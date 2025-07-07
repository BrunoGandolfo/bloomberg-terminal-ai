const alphaVantageService = require('./alphaVantageService');
const perplexityService = require('./perplexityService');

/**
 * Servicio unificado que maneja múltiples fuentes de datos
 * con fallback inteligente y validación
 */
class UnifiedMarketDataService {
  /**
   * Obtiene datos fundamentales con fallback automático
   * @param {string} symbol - Símbolo de la acción
   * @returns {Promise<Object>} Datos fundamentales validados
   */
  async getFundamentals(symbol) {
    try {
      // Intentar primero con Alpha Vantage
      const alphaVantageData = await this.getAlphaVantageDataFundamentals(symbol);
      if (alphaVantageData.success) {
        return {
          ...alphaVantageData.data,
          dataSource: alphaVantageData.actualSource || 'alphavantage',
          reliability: alphaVantageData.actualSource === 'perplexity' ? 'medium' : 'high'
        };
      }

      // Si falla, intentar con Perplexity
      console.log(`[UnifiedMarketData] Alpha Vantage failed for ${symbol}, trying Perplexity`);
      const perplexityData = await this.getPerplexityFundamentals(symbol);
      
      if (perplexityData.success) {
        return {
          ...perplexityData.data,
          dataSource: 'perplexity',
          reliability: perplexityData.confidence === 'high' ? 'medium-high' : 'medium',
          confidence: perplexityData.confidence
        };
      }

      // Si ambos fallan, devolver estructura vacía pero válida
      return this.getEmptyFundamentals(symbol);

    } catch (error) {
      console.error(`[UnifiedMarketData] Critical error for ${symbol}:`, error);
      return this.getEmptyFundamentals(symbol);
    }
  }

  /**
   * Obtiene datos de Alpha Vantage con validación
   */
  async getAlphaVantageDataFundamentals(symbol) {
    try {
      const data = await alphaVantageService.getFundamentals(symbol);
      
      // Si los datos vienen de Perplexity (fallback interno de alphaVantageService)
      if (data.dataSource === 'perplexity') {
        return {
          success: true,
          data: this.normalizeAlphaVantageData(data),
          actualSource: 'perplexity'
        };
      }
      
      // Si es error 403, no es un fallo real, es limitación del plan
      if (data.error === 'plan_limitation') {
        return { success: false, reason: 'plan_limitation' };
      }

      // Validar que los datos sean completos
      if (this.validateAlphaVantageData(data)) {
        return { 
          success: true, 
          data: this.normalizeAlphaVantageData(data) 
        };
      }

      return { success: false, reason: 'incomplete_data' };

    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Obtiene datos de Perplexity con parsing robusto
   */
  async getPerplexityFundamentals(symbol) {
    try {
      const data = await perplexityService.getFinancialDataFromPerplexity(symbol);
      
      // Manejar errores específicos como timeout
      if (data.error === 'timeout') {
        console.log(`[UnifiedMarketData] Perplexity timeout for ${symbol}`);
        return { success: false, reason: 'timeout' };
      }
      
      // Validar que al menos tengamos algunos datos
      if (data.marketCapRaw || data.peRatio) {
        return {
          success: true,
          data: this.normalizePerplexityData(data, symbol),
          confidence: data.confidence || 'medium'
        };
      }

      return { success: false, reason: 'no_data_found' };

    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Valida datos de Alpha Vantage
   */
  validateAlphaVantageData(data) {
    return data && 
           data.marketCapRaw !== undefined && 
           data.peRatio !== undefined &&
           !data.error;
  }

  /**
   * Normaliza datos de Alpha Vantage
   */
  normalizeAlphaVantageData(data) {
    return {
      name: data.name || data.symbol,
      exchange: data.exchange || 'N/A',
      currency: data.currency || 'USD',
      marketCap: this.formatLargeNumber(data.marketCapRaw),
      marketCapRaw: this.ensureNumber(data.marketCapRaw),
      peRatio: this.ensureNumber(data.peRatio),
      pegRatio: this.ensureNumber(data.pegRatio),
      priceToBook: this.ensureNumber(data.priceToBook),
      priceToSales: this.ensureNumber(data.priceToSales),
      profitMargin: data.profitMargin || 'N/A',
      operatingMargin: data.operatingMargin || 'N/A',
      returnOnEquity: data.returnOnEquity || 'N/A',
      beta: this.ensureNumber(data.beta),
      eps: this.ensureNumber(data.eps),
      revenue: data.revenue || 'N/A',
      sharesOutstanding: this.ensureNumber(data.sharesOutstanding),
      float: this.ensureNumber(data.float),
      shortRatio: this.ensureNumber(data.shortRatio),
      dividendYield: data.dividendYield || '0%',
      dividendRate: this.ensureNumber(data.dividendRate),
      payoutRatio: this.ensureNumber(data.payoutRatio),
      fiftyTwoWeekLow: this.ensureNumber(data.fiftyTwoWeekLow),
      fiftyTwoWeekHigh: this.ensureNumber(data.fiftyTwoWeekHigh),
      day50MA: this.ensureNumber(data.day50MA),
      day200MA: this.ensureNumber(data.day200MA)
    };
  }

  /**
   * Normaliza datos de Perplexity
   */
  normalizePerplexityData(data, symbol) {
    const normalized = this.getEmptyFundamentals(symbol);
    
    // Solo sobrescribir los campos que Perplexity proporciona
    if (data.marketCapRaw) {
      normalized.marketCapRaw = data.marketCapRaw;
      normalized.marketCap = this.formatLargeNumber(data.marketCapRaw);
    }
    
    if (data.peRatio) {
      normalized.peRatio = data.peRatio;
    }

    return normalized;
  }

  /**
   * Estructura vacía pero válida
   */
  getEmptyFundamentals(symbol) {
    return {
      name: symbol,
      exchange: 'N/A',
      currency: 'USD',
      marketCap: 'N/A',
      marketCapRaw: 0,
      peRatio: 0,
      pegRatio: 0,
      priceToBook: 0,
      priceToSales: 0,
      profitMargin: 'N/A',
      operatingMargin: 'N/A',
      returnOnEquity: 'N/A',
      beta: 0,
      eps: 0,
      revenue: 'N/A',
      sharesOutstanding: 0,
      float: 0,
      shortRatio: 0,
      dividendYield: '0%',
      dividendRate: 0,
      payoutRatio: 0,
      fiftyTwoWeekLow: 0,
      fiftyTwoWeekHigh: 0,
      day50MA: 0,
      day200MA: 0,
      dataSource: 'none',
      reliability: 'none'
    };
  }

  /**
   * Asegura que un valor sea número
   */
  ensureNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Formatea números grandes
   */
  formatLargeNumber(num) {
    if (!num || num === 0) return 'N/A';
    
    const value = this.ensureNumber(num);
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  }
}

module.exports = new UnifiedMarketDataService(); 