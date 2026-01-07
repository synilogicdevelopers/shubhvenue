import axios from 'axios';
import crypto from 'crypto';
import PaymentConfig from '../models/PaymentConfig.js';

/**
 * Load microservice configuration (api url, project id, secret) from PaymentConfig.
 *
 * We reuse the existing PaymentConfig collection but interpret its fields as:
 * - razorpayKeyId     => microservice project code
 * - razorpayKeySecret => microservice project secret
 * - MICROSERVICE_API_URL (env) => microservice base URL
 */
export async function getMicroserviceConfig() {
  // For microservice, we only need the API URL
  // Project code and secret are optional - only needed if microservice requires authentication
  const config = await PaymentConfig.findOne();

  const apiUrl = (process.env.MICROSERVICE_API_URL || '').trim();
  
  // Optional: Get project code/secret if configured (for authenticated microservices)
  const projectId = (config?.razorpayKeyId || '').trim();
  const projectSecret = (config?.razorpayKeySecret || '').trim();

  console.log('🔍 Microservice Config Check:', {
    hasApiUrl: !!apiUrl,
    apiUrl: apiUrl ? apiUrl.substring(0, 50) + '...' : 'NOT SET',
    hasProjectId: !!projectId,
    projectIdLength: projectId ? projectId.length : 0,
    projectIdPreview: projectId ? (projectId.substring(0, 10) + '...' + projectId.substring(projectId.length - 5)) : 'NOT SET',
    hasProjectSecret: !!projectSecret,
    projectSecretLength: projectSecret ? projectSecret.length : 0,
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
    throw new Error(
      'Microservice requires authentication. Please configure Project Code (Key ID) and Project Secret (Key Secret) in admin settings → Payment Configuration. These are your microservice project credentials from payments.synilogic.in admin panel.'
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
      projectId: projectId.substring(0, 10) + '...',
      hasSignature: !!signature,
      payloadKeys: Object.keys(payload || {}),
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

    if (!response.status || response.status >= 500) {
      throw new Error(
        `Microservice error (${response.status || 'no status'}): ${
          data?.message || data?.error || 'Unexpected server error'
        }`
      );
    }

    // Laravel ApiResponse::success uses { success: true, data, message }
    if (data && data.success === false) {
      throw new Error(data.message || data.error || 'Microservice request failed');
    }

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
