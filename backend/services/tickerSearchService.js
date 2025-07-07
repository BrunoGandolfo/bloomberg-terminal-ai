const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// Ruta al archivo local donde se almacenarán los tickers de la SEC
const TICKER_FILE_PATH = path.join(__dirname, '..', 'data', 'sec_tickers.json');
// URL oficial de la SEC con tickers + CIK
const SEC_TICKER_URL = 'https://www.sec.gov/files/company_tickers.json';

// Estructura en memoria para búsquedas rápidas
let tickerMap = new Map();

// Mapeo manual de términos comunes a símbolos reales (prioridad absoluta)
const commonMappings = {
  'bitcoin': 'BTC/USD',
  'btc': 'BTC/USD',
  // ETH/USD removida - solo BTC/USD soportada
  'apple': 'AAPL',
  'microsoft': 'MSFT',
  'google': 'GOOGL',
  'amazon': 'AMZN',
  'tesla': 'TSLA'
};

/**
 * Descarga el archivo de la SEC (si es posible), lo guarda en disco y actualiza el Map en memoria.
 */
async function loadTickers() {
  try {
    const { data } = await axios.get(SEC_TICKER_URL, {
      timeout: 15000,
      headers: {
                  'User-Agent': 'Terminal Financiera Power IA/1.0 (Contact: user@example.com)'
      }
    });
    await fs.writeFile(TICKER_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    populateMap(data);
    logger.info('Tickers SEC cargados desde la web.');
  } catch (downloadErr) {
    logger.warn('No se pudo descargar los tickers de la SEC:', downloadErr.message);
    // Intentar leer el archivo local como fallback
    try {
      const raw = await fs.readFile(TICKER_FILE_PATH, 'utf8');
      const json = JSON.parse(raw);
      populateMap(json);
      logger.info('Tickers SEC cargados desde el archivo local.');
    } catch (fileErr) {
      logger.error('No se pudo cargar tickers locales:', fileErr.message);
      tickerMap = new Map();
    }
  }
}

/**
 * Rellena el Map en memoria usando el JSON provisto por la SEC.
 * @param {Object} data JSON con claves numéricas como índices.
 */
function populateMap(data) {
  tickerMap = new Map();
  for (const key in data) {
    const entry = data[key];
    if (entry && entry.ticker && entry.title && entry.cik_str) {
      tickerMap.set(entry.ticker.toUpperCase(), {
        symbol: entry.ticker.toUpperCase(),
        name: entry.title.toUpperCase(),
        cik: entry.cik_str.toString()
      });
    }
  }
}

/**
 * Busca tickers por símbolo o nombre.
 * @param {string} query texto de búsqueda.
 * @returns {Array<{symbol:string,name:string,cik:string}>}
 */
function searchTicker(query = '') {
  if (!query) return [];
  const lower = query.toLowerCase().trim();

  // 1) Verificar en mapeos comunes
  if (commonMappings[lower]) {
    return [{ symbol: commonMappings[lower], name: query.toUpperCase(), cik: '' }];
  }

  const q = query.toUpperCase();
  const results = [];

  // 2) Coincidencia exacta en la SEC
  if (tickerMap.has(q)) {
    results.push(tickerMap.get(q));
  }
  for (const tickerObj of tickerMap.values()) {
    if (tickerObj.symbol.includes(q) || tickerObj.name.includes(q)) {
      // Evitar duplicados
      if (!results.find(r => r.symbol === tickerObj.symbol)) {
        results.push(tickerObj);
      }
      if (results.length >= 10) break;
    }
  }
  return results;
}

/**
 * Programa una actualización diaria a las 3 AM hora del servidor usando setTimeout recursivo.
 */
function scheduleDailyUpdate() {
  const now = new Date();
  const next = new Date();
  next.setHours(3, 0, 0, 0); // 03:00:00.000
  if (next <= now) {
    // Si ya pasó hoy, programar para mañana
    next.setDate(next.getDate() + 1);
  }
  const msUntilNext = next - now;
  setTimeout(async () => {
    await loadTickers();
    scheduleDailyUpdate(); // reprogramar
  }, msUntilNext);
  logger.info(`Próxima actualización de tickers programada en ${(msUntilNext / 3600000).toFixed(2)} horas.`);
}

// Cargar al iniciar el servicio
loadTickers().then(scheduleDailyUpdate).catch((err) => {
  logger.error('Error inicializando tickerSearchService:', err.message);
});

module.exports = {
  searchTicker,
  loadTickers
}; 