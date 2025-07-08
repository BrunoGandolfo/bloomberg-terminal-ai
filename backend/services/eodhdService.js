const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

// CONFIGURACIÓN EODHD
const BASE_URL = 'https://eodhd.com/api';
const API_KEY = process.env.EODHD_API_KEY;

logger.info(`[EODHD] API Key cargada: ${API_KEY ? 'Sí, terminando en ...' + API_KEY.slice(-4) : 'NO'}`);

if (!API_KEY) {
  logger.error('EODHD_API_KEY no está configurada en el archivo .env');
  // throw new Error('EODHD_API_KEY must be set.'); // Descomentar en producción
}

// RATE LIMITER - Adaptado para EODHD (1000 llamadas/minuto en plan gratuito)
class RateLimiter {
  constructor(maxCallsPerMinute = 1000) {
    this.maxCalls = maxCallsPerMinute;
    this.calls = [];
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      isOpen: false,
      resetTime: null,
      failedSymbols: new Set()
    };
  }

  async throttle() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.calls = this.calls.filter(time => time > oneMinuteAgo);
    
    if (this.circuitBreaker.isOpen) {
      if (now < this.circuitBreaker.resetTime) {
        throw new Error('Circuit breaker OPEN - EODHD API temporalmente bloqueada');
      }
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.failedSymbols.clear();
      logger.info('[EODHD] Circuit breaker RESET - API disponible');
    }
    
    if (this.calls.length >= this.maxCalls) {
      const waitTime = 60000 - (now - this.calls[0]);
      logger.warn(`[EODHD] Límite de llamadas alcanzado. Esperando ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.calls.push(now);
  }

  reportFailure(symbol = null) {
    this.circuitBreaker.failures++;
    if (symbol) this.circuitBreaker.failedSymbols.add(symbol);
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      this.circuitBreaker.resetTime = Date.now() + 60000;
      logger.error('[EODHD] Circuit breaker ACTIVADO - Pausando llamadas por 1 minuto');
    }
  }

  reportSuccess() {
    this.circuitBreaker.failures = 0;
  }
}

const rateLimiter = new RateLimiter();

// CACHE DIFERENCIADO
const CACHE_CONFIG = {
  quotes: 30000,       // 30 segundos
  fundamentals: 3600000, // 1 hora
  historical: 1800000,   // 30 minutos
  search: 86400000       // 24 horas para búsquedas
};

const cache = new Map();

function checkCache(key, type) {
  const cached = cache.get(key);
  const ttl = CACHE_CONFIG[type] || 60000; // TTL por defecto de 1 min
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}

function setCache(key, data, type) {
  cache.set(key, { data, timestamp: Date.now() });
}

// HELPERS
const formatSymbol = (symbol) => {
  if (symbol.includes('/') || symbol.includes('-')) {
    return `${symbol.replace('/', '-')}.CC`; // Formato Crypto: BTC-USD.CC
  }
  if (!symbol.includes('.')) {
    return `${symbol}.US`; // Asumir mercado US si no se especifica
  }
  return symbol;
};

// --- FUNCIONES AUXILIARES INTERNAS ---

// Función auxiliar para datos en tiempo real
async function getRealtimeData(symbol) {
  const eodSymbol = formatSymbol(symbol);
  await rateLimiter.throttle();
  logger.debug(`[EODHD] Petición Real-Time para: ${eodSymbol}`);
  const response = await axios.get(`${BASE_URL}/real-time/${eodSymbol}?api_token=${API_KEY}&fmt=json`);
  return response.data;
}

// Función auxiliar para datos fundamentales (CORREGIDA)
async function getFundamentalsData(symbol) {
  // Los datos fundamentales no existen para criptomonedas
  if (symbol.includes('/') || symbol.includes('-')) {
    return { symbol, General: { Symbol: symbol } }; // Devolver objeto compatible
  }

  // El endpoint de fundamentales NO usa el mismo formato que real-time
  const eodSymbol = symbol.includes('.') ? symbol : `${symbol}.US`;
  const url = `${BASE_URL}/fundamentals/${eodSymbol}?api_token=${API_KEY}&fmt=json`;

  try {
    await rateLimiter.throttle();
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    logger.error(`[EODHD] Error en getFundamentalsData para ${symbol}: ${error.message}`);
    // Devolvemos un objeto de error compatible para no romper Promise.all
    return { symbol, error: error.message, General: { Symbol: symbol } };
  }
}

// --- FUNCIONES PRINCIPALES ---

async function getQuote(symbol) {
  const cacheKey = `quote_${symbol}`;
  const cached = checkCache(cacheKey, 'quotes');
  if (cached) return cached;

  try {
    // Llamadas en paralelo para mayor velocidad
    const [realtimeData, fundamentalsData] = await Promise.all([
      getRealtimeData(symbol),
      getFundamentalsData(symbol)
    ]);

    // Mapeo híbrido con TODOS los datos
    const normalized = {
      symbol: symbol,
      name: fundamentalsData.General?.Name || null,
      
      // Datos tiempo real
      price: realtimeData.close ?? null,
      change: realtimeData.change ?? null,
      changePercent: realtimeData.change_p ?? null,
      open: realtimeData.open ?? null,
      high: realtimeData.high ?? null,
      low: realtimeData.low ?? null,
      volume: realtimeData.volume ?? null,
      previousClose: realtimeData.previousClose ?? null,
      
      // Datos fundamentales RICOS
      marketCap: fundamentalsData.Highlights?.MarketCapitalization || null,
      trailingPE: fundamentalsData.Highlights?.PERatio || null,
      eps: fundamentalsData.Highlights?.EarningsShare || null,
      targetPrice: fundamentalsData.Highlights?.WallStreetTargetPrice || null,
      profitMargin: fundamentalsData.Highlights?.ProfitMargin || null,
      roe: fundamentalsData.Highlights?.ReturnOnEquityTTM || null,
      dividendYield: fundamentalsData.Highlights?.DividendYield || null
    };

    setCache(cacheKey, normalized, 'quotes');
    rateLimiter.reportSuccess();
    return normalized;
    
  } catch (error) {
    logger.error(`[EODHD] Error en getQuote híbrido para ${symbol}: ${error.message}`);
    rateLimiter.reportFailure(symbol);
    throw error;
  }
}

async function getFundamentals(symbol) {
  const eodSymbol = formatSymbol(symbol);
  const cacheKey = `fundamentals_${eodSymbol}`;
  const cached = checkCache(cacheKey, 'fundamentals');
  if (cached) return cached;

  try {
    await rateLimiter.throttle();
    const response = await axios.get(`${BASE_URL}/fundamentals/${eodSymbol}?api_token=${API_KEY}`);
    const data = response.data;

    const normalized = {
      name: data.General?.Name || symbol,
      marketCapRaw: data.Highlights?.MarketCapitalization || null,
      peRatio: data.Highlights?.PERatio || null,
      sector: data.General?.Sector || null,
      industry: data.General?.Industry || null,
      dividendYield: data.Highlights?.DividendYield || null
    };

    setCache(cacheKey, normalized, 'fundamentals');
    rateLimiter.reportSuccess();
    return normalized;
  } catch (error) {
    logger.error(`[EODHD] Error obteniendo fundamentales para ${symbol}: ${error.message}`);
    rateLimiter.reportFailure(symbol);
    throw error;
  }
}

async function getHistoricalData(symbol, days = 100) {
  const eodSymbol = formatSymbol(symbol);
  const cacheKey = `historical_${eodSymbol}_${days}`;
  const cached = checkCache(cacheKey, 'historical');
  if (cached) return cached;
  
  try {
    await rateLimiter.throttle();
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await axios.get(`${BASE_URL}/eod/${eodSymbol}?api_token=${API_KEY}&period=d&from=${startDate}&to=${endDate}&fmt=json`);
    
    const normalized = response.data.map(item => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));

    setCache(cacheKey, normalized, 'historical');
    rateLimiter.reportSuccess();
    return normalized;
  } catch (error) {
    logger.error(`[EODHD] Error obteniendo históricos para ${symbol}: ${error.message}`);
    rateLimiter.reportFailure(symbol);
    throw error;
  }
}

async function getBatchQuotes(symbols) {
  if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
    return {};
  }
  const CHUNK_SIZE = 5;
  const results = {};

  try {
    // 1. Obtener todos los datos de tiempo real en UNA SOLA llamada
    const formattedSymbolsForRealtime = symbols.map(formatSymbol);
    await rateLimiter.throttle();
    const realtimeResponse = await axios.get(`${BASE_URL}/real-time/${formattedSymbolsForRealtime.join(',')}?api_token=${API_KEY}&fmt=json`);
    const realtimeDataArray = Array.isArray(realtimeResponse.data) ? realtimeResponse.data : [realtimeResponse.data];
    const realtimeMap = new Map(realtimeDataArray.map(item => [item.code, item]));

    // 2. Procesar en lotes para obtener fundamentales
    for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
      const chunk = symbols.slice(i, i + CHUNK_SIZE);
      const fundamentalsPromises = chunk.map(symbol => 
        getFundamentalsData(symbol).catch(e => ({ symbol, error: e.message }))
      );
      const fundamentalsResults = await Promise.all(fundamentalsPromises);
      const fundamentalsMap = new Map(fundamentalsResults.map(item => [item.General?.Symbol || item.symbol, item]));

      // 3. Combinar los datos del chunk actual
      for (const symbol of chunk) {
        const formattedSymbol = formatSymbol(symbol);
        const realtimeData = realtimeMap.get(formattedSymbol);
        const fundamentalsData = fundamentalsMap.get(symbol);

        if (realtimeData) {
          results[symbol] = {
            symbol: symbol,
            name: fundamentalsData?.General?.Name || realtimeData.name || symbol,
            price: realtimeData.close ?? null,
            change: realtimeData.change ?? null,
            changePercent: realtimeData.change_p ?? null,
            volume: realtimeData.volume ?? null,
            marketCap: fundamentalsData?.Highlights?.MarketCapitalization ?? null,
            trailingPE: fundamentalsData?.Highlights?.PERatio ?? null,
          };
        } else {
          results[symbol] = { error: `No se pudieron obtener datos para ${symbol}` };
        }
      }
    }
    return results;
  } catch (error) {
    logger.error(`[EODHD] Error fatal en getBatchQuotes: ${error.message}`);
    symbols.forEach(symbol => {
      results[symbol] = { error: 'Fallo en la obtención de datos batch' };
    });
    return results;
  }
}

async function searchTicker(query) {
    const cacheKey = `search_${query}`;
    const cached = checkCache(cacheKey, 'search');
    if (cached) return cached;
    
    try {
        await rateLimiter.throttle();
        const response = await axios.get(`${BASE_URL}/search/${query}?api_token=${API_KEY}`);
        
        const normalized = response.data.map(item => ({
            symbol: item.Code,
            name: item.Name,
            exchange: item.Exchange
        }));

        setCache(cacheKey, normalized, 'search');
        return normalized;
    } catch (error) {
        logger.error(`[EODHD] Error en búsqueda de ticker para "${query}": ${error.message}`);
        throw error;
    }
}

// FUNCIONES DE UTILIDAD Y PLACEHOLDERS
function clearCache() {
  cache.clear();
  logger.info('[EODHD] Cache limpiado');
}

function clearAllCache() {
  clearCache();
}

function getSystemStats() {
  return {
    cacheSize: cache.size,
    rateLimiter: {
      callsInLastMinute: rateLimiter.calls.length,
      maxCalls: rateLimiter.maxCalls,
      circuitBreakerOpen: rateLimiter.circuitBreaker.isOpen,
      failures: rateLimiter.circuitBreaker.failures
    }
  };
}

function getRateLimiterStatus() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const callsInLastMinute = rateLimiter.calls.filter(time => time > oneMinuteAgo).length;
  
  return {
    callsInLastMinute,
    maxCalls: rateLimiter.maxCalls,
    circuitBreakerOpen: rateLimiter.circuitBreaker.isOpen,
    circuitBreakerFailures: rateLimiter.circuitBreaker.failures,
    blacklistedSymbols: Array.from(rateLimiter.circuitBreaker.failedSymbols)
  };
}

async function getRSI(symbol) { return { rsi: 50 }; }
async function getMACD(symbol) { return { macd: 0 }; }

module.exports = {
  getQuote,
  getFundamentals,
  getHistoricalData,
  getBatchQuotes,
  searchTicker,
  getCryptoQuote: getQuote,
  clearCache,
  clearAllCache,
  getSystemStats,
  getRateLimiterStatus,
  getRSI,
  getMACD
}; 