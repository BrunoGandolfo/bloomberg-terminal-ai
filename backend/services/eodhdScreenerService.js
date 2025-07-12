/**
 * EODHD Screener Service
 * Maneja todas las operaciones de screeners, búsquedas y filtros usando EODHD API
 * Migrado desde Yahoo Finance para consolidar proveedores
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { screeners } = require('./cacheService');

// Importar configuración y helpers de eodhdService
const eodhdService = require('./eodhdService');
const BASE_URL = 'https://eodhd.com/api';
const API_KEY = process.env.EODHD_API_KEY;

// Rate limiter dedicado para screeners
// Usa límite más conservador porque screeners consumen 5 API calls cada uno
class ScreenerRateLimiter {
  constructor(maxCallsPerMinute = 200) {
    this.maxCalls = maxCallsPerMinute;
    this.calls = [];
    this.lastReset = Date.now();
  }

  async throttle() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Limpiar llamadas antiguas
    this.calls = this.calls.filter(time => time > oneMinuteAgo);
    
    if (this.calls.length >= this.maxCalls) {
      const waitTime = 60000 - (now - this.calls[0]);
      logger.warn(`[EODHD Screener] Rate limit alcanzado. Esperando ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.calls.push(now);
  }
}

const rateLimiter = new ScreenerRateLimiter();

// Traducciones de sectores (mantener compatibilidad con Yahoo)
const SECTOR_TRANSLATIONS = {
  'Technology': 'Tecnología',
  'Healthcare': 'Salud',
  'Financial Services': 'Servicios Financieros',
  'Financial': 'Servicios Financieros',
  'Communication Services': 'Servicios de Comunicación',
  'Consumer Cyclical': 'Consumo Cíclico',
  'Consumer Defensive': 'Consumo Defensivo',
  'Industrials': 'Industria',
  'Energy': 'Energía',
  'Utilities': 'Servicios Públicos',
  'Real Estate': 'Bienes Raíces',
  'Basic Materials': 'Materiales Básicos',
  'Materials': 'Materiales Básicos'
};

// Mapeo inverso para búsquedas
const SECTOR_REVERSE_MAP = Object.fromEntries(
  Object.entries(SECTOR_TRANSLATIONS).map(([k, v]) => [v, k])
);

// Helper para formatear market cap con sufijos
function formatMarketCap(value) {
  if (!value || value === 0) return 'N/A';
  
  const num = parseFloat(value);
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// Helper para formatear respuestas al estilo Yahoo
function formatStockData(eodhdData) {
  return {
    símbolo: eodhdData.code || eodhdData.symbol,
    nombre: eodhdData.name || eodhdData.shortname || 'N/A',
    precio: eodhdData.adjusted_close || eodhdData.close || 0,
    cambio_porcentual: eodhdData.refund_1d_p || eodhdData.change_p || 0,
    capitalización: formatMarketCap(eodhdData.market_capitalization),
    sector: SECTOR_TRANSLATIONS[eodhdData.sector] || eodhdData.sector || 'N/A',
    volumen: eodhdData.avgvol_1d || eodhdData.volume || 0
  };
}

// Implementación de funciones principales

/**
 * Obtiene las acciones más activas como proxy de "trending"
 * EODHD no tiene endpoint de trending, usamos most actives por volumen
 */
async function getTrendingStocks() {
  const cacheKey = 'eodhd_trending_stocks';
  
  return screeners.getOrSet(cacheKey, async () => {
    try {
      await rateLimiter.throttle();
      
      // Usar screener de EODHD ordenado por volumen promedio
      const url = `${BASE_URL}/screener?api_token=${API_KEY}&sort=avgvol_1d.desc&filters=[["exchange","=","us"]]&limit=20&offset=0`;
      
      logger.debug('[EODHD Screener] Obteniendo trending stocks (most actives)');
      
      const response = await axios.get(url);
      const data = response.data?.data || [];
      
      if (!Array.isArray(data)) {
        logger.error('[EODHD Screener] Respuesta inesperada de API:', response.data);
        return [];
      }
      
      // Formatear al estilo Yahoo
      const formattedStocks = data.map(stock => formatStockData(stock));
      
      logger.info(`[EODHD Screener] ${formattedStocks.length} trending stocks obtenidos`);
      
      return formattedStocks;
      
    } catch (error) {
      logger.error('[EODHD Screener] Error obteniendo trending stocks:', error.message);
      if (error.response) {
        logger.error('[EODHD Screener] Response data:', error.response.data);
      }
      return [];
    }
  });
}

