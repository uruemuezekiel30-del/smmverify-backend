const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const SMSPOOL_API_KEY = process.env.SMSPOOL_API_KEY;
const SMSPOOL_BASE_URL = process.env.SMSPOOL_BASE_URL || 'https://api.smspool.net';

const smsPoolClient = axios.create({
  baseURL: SMSPOOL_BASE_URL,
  timeout: 10000
});

const SERVICE_MAPPING = {
  'facebook': 2,
  'whatsapp': 6,
  'tiktok': 9,
  'instagram': 5
};

const COUNTRY_MAPPING = {
  'us': 'US',
  'gb': 'GB',
  'ca': 'CA',
  'ng': 'NG',
  'gh': 'GH',
  'ke': 'KE',
  'za': 'ZA',
  'in': 'IN',
  'de': 'DE',
  'fr': 'FR',
  'nl': 'NL',
  'br': 'BR',
  'ph': 'PH',
  'id': 'ID',
  'vn': 'VN',
  'ru': 'RU',
  'ua': 'UA',
  'pl': 'PL',
  'es': 'ES',
  'it': 'IT',
  'tr': 'TR',
  'eg': 'EG',
  'mx': 'MX',
  'co': 'CO',
  'ar': 'AR',
  'my': 'MY',
  'th': 'TH',
  'pk': 'PK',
  'bd': 'BD',
  'ae': 'AE'
};

class SMSPoolService {
  async requestOTP(service, country) {
    try {
      const serviceId = SERVICE_MAPPING[service];
      const countryCode = COUNTRY_MAPPING[country];

      if (!serviceId || !countryCode) {
        throw new Error('Invalid service or country');
      }

      const response = await smsPoolClient.get('/purchase/sms', {
        params: {
          api_key: SMSPOOL_API_KEY,
          service: serviceId,
          country: countryCode
        }
      });

      if (response.data.success === 1) {
        return {
          success: true,
          orderId: response.data.order_id,
          phoneNumber: response.data.phone_number,
          country: countryCode,
          service: service
        };
      } else {
        throw new Error(response.data.message || 'Failed to request OTP');
      }
    } catch (error) {
      console.error('SMSPool error:', error.message);
      throw error;
    }
  }

  async checkOTP(orderId) {
    try {
      const response = await smsPoolClient.get('/check/sms', {
        params: {
          api_key: SMSPOOL_API_KEY,
          order_id: orderId
        }
      });

      if (response.data.success === 1) {
        return {
          success: true,
          otp: response.data.sms,
          status: response.data.status
        };
      } else if (response.data.success === 0) {
        return {
          success: false,
          status: 'pending',
          message: 'OTP not received yet'
        };
      }
    } catch (error) {
      console.error('SMSPool check error:', error.message);
      throw error;
    }
  }

  async cancelOrder(orderId) {
    try {
      const response = await smsPoolClient.get('/cancel/sms', {
        params: {
          api_key: SMSPOOL_API_KEY,
          order_id: orderId
        }
      });

      return {
        success: response.data.success === 1,
        message: response.data.message
      };
    } catch (error) {
      console.error('SMSPool cancel error:', error.message);
      throw error;
    }
  }

  async getBalance() {
    try {
      const response = await smsPoolClient.get('/user/balance', {
        params: {
          api_key: SMSPOOL_API_KEY
        }
      });

      if (response.data.success === 1) {
        return {
          success: true,
          balance: response.data.balance
        };
      }
    } catch (error) {
      console.error('SMSPool balance error:', error.message);
      throw error;
    }
  }
}

module.exports = new SMSPoolService();
