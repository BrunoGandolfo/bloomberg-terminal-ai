/**
 * Componente de header para Watchlist
 * Muestra el título y controles principales
 */

import React from 'react';

const WatchlistHeader = ({ refreshWatchlist, isLoading, renderTimeAgo, styles }) => {
  return (
    <>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>LISTA DE SEGUIMIENTO</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <button
          onClick={() => refreshWatchlist(true)}
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Actualizando...' : '🔄 ACTUALIZAR'}
        </button>
        <span style={{ fontSize: '11px', color: '#888' }}>
          Actualizado: {renderTimeAgo()}
        </span>
      </div>
    </>
  );
};

export default WatchlistHeader; 