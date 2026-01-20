import axios from 'axios';
import crypto from 'crypto';
import PaymentConfig from '../models/PaymentConfig.js';

/**
 * Load microservice configuration (api url, project id, secret) from PaymentConfig.
 *
 * We reuse the existing PaymentConfig collection but interpret its fields as:
 * - razorpayKeyId     => microservice project code (works for PayU, Razorpay, etc.)
 * - razorpayKeySecret => microservice project secret (works for PayU, Razorpay, etc.)
 * - MICROSERVICE_API_URL (env) => microservice base URL
 * 
 * Note: Microservice supports multiple payment gateways (PayU, Razorpay, etc.)
 */
export async function getMicroserviceConfig() {
  // For microservice, we only need the API URL
  // Project code and secret are optional - only needed if microservice requires authentication
  const config = await PaymentConfig.findOne();

  const apiUrl = (process.env.MICROSERVICE_API_URL || '').trim();
  
  // Get project code/secret from environment variables first, then fall back to database
  // Environment variables: PROJECT_CODE (or RAZORPAY_KEY_ID) and PROJECT_SECRET (or RAZORPAY_KEY_SECRET)
  const projectId = (
    process.env.PROJECT_CODE || 
    process.env.MICROSERVICE_PROJECT_CODE || 
    process.env.RAZORPAY_KEY_ID || 
    config?.razorpayKeyId || 
    ''
  ).trim();
  
  const projectSecret = (
    process.env.PROJECT_SECRET || 
    process.env.MICROSERVICE_PROJECT_SECRET || 
    process.env.RAZORPAY_KEY_SECRET || 
    config?.razorpayKeySecret || 
    ''
  ).trim();

  // Determine source of project credentials
  const projectIdSource = process.env.PROJECT_CODE || process.env.MICROSERVICE_PROJECT_CODE || process.env.RAZORPAY_KEY_ID 
    ? 'Environment Variables' 
    : (config?.razorpayKeyId ? 'Database (PaymentConfig)' : 'Not Set');
  const projectSecretSource = process.env.PROJECT_SECRET || process.env.MICROSERVICE_PROJECT_SECRET || process.env.RAZORPAY_KEY_SECRET 
    ? 'Environment Variables' 
    : (config?.razorpayKeySecret ? 'Database (PaymentConfig)' : 'Not Set');

  console.log('🔍 Microservice Config Check:', {
    hasApiUrl: !!apiUrl,
    apiUrl: apiUrl ? apiUrl.substring(0, 50) + '...' : 'NOT SET',
    hasProjectId: !!projectId,
    projectIdLength: projectId ? projectId.length : 0,
    projectIdPreview: projectId ? (projectId.substring(0, 10) + '...' + projectId.substring(projectId.length - 5)) : 'NOT SET',
    projectIdSource,
    hasProjectSecret: !!projectSecret,
    projectSecretLength: projectSecret ? projectSecret.length : 0,
    projectSecretSource,
    authMode: (projectId && projectSecret) ? 'With Auth' : 'URL Only (No Auth)',
  });

  // Only API URL is required for microservice
  if (!apiUrl) {
    throw new Error(
      'Microservice is not configured. Please set MICROSERVICE_API_URL in backend environment variables (.env file).'
    );
  }

  // Microservice requires authentication (project code and secret)
  // If not provided, show helpful error
  if (!projectId || !projectSecret) {
    const envHint = process.env.PROJECT_CODE || process.env.PROJECT_SECRET 
      ? '\n\nAlternatively, you can set these in backend environment variables (.env file):\n  PROJECT_CODE=your_project_code\n  PROJECT_SECRET=your_project_secret'
      : '';
    
    throw new Error(
      'Microservice requires authentication. Please configure Project Code (Key ID) and Project Secret (Key Secret) in admin settings → Payment Configuration. These are your microservice project credentials from payments.synilogic.in admin panel.' + envHint
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''), // remove trailing slashes
    projectId,
    projectSecret,
  };
}

