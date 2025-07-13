/**
 * Componente de resumen del portfolio
 * Muestra las métricas principales del portfolio
 */

import React from 'react';
import { formatNumber } from '../utils/formatters';

const PortfolioSummary = ({ portfolioMetrics, positionsCount, styles }) => {
  return (
    <div style={styles.panel}>
      <h3>RESUMEN GENERAL</h3>
      <div style={{ fontSize: '16px' }}>
        <div>
          Valor Total: {' '}
          <span style={portfolioMetrics.totalValue >= portfolioMetrics.totalCost ? styles.priceUp : styles.priceDown}>
            ${formatNumber(portfolioMetrics.totalValue)}
          </span>
        </div>
        <div>Costo Total: ${formatNumber(portfolioMetrics.totalCost)}</div>
        <div>
          Ganancia/Pérdida: {' '}
          <span style={portfolioMetrics.totalGain >= 0 ? styles.priceUp : styles.priceDown}>
            ${formatNumber(portfolioMetrics.totalGain)} ({formatNumber(portfolioMetrics.totalReturn)}%)
          </span>
        </div>
        <div>Posiciones: {positionsCount}</div>
      </div>
    </div>
  );
};

export default PortfolioSummary; 