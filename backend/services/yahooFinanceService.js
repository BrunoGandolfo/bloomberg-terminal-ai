const yahooFinance = require('yahoo-finance2').default;
const logger = require('../utils/logger');
const tickerSearchService = require('./tickerSearchService');
require('dotenv').config();

// WHITELIST DE CRYPTO - SOLO BTC/USD PARA OPTIMIZAR API CALLS
const SUPPORTED_CRYPTO = {
  // ÚNICA CRYPTO SOPORTADA
  'BTC/USD': 'BTC-USD',  // Mapeo a formato Yahoo Finance
  
  // TODAS LAS DEMÁS CRYPTO NO SOPORTADAS PARA OPTIMIZAR API USAGE
  'ETH/USD': 'ETH-USD',    // Ethereum - disponible pero deshabilitada
  'XRP/USD': 'XRP-USD',    // XRP - disponible pero deshabilitada
  'LTC/USD': 'LTC-USD',    // Litecoin - disponible pero deshabilitada
  'ADA/USD': 'ADA-USD',    // Cardano - disponible pero deshabilitada
  'DOT/USD': 'DOT-USD',    // Polkadot - disponible pero deshabilitada
  'LINK/USD': 'LINK-USD',  // Chainlink - disponible pero deshabilitada
  'UNI/USD': 'UNI-USD',    // Uniswap - disponible pero deshabilitada
  'THETA/USD': 'THETA-USD', // Theta - disponible pero deshabilitada
  'BNB/USD': 'BNB-USD',    // Binance Coin - disponible pero deshabilitada
  'SOL/USD': 'SOL-USD',    // Solana - disponible pero deshabilitada
  'AVAX/USD': 'AVAX-USD',  // Avalanche - disponible pero deshabilitada
  'MATIC/USD': 'MATIC-USD', // Polygon - disponible pero deshabilitada
  'USDT/USD': false,       // Tether - no necesaria (siempre ~$1)
  'USDC/USD': false        // USD Coin - no necesaria (siempre ~$1)
};

