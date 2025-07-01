import React, { useState, useEffect } from 'react';

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
  }
};

// Módulo de Watchlist
function WatchlistModule() {
  const [watchlist, setWatchlist] = useState(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']);
  const [newSymbol, setNewSymbol] = useState('');
  const [alerts, setAlerts] = useState({
    AAPL: { type: 'above', price: 180 },
    TSLA: { type: 'below', price: 240 }
  });
  const [watchlistData, setWatchlistData] = useState({});


  // Actualizar datos del watchlist
  useEffect(() => {
    const updateWatchlistData = async () => {
      if (watchlist.length === 0) return;

      const priceUpdatePromises = watchlist.map(symbol =>
        fetch(`http://localhost:5000/api/market/quote/${symbol}`)
          .then(res => res.ok ? res.json() : null)
      );

      const results = await Promise.all(priceUpdatePromises);

      setWatchlistData(prevData => {
        const newData = { ...prevData };
        results.forEach(quote => {
          if (quote) {
            const existing = newData[quote.symbol] || {};
            newData[quote.symbol] = {
              ...existing,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              // Mantener simulación para datos no provistos por la API de cotización
              name: marketData[quote.symbol]?.name || existing.name || `${quote.symbol} Inc.`,
              volume: existing.volume || Math.floor(Math.random() * 50000000),
              dayHigh: quote.price + Math.random() * 5,
              dayLow: quote.price - Math.random() * 5,
            };
          }
        });
        return newData;
      });
    };

    updateWatchlistData(); // Llamada inicial
    const interval = setInterval(updateWatchlistData, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, [watchlist]);

  const addToWatchlist = () => {
    if (newSymbol && !watchlist.includes(newSymbol.toUpperCase())) {
      setWatchlist([...watchlist, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
    const newAlerts = { ...alerts };
    delete newAlerts[symbol];
    setAlerts(newAlerts);
  };

  const setAlert = (symbol, type, price) => {
    setAlerts({
      ...alerts,
      [symbol]: { type, price: parseFloat(price) }
    });
  };

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>WATCHLIST</h2>

      {/* Agregar al Watchlist */}
      <div style={styles.panel}>
        <h3>AGREGAR SÍMBOLO</h3>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Símbolo (ej: NVDA)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
            style={styles.input}
          />
          <button onClick={addToWatchlist} style={styles.button}>AGREGAR</button>
          <span style={{ marginLeft: '20px', fontSize: '11px' }}>
            Símbolos en watchlist: {watchlist.length}
          </span>
        </div>
      </div>

      {/* Lista del Watchlist */}
      <div style={styles.panel}>
        <h3>COTIZACIONES EN TIEMPO REAL</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #FF8800' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Símbolo</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Nombre</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Precio</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Cambio</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>% Cambio</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Volumen</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Rango Día</th>
                <th style={{ textAlign: 'center', padding: '10px' }}>Alerta</th>
                <th style={{ textAlign: 'center', padding: '10px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map(symbol => {
                const data = watchlistData[symbol];
                if (!data) return null;

                const alert = alerts[symbol];
                const alertTriggered = alert && (
                  (alert.type === 'above' && data.price > alert.price) ||
                  (alert.type === 'below' && data.price < alert.price)
                );

                return (
                  <tr key={symbol} style={{
                    borderBottom: '1px solid #333',
                    backgroundColor: alertTriggered ? '#330000' : 'transparent'
                  }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{symbol}</td>
                    <td style={{ padding: '10px' }}>{data.name}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>
                      ${data.price.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '10px',
                      textAlign: 'right',
                      color: data.change > 0 ? '#00FF00' : '#FF0000'
                    }}>
                      {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '10px',
                      textAlign: 'right',
                      color: data.change > 0 ? '#00FF00' : '#FF0000'
                    }}>
                      {data.changePercent.toFixed(2)}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {(data.volume / 1e6).toFixed(1)}M
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '11px' }}>
                      ${data.dayLow.toFixed(2)} - ${data.dayHigh.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {alert ? (
                        <span style={{ color: alertTriggered ? '#FF0000' : '#FFFF00' }}>
                          {alert.type === 'above' ? '▲' : '▼'} ${alert.price}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const type = prompt('Tipo de alerta (above/below):');
                            const price = prompt('Precio de alerta:');
                            if (type && price) setAlert(symbol, type, price);
                          }}
                          style={{ ...styles.button, padding: '4px 8px', fontSize: '10px' }}
                        >
                          SET
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => removeFromWatchlist(symbol)}
                        style={{
                          ...styles.button,
                          backgroundColor: '#FF0000',
                          padding: '4px 8px',
                          fontSize: '10px'
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