/**
 * Busca instrumentos financieros por símbolo o nombre
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Array>} Lista de resultados formateados
 */
async function searchStocks(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const cacheKey = `eodhd_search_${query.toLowerCase()}`;
  
  return screeners.getOrSet(cacheKey, async () => {
    try {
      await rateLimiter.throttle();
      
      const url = `${BASE_URL}/search/${encodeURIComponent(query)}?api_token=${API_KEY}&limit=20`;
      
      logger.debug(`[EODHD Screener] Buscando: "${query}"`);
      
      const response = await axios.get(url);
      const results = response.data || [];
      
      if (!Array.isArray(results)) {
        logger.error('[EODHD Screener] Respuesta de búsqueda inválida');
        return [];
      }
      
      // Formatear resultados al estilo Yahoo
      const formattedResults = results
        .filter(item => item.Code) // Filtrar resultados sin símbolo
        .map(item => ({
          símbolo: item.Code,
          nombre: item.Name || item.Code,
          intercambio: item.Exchange || 'N/A',
          tipo: item.Type || 'N/A',
          país: item.Country || 'N/A',
          moneda: item.Currency || 'USD'
        }));
      
      logger.info(`[EODHD Screener] ${formattedResults.length} resultados para "${query}"`);
      
      return formattedResults;
      
    } catch (error) {
      logger.error(`[EODHD Screener] Error buscando "${query}":`, error.message);
      return [];
    }
  });
}

/**
 * Obtiene resultados de screeners predefinidos
 * @param {string} type - Tipo de screener: 'most_actives', 'gainers', 'losers', 'etfs'
 * @returns {Promise<Array>} Lista de acciones formateadas
 */
async function getScreenerResults(type) {
  const validTypes = ['most_actives', 'gainers', 'losers', 'etfs'];
  
  if (!validTypes.includes(type)) {
    logger.error(`[EODHD Screener] Tipo inválido: ${type}`);
    return [];
  }
  
  const cacheKey = `eodhd_screener_${type}`;
  
  return screeners.getOrSet(cacheKey, async () => {
    try {
      await rateLimiter.throttle();
      
      let url;
      let filters = '[["exchange","=","us"]]';
      let limit = type === 'etfs' ? 50 : 100;
      
      switch (type) {
        case 'most_actives':
          // Ordenar por volumen promedio descendente
          url = `${BASE_URL}/screener?api_token=${API_KEY}&sort=avgvol_1d.desc&filters=${filters}&limit=${limit}`;
          break;
          
        case 'gainers':
          // Ordenar por cambio porcentual diario descendente (gainers)
          url = `${BASE_URL}/screener?api_token=${API_KEY}&sort=refund_1d_p.desc&filters=${filters}&limit=${limit}`;
          break;
          
        case 'losers':
          // Ordenar por cambio porcentual diario ascendente (losers)
          url = `${BASE_URL}/screener?api_token=${API_KEY}&sort=refund_1d_p.asc&filters=${filters}&limit=${limit}`;
          break;
          
        case 'etfs':
          // Filtrar solo ETFs del mercado US
          filters = '[["exchange","=","us"],["type","=","ETF"]]';
          url = `${BASE_URL}/screener?api_token=${API_KEY}&sort=avgvol_1d.desc&filters=${filters}&limit=${limit}`;
          break;
      }
      
      logger.debug(`[EODHD Screener] Obteniendo ${type}`);
      
      const response = await axios.get(url);
      const data = response.data?.data || [];
      
      if (!Array.isArray(data)) {
        logger.error(`[EODHD Screener] Respuesta inválida para ${type}`);
        return [];
      }
      
      // Formatear y filtrar resultados
      const formattedStocks = data
        .filter(stock => {
          // Filtrar stocks con datos válidos
          return stock.adjusted_close > 0 && 
                 stock.refund_1d_p !== null &&
                 (type === 'etfs' || stock.sector !== '');
        })
        .map(stock => formatStockData(stock));
      
      logger.info(`[EODHD Screener] ${formattedStocks.length} resultados para ${type}`);
      
      return formattedStocks;
      
    } catch (error) {
      logger.error(`[EODHD Screener] Error obteniendo ${type}:`, error.message);
      if (error.response) {
        logger.error('[EODHD Screener] Response:', error.response.data);
      }
      return [];
    }
  });
}

