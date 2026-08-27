const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const SMM_PANEL_URL = process.env.SMM_PANEL_URL;
const SMM_PANEL_API_KEY = process.env.SMM_PANEL_API_KEY;

const smmPanelClient = axios.create({
  baseURL: SMM_PANEL_URL,
  timeout: 10000
});

const SERVICE_MAPPING = {
  'fb_followers': 'facebook_page_followers', // or similar based on panel
  'tt_followers': 'tiktok_followers',
  'tt_views': 'tiktok_video_views',
  'ig_followers': 'instagram_followers',
  'ig_likes': 'instagram_post_likes'
};

class SMMPanelService {
  async placeOrder(serviceType, targetLink, quantity) {
    try {
      const response = await smmPanelClient.post('/', {
        key: SMM_PANEL_API_KEY,
        action: 'add',
        service: SERVICE_MAPPING[serviceType],
        link: targetLink,
        quantity: quantity
      });

      if (response.data.order) {
        return {
          success: true,
          orderId: response.data.order,
          status: 'pending'
        };
      } else if (response.data.error) {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('SMM Panel error:', error.message);
      throw error;
    }
  }

  async checkOrderStatus(orderId) {
    try {
      const response = await smmPanelClient.post('/', {
        key: SMM_PANEL_API_KEY,
        action: 'status',
        order: orderId
      });

      return {
        success: true,
        status: response.data.status,
        startCount: response.data.start_count,
        currentCount: response.data.currency || response.data.current_count
      };
    } catch (error) {
      console.error('SMM Panel status check error:', error.message);
      throw error;
    }
  }

  async cancelOrder(orderId) {
    try {
      const response = await smmPanelClient.post('/', {
        key: SMM_PANEL_API_KEY,
        action: 'cancel',
        order: orderId
      });

      return {
        success: !response.data.error,
        message: response.data.error || 'Order cancelled'
      };
    } catch (error) {
      console.error('SMM Panel cancel error:', error.message);
      throw error;
    }
  }

  async getBalance() {
    try {
      const response = await smmPanelClient.post('/', {
        key: SMM_PANEL_API_KEY,
        action: 'balance'
      });

      return {
        success: true,
        balance: response.data
      };
    } catch (error) {
      console.error('SMM Panel balance error:', error.message);
      throw error;
    }
  }
}

module.exports = new SMMPanelService();
