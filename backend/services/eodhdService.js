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
  const results = {};

  try {
    // 1. Primero, intentar obtener de cache los que ya tenemos
    const symbolsNeedingData = [];
    
    for (const symbol of symbols) {
      const cachedQuote = checkCache(`quote_${symbol}`, 'quotes');
      if (cachedQuote) {
        // Si tenemos datos completos en cache, usarlos
        results[symbol] = cachedQuote;
        logger.debug(`[EODHD] Batch: Usando cache para ${symbol}`);
      } else {
        symbolsNeedingData.push(symbol);
      }
    }
    
    // Si todos los símbolos estaban en cache, retornar
    if (symbolsNeedingData.length === 0) {
      logger.info(`[EODHD] Batch: Todos los ${symbols.length} símbolos desde cache`);
      return results;
    }
    
    logger.info(`[EODHD] Batch: ${results.length || 0} desde cache, obteniendo ${symbolsNeedingData.length} símbolos`);
    
    // 2. Obtener datos de tiempo real para los símbolos que faltan
    const formattedSymbolsForRealtime = symbolsNeedingData.map(formatSymbol);
    await rateLimiter.throttle();
    
    let realtimeDataArray = [];
    try {
      const realtimeResponse = await axios.get(`${BASE_URL}/real-time/${formattedSymbolsForRealtime.join(',')}?api_token=${API_KEY}&fmt=json`);
      realtimeDataArray = Array.isArray(realtimeResponse.data) ? realtimeResponse.data : [realtimeResponse.data];
    } catch (realtimeError) {
      logger.error(`[EODHD] Error obteniendo datos en tiempo real: ${realtimeError.message}`);
      // Continuar sin datos en tiempo real
    }
    
    const realtimeMap = new Map(realtimeDataArray.map(item => [item.code, item]));

    // 3. Para cada símbolo, intentar obtener fundamentales desde cache o crear resultado básico
    for (const symbol of symbolsNeedingData) {
      const formattedSymbol = formatSymbol(symbol);
      const realtimeData = realtimeMap.get(formattedSymbol);
      
      if (realtimeData) {
        // Buscar fundamentales en cache primero
        const cachedFundamentals = checkCache(`fundamentals_${formattedSymbol}`, 'fundamentals');
        
        const result = {
          symbol: symbol,
          name: symbol,
          price: realtimeData.close ?? null,
          change: realtimeData.change ?? null,
          changePercent: realtimeData.change_p ?? null,
          volume: realtimeData.volume ?? null,
          marketCap: null,
          trailingPE: null,
        };
        
        // Si tenemos fundamentales en cache, usarlos
        if (cachedFundamentals) {
          result.name = cachedFundamentals.name || symbol;
          result.marketCap = cachedFundamentals.marketCapRaw || null;
          result.trailingPE = cachedFundamentals.peRatio || null;
          logger.debug(`[EODHD] Batch: Usando fundamentales de cache para ${symbol}`);
        }
        
        results[symbol] = result;
        
        // Guardar en cache como quote básico (sin fundamentales completos)
        setCache(`quote_${symbol}`, result, 'quotes');
      } else {
        // Si no hay datos en tiempo real, devolver estructura mínima
        results[symbol] = {
          symbol: symbol,
          name: symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          marketCap: null,
          trailingPE: null,
          error: 'No real-time data available'
        };
      }
    }
    
    // 4. Opcionalmente, programar actualización de fundamentales en background
    // para que estén disponibles en la próxima llamada
    setTimeout(() => {
      updateFundamentalsInBackground(symbolsNeedingData);
    }, 1000);
    
    return results;
  } catch (error) {
    logger.error(`[EODHD] Error fatal en getBatchQuotes: ${error.message}`);
    symbols.forEach(symbol => {
      if (!results[symbol]) {
        results[symbol] = { 
          symbol,
          name: symbol,
          price: 0,
          error: 'Batch quotes failed' 
        };
      }
    });
    return results;
  }
}

// Función auxiliar para actualizar fundamentales en background
async function updateFundamentalsInBackground(symbols) {
  logger.debug(`[EODHD] Actualizando fundamentales en background para ${symbols.length} símbolos`);
  
  for (const symbol of symbols) {
    try {
      // Verificar si ya tenemos fundamentales recientes en cache
      const cachedFundamentals = checkCache(`fundamentals_${formatSymbol(symbol)}`, 'fundamentals');
      if (!cachedFundamentals) {
        // Intentar obtener fundamentales con throttling
        await rateLimiter.throttle();
        await getFundamentals(symbol);
        logger.debug(`[EODHD] Fundamentales actualizados para ${symbol}`);
        
        // Pequeña pausa entre símbolos para no saturar
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.debug(`[EODHD] No se pudieron actualizar fundamentales para ${symbol}: ${error.message}`);
    }
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