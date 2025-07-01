import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import FundamentalAnalysisModule from './components/FundamentalAnalysisModule';
import GlobalIndicesTicker from './components/GlobalIndicesTicker';
import DocumentAnalysisModule from './components/DocumentAnalysisModule';
import AIAssistantModule from './components/AIAssistantModule';
import WatchlistModule from './components/WatchlistModule';
import PortfolioModule from './components/PortfolioModule';

// Estilos Bloomberg Terminal
const styles = {
  terminal: {
    backgroundColor: '#000000',
    color: '#FF8800',
    minHeight: '100vh',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: '10px 20px',
    borderBottom: '2px solid #FF8800',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FF8800',
    letterSpacing: '2px'
  },
  navbar: {
    backgroundColor: '#0a0a0a',
    padding: '5px',
    display: 'flex',
    borderBottom: '1px solid #333'
  },
  navButton: {
    backgroundColor: 'transparent',
    color: '#FF8800',
    border: '1px solid #333',
    padding: '8px 15px',
    margin: '0 5px',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.3s'
  },
  navButtonActive: {
    backgroundColor: '#FF8800',
    color: '#000',
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: '20px',
    overflow: 'auto'
  },
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



// Componente Principal
export default function BloombergTerminal() {
  const [activeModule, setActiveModule] = useState('market');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.terminal}>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>BLOOMBERG TERMINAL AI</div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span>{currentTime.toLocaleTimeString()}</span>
          <span>{currentTime.toLocaleDateString()}</span>
          <span style={{ color: '#00FF00' }}>● ONLINE</span>
        </div>
      </div>

      {/* Ticker de Índices Globales */}
      <GlobalIndicesTicker />

      {/* Navigation */}
      <div style={styles.navbar}>
        {[
          { id: 'market', name: 'MERCADOS [F1]' },
          { id: 'portfolio', name: 'PORTAFOLIO [F2]' },
          { id: 'watchlist', name: 'WATCHLIST [F3]' },
          { id: 'personal', name: 'FINANZAS [F4]' },
          { id: 'analysis', name: 'ANÁLISIS [F5]' },
          { id: 'ai', name: 'IA [F6]' },
          { id: 'fundamental', name: 'FUNDAMENTAL [F7]' }
        ].map(module => (
          <button
            key={module.id}
            style={{
              ...styles.navButton,
              ...(activeModule === module.id ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule(module.id)}
          >
            {module.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={{ display: activeModule === 'market' ? 'block' : 'none' }}>
          <MarketModule />
        </div>
        <div style={{ display: activeModule === 'portfolio' ? 'block' : 'none' }}>
          <PortfolioModule />
        </div>
        <div style={{ display: activeModule === 'watchlist' ? 'block' : 'none' }}>
          <WatchlistModule />
        </div>
        <div style={{ display: activeModule === 'personal' ? 'block' : 'none' }}>
          <PersonalFinanceModule />
        </div>
        <div style={{ display: activeModule === 'analysis' ? 'block' : 'none' }}>
          <DocumentAnalysisModule />
        </div>
        <div style={{ display: activeModule === 'ai' ? 'block' : 'none' }}>
          <AIAssistantModule />
        </div>
        <div style={{ display: activeModule === 'fundamental' ? 'block' : 'none' }}>
          <FundamentalAnalysisModule />
        </div>
      </div>
    </div>
  );
}

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

  const handleSearch = async () => {
    if (!searchSymbol.trim()) return;
    
    setIsLoading(true);
    try {
      // Obtener datos completos (quote + fundamentales)
      const response = await fetch(`http://localhost:5000/api/market/full/${searchSymbol.toUpperCase()}`);
      
      if (!response.ok) {
        alert('Símbolo no encontrado');
        return;
      }
      
      const fullData = await response.json();
      
      // Actualizar datos del mercado con datos REALES
      setCurrentMarketData({
        symbol: fullData.symbol,
        name: fullData.fundamentals?.name || fullData.symbol,
        price: fullData.price,
        change: fullData.change,
        changePercent: fullData.changePercent,
        volume: fullData.volume,
        high: fullData.high,
        low: fullData.low,
        open: fullData.open,
        previousClose: fullData.previousClose,
        
        // Datos fundamentales REALES
        marketCap: fullData.fundamentals?.marketCapRaw || 0,
        marketCapFormatted: fullData.fundamentals?.marketCap || 'N/A',
        peRatio: fullData.fundamentals?.peRatio || 0,
        eps: fullData.fundamentals?.eps || 0,
        dividendYield: fullData.fundamentals?.dividendYield || '0%',
        beta: fullData.fundamentals?.beta || 0,
        profitMargin: fullData.fundamentals?.profitMargin || 'N/A',
        revenue: fullData.fundamentals?.revenue || 'N/A'
      });
      
      // Obtener datos históricos
      const historyResponse = await fetch(`http://localhost:5000/api/market/history/${searchSymbol.toUpperCase()}`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('Datos históricos recibidos:', historyData.length, 'registros');
        console.log('Buscando 26 dic 2024:', historyData.find(d => d.date.includes('2024-12-26')));
        setHistoricalData(historyData);
      }
      
      setSearchSymbol('');
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
      const response = await fetch(`http://localhost:5000/api/market/history/${currentMarketData.symbol}?days=${daysMap[range]}`);
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data);
      }
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
    const loadDefaultStock = async () => {
      try {
        // Cargar datos completos
        const response = await fetch('http://localhost:5000/api/market/full/AAPL');
        if (response.ok) {
          const data = await response.json();
          setCurrentMarketData({
            symbol: data.symbol,
            name: data.fundamentals?.name || 'Apple Inc.',
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            volume: data.volume,
            high: data.high,
            low: data.low,
            marketCapFormatted: data.fundamentals?.marketCap || 'N/A',
            peRatio: data.fundamentals?.peRatio || 0,
            eps: data.fundamentals?.eps || 0
          });
        }
        
        // AGREGAR ESTA PARTE: Cargar datos históricos
        const historyResponse = await fetch('http://localhost:5000/api/market/history/AAPL');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          console.log('Datos históricos recibidos:', historyData.length, 'registros');
          console.log('Buscando 26 dic 2024:', historyData.find(d => d.date.includes('2024-12-26')));
          setHistoricalData(historyData);
        }
        
      } catch (error) {
        console.error('Error cargando AAPL por defecto:', error);
      }
    };
    
    loadDefaultStock();
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
        <input
          type="text"
          value={searchSymbol}
          onChange={(e) => setSearchSymbol(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          style={styles.input}
          placeholder="Símbolo (ej: AAPL)"
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

// Módulo de Buscador de Activos (Screener)
function ScreenerPanel({ onClose, onSelectSymbol }) {
  const [activeTab, setActiveTab] = useState('Acciones');
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('Todos');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  const TABS = ["Acciones", "ETFs", "Bonos"];

  // Fetch sectors for the dropdown
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/screener/sectors');
        if (!response.ok) throw new Error('Failed to fetch sectors');
        const data = await response.json();
        setSectors(['Todos', ...data]);
      } catch (error) {
        console.error("Error fetching sectors:", error);
      }
    };
    fetchSectors();
  }, []);

  // Fetch data when tab or sector changes
  useEffect(() => {
    if (searchMode) return; // Don't fetch if we are in search mode

    const fetchData = async () => {
      setIsLoading(true);
      setData([]); // Limpiar datos anteriores
      let url = '';
      
      switch (activeTab) {
        case 'Acciones':
          if (!selectedSector || selectedSector === 'Todos' || selectedSector === 'N/A') {
            url = 'http://localhost:5000/api/screener/realtime/most_actives';
          } else {
            url = `http://localhost:5000/api/screener/by-sector/${encodeURIComponent(selectedSector)}`;
          }
          break;
        case 'ETFs':
          url = 'http://localhost:5000/api/screener/etfs';
          break;
        case 'Bonos':
          url = 'http://localhost:5000/api/screener/bonds';
          break;
        default:
          break;
      }

      if (url) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch data');
          const fetchedData = await response.json();
          setData(fetchedData);
        } catch (error) {
          console.error(`Error fetching data for ${activeTab}:`, error);
          setData([]);
        }
      } else {
        setData([]);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [activeTab, selectedSector, searchMode]);

  const handleSearch = async () => {
    if (!searchQuery) {
      setSearchMode(false);
      // Trigger a re-fetch of the current tab's data
      setSelectedSector(sectors[0]);
      setActiveTab(TABS[0]);
      return;
    }
    setIsLoading(true);
    setSearchMode(true);
    try {
      const response = await fetch(`http://localhost:5000/api/screener/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const fetchedData = await response.json();
      setData(fetchedData);
    } catch (error) {
      console.error("Error searching:", error);
      setData([]);
    }
    setIsLoading(false);
  };
  
  const getHeaders = () => {
    if (searchMode) return ['Símbolo', 'Nombre', 'Intercambio', 'Tipo'];
    switch (activeTab) {
      case 'Acciones': return ['Símbolo', 'Nombre', 'Precio', 'Cambio %', 'Cap. Mercado'];
      case 'ETFs': return ['Símbolo', 'Nombre', 'Precio', 'Cambio %', 'Cap. Mercado'];
      case 'Bonos': return ['Símbolo', 'Nombre', 'Precio', 'Cambio', 'Rendimiento Anual'];
      default: return [];
    }
  };

  const renderRow = (item) => {
    const formatValue = (value, type) => {
      if (typeof value !== 'number') return value;
      switch (type) {
        case 'price': return `$${value.toFixed(2)}`;
        case 'percent':
          const style = value >= 0 ? styles.priceUp : styles.priceDown;
          return <span style={style}>{value.toFixed(2)}%</span>;
        case 'change':
            const styleChange = value >= 0 ? styles.priceUp : styles.priceDown;
            return <span style={styleChange}>{value > 0 ? '+' : ''}{value.toFixed(2)}</span>;
        case 'marketCap':
          return `$${(value / 1e9).toFixed(2)}B`;
        default: return value;
      }
    };

    if (searchMode) {
      return [item.símbolo, item.nombre, item.intercambio, item.tipo];
    }

    switch (activeTab) {
      case 'Acciones':
      case 'ETFs':
        return [item.símbolo, item.nombre, formatValue(item.precio, 'price'), formatValue(item.cambio_porcentual, 'percent'), formatValue(item.capitalización, 'marketCap')];
      case 'Bonos':
        return [item.símbolo, item.nombre, formatValue(item.precio, 'price'), formatValue(item.cambio, 'change'), item.rendimiento_anual];
      default: return [];
    }
  };
  
  return (
    <div style={{
        position: 'fixed', top: '5%', left: '5%', right: '5%', bottom: '5%',
        backgroundColor: 'rgba(0,0,0,0.95)', border: '2px solid #FF8800',
        zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#FF8800', margin: 0 }}>BUSCADOR DE ACTIVOS</h2>
            <button onClick={onClose} style={{...styles.button, backgroundColor: '#555'}}>CERRAR [ESC]</button>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{ ...styles.input, flex: 1 }}
              placeholder="Buscar por nombre o símbolo..."
            />
            <button onClick={handleSearch} style={{...styles.button}}>BUSCAR</button>
        </div>

        {/* Tabs and Sector Dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', marginBottom: '15px' }}>
            <div style={{ display: 'flex' }}>
              {TABS.map(tab => (
                <button key={tab} 
                  onClick={() => { setSearchMode(false); setActiveTab(tab); }}
                  style={{...styles.navButton, border: 0, borderBottom: activeTab === tab && !searchMode ? '2px solid #FF8800' : '2px solid transparent' }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            {activeTab === 'Acciones' && !searchMode && (
              <select 
                value={selectedSector} 
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                }} 
                style={{...styles.input, width: 'auto'}}
              >
                {sectors.map(sector => <option key={sector} value={sector}>{sector}</option>)}
              </select>
            )}
        </div>

        {/* Results Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? <p>Cargando...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #FF8800' }}>
                  {getHeaders().map(h => <th key={h} style={{ padding: '8px', textAlign: 'left' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.símbolo} onClick={() => onSelectSymbol(item.símbolo)} style={{ cursor: 'pointer', borderBottom: '1px solid #222' }} className="hover-row">
                    {renderRow(item).map((cell, i) => <td key={i} style={{ padding: '8px' }}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            )}
        </div>
        <style>{'.hover-row:hover { background-color: #1a1a1a; }'}</style>
    </div>
  );
}





// Módulo de Finanzas Personales
function PersonalFinanceModule() {
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2024-01-15', description: 'Salario Mensual', amount: 5000, type: 'income', category: 'Salario' },
    { id: 2, date: '2024-01-16', description: 'Supermercado Walmart', amount: -150, type: 'expense', category: 'Alimentación' },
    { id: 3, date: '2024-01-17', description: 'Gasolina Shell', amount: -60, type: 'expense', category: 'Transporte' },
    { id: 4, date: '2024-01-18', description: 'Proyecto Freelance', amount: 800, type: 'income', category: 'Freelance' },
    { id: 5, date: '2024-01-19', description: 'Netflix', amount: -15, type: 'expense', category: 'Suscripciones' },
    { id: 6, date: '2024-01-20', description: 'Dividendos AAPL', amount: 125, type: 'income', category: 'Inversiones' }
  ]);

  // Categorías separadas para ingresos y gastos
  const [expenseCategories, setExpenseCategories] = useState([
    'Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Suscripciones',
    'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Mascotas', 'Otros'
  ]);

  const [incomeCategories, setIncomeCategories] = useState([
    'Salario', 'Freelance', 'Inversiones', 'Alquiler', 'Ventas',
    'Bonos', 'Reembolsos', 'Regalos', 'Otros'
  ]);

  // Presupuesto mensual único
  const [monthlyBudget, setMonthlyBudget] = useState(3000);
  const [savings, setSavings] = useState(1250); // Ahorro acumulado

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: ''
  });

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryType, setCategoryType] = useState('expense');

  const addTransaction = () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.category) {
      setTransactions([...transactions, {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        ...newTransaction,
        amount: newTransaction.type === 'expense' ? -Math.abs(Number(newTransaction.amount)) : Math.abs(Number(newTransaction.amount))
      }]);
      setNewTransaction({ description: '', amount: '', type: 'expense', category: '' });
    }
  };

  const addCategory = () => {
    if (newCategory.trim()) {
      if (categoryType === 'expense') {
        setExpenseCategories([...expenseCategories, newCategory]);
      } else {
        setIncomeCategories([...incomeCategories, newCategory]);
      }
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  // Calcular totales y presupuesto restante
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totals = monthlyTransactions.reduce((acc, t) => {
    if (t.amount > 0) acc.income += t.amount;
    else acc.expenses += Math.abs(t.amount);
    return acc;
  }, { income: 0, expenses: 0 });

  totals.balance = totals.income - totals.expenses;

  // Cálculo del presupuesto restante
  const budgetRemaining = monthlyBudget - totals.expenses;
  const budgetUsedPercent = monthlyBudget > 0 ? (totals.expenses / monthlyBudget * 100) : 0;
  const potentialSavingsPercent = budgetRemaining > 0 ? (budgetRemaining / monthlyBudget * 100) : 0;

  // Gastos por categoría
  const categorySpending = {};
  monthlyTransactions.filter(t => t.amount < 0).forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
  });

  // Datos para gráficos
  const categoryData = Object.entries(categorySpending).map(([category, spent]) => ({
    name: category,
    value: spent
  }));

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>FINANZAS PERSONALES</h2>

      {/* Botones de Acción */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowBudgetModal(true)}
          style={{ ...styles.button, marginRight: '10px' }}
        >
          CONFIGURAR PRESUPUESTO MENSUAL
        </button>
        <button
          onClick={() => setShowCategoryModal(true)}
          style={styles.button}
        >
          AGREGAR CATEGORÍA
        </button>
      </div>

      {/* Resumen Financiero y Presupuesto */}
      <div style={styles.grid}>
        <div style={styles.panel}>
          <h3>PRESUPUESTO MENSUAL</h3>
          <div style={{ fontSize: '18px' }}>
            <div>Presupuesto Total: <span style={{ color: '#FFFF00' }}>${monthlyBudget.toFixed(2)}</span></div>
            <div>Gastos del Mes: <span style={styles.priceDown}>${totals.expenses.toFixed(2)}</span></div>
            <div>Presupuesto Restante:
              <span style={budgetRemaining > 0 ? styles.priceUp : styles.priceDown}>
                ${budgetRemaining.toFixed(2)} ({potentialSavingsPercent.toFixed(1)}%)
              </span>
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{
                width: '100%',
                height: '25px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(budgetUsedPercent, 100)}%`,
                  height: '100%',
                  backgroundColor: budgetUsedPercent > 90 ? '#FF0000' : budgetUsedPercent > 70 ? '#FFFF00' : '#00FF00',
                  transition: 'width 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  {budgetUsedPercent > 10 && `${budgetUsedPercent.toFixed(0)}%`}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <h3>CUENTA DE AHORRO</h3>
          <div style={{ fontSize: '18px' }}>
            <div>Ahorro Acumulado: <span style={styles.priceUp}>${savings.toFixed(2)}</span></div>
            <div>Potencial este mes:
              <span style={budgetRemaining > 0 ? styles.priceUp : { color: '#888' }}>
                ${budgetRemaining > 0 ? budgetRemaining.toFixed(2) : '0.00'}
              </span>
            </div>
            <div>% Ahorro del Presupuesto:
              <span style={{ color: potentialSavingsPercent > 20 ? '#00FF00' : potentialSavingsPercent > 10 ? '#FFFF00' : '#FF8800' }}>
                {potentialSavingsPercent.toFixed(1)}%
              </span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
              Meta recomendada: 20% del presupuesto
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del Mes */}
      <div style={styles.panel}>
        <h3>RESUMEN COMPLETO DEL MES</h3>
        <div style={styles.grid}>
          <div>
            <div style={{ marginBottom: '10px' }}>Ingresos Totales: <span style={styles.priceUp}>${totals.income.toFixed(2)}</span></div>
            <div style={{ marginBottom: '10px' }}>Gastos Totales: <span style={styles.priceDown}>${totals.expenses.toFixed(2)}</span></div>
            <div>Balance Real: <span style={totals.balance > 0 ? styles.priceUp : styles.priceDown}>${totals.balance.toFixed(2)}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#FF8800' }}>Estado del Presupuesto:</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>
              {budgetRemaining > 0 ? (
                <span style={styles.priceUp}>EN PRESUPUESTO ✓</span>
              ) : (
                <span style={styles.priceDown}>SOBREPASADO ✗</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agregar Transacción */}
      <div style={styles.panel}>
        <h3>NUEVA TRANSACCIÓN</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <input
            type="text"
            placeholder="Descripción"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
            style={{ ...styles.input, width: '100%', margin: 0 }}
          />
          <input
            type="number"
            placeholder="Monto"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
            style={{ ...styles.input, width: '100%', margin: 0 }}
          />
          <select
            value={newTransaction.type}
            onChange={(e) => {
              setNewTransaction({
                ...newTransaction,
                type: e.target.value,
                category: ''
              });
            }}
            style={{ ...styles.input, width: '100%', margin: 0 }}
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
          <select
            value={newTransaction.category}
            onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
            style={{ ...styles.input, width: '100%', margin: 0 }}
          >
            <option value="">Categoría</option>
            {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={addTransaction} style={{ ...styles.button, margin: 0 }}>+</button>
        </div>
      </div>

      {/* Gráficos */}
      <div style={styles.grid}>
        <div style={styles.panel}>
          <h3>DISTRIBUCIÓN DE GASTOS</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#FF8800', '#00FF00', '#FF0000', '#FFFF00', '#00FFFF', '#FF00FF'][index % 6]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.panel}>
          <h3>INGRESOS POR FUENTE</h3>
          <div>
            {incomeCategories.map(cat => {
              const amount = monthlyTransactions
                .filter(t => t.amount > 0 && t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);

              if (amount === 0) return null;

              return (
                <div key={cat} style={{
                  padding: '10px',
                  marginBottom: '5px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{cat}</span>
                  <span style={styles.priceUp}>${amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de Transacciones */}
      <div style={styles.panel}>
        <h3>TRANSACCIONES RECIENTES</h3>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #FF8800' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Descripción</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Categoría</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Monto</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Presupuesto</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice().reverse().map((t, index) => {
                // Calcular presupuesto restante después de cada transacción
                const previousExpenses = transactions
                  .slice(0, transactions.length - index - 1)
                  .filter(tr => tr.amount < 0 && new Date(tr.date).getMonth() === currentMonth)
                  .reduce((sum, tr) => sum + Math.abs(tr.amount), 0);

                const budgetAfter = monthlyBudget - previousExpenses - (t.amount < 0 ? Math.abs(t.amount) : 0);

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px' }}>{t.date}</td>
                    <td style={{ padding: '10px' }}>{t.description}</td>
                    <td style={{ padding: '10px' }}>{t.category}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: t.amount > 0 ? '#00FF00' : '#FF0000' }}>
                      {t.amount > 0 ? '+' : ''} ${Math.abs(t.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: budgetAfter > 0 ? '#00FF00' : '#FF0000' }}>
                      ${budgetAfter.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Presupuesto */}
      {showBudgetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '2px solid #FF8800',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>CONFIGURAR PRESUPUESTO MENSUAL</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                Presupuesto para gastos del mes:
              </label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                style={{ ...styles.input, width: '100%' }}
                placeholder="Ej: 3000"
              />
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>
              Este es el monto máximo que planeas gastar este mes.
              Lo que sobre irá automáticamente a tu cuenta de ahorro.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowBudgetModal(false)} style={styles.button}>
                GUARDAR
              </button>
              <button
                onClick={() => setShowBudgetModal(false)}
                style={{ ...styles.button, backgroundColor: '#FF0000' }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categorías */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '2px solid #FF8800',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>AGREGAR NUEVA CATEGORÍA</h3>
            <select
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value)}
              style={{ ...styles.input, width: '100%', marginBottom: '10px' }}
            >
              <option value="expense">Categoría de Gasto</option>
              <option value="income">Categoría de Ingreso</option>
            </select>
            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ ...styles.input, width: '100%', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={addCategory} style={styles.button}>
                AGREGAR
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory('');
                }}
                style={{ ...styles.button, backgroundColor: '#FF0000' }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