// RATE LIMITER PROFESIONAL ESTILO BLOOMBERG - ADAPTADO PARA YAHOO FINANCE
class RateLimiter {
  constructor(maxCallsPerMinute = 120) { // Yahoo Finance es más generoso
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
    
    // Limpiar llamadas viejas
    this.calls = this.calls.filter(time => time > oneMinuteAgo);
    
    // Circuit breaker check
    if (this.circuitBreaker.isOpen) {
      if (now < this.circuitBreaker.resetTime) {
        throw new Error('Circuit breaker OPEN - API temporalmente bloqueada');
      }
      // Reset circuit breaker
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.failedSymbols.clear();
      logger.info('[Yahoo Finance] Circuit breaker RESET - API disponible');
    }
    
    // Rate limit check - Yahoo Finance es más tolerante
    if (this.calls.length >= this.maxCalls - 10) { // Margen de seguridad mayor
      const waitTime = 60000 - (now - this.calls[0]);
      logger.warn(`[Yahoo Finance] Límite alcanzado. Esperando ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.calls.push(now);
  }
  
  reportFailure(symbol = null) {
    this.circuitBreaker.failures++;
    logger.warn(`[Yahoo Finance] Fallo registrado: ${this.circuitBreaker.failures}/${this.circuitBreaker.threshold}`);
    
    if (symbol) {
      this.circuitBreaker.failedSymbols.add(symbol);
      logger.warn(`[Yahoo Finance] Símbolo ${symbol} agregado a lista negra temporal`);
    }
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      this.circuitBreaker.resetTime = Date.now() + 60000; // 1 minuto
      logger.error('[Yahoo Finance] Circuit breaker ACTIVADO - Pausando llamadas por 1 minuto');
    }
  }
  
  reportSuccess() {
    this.circuitBreaker.failures = 0;
  }
  
  isSymbolBlacklisted(symbol) {
    return this.circuitBreaker.failedSymbols.has(symbol);
  }
}

// Cache diferenciado por tipo de dato
const CACHE_CONFIG = {
  quotes: {
    ttl: 5000,       // 5 segundos para cotizaciones (TEMPORAL - debug campos P/E y MarketCap)
    priority: 'high'
  },
  fundamentals: {
    ttl: 3600000,    // 1 hora para fundamentales
    priority: 'medium'
  },
  crypto: {
    ttl: 15000,      // 15 segundos para crypto (más volátil)
    priority: 'high'
  },
  historical: {
    ttl: 1800000,    // 30 minutos para datos históricos
    priority: 'low'
  }
};

// Instancia del rate limiter
const rateLimiter = new RateLimiter(120); // Yahoo Finance permite más llamadas

// Cache inteligente
const cache = new Map();

// Helper para obtener configuración de cache
function getCacheConfig(type) {
  return CACHE_CONFIG[type] || CACHE_CONFIG.quotes;
}

// Helper para verificar cache
function checkCache(key, type) {
  const cached = cache.get(key);
  const config = getCacheConfig(type);
  
  if (cached && Date.now() - cached.timestamp < config.ttl) {
    return cached.data;
  }
  return null;
}

// Helper para guardar en cache
function setCache(key, data, type) {
  const config = getCacheConfig(type);
  cache.set(key, { 
    data, 
    timestamp: Date.now(), 
    type, 
    priority: config.priority 
  });
}

// FUNCIÓN PARA CRYPTO USANDO YAHOO FINANCE
async function getCryptoQuote(symbol) {
  try {
    logger.info(`[Yahoo Finance] Obteniendo cotización crypto: ${symbol}`);
    
    // Verificar cache crypto
    const cached = checkCache(`crypto_${symbol}`, 'crypto');
    if (cached) {
      logger.debug(`[Yahoo Finance] Cache HIT para crypto ${symbol}`);
      return cached;
    }
    
    // Aplicar rate limiting
    await rateLimiter.throttle();
    
    // Convertir formato BTC/USD a BTC-USD para Yahoo Finance
    const yahooSymbol = SUPPORTED_CRYPTO[symbol];
    if (!yahooSymbol) {
      throw new Error(`Formato de símbolo crypto no soportado: ${symbol}`);
    }
    
    // Usar yahoo-finance2 para obtener cotización
    const result = await yahooFinance.quote(yahooSymbol, {
      fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 
               'regularMarketVolume', 'regularMarketOpen', 'regularMarketDayHigh', 
               'regularMarketDayLow', 'regularMarketPreviousClose', 'shortName']
    });
    
    if (!result || !result.regularMarketPrice) {
      logger.error(`[Yahoo Finance] No hay datos de crypto para ${symbol}:`, result);
      rateLimiter.reportFailure(symbol);
      throw new Error(`No hay datos de crypto para ${symbol}`);
    }
    
    // Mapear a estructura esperada por el frontend
    const normalized = {
      symbol: symbol,
      name: result.shortName || symbol,
      price: result.regularMarketPrice,
      open: result.regularMarketOpen || result.regularMarketPrice,
      high: result.regularMarketDayHigh || result.regularMarketPrice,
      low: result.regularMarketDayLow || result.regularMarketPrice,
      close: result.regularMarketPrice,
      volume: result.regularMarketVolume || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      previousClose: result.regularMarketPreviousClose || result.regularMarketPrice,
      averageVolume: null,
      marketCap: null,
      timestamp: new Date().toISOString()
    };
    
    // Guardar en cache crypto
    setCache(`crypto_${symbol}`, normalized, 'crypto');
    
    rateLimiter.reportSuccess();
    logger.info(`[Yahoo Finance] Cotización crypto obtenida: ${symbol} = $${normalized.price.toLocaleString()}`);
    
    return normalized;
    
  } catch (error) {
    // Log detallado del error de yahoo-finance2
    logger.error(`[Yahoo Finance] Error obteniendo crypto quote para ${symbol}:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      response: error.response?.data || error.response,
      symbol: symbol,
      yahooSymbol: SUPPORTED_CRYPTO[symbol]
    });
    rateLimiter.reportFailure(symbol);
    throw error;
  }
}

