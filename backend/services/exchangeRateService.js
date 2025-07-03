const axios = require('axios');
const logger = require('../utils/logger');
const { exchange } = require('./cacheService');

const API_URLS = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
  'https://latest.currency-api.pages.dev/v1/currencies/usd.json' // Fallback
];

/**
 * Obtiene el tipo de cambio USD a UYU, utilizando cache y fallbacks.
 * @returns {Promise<number>} El tipo de cambio actual.
 */
async function getUYURate() {
  const cacheKey = 'uyu_rate';
  
  return exchange.getOrSet(cacheKey, async () => {
    for (const url of API_URLS) {
      try {
        const response = await axios.get(url);
        const rate = response.data?.usd?.uyu;
        if (rate) {
          return rate;
        }
      } catch (error) {
        logger.error(`Error obteniendo tipo de cambio de ${url}: ${error.message}`);
      }
    }
    
    // Si todas las APIs fallan, devolver valor por defecto
    return 40.29; // Valor por defecto si todo lo demás falla
  });
}

/**
 * Convierte una cantidad de USD a UYU.
 * @param {number} amount La cantidad en USD.
 * @returns {Promise<number>} La cantidad equivalente en UYU.
 */
async function convertUSDtoUYU(amount) {
  const rate = await getUYURate();
  return amount * rate;
}

/**
 * Convierte una cantidad de UYU a USD.
 * @param {number} amount La cantidad en UYU.
 * @returns {Promise<number>} La cantidad equivalente en USD.
 */
async function convertUYUtoUSD(amount) {
  const rate = await getUYURate();
  return amount / rate;
}

module.exports = {
  getUYURate,
  convertUSDtoUYU,
  convertUYUtoUSD
}; 