/**
 * Funciones de formateo de datos para el módulo de mercado
 * Extraídas de MarketModule.js para mejor modularización
 */

/**
 * Obtiene el color según el cambio de precio
 * @param {number} change - Cambio de precio
 * @returns {string} Color hexadecimal
 */
export const getPriceColor = (change) => {
  return change >= 0 ? '#00FF00' : '#FF0000';
};

/**
 * Formatea números grandes con sufijos (K, M, B, T)
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
export const formatNumber = (num) => {
  if (!num || num === 0) return '--';
  
  const absNum = Math.abs(num);
  if (absNum >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (absNum >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (absNum >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (absNum >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  
  return num.toFixed(2);
};

/**
 * Formatea porcentajes con signo
 * @param {number} num - Número a formatear como porcentaje
 * @returns {string} Porcentaje formateado
 */
export const formatPercent = (num) => {
  return `${num >= 0 ? '+' : ''}${num?.toFixed(2) || '0.00'}%`;
};

/**
 * Formatea el ratio P/E
 * @param {number} pe - Ratio P/E
 * @returns {string} P/E formateado
 */
export const formatPE = (pe) => {
  if (!pe || pe === 0) return '-';
  return pe.toFixed(1);
};

/**
 * Formatea la capitalización de mercado
 * @param {number} marketCap - Capitalización de mercado
 * @returns {string} Market Cap formateado
 */
export const formatMarketCap = (marketCap) => {
  if (!marketCap || marketCap === 0) return '-';
  if (marketCap >= 1_000_000_000_000) return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  if (marketCap >= 1_000_000_000) return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  if (marketCap >= 1_000_000) return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  return `$${marketCap}`;
};

/**
 * Obtiene el color según la señal de trading
 * @param {string} signal - Señal (bullish, bearish, neutral)
 * @returns {string} Color hexadecimal
 */
export const getSignalColor = (signal) => {
  switch (signal) {
    case 'bullish': return '#00FF00';
    case 'bearish': return '#FF0000';
    case 'neutral': return '#888888';
    default: return '#CCCCCC';
  }
};

/**
 * Obtiene el color para señales en español
 * @param {string} signal - Señal en español
 * @returns {string} Color hexadecimal
 */
export const getSignalColorForSummary = (signal) => {
  if (signal.includes('ALCISTA')) return '#00FF00';
  if (signal.includes('BAJISTA')) return '#FF0000';
  if (signal.includes('MIXTA')) return '#FF8800';
  if (signal === 'NEUTRAL') return '#FFFF00';
  return '#888888';
};

/**
 * Obtiene el color según la recomendación
 * @param {string} recommendation - Recomendación de trading
 * @returns {string} Color hexadecimal
 */
export const getRecommendationColor = (recommendation) => {
  if (recommendation.includes('COMPRA') || recommendation === 'COMPRAR') return '#00FF00';
  if (recommendation.includes('VENTA') || recommendation === 'VENDER') return '#FF0000';
  if (recommendation === 'ESPERAR') return '#FFFF00';
  if (recommendation === 'CAUTELA') return '#FF8800';
  return '#888888';
};

/**
 * Obtiene el color según el nivel de confianza
 * @param {string} confidence - Nivel de confianza (ALTA, MEDIA, BAJA)
 * @returns {string} Color hexadecimal
 */
export const getConfidenceColor = (confidence) => {
  switch (confidence) {
    case 'ALTA': return '#00FF00';
    case 'MEDIA': return '#FFFF00';
    case 'BAJA': return '#FF8800';
    default: return '#888888';
  }
};

/**
 * Formatea valores de indicadores técnicos
 * @param {any} value - Valor a formatear
 * @returns {string} Valor formateado
 */
export const formatValue = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  } else if (typeof value === 'object' && value !== null) {
    // Para objetos complejos como MACD
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
      .join(', ');
  }
  return value || 'N/A';
};

// Exportar todas las funciones como un objeto por conveniencia
export const formatters = {
  getPriceColor,
  formatNumber,
  formatPercent,
  formatPE,
  formatMarketCap,
  getSignalColor,
  getSignalColorForSummary,
  getRecommendationColor,
  getConfidenceColor,
  formatValue
}; 