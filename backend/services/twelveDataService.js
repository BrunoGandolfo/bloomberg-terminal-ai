const axios = require('axios');
const logger = require('../utils/logger');

const API_KEY = process.env.TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

// Cache simple en memoria
const cache = new Map();
const CACHE_DURATION = 30000; // 30 segundos

// Obtener cotización en tiempo real
async function getQuote(symbol) {
  try {
    // Verificar cache
    const cached = cache.get(`quote_${symbol}`);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const response = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol: symbol,
        apikey: API_KEY
      }
    });

    const data = response.data;
    
    // Formatear respuesta - CLOSE es el precio actual
    const formattedData = {
      symbol: data.symbol,
      price: parseFloat(data.close || data.price || 0),
      change: parseFloat(data.change || 0),
      changePercent: parseFloat(data.percent_change || 0),
      volume: parseInt(data.volume || 0),
      high: parseFloat(data.high || 0),
      low: parseFloat(data.low || 0),
      open: parseFloat(data.open || 0),
      previousClose: parseFloat(data.previous_close || 0),
      timestamp: new Date().toISOString()
    };

    // Guardar en cache
    cache.set(`quote_${symbol}`, {
      data: formattedData,
      timestamp: Date.now()
    });

    return formattedData;
  } catch (error) {
    logger.error(`Error obteniendo datos de ${symbol}:`, error.message);
    throw error;
  }
}

// Obtener datos históricos
async function getHistoricalData(symbol, outputsize = 30) {
  try {
    const response = await axios.get(`${BASE_URL}/time_series`, {
      params: {
        symbol: symbol,
        interval: '1day',
        outputsize: outputsize,
        apikey: API_KEY
      }
    });

    return response.data.values || [];
  } catch (error) {
    logger.error(`Error obteniendo históricos de ${symbol}:`, error.message);
    throw error;
  }
}

// Obtener indicador técnico RSI
async function getRSI(symbol) {
  try {
    const response = await axios.get(`${BASE_URL}/rsi`, {
      params: {
        symbol: symbol,
        interval: '1day',
        time_period: 14,
        apikey: API_KEY
      }
    });

    const values = response.data.values;
    return values && values.length > 0 ? parseFloat(values[0].rsi) : null;
  } catch (error) {
    logger.error(`Error obteniendo RSI de ${symbol}:`, error.message);
    return null;
  }
}

// Obtener MACD
async function getMACD(symbol) {
  try {
    const response = await axios.get(`${BASE_URL}/macd`, {
      params: {
        symbol: symbol,
        interval: '1day',
        apikey: API_KEY
      }
    });

    const values = response.data.values;
    return values && values.length > 0 ? values[0] : null;
  } catch (error) {
    logger.error(`Error obteniendo MACD de ${symbol}:`, error.message);
    return null;
  }
}

// Obtener múltiples cotizaciones (batch)
async function getBatchQuotes(symbols) {
  try {
    const symbolsString = symbols.join(',');
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol: symbolsString,
        apikey: API_KEY
      }
    });

    // Esta lógica normaliza la respuesta para que SIEMPRE sea un array.
    if (response.data && !Array.isArray(response.data)) {
      // Handle the two different object shapes returned by the API.
      if (response.data.symbol) {
        // It's a single quote object, wrap it in an array to be consistent.
        return [response.data];
      }
      // It's a map of symbols to quote objects. Convert it to an array.
      return Object.entries(response.data).map(([symbol, data]) => ({ symbol, ...data }));
    }
    // Si ya es un array (caso de un solo símbolo no encontrado) o no hay datos, se devuelve como está o un array vacío.
    return response.data || [];
  } catch (error) {
    logger.error('Error en batch quotes:', error.message);
    return [];
  }
}

// Obtener datos fundamentales (market cap, P/E, etc.)
async function getFundamentals(symbol) {
  try {
    // Obtener estadísticas completas
    const response = await axios.get(`${BASE_URL}/statistics`, {
      params: {
        symbol: symbol,
        apikey: API_KEY
      }
    });

    const data = response.data;
    const stats = data.statistics || {};
    const valuations = stats.valuations_metrics || {};
    const financials = stats.financials || {};
    const stockStats = stats.stock_statistics || {};
    const pricesSummary = stats.stock_price_summary || {};
    const dividends = stats.dividends_and_splits || {};
    
    return {
      // Información básica
      name: data.meta?.name || symbol,
      exchange: data.meta?.exchange || 'N/A',
      currency: data.meta?.currency || 'USD',
      
      // Métricas de valoración
      marketCap: valuations.market_capitalization ? 
        `$${(valuations.market_capitalization / 1000000000).toFixed(2)}B` : 'N/A',
      marketCapRaw: valuations.market_capitalization || 0,
      peRatio: valuations.trailing_pe || 0,
      pegRatio: valuations.peg_ratio || 0,
      priceToBook: valuations.price_to_book_mrq || 0,
      priceToSales: valuations.price_to_sales_ttm || 0,
      
      // Datos financieros
      profitMargin: (financials.profit_margin * 100).toFixed(2) + '%',
      operatingMargin: (financials.operating_margin * 100).toFixed(2) + '%',
      returnOnEquity: (financials.return_on_equity_ttm * 100).toFixed(2) + '%',
      eps: financials.income_statement?.diluted_eps_ttm || 0,
      revenue: financials.income_statement?.revenue_ttm ? 
        `$${(financials.income_statement.revenue_ttm / 1000000000).toFixed(2)}B` : 'N/A',
      
      // Estadísticas de acciones
      sharesOutstanding: stockStats.shares_outstanding || 0,
      float: stockStats.float_shares || 0,
      shortRatio: stockStats.short_ratio || 0,
      beta: pricesSummary.beta || 0,
      
      // Dividendos
      dividendYield: dividends.forward_annual_dividend_yield 
        ? (dividends.forward_annual_dividend_yield * 100).toFixed(2) + '%' : '0%',
      dividendRate: dividends.forward_annual_dividend_rate || 0,
      payoutRatio: dividends.payout_ratio || 0,
      
      // Rangos de precio
      fiftyTwoWeekLow: pricesSummary.fifty_two_week_low || 0,
      fiftyTwoWeekHigh: pricesSummary.fifty_two_week_high || 0,
      day50MA: pricesSummary.day_50_ma || 0,
      day200MA: pricesSummary.day_200_ma || 0
    };
  } catch (error) {
    logger.error(`Error obteniendo estadísticas de ${symbol}:`, error.response?.data || error.message);
    
    // Devolver estructura básica si falla
    return {
      name: symbol,
      marketCap: 'Error al obtener',
      error: error.response?.data?.message || error.message
    };
  }
}

module.exports = {
  getQuote,
  getHistoricalData,
  getRSI,
  getMACD,
  getBatchQuotes,
  getFundamentals
}; 