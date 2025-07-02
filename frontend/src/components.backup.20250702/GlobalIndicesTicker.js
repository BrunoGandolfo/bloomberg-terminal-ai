import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

const GlobalIndicesTicker = () => {
  const [indices, setIndices] = useState([]);
  
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const data = await apiCall('/api/screener/indices');
        setIndices(data);
      } catch (error) {
        console.error('Error fetching global indices:', error);
      }
    };
    
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // Actualiza cada minuto
    
    return () => clearInterval(interval);
  }, []);
  
  const getIndexName = (symbol) => {
    const names = {
      '^GSPC': 'S&P 500',
      '^DJI': 'DOW JONES',
      '^IXIC': 'NASDAQ',
      '^RUT': 'RUSSELL 2000'
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
            <strong>{getIndexName(index.símbolo)}:</strong> {index.precio.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
            <span style={{ color: index.cambio > 0 ? '#00FF00' : '#FF0000' }}>
              {index.cambio > 0 ? '▲' : '▼'} {Math.abs(index.cambio_porcentual).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default GlobalIndicesTicker; 