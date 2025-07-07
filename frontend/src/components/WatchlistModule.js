import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { apiCall } from '../services/api';
import TickerSearchInput from './TickerSearchInput';

// Estilos necesarios para el módulo
const styles = {
  panel: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '4px'
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '1px solid #FF8800',
    padding: '8px',
    fontSize: '12px',
    width: '200px',
    marginRight: '10px'
  },
  button: {
    backgroundColor: '#FF8800',
    color: '#000',
    border: 'none',
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  priceUp: {
    color: '#00FF00'
  },
  priceDown: {
    color: '#FF0000'
  },
  deleteButton: {
    backgroundColor: 'transparent',
    color: '#CC0000',
    border: '1px solid #333',
    padding: '3px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    transition: 'background-color 0.2s, color 0.2s',
  }
};

// Función de obtención de datos, ahora es una función pura fuera del componente
const fetchAllWatchlistData = async (symbols) => {
  if (!symbols || symbols.length === 0) return {};
  try {
    const data = await apiCall('/api/market/batch-quotes', 'POST', { symbols });
    return data || {};
  } catch (error) {
    console.error('Error fetching batch watchlist data:', error);
    return {}; // Devolver objeto vacío en caso de error para no romper el render
  }
};

// Módulo de Watchlist
const WatchlistModule = forwardRef((props, ref) => {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error al leer la watchlist de localStorage:", error);
      return [];
    }
  });

  const [watchlistData, setWatchlistData] = useState({});
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Persistir watchlist (backend + localStorage)
  const persistWatchlist = useCallback(async (list) => {
    try {
      localStorage.setItem('watchlist', JSON.stringify(list));
      await apiCall('/api/watchlist', 'POST', { watchlist: list });
    } catch (error) {
      console.error('Error al guardar la watchlist:', error);
    }
  }, []);

  // Cargar watchlist desde backend al montar el componente
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const data = await apiCall('/api/watchlist');
        if (Array.isArray(data) && data.length > 0) {
          setWatchlist(data);
          return;
        }
      } catch (err) {
        console.error('Backend watchlist fetch failed:', err);
      }
      // Fallback a localStorage
      try {
        const saved = localStorage.getItem('watchlist');
        if (saved) setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error('Error leyendo watchlist de localStorage:', e);
      }
    };
    loadWatchlist();
  }, []);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const refreshWatchlist = useCallback(async (showLoader = true) => {
    if (watchlist.length === 0) {
      setWatchlistData({});
      return;
    }
    if (showLoader) setIsLoading(true);

    try {
      const data = await apiCall('/api/market/batch-quotes', 'POST', { symbols: watchlist });

      // Actualizar estado y disparar animación si el precio cambió
      setWatchlistData(prevData => {
        Object.keys(data || {}).forEach(symbol => {
          if (prevData[symbol]?.price !== data[symbol]?.price) {
            const row = document.querySelector(`tr[data-symbol="${symbol}"]`);
            if (row) {
              row.style.animation = 'flash 0.5s';
              setTimeout(() => {
                row.style.animation = '';
              }, 500);
            }
          }
        });
        return data || {};
      });
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error al refrescar la watchlist:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    refreshWatchlist(true);
  }, [refreshWatchlist]);

  const handleAddSymbol = async (symbolParam) => {
    const symbolToAdd = (symbolParam || newSymbol).trim().toUpperCase();
    if (!symbolToAdd || watchlist.includes(symbolToAdd)) return;

    setIsLoading(true);
    try {
      await apiCall(`/api/market/quote/${encodeURIComponent(symbolToAdd)}`);
      const updated = [...watchlist, symbolToAdd].sort();
      setWatchlist(updated);
      setNewSymbol('');
      persistWatchlist(updated);
    } catch (error) {
      console.error(`Error al validar el símbolo ${symbolToAdd}:`, error);
      alert(`Símbolo '${symbolToAdd}' no es válido o no se encontró.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSymbol = (symbolToRemove) => {
    const updated = watchlist.filter(symbol => symbol !== symbolToRemove);
    setWatchlist(updated);
    persistWatchlist(updated);
  };

  const renderTimeAgo = () => {
    if (!lastUpdated) return 'Nunca';
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 10) return 'justo ahora';
    if (seconds < 60) return `hace ${seconds} segundos`;
    return `hace ${Math.floor(seconds / 60)} min`;
  };

  // Exponer función refreshData
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      console.log('🔄 WatchlistModule: Actualizando datos...');
      await refreshWatchlist(true);
      console.log('✅ WatchlistModule: Datos actualizados');
    }
  }));

  return (
    <div style={styles.panel}>
      <style>{`
        .delete-btn:hover { background-color: #CC0000; color: #000; }
        @keyframes flash {
          0% { background-color: #333; }
          50% { background-color: #555; }
          100% { background-color: #333; }
        }
      `}</style>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>LISTA DE SEGUIMIENTO</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <TickerSearchInput
          placeholder="Agregar Símbolo..."
          onSelectTicker={(t) => {
            setNewSymbol(t.symbol);
            handleAddSymbol(t.symbol);
          }}
          style={{ width: '200px' }}
        />
        <button onClick={() => handleAddSymbol()} style={styles.button} disabled={isLoading}>
          {isLoading ? '...' : 'AGREGAR'}
        </button>
        <span style={{ fontSize: '11px', color: '#888' }}>
          Actualizado: {renderTimeAgo()}
        </span>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {watchlist.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888' }}>Agregue símbolos a su lista de seguimiento.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #FF8800' }}>
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
                
                // LOG TEMPORAL para debugging
                console.log('Datos recibidos para', symbol, ':', data);
                
                // Función para obtener color dinámico basado en change
                const getChangeColor = (change) => {
                  if (!change && change !== 0) return '#888888';
                  if (change > 0) return '#00ff00';
                  if (change < 0) return '#ff0000';
                  return '#888888';
                };

                const changeColor = getChangeColor(data?.change);

                // Formatear Market Cap
                const formatMarketCap = (marketCap) => {
                  if (!marketCap || marketCap === 0) return 'N/A';
                  if (marketCap >= 1_000_000_000_000) return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
                  if (marketCap >= 1_000_000_000) return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
                  if (marketCap >= 1_000_000) return `$${(marketCap / 1_000_000).toFixed(2)}M`;
                  return `$${marketCap}`;
                };

                // Formatear P/E
                const formatPE = (pe) => {
                  if (!pe || pe === 0) return 'N/A';
                  return pe.toFixed(1);
                };

                return (
                  <tr key={symbol} data-symbol={symbol} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{symbol}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: changeColor }}>
                      {data ? `$${data.price?.toFixed(2)}` : 'N/A'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: changeColor }}>
                      {data?.change ? `${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}` : 'N/A'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: changeColor }}>
                      {data?.changePercent ? `${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%` : 'N/A'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {formatPE(data?.trailingPE)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {formatMarketCap(data?.marketCap)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleRemoveSymbol(symbol)} 
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
        )}
      </div>
    </div>
  );
});

export default WatchlistModule;
