const axios = require('axios');

const cache = new Map();
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas

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
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.rate;
  }

  for (const url of API_URLS) {
    try {
      const response = await axios.get(url);
      const rate = response.data?.usd?.uyu;
      if (rate) {
        cache.set(cacheKey, { rate, timestamp: Date.now() });
        return rate;
      }
    } catch (error) {
      console.error(`Error obteniendo tipo de cambio de ${url}: ${error.message}`);
    }
  }

  // Si todas las APIs fallan, devolver el último valor en caché o un default.
  if (cached) {
    return cached.rate;
  }
  
  return 40.29; // Valor por defecto si todo lo demás falla
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