/**
 * Generate HMAC SHA256 signature for microservice requests.
 * Signature = HMAC_SHA256(json_body, project_secret)
 */
export function generateMicroserviceSignature(bodyString, secret) {
  return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
}

/**
 * Call the Razorpay Central Payments Microservice with HMAC auth.
 *
 * @param {string} endpoint - e.g. '/api/payment/order'
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {object|null} payload
 * @returns {Promise<any>} Parsed JSON response from microservice
 */
export async function callMicroservice(endpoint, method = 'GET', payload = null) {
  const { apiUrl, projectId, projectSecret } = await getMicroserviceConfig();

  const url = `${apiUrl}${endpoint}`;

  let bodyString = '';
  if (payload && method !== 'GET') {
    // Build a stable JSON body string
    bodyString = JSON.stringify(payload);
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Microservice requires authentication headers
  headers['X-Project-Id'] = projectId;
  if (bodyString) {
    const signature = generateMicroserviceSignature(bodyString, projectSecret);
    headers['X-Project-Signature'] = signature;
    
    console.log('📤 Microservice Request:', {
      url,
      method,
      projectId: projectId, // Show full project ID for debugging
      projectIdLength: projectId.length,
      projectSecretLength: projectSecret.length,
      hasSignature: !!signature,
      signatureLength: signature ? signature.length : 0,
      payloadKeys: Object.keys(payload || {}),
      headers: {
        'X-Project-Id': projectId,
        'X-Project-Signature': signature ? signature.substring(0, 20) + '...' : 'none',
      },
    });
  } else {
    // For GET requests, still log the project ID
    console.log('📤 Microservice Request (GET):', {
      url,
      method,
      projectId: projectId,
      projectIdLength: projectId.length,
    });
  }

  try {
    const response = await axios({
      url,
      method,
      headers,
      data: bodyString || undefined,
      validateStatus: () => true, // handle errors manually
    });

    const data = response.data;

    // Log full response for debugging
    console.log('📥 Microservice Response:', {
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: response.headers,
    });

    if (!response.status || response.status >= 500) {
      const errorMsg = data?.message || data?.error || data?.data?.message || JSON.stringify(data) || 'Unexpected server error';
      console.error('❌ Microservice 500 Error Details:', {
        status: response.status,
        url,
        responseData: data,
        errorMessage: errorMsg,
      });
      throw new Error(
        `Microservice error (${response.status || 'no status'}): ${errorMsg}`
      );
    }

    // Laravel ApiResponse::success uses { success: true, data, message }
    if (data && data.success === false) {
      const errorMsg = data.message || data.error || data.data?.message || 'Microservice request failed';
      console.error('❌ Microservice Request Failed:', {
        url,
        success: data.success,
        message: errorMsg,
        data: data,
      });
      throw new Error(errorMsg);
    }

    // Check if response has data field (Laravel ApiResponse format)
    if (data && data.data) {
      return data;
    }

    // Return response as-is if it's already in expected format
    return data;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || data?.error || JSON.stringify(data) || error.message;
      
      console.error('❌ Microservice Error Response:', {
        status,
        url,
        error: errorMessage,
        data: data,
      });
      
      // Handle specific error cases
      if (errorMessage.includes('Invalid project') || 
          errorMessage.includes('invalid project') ||
          errorMessage.includes('Invalid Project')) {
        throw new Error(
          `Invalid Project: Microservice project code or secret is incorrect. Please verify the Project Code (Key ID) and Project Secret (Key Secret) in admin settings → Payment Configuration. Get these from your microservice admin panel.`
        );
      }
      
      if (errorMessage.includes('Missing authentication') || 
          errorMessage.includes('missing authentication')) {
        throw new Error(
          `Missing Authentication: Microservice requires Project Code and Secret. Please configure them in admin settings → Payment Configuration.`
        );
      }
      
      throw new Error(
        `Microservice HTTP ${status}: ${errorMessage}`
      );
    }
    
    console.error('❌ Microservice Request Error:', {
      url,
      error: error.message,
      stack: error.stack,
    });
    
    throw error;
  }
}
