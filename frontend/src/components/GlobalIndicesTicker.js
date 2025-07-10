import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { apiCall } from '../services/api';
import CompanyLogo from './CompanyLogo';

const GlobalIndicesTicker = forwardRef((props, ref) => {
  const [indices, setIndices] = useState([]);
  const [paused, setPaused] = useState(false);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const fetchIndices = useCallback(async () => {
    // Incrementar ID de request para cancelar requests obsoletos
    const currentRequestId = ++requestIdRef.current;

    try {
      console.log('🔄 GlobalIndices: Actualizando datos...');

      // Verificar si el componente sigue montado antes de la primera llamada
      if (!isMountedRef.current) return;

      const data = await apiCall('/api/screener/indices');

      // Verificar si este request es aún válido
      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
        console.log('🚫 GlobalIndices: Request cancelado (componente desmontado o request obsoleto)');
        return;
      }

      // Obtener cotizaciones de crypto - SOLO BTC/USD para optimizar API calls
      try {
        const cryptoSymbols = ['BTC/USD'];
        const cryptoNames = ['Bitcoin'];

        // Verificar nuevamente antes de la llamada crypto
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) return;

        const cryptoPromises = cryptoSymbols.map(sym =>
          apiCall(`/api/market/quote/${encodeURIComponent(sym)}`)
        );
        const cryptoResults = await Promise.allSettled(cryptoPromises);

        // Verificar una vez más antes de procesar resultados
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) return;

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

        // Verificación final antes de actualizar estado
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setIndices([...data, ...cryptoIndices]);
          console.log('✅ GlobalIndices: Datos actualizados');
        }
      } catch (cryptoError) {
        // Solo actualizar si el componente sigue montado y el request es válido
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          console.error('Error fetching crypto indices:', cryptoError);
          setIndices(data);
        }
      }
    } catch (error) {
      // Solo loggear si el componente sigue montado
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        console.error('Error fetching global indices:', error);
      }
    }
  }, []); // Dependencies vacías - la función no depende de ningún prop o estado

  // Auto-refresh OPTIMIZADO - REDUCIDO API CALLS
  useEffect(() => {
    // Marcar componente como montado
    isMountedRef.current = true;

    fetchIndices(); // Carga inicial

    const intervalId = setInterval(() => {
      if (isMountedRef.current && document.visibilityState === 'visible') {
        fetchIndices();
      }
    }, 30000); // ✅ CAMBIO: 30 segundos (antes 1000ms) - OPTIMIZACIÓN CRÍTICA

    // Cleanup obligatorio
    return () => {
      // Marcar componente como desmontado
      isMountedRef.current = false;
      // Incrementar requestId para invalidar requests pendientes
      requestIdRef.current++;
      // Limpiar interval
      clearInterval(intervalId);
      console.log('🧹 GlobalIndices: Cleanup completado');
    };
  }, [fetchIndices]); // fetchIndices está envuelto en useCallback

  // Exponer función refreshData
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      if (isMountedRef.current) {
        await fetchIndices();
      }
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
            <CompanyLogo symbol={index.símbolo} size={16} change={index.cambio} />
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
