/**
 * Servicio centralizado de API para el módulo de mercado
 * Extrae todas las llamadas API de MarketModule.js
 */

// Base URL de la API - usar variable de entorno si está disponible
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Helper para hacer llamadas API con manejo de errores
 * @param {string} endpoint - Endpoint a llamar
 * @param {object} options - Opciones de fetch
 * @returns {Promise<any>} Respuesta parseada
 */
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('API call failed:', err);
    throw err;
  }
};

/**
 * Servicio de API para el módulo de mercado
 */
export const marketApi = {
  /**
   * Buscar símbolos por query
   * @param {string} query - Texto de búsqueda
   * @returns {Promise<Array>} Lista de sugerencias
   */
  searchSymbol: async (query) => {
    if (!query || query.length < 1) {
      return [];
    }
    
    try {
      const data = await apiCall(`/api/search/ticker?q=${encodeURIComponent(query)}`);
      return data || [];
    } catch (err) {
      console.error('Error searching ticker:', err);
      return [];
    }
  },

  /**
   * Obtener datos completos del mercado para un símbolo
   * @param {string} symbol - Símbolo a buscar
   * @returns {Promise<object>} Datos completos del mercado
   */
  getMarketData: async (symbol) => {
    if (!symbol) {
      throw new Error('Symbol is required');
    }
    
    return await apiCall(`/api/market/full/${symbol.toUpperCase()}`);
  },

  /**
   * Obtener datos históricos para un símbolo
   * @param {string} symbol - Símbolo a buscar
   * @param {number} days - Número de días de historia (default: 10950 = 30 años)
   * @returns {Promise<Array>} Datos históricos
   */
  getHistoricalData: async (symbol, days = 10950) => {
    if (!symbol) {
      throw new Error('Symbol is required');
    }
    
    return await apiCall(`/api/market/history/${symbol.toUpperCase()}?days=${days}`);
  },

  /**
   * Obtener indicadores técnicos para un símbolo
   * @param {string} symbol - Símbolo a analizar
   * @param {Array<string>} indicators - Lista de indicadores a obtener
   * @param {number} currentPrice - Precio actual para análisis
   * @returns {Promise<object>} Indicadores técnicos
   */
  getTechnicalIndicators: async (symbol, indicators = ['rsi', 'macd', 'sma', 'ema'], currentPrice = null) => {
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/technical/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: symbol,
        indicators: indicators,
        currentPrice: currentPrice
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },

  /**
   * Buscar nombre de compañía como fallback
   * @param {string} symbol - Símbolo a buscar
   * @returns {Promise<string|null>} Nombre de la compañía
   */
  getCompanyName: async (symbol) => {
    try {
      const searchResults = await marketApi.searchSymbol(symbol);
      const bestMatch = searchResults?.find(r => r.symbol.toUpperCase() === symbol.toUpperCase());
      return bestMatch?.name || null;
    } catch (error) {
      console.error("Error fetching company name as a fallback:", error);
      return null;
    }
  }
};

// Exportar también las funciones individuales por conveniencia
export const {
  searchSymbol,
  getMarketData,
  getHistoricalData,
  getTechnicalIndicators,
  getCompanyName
} = marketApi; 