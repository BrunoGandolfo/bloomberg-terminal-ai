/**
 * Servicio de API para el módulo de Portfolio
 * Centraliza toda la comunicación con el backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Realiza una llamada a la API con manejo de errores
 */
const apiCall = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const portfolioApi = {
  /**
   * Obtiene el portfolio completo del usuario
   * @returns {Promise<Object>} Portfolio con posiciones
   */
  getPortfolio: async () => {
    try {
      const portfolio = await apiCall('/portfolio');
      return portfolio || { positions: [] };
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  },

  /**
   * Actualiza el portfolio completo
   * @param {Object} portfolio - Portfolio actualizado
   * @returns {Promise<Object>} Portfolio guardado
   */
  updatePortfolio: async (portfolio) => {
    try {
      return await apiCall('/portfolio', 'POST', portfolio);
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  },

  /**
   * Agrega una nueva posición al portfolio
   * @param {Object} portfolioData - Portfolio actual
   * @param {Object} newPosition - Nueva posición a agregar
   * @returns {Promise<Object>} Portfolio actualizado
   */
  addPosition: async (portfolioData, newPosition) => {
    const updatedPortfolio = {
      ...portfolioData,
      positions: [...portfolioData.positions, newPosition],
      lastModified: new Date().toISOString()
    };

    return portfolioApi.updatePortfolio(updatedPortfolio);
  },

  /**
   * Elimina una posición del portfolio
   * @param {Object} portfolioData - Portfolio actual
   * @param {string} symbol - Símbolo a eliminar
   * @returns {Promise<Object>} Portfolio actualizado
   */
  removePosition: async (portfolioData, symbol) => {
    const updatedPositions = portfolioData.positions.filter(p => p.symbol !== symbol);
    const updatedPortfolio = {
      ...portfolioData,
      positions: updatedPositions,
      lastModified: new Date().toISOString()
    };

    return portfolioApi.updatePortfolio(updatedPortfolio);
  },

  /**
   * Obtiene cotizaciones en batch para múltiples símbolos
   * @param {string[]} symbols - Array de símbolos
   * @returns {Promise<Object>} Objeto con cotizaciones por símbolo
   */
  getBatchQuotes: async (symbols) => {
    try {
      if (!symbols || symbols.length === 0) {
        return {};
      }
      return await apiCall('/market/batch-quotes', 'POST', { symbols });
    } catch (error) {
      console.error('Error fetching batch quotes:', error);
      return {};
    }
  }
}; 