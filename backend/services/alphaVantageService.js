// backend/services/alphaVantageService.js
const axios = require('axios');
const logger = require('../utils/logger');
const tickerSearchService = require('./tickerSearchService');
require('dotenv').config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// WHITELIST DE CRYPTO - SOLO BTC/USD PARA OPTIMIZAR API CALLS
const SUPPORTED_CRYPTO = {
  // ÚNICA CRYPTO SOPORTADA
  'BTC/USD': true,
  
  // TODAS LAS DEMÁS CRYPTO NO SOPORTADAS PARA OPTIMIZAR API USAGE
  'ETH/USD': false,    // Ethereum - deshabilitada para optimizar
  'XRP/USD': false,    // XRP - deshabilitada para optimizar
  'LTC/USD': false,    // Litecoin - deshabilitada para optimizar
  'ADA/USD': false,    // Cardano - deshabilitada para optimizar
  'DOT/USD': false,    // Polkadot - deshabilitada para optimizar
  'LINK/USD': false,   // Chainlink - deshabilitada para optimizar
  'UNI/USD': false,    // Uniswap - deshabilitada para optimizar
  'THETA/USD': false,  // Theta - deshabilitada para optimizar
  'BNB/USD': false,    // Binance Coin - problemas conocidos
  'SOL/USD': false,    // Solana - no soportada consistentemente
  'AVAX/USD': false,   // Avalanche - soporte inconsistente
  'MATIC/USD': false,  // Polygon - no soportada
  'USDT/USD': false,   // Tether - no necesaria (siempre ~$1)
  'USDC/USD': false    // USD Coin - no necesaria (siempre ~$1)
};

// RATE LIMITER PROFESIONAL ESTILO BLOOMBERG - MEJORADO
class RateLimiter {
  constructor(maxCallsPerMinute = 75) {
    this.maxCalls = maxCallsPerMinute;
    this.calls = [];
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      isOpen: false,
      resetTime: null,
      failedSymbols: new Set() // NUEVO: Track de símbolos fallidos
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
      this.circuitBreaker.failedSymbols.clear(); // Limpiar lista negra
      logger.info('[Rate Limiter] Circuit breaker RESET - API disponible');
    }
    
