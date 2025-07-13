/**
 * Componente de header del portfolio
 * Muestra el título y botón de actualización
 */

import React from 'react';

const PortfolioHeader = ({ renderTimeAgo, refreshPortfolio, isLoading, styles }) => {
  return (
    <div style={{...styles.panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <h2 style={{ color: '#FF8800', margin: 0 }}>MI PORTAFOLIO</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button
          onClick={() => refreshPortfolio(true)}
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Actualizando...' : '🔄 ACTUALIZAR'}
        </button>
        <span style={{ fontSize: '11px', color: '#888' }}>
          Última actualización: {renderTimeAgo()}
        </span>
      </div>
    </div>
  );
};

export default PortfolioHeader; 