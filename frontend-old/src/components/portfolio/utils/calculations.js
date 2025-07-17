/**
 * Funciones de cálculo para el módulo de Portfolio
 * Extraído de PortfolioModule.js para mejor organización
 */

/**
 * Calcula las métricas del portfolio
 * @param {Array} positions - Array de posiciones del portfolio
 * @param {number} totalValue - Valor total del portfolio
 * @returns {Object} Métricas calculadas
 */
export const calculatePortfolioMetrics = (positions = [], totalValue = 0) => {
  // Calcular costo total
  const totalCost = positions.reduce((acc, pos) => {
    const avgCost = pos.avgCost ?? 0;
    return acc + (pos.shares * avgCost);
  }, 0);

  // Calcular ganancia total
  const totalGain = totalValue - totalCost;

  // Calcular retorno porcentual
  const totalReturn = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalGain,
    totalReturn
  };
};

/**
 * Prepara los datos para el gráfico de distribución
 * @param {Array} positions - Array de posiciones del portfolio
 * @returns {Array} Datos formateados para el PieChart
 */
export const prepareDistributionData = (positions = []) => {
  return positions.map(pos => ({
    name: pos.symbol,
    value: pos.shares * (pos.currentPrice || 0)
  }));
};

/**
 * Calcula las métricas individuales de una posición
 * @param {Object} position - Posición individual
 * @returns {Object} Métricas de la posición
 */
export const calculatePositionMetrics = (position) => {
  const avgCost = position.avgCost ?? 0;
  const currentPrice = position.currentPrice ?? 0;
  const totalCost = position.shares * avgCost;
  const currentValue = position.shares * currentPrice;
  const gain = currentValue - totalCost;
  const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

  return {
    totalCost,
    currentValue,
    gain,
    gainPercent
  };
}; 