    // Rate limit check
    if (this.calls.length >= this.maxCalls - 5) { // Margen de seguridad
      const waitTime = 60000 - (now - this.calls[0]);
      logger.warn(`[Rate Limiter] Límite alcanzado. Esperando ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.calls.push(now);
  }
  
  reportFailure(symbol = null) {
    this.circuitBreaker.failures++;
    logger.warn(`[Rate Limiter] Fallo registrado: ${this.circuitBreaker.failures}/${this.circuitBreaker.threshold}`);
    
    // Si un símbolo falla repetidamente, blacklistearlo temporalmente
    if (symbol) {
      this.circuitBreaker.failedSymbols.add(symbol);
      logger.warn(`[Rate Limiter] Símbolo ${symbol} agregado a lista negra temporal`);
    }
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      this.circuitBreaker.resetTime = Date.now() + 60000; // 1 minuto
      logger.error('[Rate Limiter] Circuit breaker ACTIVADO - Pausando llamadas por 1 minuto');
    }
  }
  
  reportSuccess() {
    // Reset failures on success
    this.circuitBreaker.failures = 0;
  }
  
  isSymbolBlacklisted(symbol) {
    return this.circuitBreaker.failedSymbols.has(symbol);
  }
}

// Cache diferenciado por tipo de dato
const CACHE_CONFIG = {
  quotes: {
    ttl: 30000,      // 30 segundos para cotizaciones
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
const rateLimiter = new RateLimiter(75); // Alpha Vantage Pro

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

// NUEVA FUNCIÓN PARA CRYPTO - CORREGIDA PARA TIEMPO REAL
async function getCryptoQuote(symbol) {
  try {
    logger.info(`[Alpha Vantage] Obteniendo cotización crypto: ${symbol}`);
    
    // Verificar cache crypto
    const cached = checkCache(`crypto_${symbol}`, 'crypto');
    if (cached) {
      logger.debug(`[Alpha Vantage] Cache HIT para crypto ${symbol}`);
      return cached;
    }
    
    // Aplicar rate limiting
    await rateLimiter.throttle();
    
    // Separar BTC/USD en BTC y USD
    const [fromCurrency, toCurrency] = symbol.split('/');
    
    if (!fromCurrency || !toCurrency) {
      throw new Error(`Formato de símbolo crypto inválido: ${symbol}. Use formato BTC/USD`);
    }
    
    // Para crypto en tiempo real, usar CURRENCY_EXCHANGE_RATE
    const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${API_KEY}`;
    
    logger.debug(`[Alpha Vantage] Crypto URL: ${url.replace(API_KEY, 'HIDDEN')}`);
    
    const response = await axios.get(url);
    
    if (response.data['Error Message']) {
      rateLimiter.reportFailure(symbol);
      throw new Error(`Símbolo crypto inválido: ${symbol}`);
    }
    
    if (response.data['Note']) {
      rateLimiter.reportFailure(symbol);
      throw new Error('Límite de API alcanzado');
    }
    
    // Alpha Vantage devuelve cotización en tiempo real para crypto
    const data = response.data['Realtime Currency Exchange Rate'];
    
    if (!data) {
      logger.error(`[Alpha Vantage] No hay datos de crypto para ${symbol}:`, response.data);
      rateLimiter.reportFailure(symbol);
      throw new Error(`No hay datos de crypto para ${symbol}`);
    }
    
    // Extraer precio actual
    const currentPrice = parseFloat(data['5. Exchange Rate']);
    const bidPrice = parseFloat(data['8. Bid Price']);
    const askPrice = parseFloat(data['9. Ask Price']);
    
    // Para crypto, no tenemos datos de cambio diario en tiempo real
    // Usaremos bid/ask spread como aproximación de volatilidad
    const spread = askPrice - bidPrice;
    const spreadPercent = (spread / currentPrice) * 100;
    
    // Mapear a estructura esperada por el frontend
    const normalized = {
      symbol: symbol,
      name: `${fromCurrency} to ${toCurrency}`, // Nombre descriptivo para crypto
      price: currentPrice,
      open: currentPrice, // Crypto no tiene open/close tradicional en tiempo real
      high: askPrice, // Usar ask como high aproximado
      low: bidPrice,  // Usar bid como low aproximado
      close: currentPrice,
      volume: 0, // CURRENCY_EXCHANGE_RATE no proporciona volumen
      change: 0, // No disponible en tiempo real, requeriría comparar con día anterior
      changePercent: 0,
      previousClose: currentPrice,
      averageVolume: null, // No disponible para crypto
      marketCap: null,     // No disponible para crypto en este endpoint
      timestamp: data['6. Last Refreshed'],
      // Datos adicionales específicos de crypto
      bidPrice: bidPrice,
      askPrice: askPrice,
      spread: parseFloat(spread.toFixed(4)),
      spreadPercent: parseFloat(spreadPercent.toFixed(4))
    };
    
    // Guardar en cache crypto
    setCache(`crypto_${symbol}`, normalized, 'crypto');
    
    rateLimiter.reportSuccess();
    logger.info(`[Alpha Vantage] Cotización crypto obtenida: ${symbol} = $${normalized.price.toLocaleString()} (Spread: ${normalized.spreadPercent.toFixed(4)}%)`);
    
    return normalized;
    
  } catch (error) {
    logger.error(`[Alpha Vantage] Error obteniendo crypto quote para ${symbol}:`, error.message);
    rateLimiter.reportFailure(symbol);
    throw error;
  }
}

// FUNCIONES PRINCIPALES - MEJORADAS

async function getQuote(symbol) {
  try {
    logger.info(`[Alpha Vantage] Obteniendo cotización: ${symbol}`);
    
    // DETECTAR SI ES CRYPTO
    const isCrypto = symbol.includes('/USD') || symbol.includes('/EUR');
    
    if (isCrypto) {
      // VERIFICAR SI ESTÁ EN LISTA NEGRA TEMPORAL
      if (rateLimiter.isSymbolBlacklisted(symbol)) {
        logger.warn(`[Alpha Vantage] Símbolo ${symbol} en lista negra temporal`);
        return {
          symbol: symbol,
          price: 0,
          error: 'Symbol temporarily blacklisted',
          message: 'Este símbolo está temporalmente no disponible debido a errores repetidos'
        };
      }
      
      // VERIFICAR SI ESTÁ SOPORTADA EN WHITELIST
      if (SUPPORTED_CRYPTO[symbol] === false) {
        logger.warn(`[Alpha Vantage] Crypto ${symbol} no soportada por Alpha Vantage`);
        return {
          symbol: symbol,
          price: 0,
          error: 'Cryptocurrency not supported by Alpha Vantage',
          message: 'Esta criptomoneda no está disponible en Alpha Vantage',
          supported: false
        };
      }
      
      // Solo intentar si está confirmada como soportada
      if (SUPPORTED_CRYPTO[symbol] === true) {
        logger.debug(`[Alpha Vantage] Detectado símbolo crypto soportado: ${symbol}`);
        return await getCryptoQuote(symbol);
      }
      
      // Si no está en la whitelist, intentar pero con precaución
      logger.warn(`[Alpha Vantage] Crypto ${symbol} no está en whitelist, intentando...`);
      return await getCryptoQuote(symbol);
    }
    
    // STOCKS - Lógica mejorada
    const cached = checkCache(`quote_${symbol}`, 'quotes');
    if (cached) {
      logger.debug(`[Alpha Vantage] Cache HIT para ${symbol}`);
      return cached;
    }
    
    // Aplicar rate limiting
    await rateLimiter.throttle();

    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    logger.debug(`[Alpha Vantage] Stock URL: ${url.replace(API_KEY, 'HIDDEN')}`);
    
    const response = await axios.get(url);
    
    if (response.data['Error Message']) {
      rateLimiter.reportFailure(symbol);
      throw new Error(`Símbolo inválido: ${symbol}`);
    }
    
    if (response.data['Note']) {
      rateLimiter.reportFailure(symbol);
      throw new Error('Límite de API alcanzado');
    }
    
    if (!response.data['Global Quote']) {
      logger.error(`[Alpha Vantage] No hay Global Quote para ${symbol}:`, response.data);
      rateLimiter.reportFailure(symbol);
      throw new Error(`Respuesta inválida de Alpha Vantage para ${symbol}`);
    }
    
    const quote = response.data['Global Quote'];
    
    // Obtener nombre de la empresa usando tickerSearchService
    let companyName = symbol; // Fallback al símbolo
    try {
      const tickerInfo = tickerSearchService.searchTicker(symbol);
      if (tickerInfo && tickerInfo.length > 0 && tickerInfo[0].name) {
        companyName = tickerInfo[0].name;
      }
    } catch (err) {
      logger.debug(`[Alpha Vantage] No se pudo obtener nombre para ${symbol}: ${err.message}`);
    }
    
    const normalized = {
      symbol: quote['01. symbol'],
      name: companyName,
      price: parseFloat(quote['05. price']),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      close: parseFloat(quote['05. price']),
      volume: parseInt(quote['06. volume']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      previousClose: parseFloat(quote['08. previous close']),
      averageVolume: null, // Alpha Vantage GLOBAL_QUOTE no proporciona volumen promedio
      marketCap: null,     // Alpha Vantage GLOBAL_QUOTE no proporciona market cap
      timestamp: new Date().toISOString()
    };
    
    // Guardar en cache
    setCache(`quote_${symbol}`, normalized, 'quotes');
    
    rateLimiter.reportSuccess();
    logger.info(`[Alpha Vantage] Cotización obtenida: ${symbol} = $${normalized.price}`);
    
    return normalized;
    
  } catch (error) {
    logger.error(`[Alpha Vantage] Error obteniendo cotización ${symbol}:`, error.message);
    rateLimiter.reportFailure(symbol);
    throw error;
  }
}

async function getFundamentals(symbol) {
  try {
    logger.info(`[Alpha Vantage] Obteniendo fundamentals: ${symbol}`);
    
    const cached = checkCache(`fundamentals_${symbol}`, 'fundamentals');
    if (cached) {
      logger.debug(`[Alpha Vantage] Cache HIT para fundamentals ${symbol}`);
      return cached;
    }
    
    // Aplicar rate limiting
    await rateLimiter.throttle();

    const url = `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await axios.get(url);
    
    if (response.data['Error Message']) {
      rateLimiter.reportFailure();
      throw new Error(`Símbolo inválido: ${symbol}`);
    }
    
    if (response.data['Note']) {
      rateLimiter.reportFailure();
      throw new Error('Límite de API alcanzado');
    }
    
    const data = response.data;
    const normalized = {
      name: data.Name,
      marketCap: data.MarketCapitalization,
      marketCapRaw: parseInt(data.MarketCapitalization),
      peRatio: parseFloat(data.PERatio) || null,
      eps: parseFloat(data.EPS),
      profitMargin: (parseFloat(data.ProfitMargin) * 100).toFixed(2) + '%',
      returnOnEquity: (parseFloat(data.ReturnOnEquityTTM) * 100).toFixed(2) + '%',
      dividendYield: (parseFloat(data.DividendYield) * 100).toFixed(2) + '%',
      bookValue: parseFloat(data.BookValue),
      priceToBook: parseFloat(data.PriceToBookRatio),
      beta: parseFloat(data.Beta),
      week52High: parseFloat(data['52WeekHigh']),
      week52Low: parseFloat(data['52WeekLow']),
      debtToEquity: parseFloat(data.DebtToEquity) || null
    };
    
    setCache(`fundamentals_${symbol}`, normalized, 'fundamentals');
    
    rateLimiter.reportSuccess();
    logger.info(`[Alpha Vantage] Fundamentals obtenidos: ${symbol}`);
    
    return normalized;
    
  } catch (error) {
    logger.error(`[Alpha Vantage] Error obteniendo fundamentals ${symbol}:`, error.message);
    rateLimiter.reportFailure();
    throw error;
  }
}

async function getHistoricalData(symbol, days = 100) {
  try {
    logger.info(`[Alpha Vantage] Obteniendo históricos: ${symbol} (${days} días)`);
    
    const cached = checkCache(`historical_${symbol}_${days}`, 'historical');
    if (cached) {
      logger.debug(`[Alpha Vantage] Cache HIT para históricos ${symbol}`);
      return cached;
    }
    
    // Aplicar rate limiting
    await rateLimiter.throttle();
    
    const outputsize = days > 100 ? 'full' : 'compact';
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${API_KEY}`;
    const response = await axios.get(url);
    
    if (response.data['Error Message']) {
      rateLimiter.reportFailure();
      throw new Error(`Símbolo inválido: ${symbol}`);
    }
    
    if (response.data['Note']) {
      rateLimiter.reportFailure();
      throw new Error('Límite de API alcanzado');
    }
    
    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
      rateLimiter.reportFailure();
      throw new Error('No hay datos históricos disponibles');
    }
    
    const dates = Object.keys(timeSeries).slice(0, days);
    const result = dates.map(date => ({
      date,
      open: parseFloat(timeSeries[date]['1. open']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
      close: parseFloat(timeSeries[date]['4. close']),
      volume: parseInt(timeSeries[date]['5. volume'])
    })).reverse();
    
    setCache(`historical_${symbol}_${days}`, result, 'historical');
    
    rateLimiter.reportSuccess();
    logger.info(`[Alpha Vantage] Históricos obtenidos: ${symbol} (${result.length} registros)`);
    
    return result;
    
  } catch (error) {
    logger.error(`[Alpha Vantage] Error obteniendo históricos ${symbol}:`, error.message);
    rateLimiter.reportFailure();
    throw error;
  }
}

// Para tus 25 tickers - actualización inteligente MEJORADA
async function getBatchQuotes(symbols) {
  try {
    logger.info(`[Alpha Vantage] Obteniendo batch quotes: ${symbols.length} símbolos`);
    
    const results = [];
    
    // Obtener de cache primero
    for (const symbol of symbols) {
      const cached = checkCache(`quote_${symbol}`, 'quotes');
      if (cached) {
        results.push(cached);
        logger.debug(`[Alpha Vantage] Cache HIT para batch ${symbol}`);
      } else {
        // Solo pedir los que no están en cache
        try {
          const quote = await getQuote(symbol);
          results.push(quote);
          
          // Pausa inteligente basada en rate limiter
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms = ~300 calls/min
          
        } catch (err) {
          logger.error(`[Alpha Vantage] Error en batch para ${symbol}:`, err.message);
          // Continuar con otros símbolos
        }
      }
    }
    
    logger.info(`[Alpha Vantage] Batch completado: ${results.length}/${symbols.length} símbolos`);
    return results;
    
  } catch (error) {
    logger.error('[Alpha Vantage] Error en batch quotes:', error);
    throw error;
  }
}

// Función para limpiar cache (útil para debugging)
function clearCache() {
  cache.clear();
  logger.info('[Alpha Vantage] Cache limpiado');
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
  // TODO: Implementar si necesario
  return { rsi: 50 };
}

async function getMACD(symbol) {
  // TODO: Implementar si necesario
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
  getSystemStats,
  getRateLimiterStatus
};