// FUNCIONES PRINCIPALES USANDO YAHOO FINANCE

async function getQuote(symbol) {
  try {
    logger.info(`[Yahoo Finance] Obteniendo cotización: ${symbol}`);
    
    // DETECTAR SI ES CRYPTO
    const isCrypto = symbol.includes('/USD') || symbol.includes('/EUR');
    
    if (isCrypto) {
      // VERIFICAR SI ESTÁ EN LISTA NEGRA TEMPORAL
      if (rateLimiter.isSymbolBlacklisted(symbol)) {
        logger.warn(`[Yahoo Finance] Símbolo ${symbol} en lista negra temporal`);
        return {
          symbol: symbol,
          price: 0,
          error: 'Symbol temporarily blacklisted',
          message: 'Este símbolo está temporalmente no disponible debido a errores repetidos'
        };
      }
      
      // VERIFICAR SI ESTÁ SOPORTADA EN WHITELIST
      if (SUPPORTED_CRYPTO[symbol] === false || !SUPPORTED_CRYPTO[symbol]) {
        logger.warn(`[Yahoo Finance] Crypto ${symbol} no soportada`);
        return {
          symbol: symbol,
          price: 0,
          error: 'Cryptocurrency not supported',
          message: 'Esta criptomoneda no está disponible',
          supported: false
        };
      }
      
      // TEMPORAL: BTC/USD deshabilitado por incompatibilidad con esquema Yahoo Finance
      if (symbol === 'BTC/USD') {
        logger.info('[Yahoo Finance] Crypto temporalmente deshabilitada');
        return {
          symbol: 'BTC/USD',
          price: 0,
          error: 'Crypto temporarily disabled',
          message: 'BTC/USD deshabilitado temporalmente por cambios en Yahoo Finance API'
        };
      }
      
      logger.warn(`[Yahoo Finance] Crypto ${symbol} no habilitada actualmente`);
      return {
        symbol: symbol,
        price: 0,
        error: 'Cryptocurrency not enabled',
        message: 'Solo BTC/USD está habilitado actualmente'
      };
    }
    
    // STOCKS - Lógica con Yahoo Finance
    const cached = checkCache(`quote_${symbol}`, 'quotes');
    if (cached) {
      logger.debug(`[Yahoo Finance] Cache HIT para ${symbol}`);
      return cached;
    }
    
    // Aplicar rate limiting
    await rateLimiter.throttle();

    // Usar yahoo-finance2 para obtener cotización
    const result = await yahooFinance.quote(symbol, {
      fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 
               'regularMarketVolume', 'regularMarketOpen', 'regularMarketDayHigh', 
               'regularMarketDayLow', 'regularMarketPreviousClose', 'shortName', 'longName',
               'marketCap', 'trailingPE']
    });
    
    if (!result || !result.regularMarketPrice) {
      logger.error(`[Yahoo Finance] No hay datos para ${symbol}:`, result);
      rateLimiter.reportFailure(symbol);
      throw new Error(`No hay datos para ${symbol}`);
    }
    
    // LOG TEMPORAL para debugging
    console.log('[DEBUG] Datos de Yahoo para', symbol, ':', result);
    
    // Obtener nombre de la empresa
    let companyName = result.shortName || result.longName || symbol;
    try {
      const tickerInfo = tickerSearchService.searchTicker(symbol);
      if (tickerInfo && tickerInfo.length > 0 && tickerInfo[0].name) {
        companyName = tickerInfo[0].name;
      }
    } catch (err) {
      logger.debug(`[Yahoo Finance] No se pudo obtener nombre para ${symbol}: ${err.message}`);
    }
    
    const normalized = {
      symbol: symbol,
      name: companyName,
      price: result.regularMarketPrice,
      open: result.regularMarketOpen || result.regularMarketPrice,
      high: result.regularMarketDayHigh || result.regularMarketPrice,
      low: result.regularMarketDayLow || result.regularMarketPrice,
      close: result.regularMarketPrice,
      volume: result.regularMarketVolume || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      previousClose: result.regularMarketPreviousClose || result.regularMarketPrice,
      averageVolume: null,
      marketCap: result.marketCap || null,
      trailingPE: result.trailingPE || null,
      timestamp: new Date().toISOString()
    };
    
    // Guardar en cache
    setCache(`quote_${symbol}`, normalized, 'quotes');
    
    rateLimiter.reportSuccess();
    logger.info(`[Yahoo Finance] Cotización obtenida: ${symbol} = $${normalized.price}`);
    
    return normalized;
    
  } catch (error) {
    // Log detallado del error de yahoo-finance2  
    logger.error(`[Yahoo Finance] Error obteniendo cotización ${symbol}:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      response: error.response?.data || error.response,
      symbol: symbol,
      isCrypto: symbol.includes('/USD') || symbol.includes('/EUR')
    });
    rateLimiter.reportFailure(symbol);
    throw error;
  }
}

async function getFundamentals(symbol) {
  try {
    logger.info(`[Yahoo Finance] Obteniendo fundamentals: ${symbol}`);
    
    const cached = checkCache(`fundamentals_${symbol}`, 'fundamentals');
    if (cached) {
      logger.debug(`[Yahoo Finance] Cache HIT para fundamentals ${symbol}`);
      return cached;
    }
    
    // Aplicar rate limiting
    await rateLimiter.throttle();

    // Usar yahoo-finance2 para obtener datos fundamentales
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail']
    });
    
    if (!result) {
      rateLimiter.reportFailure();
      throw new Error(`No hay datos fundamentales para ${symbol}`);
    }
    
    const keyStats = result.defaultKeyStatistics || {};
    const financialData = result.financialData || {};
    const summaryDetail = result.summaryDetail || {};
    
    const normalized = {
      name: symbol, // Yahoo Finance no siempre incluye el nombre en quoteSummary
      marketCap: summaryDetail.marketCap?.fmt || '0',
      marketCapRaw: summaryDetail.marketCap?.raw || 0,
      peRatio: summaryDetail.trailingPE?.raw || null,
      eps: keyStats.trailingEps?.raw || 0,
      profitMargin: (financialData.profitMargins?.raw * 100)?.toFixed(2) + '%' || 'N/A',
      returnOnEquity: (financialData.returnOnEquity?.raw * 100)?.toFixed(2) + '%' || 'N/A',
      dividendYield: (summaryDetail.dividendYield?.raw * 100)?.toFixed(2) + '%' || 'N/A',
      bookValue: keyStats.bookValue?.raw || 0,
      priceToBook: keyStats.priceToBook?.raw || null,
      beta: keyStats.beta?.raw || null,
      week52High: summaryDetail.fiftyTwoWeekHigh?.raw || 0,
      week52Low: summaryDetail.fiftyTwoWeekLow?.raw || 0,
      debtToEquity: financialData.debtToEquity?.raw || null
    };
    
    setCache(`fundamentals_${symbol}`, normalized, 'fundamentals');
    
    rateLimiter.reportSuccess();
    logger.info(`[Yahoo Finance] Fundamentals obtenidos: ${symbol}`);
    
    return normalized;
    
  } catch (error) {
    // Log detallado del error de yahoo-finance2
    logger.error(`[Yahoo Finance] Error obteniendo fundamentals ${symbol}:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      response: error.response?.data || error.response,
      symbol: symbol
    });
    rateLimiter.reportFailure();
    throw error;
  }
}

