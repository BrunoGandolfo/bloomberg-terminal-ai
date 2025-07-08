import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { apiCall } from '../services/api';
import CompanyLogo from './CompanyLogo';

const GlobalIndicesTicker = forwardRef((props, ref) => {
  const [indices, setIndices] = useState([]);
  const [paused, setPaused] = useState(false);
  
  const fetchIndices = async () => {
    try {
      console.log('🔄 GlobalIndices: Actualizando datos...');
      const data = await apiCall('/api/screener/indices');

      // Obtener cotizaciones de crypto - SOLO BTC/USD para optimizar API calls
      try {
        const cryptoSymbols = ['BTC/USD'];
        const cryptoNames = ['Bitcoin'];
        const cryptoPromises = cryptoSymbols.map(sym => apiCall(`/api/market/quote/${encodeURIComponent(sym)}`));
        const cryptoResults = await Promise.allSettled(cryptoPromises);
        const cryptoIndices = cryptoResults
          .filter(r => r.status === 'fulfilled' && r.value)
          .map((r, idx) => {
            const quote = r.value;
            return {
              símbolo: cryptoSymbols[idx],
              nombre: cryptoNames[idx],
              precio: quote.price || 0,
              cambio: quote.change || 0,
              cambio_porcentual: quote.changePercent || 0,
            };
          });

        setIndices([...data, ...cryptoIndices]);
        console.log('✅ GlobalIndices: Datos actualizados');
      } catch (cryptoError) {
        console.error('Error fetching crypto indices:', cryptoError);
        setIndices(data);
      }
    } catch (error) {
      console.error('Error fetching global indices:', error);
    }
  };

  // Auto-refresh inteligente
  useEffect(() => {
    fetchIndices(); // Carga inicial
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchIndices();
      }
    }, 2000); // <-- MODO AGRESIVO: 2 segundos

    // Cleanup obligatorio
    return () => clearInterval(intervalId);
  }, [fetchIndices]); // fetchIndices está envuelto en useCallback

  // Exponer función refreshData
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      await fetchIndices();
    }
  }));
  
  const getIndexName = (symbol) => {
    const names = {
      '^GSPC': 'S&P 500',
      '^DJI': 'DOW JONES',
      '^IXIC': 'NASDAQ',
      '^RUT': 'RUSSELL 2000',
      'BTC/USD': 'BITCOIN'
    };
    return names[symbol] || symbol;
  };
  
  if (indices.length === 0) return null; // No renderizar si no hay datos

  return (
    <div style={{
      backgroundColor: '#000',
      color: '#FF8800',
      padding: '5px 0',
      borderBottom: '1px solid #FF8800',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    }}>
      <div style={{ display: 'inline-block', paddingLeft: '100%', animation: 'scroll 30s linear infinite' }}>
        {[...indices, ...indices].map((index, i) => ( // Duplicar para un scroll continuo y suave
          <span key={`${index.símbolo}-${i}`} style={{ marginRight: '40px' }}>
            <CompanyLogo symbol={index.símbolo} size={16} />
            <strong>{getIndexName(index.símbolo)}:</strong> {index.precio.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
            <span style={{ color: index.cambio >= 0 ? '#00FF00' : '#FF0000' }}>
              {index.cambio >= 0 ? '▲' : '▼'} {Math.abs(index.cambio_porcentual).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
});

export default GlobalIndicesTicker; 