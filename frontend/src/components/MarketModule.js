import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ScreenerPanel from './ScreenerPanel';
import { apiCall } from '../services/api';
import TickerSearchInput from './TickerSearchInput';

// Estilos Bloomberg Terminal
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
  priceUp: {
    color: '#00FF00'
  },
  priceDown: {
    color: '#FF0000'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  }
};

// Módulo de Mercados
function MarketModule() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [currentMarketData, setCurrentMarketData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [showScreener, setShowScreener] = useState(false);
  const [selectedRange, setSelectedRange] = useState('1Y');

  useEffect(() => {
    if (historicalData.length > 0) {
      const data = historicalData; // Para usar el mismo nombre de variable que solicitaste
      console.log('--- DEBUG GRÁFICO (DATOS ACTUALIZADOS) ---');
      console.log('Total datos recibidos:', data.length);
      console.log('Primer dato:', data[0]);
      console.log('Último dato:', data[data.length - 1]);
      console.log('Últimos 3 datos:', data.slice(-3));
    }
  }, [historicalData]);

  const calculateVolatility = (closes) => {
    const n = closes.length;
    const mean = closes.reduce((a, b) => a + b) / n;
    const variance = closes.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return Math.sqrt(variance);
  };
  
  const calculatePeriodStats = (data) => {
    if (!data || data.length === 0) return null;
    
    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    
    return {
      min: Math.min(...closes),
      max: Math.max(...closes),
      change: closes[closes.length - 1] - closes[0],
      changePercent: ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100,
      avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      volatility: calculateVolatility(closes),
    };
  };

  const periodStats = calculatePeriodStats(historicalData);

  const periodInfo = historicalData.length > 0 ? {
    start: historicalData[0].date,
    end: historicalData[historicalData.length - 1].date,
    days: historicalData.length,
    lastUpdate: new Date().toLocaleTimeString()
  } : null;

  const handleSearch = async (symbolParam) => {
    const symbol = (symbolParam || searchSymbol || '').toUpperCase();
    if (!symbol) return;
    setIsLoading(true);
    try {
      const data = await apiCall(`/api/market/full/${symbol}`);
      setCurrentMarketData(data);

      // Cargar historial inicial de 1 año
      const historyData = await apiCall(`/api/market/history/${symbol}`);
      setHistoricalData(historyData);
    } catch (error) {
      console.error('Error buscando símbolo:', error);
      alert('Error al buscar el símbolo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRangeChange = async (range) => {
    setSelectedRange(range);
    
    const daysMap = {
      '1 día': 1,
      '5 días': 5,
      '1 mes': 30,
      '3 meses': 90,
      '6 meses': 180,
      '1 año': 365,
      '5 años': 1825 // Aproximadamente 5 años
    };
    
    try {
      const data = await apiCall(
        `/api/market/history/${currentMarketData.symbol}?days=${daysMap[range]}`
      );
      setHistoricalData(data);
    } catch (error) {
      console.error('Error cambiando rango:', error);
    }
  };

  const handleSelectSymbolFromScreener = (selectedSymbol) => {
    setSearchSymbol(selectedSymbol.toUpperCase());
    // Disparar la búsqueda inmediatamente después de seleccionar
    // en lugar de esperar que el estado se actualice y usar un useEffect.
    handleSearch(selectedSymbol.toUpperCase()); 
    setShowScreener(false);
  };
  
  // Cargar AAPL por defecto al iniciar
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const initialData = await apiCall('/api/market/full/AAPL');
        setCurrentMarketData(initialData);
        
        const historyData = await apiCall('/api/market/history/AAPL');
        setHistoricalData(historyData);
      } catch (error) {
        console.error('Error cargando AAPL por defecto:', error);
      }
      setIsLoading(false);
    };
    
    fetchInitialData();
  }, []);

  // Formatter for X-Axis (Date)
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    // Add a day to the date to correct for potential timezone issues
    date.setDate(date.getDate() + 1);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  };

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>TERMINAL DE MERCADOS</h2>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: '20px' }}>
        <TickerSearchInput
          placeholder="Buscar empresa o símbolo..."
          onSelectTicker={(t) => {
            setSearchSymbol(t.symbol);
            handleSearch(t.symbol);
          }}
          style={{ width: '300px', marginBottom: '10px' }}
        />
        <button onClick={() => handleSearch()} style={styles.button}>BUSCAR</button>
        <button onClick={() => setShowScreener(true)} style={{ ...styles.button, marginLeft: '10px' }}>SCREENER</button>
        <button style={{ ...styles.button, marginLeft: '10px' }}>ANÁLISIS TÉCNICO</button>
      </div>

      {showScreener && <ScreenerPanel onClose={() => setShowScreener(false)} onSelectSymbol={handleSelectSymbolFromScreener} />}

      {isLoading && <p>Cargando datos del mercado...</p>}

      {currentMarketData && !isLoading && (
      <>
      <div style={styles.grid}>
        {/* Panel de Cotización */}
        <div style={styles.panel}>
          <h3>{currentMarketData.symbol} - {currentMarketData.name}</h3>
          <div style={{ fontSize: '24px', margin: '10px 0' }}>
            ${currentMarketData.price.toFixed(2)}
            <span style={currentMarketData.change > 0 ? styles.priceUp : styles.priceDown}>
              {' '}{currentMarketData.change > 0 ? '+' : ''}{currentMarketData.change.toFixed(2)} ({currentMarketData.changePercent.toFixed(2)}%)
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Alto: ${currentMarketData.high?.toFixed(2) || 'N/A'}</div>
            <div>Bajo: ${currentMarketData.low?.toFixed(2) || 'N/A'}</div>
            <div>Volumen: {currentMarketData.volume?.toLocaleString() || 'N/A'}</div>
            <div>Cap. Mercado: {currentMarketData.marketCapFormatted || 'N/A'}</div>
            <div>P/E: {currentMarketData.peRatio?.toFixed(2) || 'N/A'}</div>
            <div>EPS: ${currentMarketData.eps?.toFixed(2) || 'N/A'}</div>
            <div>Dividendo: {currentMarketData.dividendYield || '0%'}</div>
            <div>Beta: {currentMarketData.beta?.toFixed(2) || 'N/A'}</div>
          </div>
        </div>

        {/* Panel de Noticias -> Eliminado */}
      </div>

      {/* Gráfico de Precios */}
      {historicalData && historicalData.length > 0 && (
        <div style={styles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>GRÁFICO DE PRECIOS</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              {['1 día', '5 días', '1 mes', '3 meses', '6 meses', '1 año', '5 años'].map(range => (
                <button
                  key={range}
                  onClick={() => handleRangeChange(range)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    backgroundColor: selectedRange === range ? '#FF8800' : 'transparent',
                    color: selectedRange === range ? '#000' : '#FF8800',
                    border: '1px solid #FF8800',
                    cursor: 'pointer'
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#FF8800" />
              <YAxis stroke="#FF8800" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #FF8800' }}
                formatter={(value, name, props) => {
                  const { payload } = props;
                  if (!payload) return null;
                  
                  // No es necesario mostrar nada en el formatter principal, 
                  // el content del tooltip se definirá en el labelFormatter y en un content personalizado si fuera necesario.
                  // Dejaremos esto simple para que el labelFormatter haga su trabajo.
                  return [value.toFixed(2), name];
                }}
                labelFormatter={(label) => {
                  return label ? new Date(label).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : '';
                }}
                // Para un control total, podrías usar un content personalizado, pero por ahora esto es más limpio.
                // content={<CustomTooltip />} 
              />
              <Line type="monotone" dataKey="close" stroke="#00FF00" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          {periodInfo && (
            <div style={{ color: '#888', fontSize: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span>
                PERÍODO: {periodInfo.start} - {periodInfo.end} | DÍAS: {periodInfo.days} | FUENTE: Twelve Data
              </span>
              <span>
                ÚLTIMA ACTUALIZACIÓN: {periodInfo.lastUpdate} | DELAY: 15 min
              </span>
            </div>
          )}
        </div>
      )}

      {/* Análisis Técnico */}
      <div style={styles.panel}>
        <h3>INDICADORES TÉCNICOS</h3>
        <div style={{ color: '#888', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
          Módulo de Análisis Técnico en desarrollo. Próximamente disponible.
        </div>
      </div>
      </>
      )}
    </div>
  );
}

export default MarketModule; 