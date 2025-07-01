// Importar axios para las solicitudes HTTP y dotenv para las variables de entorno
const axios = require('axios');
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env
const creditCache = require('./creditCache');
const logger = require('../logger');

// Obtener la clave de la API desde las variables de entorno
const apiKey = process.env.TWELVE_DATA_API_KEY;

/**
 * Obtiene la cotización de un símbolo específico desde la API de Twelve Data.
 * @param {string} symbol El símbolo de la acción (ej. 'AAPL').
 * @returns {Promise<Object|null>} Un objeto con los datos de la cotización o null si hay un error.
 */
async function getQuote(symbol) {
  if (!process.env.TWELVE_DATA_API_KEY) {
    const error = new Error('TWELVE_DATA_API_KEY not configured');
    logger.error('API configuration error', { error: error.message });
    throw error;
  }

  try {
    const response = await axios.get(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`
    );

    if (!response.data || response.data.status === 'error') {
      logger.warn('Quote not found', { symbol });
      return null;
    }

    const quote = {
      symbol: response.data.symbol,
      price: parseFloat(response.data.close || response.data.previous_close),
      change: parseFloat(response.data.change),
      changePercent: parseFloat(response.data.percent_change)
    };

    creditCache.add(parseInt(response.headers['x-api-credits-used']) || 1);
    logger.info('Twelve Data credits usage', {
      symbol,
      creditsUsed: creditCache.getCurrentMinute(),
      minuteTimestamp: Math.floor(Date.now() / 60_000)
    });

    return quote;
  } catch (error) {
    logger.error('Error fetching quote', {
      symbol,
      error: error.message
    });
    return null;
  }
}

module.exports = {
  getQuote,
}; 