import { API_CONFIG } from '../config/appConfig';

/**
 * Exchange rate service for currency conversion
 */
const exchangeRateService = {
  /**
   * Cache for exchange rates
   * @private
   */
  _cache: {
    rate: API_CONFIG.exchangeRate.defaultRate,
    lastUpdated: null
  },

  /**
   * Fetch the latest USD to INR exchange rate
   * @returns {Promise<number>} Current exchange rate
   */
  fetchExchangeRate: async () => {
    try {
      // Check if we need to refresh the cached rate
      const now = new Date().getTime();
      const lastUpdated = exchangeRateService._cache.lastUpdated;
      
      if (lastUpdated && (now - lastUpdated < API_CONFIG.exchangeRate.refreshInterval)) {
        return exchangeRateService._cache.rate;
      }
      
      // Fetch fresh rate
      const response = await fetch(API_CONFIG.exchangeRate.apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }
      
      const data = await response.json();
      
      if (data.rates && data.rates.INR) {
        // Update cache
        exchangeRateService._cache.rate = data.rates.INR;
        exchangeRateService._cache.lastUpdated = now;
        return data.rates.INR;
      } else {
        throw new Error('Exchange rate data not found in response');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Return cached or default rate if available
      return exchangeRateService._cache.rate || API_CONFIG.exchangeRate.defaultRate;
    }
  },

  /**
   * Convert USD to INR
   * @param {number} amountUSD - Amount in USD
   * @returns {Promise<number>} Amount in INR
   */
  convertUSDtoINR: async (amountUSD) => {
    const rate = await exchangeRateService.fetchExchangeRate();
    return amountUSD * rate;
  },

  /**
   * Convert INR to USD
   * @param {number} amountINR - Amount in INR
   * @returns {Promise<number>} Amount in USD
   */
  convertINRtoUSD: async (amountINR) => {
    const rate = await exchangeRateService.fetchExchangeRate();
    return amountINR / rate;
  },

  /**
   * Get current cached exchange rate without fetching
   * @returns {number} Current exchange rate
   */
  getCurrentRate: () => {
    return exchangeRateService._cache.rate || API_CONFIG.exchangeRate.defaultRate;
  }
};

export default exchangeRateService;