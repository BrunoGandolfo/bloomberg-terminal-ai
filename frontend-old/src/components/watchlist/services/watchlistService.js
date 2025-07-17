/**
 * Servicio de API para el módulo de Watchlist
 * Centraliza toda la comunicación con el backend
 */

import { apiCall } from '../../../services/api';

export const watchlistService = {
  /**
   * Obtiene la watchlist del usuario desde el backend
   * @returns {Promise<Array>} Array de símbolos
   */
  getWatchlist: async () => {
    try {
      const data = await apiCall('/api/watchlist');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  },

  /**
   * Actualiza la watchlist completa en el backend
   * @param {Array} watchlist - Array de símbolos
   * @returns {Promise<void>}
   */
  updateWatchlist: async (watchlist) => {
    try {
      await apiCall('/api/watchlist', 'POST', { watchlist });
    } catch (error) {
      console.error('Error updating watchlist:', error);
      throw error;
    }
  },

  /**
   * Valida y agrega un símbolo a la watchlist
   * @param {string} symbol - Símbolo a agregar
   * @returns {Promise<boolean>} True si es válido
   */
  validateSymbol: async (symbol) => {
    try {
      await apiCall(`/api/market/quote/${encodeURIComponent(symbol)}`);
      return true;
    } catch (error) {
      console.error(`Error validating symbol ${symbol}:`, error);
      return false;
    }
  },

  /**
   * Obtiene cotizaciones en batch para múltiples símbolos
   * @param {string[]} symbols - Array de símbolos
   * @returns {Promise<Object>} Objeto con cotizaciones por símbolo
   */
  getBatchQuotes: async (symbols) => {
    try {
      if (!symbols || symbols.length === 0) return {};
      const data = await apiCall('/api/market/batch-quotes', 'POST', { symbols });
      return data || {};
    } catch (error) {
      console.error('Error fetching batch quotes:', error);
      return {};
    }
  }
}; 