/**
 * Obtiene todas las acciones de un sector específico
 * @param {string} sector - Nombre del sector en español o inglés
 * @returns {Promise<Array>} Lista de acciones del sector
 */
async function getStocksBySector(sector) {
  if (!sector) {
    logger.error('[EODHD Screener] Sector requerido');
    return [];
  }
  
  // Convertir sector español a inglés si es necesario
  const englishSector = SECTOR_REVERSE_MAP[sector] || sector;
  const cacheKey = `eodhd_sector_${englishSector.toLowerCase().replace(/\s+/g, '_')}`;
  
  return screeners.getOrSet(cacheKey, async () => {
    try {
      await rateLimiter.throttle();
      
      // Construir filtro para el sector específico
      const filters = JSON.stringify([
        ["exchange", "=", "us"],
        ["sector", "=", englishSector]
      ]);
      
      const url = `${BASE_URL}/screener?api_token=${API_KEY}&sort=market_capitalization.desc&filters=${filters}&limit=250`;
      
      logger.debug(`[EODHD Screener] Obteniendo acciones del sector: ${englishSector}`);
      
      const response = await axios.get(url);
      const data = response.data?.data || [];
      
      if (!Array.isArray(data)) {
        logger.error(`[EODHD Screener] Respuesta inválida para sector ${englishSector}`);
        return [];
      }
      
      // Formatear resultados
      const formattedStocks = data
        .filter(stock => stock.adjusted_close > 0)
        .map(stock => formatStockData(stock));
      
      logger.info(`[EODHD Screener] ${formattedStocks.length} acciones encontradas en sector ${englishSector}`);
      
      return formattedStocks;
      
    } catch (error) {
      logger.error(`[EODHD Screener] Error obteniendo sector ${englishSector}:`, error.message);
      return [];
    }
  });
}

/**
 * Obtiene los principales índices del mercado
 * @returns {Promise<Array>} Lista de índices con sus datos
 */
async function getIndices() {
  const cacheKey = 'eodhd_major_indices';
  
  return screeners.getOrSet(cacheKey, async () => {
    try {
      // Lista de índices principales
      const indices = [
        { symbol: 'GSPC.INDX', name: 'S&P 500', displaySymbol: '^GSPC' },
        { symbol: 'DJI.INDX', name: 'Dow Jones', displaySymbol: '^DJI' },
        { symbol: 'IXIC.INDX', name: 'Nasdaq', displaySymbol: '^IXIC' },
        { symbol: 'RUT.INDX', name: 'Russell 2000', displaySymbol: '^RUT' },
        { symbol: 'VIX.INDX', name: 'VIX', displaySymbol: '^VIX' },
        { symbol: 'FTSE.INDX', name: 'FTSE 100', displaySymbol: '^FTSE' },
        { symbol: 'N225.INDX', name: 'Nikkei 225', displaySymbol: '^N225' },
        { symbol: 'HSI.INDX', name: 'Hang Seng', displaySymbol: '^HSI' }
      ];
      
      const results = [];
      
      // Obtener datos de cada índice
      for (const index of indices) {
        try {
          await rateLimiter.throttle();
          
          const url = `${BASE_URL}/real-time/${index.symbol}?api_token=${API_KEY}&fmt=json`;
          const response = await axios.get(url);
          const data = response.data;
          
          if (data && data.close) {
            results.push({
              símbolo: index.displaySymbol,
              nombre: index.name,
              precio: data.close,
              cambio: data.change || 0,
              cambio_porcentual: data.change_p || 0,
              volumen: data.volume || 0
            });
          }
        } catch (error) {
          logger.warn(`[EODHD Screener] Error obteniendo índice ${index.symbol}:`, error.message);
        }
      }
      
      logger.info(`[EODHD Screener] ${results.length} índices obtenidos`);
      
      return results;
      
    } catch (error) {
      logger.error('[EODHD Screener] Error obteniendo índices:', error.message);
      return [];
    }
  });
}

