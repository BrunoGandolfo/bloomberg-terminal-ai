const fs = require('fs').promises;
const path = require('path');

// Construye la ruta al archivo portfolio.json de forma segura
// __dirname apunta al directorio actual (services), por lo que subimos un nivel
const portfolioDataPath = path.join(__dirname, '..', 'data', 'portfolio.json');

/**
 * Lee los datos del portafolio desde el archivo JSON.
 * @returns {Promise<Object>} Una promesa que resuelve al objeto del portafolio parseado.
 */
async function readPortfolio() {
  try {
    const rawData = await fs.readFile(portfolioDataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error al leer el archivo del portafolio:", error);
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
    console.error("Error al escribir en el archivo del portafolio:", error);
    // Relanzamos el error
    throw error;
  }
}

module.exports = {
  readPortfolio,
  writePortfolio,
}; 