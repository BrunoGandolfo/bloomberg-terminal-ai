/**
 * Componente de tabla de posiciones del portfolio
 * Muestra todas las posiciones con métricas y animaciones de precio
 */

import React from 'react';
import CompanyLogo from '../../CompanyLogo';
import { 
  formatNumber, 
  isCrypto, 
  formatMarketCap, 
  formatPE, 
  getGainColor 
} from '../utils/formatters';
import { calculatePositionMetrics } from '../utils/calculations';

const PositionsTable = ({ 
  positions, 
  priceChanges, 
  onRemove, 
  styles, 
  isLoading 
}) => {
  return (
    <div style={styles.panel}>
      <h3>POSICIONES ACTUALES</h3>
      
      {/* Estilos para animaciones */}
      <style>{`
        .price-flash-up { animation: flash-green 0.7s ease-out; }
        .price-flash-down { animation: flash-red 0.7s ease-out; }
        @keyframes flash-green { 0% { background-color: #00FF0030; } 100% { background-color: transparent; } }
        @keyframes flash-red { 0% { background-color: #FF000030; } 100% { background-color: transparent; } }
      `}</style>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #FF8800' }}>
              <th style={{ width: '40px' }}></th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Símbolo</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Acciones</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Costo Promedio</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Precio Actual</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Valor Total</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Ganancia/Pérdida</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>% Cambio</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>P/E</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Market Cap</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => {
              const metrics = calculatePositionMetrics(pos);
              const gainColor = getGainColor(metrics.gain);
              const flashClass = priceChanges[pos.symbol] ? 
                (priceChanges[pos.symbol] === 'up' ? 'price-flash-up' : 'price-flash-down') : '';

              return (
                <tr key={i} className={flashClass} style={{ borderBottom: '1px solid #333' }}>
                  <td><CompanyLogo symbol={pos.symbol} size={25} /></td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{pos.symbol}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {isCrypto(pos.symbol) ? pos.shares.toFixed(8) : pos.shares}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    ${formatNumber(pos.avgCost)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: gainColor }}>
                    ${formatNumber(pos.currentPrice)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    ${formatNumber(metrics.currentValue)}
                  </td>
                  <td style={{
                    padding: '10px',
                    textAlign: 'right',
                    color: gainColor
                  }}>
                    {metrics.gain > 0 ? '+' : ''}${formatNumber(metrics.gain)}
                  </td>
                  <td style={{
                    padding: '10px',
                    textAlign: 'right',
                    color: gainColor
                  }}>
                    {metrics.gainPercent > 0 ? '+' : ''}{formatNumber(metrics.gainPercent)}%
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {formatPE(pos.trailingPE)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {formatMarketCap(pos.marketCap)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={() => onRemove(pos.symbol)}
                      style={styles.deleteButton}
                      className="portfolio-del-btn"
                      disabled={isLoading}
                    >
                      DEL
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {positions.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            No hay posiciones en el portfolio
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionsTable; 