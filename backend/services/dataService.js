const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// Construye la ruta al archivo portfolio.json de forma segura
// __dirname apunta al directorio actual (services), por lo que subimos un nivel
const portfolioDataPath = path.join(__dirname, '..', 'data', 'portfolio.json');
// Ruta para la watchlist
const watchlistDataPath = path.join(__dirname, '..', 'data', 'watchlist.json');

/**
 * Lee los datos del portafolio desde el archivo JSON.
 * @returns {Promise<Object>} Una promesa que resuelve al objeto del portafolio parseado.
 */
async function readPortfolio() {
  try {
    const rawData = await fs.readFile(portfolioDataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    logger.error("Error al leer el archivo del portafolio:", error);
    // Relanzamos el error para que el llamador pueda manejarlo
    throw error;
  }
}

/**
 * Escribe los datos del portafolio en el archivo JSON.
 * @param {Object} data El objeto de datos del portafolio que se va a escribir.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la escritura ha terminado.
 */
async function writePortfolio(data) {
  try {
    // Se usa null y 2 para formatear el JSON con indentación y hacerlo más legible
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(portfolioDataPath, jsonData, 'utf8');
  } catch (error) {
    logger.error("Error al escribir en el archivo del portafolio:", error);
    // Relanzamos el error
    throw error;
  }
}

/**
 * Lee la watchlist guardada desde watchlist.json. Si el archivo no existe, devuelve un array vacío.
 * @returns {Promise<Array<string>>}
 */
async function readWatchlist() {
  try {
    const rawData = await fs.readFile(watchlistDataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Archivo no existe; devolver lista vacía
      return [];
    }
    logger.error('Error al leer watchlist:', error);
    throw error;
  }
}

/**
 * Escribe la watchlist completa en watchlist.json.
 * @param {Array<string>} list
 */
async function writeWatchlist(list) {
  try {
    const jsonData = JSON.stringify(list, null, 2);
    await fs.writeFile(watchlistDataPath, jsonData, 'utf8');
  } catch (error) {
    logger.error('Error al escribir watchlist:', error);
    throw error;
  }
}

module.exports = {
  readPortfolio,
  writePortfolio,
  readWatchlist,
  writeWatchlist,
}; 