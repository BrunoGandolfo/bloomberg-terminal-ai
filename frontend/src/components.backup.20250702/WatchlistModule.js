import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

// Datos de mercado simulados
const marketData = {
  AAPL: { name: 'Apple Inc.', price: 173.50, change: 2.35, changePercent: 1.37 },
  GOOGL: { name: 'Alphabet Inc.', price: 142.65, change: -1.20, changePercent: -0.83 },
  MSFT: { name: 'Microsoft Corp.', price: 378.85, change: 5.10, changePercent: 1.37 },
  AMZN: { name: 'Amazon.com Inc.', price: 127.74, change: 3.25, changePercent: 2.61 },
  TSLA: { name: 'Tesla Inc.', price: 242.84, change: -8.50, changePercent: -3.38 },
  META: { name: 'Meta Platforms', price: 313.26, change: 4.75, changePercent: 1.54 },
  NVDA: { name: 'NVIDIA Corp.', price: 456.38, change: 12.40, changePercent: 2.79 },
  JPM: { name: 'JPMorgan Chase', price: 146.93, change: 0.85, changePercent: 0.58 }
};

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
    backgroundColor: '#8B0000',
    color: '#FF8800',
    border: 'none',
    padding: '3px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'opacity 0.2s',
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
function WatchlistModule() {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [watchlistData, setWatchlistData] = useState({});
  const [newSymbol, setNewSymbol] = useState('');
  const [alerts, setAlerts] = useState({
    AAPL: { type: 'above', price: 180 },
    TSLA: { type: 'below', price: 240 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const stableWatchlistKey = watchlist.sort().join(',');

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Efecto para la carga inicial y cuando la lista cambia
  useEffect(() => {
    setIsLoading(true);
    fetchAllWatchlistData(watchlist).then(data => {
      setWatchlistData(data);
      setIsLoading(false);
      setLastUpdated(Date.now());
    });
  }, [stableWatchlistKey]);

  // Efecto para la actualización automática cada 2 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      // No mostrar el spinner de carga para actualizaciones en segundo plano
      fetchAllWatchlistData(watchlist).then(data => {
        setWatchlistData(data);
        setLastUpdated(Date.now());
      });
    }, 120000);
    
    return () => clearInterval(interval);
  }, [stableWatchlistKey]);

  const handleAddSymbol = async () => {
    if (newSymbol && !watchlist.includes(newSymbol.toUpperCase())) {
      try {
        // Validar que el símbolo existe antes de agregarlo
        await apiCall(`/api/market/quote/${newSymbol.toUpperCase()}`);
        setWatchlist([...watchlist, newSymbol.toUpperCase()]);
        setNewSymbol('');
      } catch (error) {
        console.error('Error validating symbol:', error);
        alert('Símbolo no válido o no encontrado.');
      }
    }
  };

  const handleRemoveSymbol = (symbolToRemove) => {
    setWatchlist(watchlist.filter(symbol => symbol !== symbolToRemove));
    const newAlerts = { ...alerts };
    delete newAlerts[symbolToRemove];
    setAlerts(newAlerts);
  };

  const setAlert = (symbol, type, price) => {
    setAlerts({
      ...alerts,
      [symbol]: { type, price: parseFloat(price) }
    });
  };

  const renderTimeAgo = () => {
    if (!lastUpdated) return 'Nunca';
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 10) return 'justo ahora';
    if (seconds < 60) return `hace ${seconds} segundos`;
    return `hace ${Math.floor(seconds / 60)} min`;
  };

  const manualRefresh = () => {
     setIsLoading(true);
     fetchAllWatchlistData(watchlist).then(data => {
       setWatchlistData(data);
       setIsLoading(false);
       setLastUpdated(Date.now());
     });
  };

  return (
    <div style={styles.panel}>
      <style>{`.delete-btn:hover { opacity: 0.8; }`}</style>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>LISTA DE SEGUIMIENTO</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Agregar Símbolo"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
          style={styles.input}
        />
        <button onClick={handleAddSymbol} style={styles.button}>AGREGAR</button>
        <button onClick={manualRefresh} style={styles.button} disabled={isLoading}>
          {isLoading ? '...' : '🔄'}
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
                <th style={{ padding: '8px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Precio</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Cambio %</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Volumen</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map(symbol => {
                const data = watchlistData[symbol];
                const priceStyle = data ? (data.changePercent >= 0 ? styles.priceUp : styles.priceDown) : {};

                return (
                  <tr key={symbol} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{symbol}</td>
                    <td style={{ padding: '8px' }}>{data?.name || 'Cargando...'}</td>
                    <td style={{ padding: '8px', textAlign: 'right', ...priceStyle }}>
                      {data ? `$${data.price?.toFixed(2)}` : 'N/A'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', ...priceStyle }}>
                      {data ? `${data.changePercent?.toFixed(2)}%` : 'N/A'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {data ? (data.volume / 1_000_000).toFixed(2) + 'M' : 'N/A'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleRemoveSymbol(symbol)} 
                        style={styles.deleteButton}
                        className="delete-btn"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Panel de Alertas */}
      <div style={styles.panel}>
        <h3>ALERTAS CONFIGURADAS</h3>
        {Object.keys(alerts).length === 0 ? (
          <p>No hay alertas configuradas. Haz clic en SET en la tabla para agregar.</p>
        ) : (
          <div style={styles.grid}>
            {Object.entries(alerts).map(([symbol, alert]) => {
              const data = watchlistData[symbol];
              const triggered = data && (
                (alert.type === 'above' && data.price > alert.price) ||
                (alert.type === 'below' && data.price < alert.price)
              );

              return (
                <div key={symbol} style={{
                  ...styles.panel,
                  backgroundColor: triggered ? '#330000' : '#1a1a1a',
                  border: triggered ? '1px solid #FF0000' : '1px solid #333'
                }}>
                  <h4>{symbol}</h4>
                  <div>Alerta: {alert.type === 'above' ? 'Por encima de' : 'Por debajo de'} ${alert.price}</div>
                  <div>Precio actual: ${data?.price.toFixed(2) || 'N/A'}</div>
                  <div style={{ color: triggered ? '#FF0000' : '#00FF00' }}>
                    Estado: {triggered ? '⚠️ ACTIVADA' : '✓ Monitoreando'}
                  </div>
                  <button
                    onClick={() => {
                      const newAlerts = { ...alerts };
                      delete newAlerts[symbol];
                      setAlerts(newAlerts);
                    }}
                    style={{ ...styles.button, marginTop: '10px', fontSize: '10px' }}
                  >
                    ELIMINAR ALERTA
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchlistModule;