/**
 * Obtiene la lista de sectores disponibles
 * @returns {Promise<Array>} Lista de sectores únicos
 */
async function getSectorsFromMarket() {
  const cacheKey = 'eodhd_available_sectors';
  
  return screeners.getOrSet(cacheKey, async () => {
    try {
      // Obtener una muestra de acciones activas para extraer sectores
      const stocks = await getScreenerResults('most_actives');
      
      // Extraer sectores únicos
      const sectorsSet = new Set();
      stocks.forEach(stock => {
        if (stock.sector && stock.sector !== 'N/A') {
          sectorsSet.add(stock.sector);
        }
      });
      
      const sectors = Array.from(sectorsSet).sort();
      logger.info(`[EODHD Screener] ${sectors.length} sectores encontrados`);
      
      return sectors;
      
    } catch (error) {
      logger.error('[EODHD Screener] Error obteniendo sectores:', error.message);
      return [];
    }
  });
}

/**
 * Obtiene ETFs principales
 * @returns {Promise<Array>} Lista de ETFs
 */
async function getTopETFs() {
  return getScreenerResults('etfs');
}

/**
 * Obtiene bonds/bonos principales (usando ETFs de bonos)
 * @returns {Promise<Array>} Lista de bonos
 */
async function getTopBonds() {
  const cacheKey = 'eodhd_top_bonds';
  
  return screeners.getOrSet(cacheKey, async () => {
    try {
      // ETFs de bonos populares
      const bondETFs = ['TLT', 'IEF', 'SHY', 'AGG', 'BND', 'HYG', 'LQD', 'TIP'];
      const results = [];
      
      for (const symbol of bondETFs) {
        try {
          await rateLimiter.throttle();
          
          const formattedSymbol = `${symbol}.US`;
          const url = `${BASE_URL}/real-time/${formattedSymbol}?api_token=${API_KEY}&fmt=json`;
          const response = await axios.get(url);
          const data = response.data;
          
          if (data && data.close) {
            results.push({
              símbolo: symbol,
              nombre: `${symbol} Bond ETF`,
              precio: data.close,
              cambio: data.change || 0,
              cambio_porcentual: data.change_p || 0,
              rendimiento_anual: 'N/A' // EODHD no proporciona yield directamente
            });
          }
        } catch (error) {
          logger.warn(`[EODHD Screener] Error obteniendo bond ETF ${symbol}:`, error.message);
        }
      }
      
      return results;
      
    } catch (error) {
      logger.error('[EODHD Screener] Error obteniendo bonds:', error.message);
      return [];
    }
  });
}

module.exports = {
  // Funciones principales migradas de Yahoo
  getTrendingStocks,
  searchStocks,
  getScreenerResults,
  getStocksBySector,
  getIndices,
  getSectorsFromMarket,
  getTopETFs,
  getTopBonds,
  
  // Alias para compatibilidad con screenerService original
  getRealTimeScreener: getScreenerResults,
  searchSymbol: searchStocks,
  getAllStocksBySector: getStocksBySector,
  getMajorIndices: getIndices,
  
  // Helpers para testing y debugging
  formatStockData,
  SECTOR_TRANSLATIONS
}; 