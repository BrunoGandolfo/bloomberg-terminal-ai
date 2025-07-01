import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorIcon from '../components/ErrorIcon';
import ScreenerTable from '../components/ScreenerTable';

function ScreenerPanel() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState('most_actives');

  useEffect(() => {
    const fetchEnrichedData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/screener/enriched/${type}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error);
        }

        setStocks(result.data);

      } catch (error) {
        setError(error.message);
        console.error('Screener fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrichedData();
    const interval = setInterval(fetchEnrichedData, 30000);
    return () => clearInterval(interval);
  }, [type]);

  return (
    <div className="screener-panel" style={styles.panel}>
      {/* Filtros */}
      <div className="screener-filters" style={styles.filters}>
        <button 
          onClick={() => setType('most_actives')}
          style={type === 'most_actives' ? styles.activeFilter : styles.filter}
        >
          Más Activas
        </button>
        <button 
          onClick={() => setType('gainers')}
          style={type === 'gainers' ? styles.activeFilter : styles.filter}
        >
          Ganadoras
        </button>
        <button 
          onClick={() => setType('losers')}
          style={type === 'losers' ? styles.activeFilter : styles.filter}
        >
          Perdedoras
        </button>
      </div>

      {/* Estados de Loading/Error */}
      {loading && (
        <div style={styles.loading}>
          <LoadingSpinner />
          <span>Cargando datos del mercado...</span>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <ErrorIcon />
          <span>{error}</span>
          <button onClick={() => setType(type)}>Reintentar</button>
        </div>
      )}

      {/* Tabla de Datos */}
      {!loading && !error && (
        <ScreenerTable 
          data={stocks}
          onSymbolClick={(symbol) => {/* ... */}}
          style={styles.table}
        />
      )}
    </div>
  );
}

const styles = {
  panel: {
    backgroundColor: '#000000',
    color: '#FF8800',
    padding: '15px',
    height: '100%'
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  filter: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '1px solid #333',
    padding: '5px 10px'
  },
  activeFilter: {
    backgroundColor: '#FF8800',
    color: '#000000'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#FF8800'
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#FF0000'
  }
};

export default ScreenerPanel; 