async function getHistoricalData(symbol, days = 100) {
  try {
    logger.info(`[Yahoo Finance] Obteniendo históricos: ${symbol} (${days} días)`);
    
    const cached = checkCache(`historical_${symbol}_${days}`, 'historical');
    if (cached) {
      logger.debug(`[Yahoo Finance] Cache HIT para históricos ${symbol}`);
      return cached;
    }
    
    // Aplicar rate limiting
    await rateLimiter.throttle();
    
    // Calcular fechas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    // Usar yahoo-finance2 para obtener datos históricos
    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    if (!result || result.length === 0) {
      rateLimiter.reportFailure();
      throw new Error('No hay datos históricos disponibles');
    }
    
    // Formatear datos
    const formattedResult = result.map(item => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    })).reverse(); // Más reciente primero
    
    setCache(`historical_${symbol}_${days}`, formattedResult, 'historical');
    
    rateLimiter.reportSuccess();
    logger.info(`[Yahoo Finance] Históricos obtenidos: ${symbol} (${formattedResult.length} registros)`);
    
    return formattedResult;
    
  } catch (error) {
    // Log detallado del error de yahoo-finance2
    logger.error(`[Yahoo Finance] Error obteniendo históricos ${symbol}:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      response: error.response?.data || error.response,
      symbol: symbol,
      days: days
    });
    rateLimiter.reportFailure();
    throw error;
  }
}

// Para tus 25 tickers - actualización inteligente usando Yahoo Finance
async function getBatchQuotes(symbols) {
  try {
    logger.info(`[Yahoo Finance] Obteniendo batch quotes: ${symbols.length} símbolos`);
    
    const results = [];
    
    // Yahoo Finance permite llamadas batch más eficientes
    for (const symbol of symbols) {
      const cached = checkCache(`quote_${symbol}`, 'quotes');
      if (cached) {
        results.push(cached);
        logger.debug(`[Yahoo Finance] Cache HIT para batch ${symbol}`);
      } else {
        try {
          const quote = await getQuote(symbol);
          results.push(quote);
          
          // Pausa más corta - Yahoo Finance es más tolerante
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms = ~600 calls/min
          
        } catch (err) {
          logger.error(`[Yahoo Finance] Error en batch para ${symbol}:`, err.message);
          // Continuar con otros símbolos
        }
      }
    }
    
    logger.info(`[Yahoo Finance] Batch completado: ${results.length}/${symbols.length} símbolos`);
    return results;
    
  } catch (error) {
    logger.error('[Yahoo Finance] Error en batch quotes:', error);
    throw error;
  }
}

// Función para limpiar cache (útil para debugging)
function clearCache() {
  cache.clear();
  logger.info('[Yahoo Finance] Cache limpiado');
}

// Función para limpiar TODO el cache (TEMPORAL para debug)
function clearAllCache() {
  cache.clear();
  logger.info('[Yahoo Finance] Cache limpiado completamente');
}

// Función para obtener estadísticas del sistema
function getSystemStats() {
  return {
    cacheSize: cache.size,
    rateLimiter: {
      callsInLastMinute: rateLimiter.calls.length,
      maxCalls: rateLimiter.maxCalls,
      circuitBreakerOpen: rateLimiter.circuitBreaker.isOpen,
      failures: rateLimiter.circuitBreaker.failures
    },
    cacheTypes: Array.from(cache.values()).reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {})
  };
}

// Placeholders para mantener compatibilidad
async function getRSI(symbol) {
  // TODO: Implementar si necesario usando Yahoo Finance
  return { rsi: 50 };
}

async function getMACD(symbol) {
  // TODO: Implementar si necesario usando Yahoo Finance
  return { macd: 0 };
}

// Función para obtener el estado del rate limiter (para debugging)
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

module.exports = {
  getQuote,
  getFundamentals,
  getHistoricalData,
  getBatchQuotes,
  getRSI,
  getMACD,
  getCryptoQuote,
  clearCache,
  clearAllCache,
  getSystemStats,
  getRateLimiterStatus
}; 