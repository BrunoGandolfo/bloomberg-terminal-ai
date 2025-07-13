/**
 * Componente de tabla para mostrar la watchlist
 * Incluye animaciones de precio y formateo
 */

import React from 'react';
import CompanyLogo from '../../CompanyLogo';
import { formatPE, formatMarketCap } from '../../portfolio/utils/formatters';

const WatchlistTable = ({ watchlist, watchlistData, priceChanges, onRemove, isLoading, styles }) => {
  /**
   * Función para obtener color dinámico basado en change
   */
  const getChangeColor = (change) => {
    if (!change && change !== 0) return '#888888';
    if (change > 0) return '#00FF00';
    if (change < 0) return '#FF0000';
    return '#888888';
  };

  if (watchlist.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: '#888' }}>
        Agregue símbolos a su lista de seguimiento.
      </p>
    );
  }

  return (
    <>
      <style>{`
        .delete-btn:hover { background-color: #CC0000; color: #000; }
        .price-flash-up { animation: flash-green 0.7s ease-out; }
        .price-flash-down { animation: flash-red 0.7s ease-out; }
        @keyframes flash-green { 0% { background-color: #00FF0030; } 100% { background-color: transparent; } }
        @keyframes flash-red { 0% { background-color: #FF000030; } 100% { background-color: transparent; } }
      `}</style>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #FF8800' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Logo</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Símbolo</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Precio</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Cambio</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>% Cambio</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>P/E</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Market Cap</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map(symbol => {
              const data = watchlistData[symbol];
              const changeColor = getChangeColor(data?.change);
              const flashClass = priceChanges[symbol] ? 
                (priceChanges[symbol] === 'up' ? 'price-flash-up' : 'price-flash-down') : '';

              return (
                <tr key={symbol} className={flashClass} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px' }}>
                    <CompanyLogo symbol={symbol} size={25} />
                  </td>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{symbol}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: changeColor }}>
                    {data ? `$${data.price?.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', color: changeColor }}>
                    {data?.change ? `${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', color: changeColor }}>
                    {data?.changePercent ? `${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    {formatPE(data?.trailingPE)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    {formatMarketCap(data?.marketCap)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => onRemove(symbol)}
                      style={styles.deleteButton}
                      className="delete-btn"
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
      </div>
    </>
  );
};

export default WatchlistTable; 