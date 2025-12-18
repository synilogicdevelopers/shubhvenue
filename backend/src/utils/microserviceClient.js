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
  const config = await PaymentConfig.findOne();

  const apiUrl = (process.env.MICROSERVICE_API_URL || '').trim();
  const projectId = (config?.razorpayKeyId || '').trim();
  const projectSecret = (config?.razorpayKeySecret || '').trim();

  if (!apiUrl || !projectId || !projectSecret) {
    throw new Error(
      'Microservice is not fully configured. Please set MICROSERVICE_API_URL and payment config (Key ID = project code, Key Secret = project secret) in admin settings.'
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
    'X-Project-Id': projectId,
  };

  if (bodyString) {
    headers['X-Project-Signature'] = generateMicroserviceSignature(bodyString, projectSecret);
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
      throw new Error(
        `Microservice HTTP ${status}: ${data?.message || data?.error || error.message}`
      );
    }
    throw error;
  }
}
