/**
 * Formatters para el módulo de Portfolio
 * Extraído de PortfolioModule.js para mejor organización y reutilización
 */

/**
 * Formatea números a 2 decimales con separadores. Maneja undefined/null.
 * @param {number} num - Número a formatear
 * @param {string} placeholder - Valor por defecto si num es inválido
 * @returns {string} Número formateado
 */
export const formatNumber = (num, placeholder = '0.00') => {
  if (num === undefined || num === null || isNaN(num)) return placeholder;
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Detecta si el símbolo corresponde a una criptomoneda - SOLO BTC/USD SOPORTADA
 * @param {string} symbol - Símbolo a evaluar
 * @returns {boolean} True si es criptomoneda
 */
export const isCrypto = (symbol) => {
  if (!symbol) return false;
  return symbol.includes('/') || symbol.toUpperCase() === 'BTC';
};

/**
 * Formatear Market Cap con sufijos (T/B/M)
 * @param {number} marketCap - Capitalización de mercado
 * @returns {string} Market cap formateado
 */
export const formatMarketCap = (marketCap) => {
  if (!marketCap || marketCap === 0) return '-';
  if (marketCap >= 1_000_000_000_000) return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  if (marketCap >= 1_000_000_000) return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  if (marketCap >= 1_000_000) return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  return `$${marketCap}`;
};

/**
 * Formatear P/E ratio
 * @param {number} pe - Price/Earnings ratio
 * @returns {string} P/E formateado
 */
export const formatPE = (pe) => {
  if (!pe || pe === 0) return '-';
  return pe.toFixed(1);
};

/**
 * Obtiene el color basado en ganancia/pérdida
 * @param {number} gain - Valor de ganancia/pérdida
 * @returns {string} Color hex para el valor
 */
export const getGainColor = (gain) => {
  if (!gain && gain !== 0) return '#888888';
  if (gain > 0) return '#00FF00';
  if (gain < 0) return '#FF0000';
  return '#888888';
}; 