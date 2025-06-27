// Importar axios para las solicitudes HTTP y dotenv para las variables de entorno
const axios = require('axios');
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

// Obtener la clave de la API desde las variables de entorno
const apiKey = process.env.ALPHA_VANTAGE_KEY;

/**
 * Obtiene la cotización de un símbolo específico desde la API de Alpha Vantage.
 * @param {string} symbol El símbolo de la acción (ej. 'AAPL').
 * @returns {Promise<Object|null>} Un objeto con los datos de la cotización o null si hay un error.
 */
async function getQuote(symbol) {
  // Validar que la clave de la API y el símbolo estén presentes
  if (!apiKey) {
    console.error('Error: La clave de la API de Alpha Vantage (ALPHA_VANTAGE_KEY) no está configurada.');
    throw new Error('API key is not configured.');
  }
  if (!symbol) {
    throw new Error('Symbol is required.');
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const quoteData = response.data['Global Quote'];

    // Alpha Vantage retorna un objeto vacío si el símbolo no existe o la API es inválida
    if (!quoteData || Object.keys(quoteData).length === 0) {
      console.warn(`No se encontró información para el símbolo: ${symbol}. La respuesta de la API estuvo vacía.`);
      return null;
    }

    // Parsear la respuesta para devolver un objeto limpio
    const parsedQuote = {
      symbol: quoteData['01. symbol'],
      price: parseFloat(quoteData['05. price']),
      change: parseFloat(quoteData['09. change']),
      changePercent: parseFloat(quoteData['10. change percent'].replace('%', '')),
    };

    return parsedQuote;

  } catch (error) {
    console.error(`Error al obtener la cotización para ${symbol}:`, error.message);
    // Relanzar el error para que sea manejado por el código que llama a esta función
    throw error;
  }
}

module.exports = {
  getQuote,
}; 