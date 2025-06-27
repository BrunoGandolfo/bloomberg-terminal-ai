import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

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

const GlobalIndicesTicker = () => {
  const [indices, setIndices] = useState([]);
  
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/screener/indices');
        if (!response.ok) throw new Error('Failed to fetch indices');
        const data = await response.json();
        setIndices(data);
      } catch (error) {
        console.error('Error fetching indices:', error);
      }
    };
    
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000); // Cada 30 segundos
    
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
          { id: 'ai', name: 'IA [F6]' }
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
        {activeModule === 'market' && <MarketModule />}
        {activeModule === 'portfolio' && <PortfolioModule />}
        {activeModule === 'watchlist' && <WatchlistModule />}
        {activeModule === 'personal' && <PersonalFinanceModule />}
        {activeModule === 'analysis' && <DocumentAnalysisModule />}
        {activeModule === 'ai' && <AIAssistantModule />}
      </div>
    </div>
  );
}

// Módulo de Mercados
function MarketModule() {
  const [symbol, setSymbol] = useState('AAPL');
  const [currentMarketData, setCurrentMarketData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [showScreener, setShowScreener] = useState(false);

  const handleSearch = async (searchSymbol) => {
    if (!searchSymbol) return;
    setIsLoading(true);
    setError(null);

    // Fetch quote and historical data in parallel
    try {
      const [quoteResponse, historyResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/market/quote/${searchSymbol}`),
        fetch(`http://localhost:5000/api/market/history/${searchSymbol}`)
      ]);

      if (!quoteResponse.ok) {
        const errData = await quoteResponse.json();
        throw new Error(errData.message || `Símbolo ${searchSymbol} no encontrado`);
      }

      const quoteData = await quoteResponse.json();
      setCurrentMarketData({
        ...quoteData,
        name: marketData[quoteData.symbol]?.name || `${quoteData.symbol} Inc.`,
        volume: 50000000 + Math.random() * 100000,
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistoricalData(historyData);
      } else {
        // Don't block UI for history errors, just log it
        console.error(`No se pudieron obtener datos históricos para ${searchSymbol}`);
        setHistoricalData([]); // Reset historical data on error
      }

    } catch (err) {
      setError(err.message);
      setCurrentMarketData(null);
      setHistoricalData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSymbolFromScreener = (selectedSymbol) => {
    setSymbol(selectedSymbol.toUpperCase());
    handleSearch(selectedSymbol);
    setShowScreener(false);
  };

  // Cargar datos del símbolo por defecto al iniciar
  useEffect(() => {
    handleSearch('AAPL');
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
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch(symbol)}
          style={styles.input}
          placeholder="Símbolo (ej: AAPL)"
        />
        <button onClick={() => handleSearch(symbol)} style={styles.button}>BUSCAR</button>
        <button onClick={() => setShowScreener(true)} style={{ ...styles.button, marginLeft: '10px' }}>SCREENER</button>
        <button style={{ ...styles.button, marginLeft: '10px' }}>ANÁLISIS TÉCNICO</button>
      </div>

      {showScreener && <ScreenerPanel onClose={() => setShowScreener(false)} onSelectSymbol={handleSelectSymbolFromScreener} />}

      {isLoading && <p>Cargando datos del mercado...</p>}
      {error && <p style={{color: '#FF0000'}}>Error: {error}</p>}

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
            <div>Alto: ${(currentMarketData.price + 2).toFixed(2)}</div>
            <div>Bajo: ${(currentMarketData.price - 2).toFixed(2)}</div>
            <div>Volumen: {((currentMarketData.volume || 50000000) / 1e6).toFixed(1)}M</div>
            <div>Cap. Mercado: $2.73T</div>
            <div>P/E: 28.4</div>
            <div>EPS: $6.11</div>
          </div>
        </div>

        {/* Panel de Noticias -> Eliminado */}
      </div>

      {/* Gráfico de Precios */}
      <div style={styles.panel}>
        <h3>GRÁFICO DE PRECIOS - 5 AÑOS</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#FF8800"
              tickFormatter={formatDate}
              minTickGap={30} // Adjust gap between ticks
            />
            <YAxis 
              stroke="#FF8800" 
              domain={['auto', 'auto']}
              tickFormatter={(price) => `$${price.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #FF8800' }}
              labelStyle={{ color: '#FF8800' }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Precio']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line type="monotone" dataKey="price" stroke="#00FF00" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

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

// Módulo de Portafolio
function PortfolioModule() {
  // Estado para almacenar todos los datos del portafolio, coincidiendo con la estructura del JSON
  const [portfolioData, setPortfolioData] = useState({ positions: [], totalValue: 0, lastModified: '' });

  // Estado para el formulario de nueva posición
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    shares: '',
    avgCost: '' // Cambiado de avgPrice a avgCost para coincidir con el JSON
  });

  // Cargar datos del portafolio desde el backend al montar el componente
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/portfolio');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPortfolioData(data);
        // Actualizar precios después de cargar el portfolio
        if (data.positions && data.positions.length > 0) {
          updatePrices(data.positions);
        }
      } catch (error) {
        console.error("Error fetching portfolio data:", error);
        // Opcional: manejar el estado de error en la UI, por ejemplo, mostrando un mensaje
      }
    };

    fetchPortfolio();
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar

  // Función para actualizar precios desde la API
  const updatePrices = async (positionsToUpdate) => {
    if (!positionsToUpdate || positionsToUpdate.length === 0) return;

    try {
      // Crear promesas para todas las llamadas a la API
      const pricePromises = positionsToUpdate.map(pos =>
        fetch(`http://localhost:5000/api/market/quote/${pos.symbol}`)
          .then(res => res.ok ? res.json() : null)
          .then(quote => ({
            symbol: pos.symbol,
            price: quote ? quote.price : pos.currentPrice
          }))
          .catch(() => ({
            symbol: pos.symbol,
            price: pos.currentPrice
          }))
      );

      const priceUpdates = await Promise.all(pricePromises);
      
      // Crear mapa de precios
      const priceMap = new Map(priceUpdates.map(p => [p.symbol, p.price]));

      // Actualizar estado con nuevos precios
      setPortfolioData(prevData => {
        const newPositions = prevData.positions.map(pos => ({
          ...pos,
          currentPrice: priceMap.get(pos.symbol) || pos.currentPrice,
          lastUpdated: new Date().toISOString()
        }));
        return { ...prevData, positions: newPositions };
      });

    } catch (error) {
      console.error('Error updating prices:', error);
    }
  };

  // Función genérica para guardar el estado completo del portafolio en el backend
  const savePortfolio = async (updatedPortfolio) => {
    try {
      const response = await fetch('http://localhost:5000/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPortfolio),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving portfolio data:", error);
    }
  };


  // Maneja la adición de una nueva posición
  const handleAddPosition = () => {
    if (newPosition.symbol && newPosition.shares && newPosition.avgCost) {
      const newPositionData = {
        symbol: newPosition.symbol.toUpperCase(),
        name: `${newPosition.symbol.toUpperCase()} Inc.`, // Nombre simulado
        shares: parseInt(newPosition.shares),
        avgCost: parseFloat(newPosition.avgCost),
        // El precio actual debería venir de una API de mercado; aquí lo simulamos
        currentPrice: parseFloat(newPosition.avgCost),
        lastUpdated: new Date().toISOString()
      };

      const updatedPortfolio = {
        ...portfolioData,
        positions: [...portfolioData.positions, newPositionData],
        lastModified: new Date().toISOString()
        // El totalValue podría recalcularse aquí o en el backend
      };

      // Actualiza el estado local primero para una UI responsiva
      setPortfolioData(updatedPortfolio);

      // Luego, envía el estado completo al backend
      savePortfolio(updatedPortfolio);

      // Actualizar precios después de agregar
      updatePrices(updatedPortfolio.positions);

      // Limpia el formulario
      setNewPosition({ symbol: '', shares: '', avgCost: '' });
    }
  };

  // Calcular métricas del portafolio a partir del estado local
  const portfolioMetrics = portfolioData.positions.reduce((acc, pos) => {
    const totalCost = pos.shares * pos.avgCost;
    const currentValue = pos.shares * pos.currentPrice;
    const gain = currentValue - totalCost;

    acc.totalCost += totalCost;
    acc.totalValue += currentValue;
    acc.totalGain += gain;

    return acc;
  }, { totalCost: 0, totalValue: 0, totalGain: 0 });

  portfolioMetrics.totalReturn = portfolioMetrics.totalCost > 0
    ? (portfolioMetrics.totalGain / portfolioMetrics.totalCost * 100)
    : 0;

  // Datos para el gráfico de distribución
  const distributionData = portfolioData.positions.map(pos => ({
    name: pos.symbol,
    value: pos.shares * pos.currentPrice
  }));

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>MI PORTAFOLIO</h2>

      {/* Resumen del Portafolio */}
      <div style={styles.grid}>
        <div style={styles.panel}>
          <h3>RESUMEN GENERAL</h3>
          <div style={{ fontSize: '16px' }}>
            <div>Valor Total: <span style={styles.priceUp}>${portfolioMetrics.totalValue.toFixed(2)}</span></div>
            <div>Costo Total: ${portfolioMetrics.totalCost.toFixed(2)}</div>
            <div>Ganancia/Pérdida:
              <span style={portfolioMetrics.totalGain >= 0 ? styles.priceUp : styles.priceDown}>
                ${portfolioMetrics.totalGain.toFixed(2)} ({portfolioMetrics.totalReturn.toFixed(2)}%)
              </span>
            </div>
            <div>Posiciones: {portfolioData.positions.length}</div>
          </div>
        </div>

        {/* Agregar Nueva Posición */}
        <div style={styles.panel}>
          <h3>AGREGAR POSICIÓN</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Símbolo (ej: AAPL)"
              value={newPosition.symbol}
              onChange={(e) => setNewPosition({...newPosition, symbol: e.target.value})}
              style={{ ...styles.input, width: '100%' }}
            />
            <input
              type="number"
              placeholder="Cantidad de acciones"
              value={newPosition.shares}
              onChange={(e) => setNewPosition({...newPosition, shares: e.target.value})}
              style={{ ...styles.input, width: '100%' }}
            />
            <input
              type="number"
              placeholder="Costo promedio por acción"
              value={newPosition.avgCost}
              onChange={(e) => setNewPosition({...newPosition, avgCost: e.target.value})}
              style={{ ...styles.input, width: '100%' }}
            />
            <button onClick={handleAddPosition} style={styles.button}>AGREGAR</button>
          </div>
        </div>
      </div>

      {/* Tabla de Posiciones */}
      <div style={styles.panel}>
        <h3>POSICIONES ACTUALES</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #FF8800' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Símbolo</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Acciones</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Costo Promedio</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Precio Actual</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Valor Total</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Ganancia/Pérdida</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>% Cambio</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.positions.map((pos, i) => {
                const totalCost = pos.shares * pos.avgCost;
                const currentValue = pos.shares * pos.currentPrice;
                const gain = currentValue - totalCost;
                const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{pos.symbol}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{pos.shares}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${pos.avgCost.toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${pos.currentPrice.toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${currentValue.toFixed(2)}</td>
                    <td style={{
                      padding: '10px',
                      textAlign: 'right',
                      color: gain >= 0 ? '#00FF00' : '#FF0000'
                    }}>
                      ${gain.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '10px',
                      textAlign: 'right',
                      color: gain >= 0 ? '#00FF00' : '#FF0000'
                    }}>
                      {gainPercent.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de Distribución */}
      <div style={styles.panel}>
        <h3>DISTRIBUCIÓN DEL PORTAFOLIO</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#FF8800', '#00FF00', '#00FFFF', '#FFFF00', '#FF00FF', '#FF0000'][index % 6]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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

// Módulo de Análisis de Documentos
function DocumentAnalysisModule() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setAnalyzing(true);

      // Simular análisis
      setTimeout(() => {
        setAnalysis({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          fileType: file.type || 'Desconocido',
          uploadDate: new Date().toLocaleString(),
          // Simulación de análisis de contenido
          extractedData: {
            revenue: '$14.5B',
            netIncome: '$3.2B',
            operatingMargin: '22%',
            debtToEquity: '0.45',
            currentRatio: '1.8',
            roe: '18.5%'
          },
          keyFindings: [
            'Ingresos crecieron 15% año contra año',
            'Márgenes operativos mejoraron 2 puntos porcentuales',
            'Flujo de caja libre aumentó 20%',
            'Deuda neta disminuyó en $500M'
          ],
          risks: [
            'Exposición a fluctuaciones de tipo de cambio',
            'Concentración de clientes en top 10',
            'Presión competitiva en segmento principal'
          ]
        });
        setAnalyzing(false);
      }, 2000);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>ANÁLISIS DE DOCUMENTOS CON IA</h2>

      {/* Upload Section */}
      <div style={styles.panel}>
        <h3>CARGAR DOCUMENTO</h3>
        <p style={{ marginBottom: '15px' }}>
          Sube cualquier documento financiero (PDF, TXT, Form 10-K, Estados Financieros) para análisis automático con IA
        </p>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".pdf,.txt,.doc,.docx"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          style={styles.button}
        >
          SELECCIONAR ARCHIVO
        </button>

        {uploadedFile && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
            <div>Archivo: {uploadedFile.name}</div>
            <div>Tamaño: {(uploadedFile.size / 1024).toFixed(2)} KB</div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analyzing && (
        <div style={styles.panel}>
          <h3>ANALIZANDO DOCUMENTO...</h3>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="loading-spinner">Procesando con IA...</div>
          </div>
        </div>
      )}

      {analysis && !analyzing && (
        <>
          {/* Métricas Extraídas */}
          <div style={styles.panel}>
            <h3>MÉTRICAS FINANCIERAS CLAVE</h3>
            <div style={styles.grid}>
              {Object.entries(analysis.extractedData).map(([key, value]) => (
                <div key={key} style={{ padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#888' }}>{key.toUpperCase()}</div>
                  <div style={{ fontSize: '18px', color: '#00FF00' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hallazgos Clave */}
          <div style={styles.grid}>
            <div style={styles.panel}>
              <h3>HALLAZGOS PRINCIPALES</h3>
              <ul style={{ paddingLeft: '20px' }}>
                {analysis.keyFindings.map((finding, i) => (
                  <li key={i} style={{ marginBottom: '8px', color: '#00FF00' }}>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.panel}>
              <h3>RIESGOS IDENTIFICADOS</h3>
              <ul style={{ paddingLeft: '20px' }}>
                {analysis.risks.map((risk, i) => (
                  <li key={i} style={{ marginBottom: '8px', color: '#FF8800' }}>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chat con el Documento */}
          <div style={styles.panel}>
            <h3>PREGUNTAS AL DOCUMENTO</h3>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Pregunta sobre el documento (ej: ¿Cuál es el margen operativo?)"
                style={{ ...styles.input, width: '70%' }}
              />
              <button style={{ ...styles.button, marginLeft: '10px' }}>PREGUNTAR</button>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
              <p><strong>Usuario:</strong> ¿Cuál es la estrategia de crecimiento?</p>
              <p><strong>IA:</strong> Según el documento, la estrategia de crecimiento se centra en tres pilares:
                1) Expansión geográfica en mercados emergentes, 2) Inversión en I+D para nuevos productos,
                y 3) Adquisiciones estratégicas en el sector tecnológico.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Módulo de Asistente IA
function AIAssistantModule() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola, soy tu asistente financiero con IA. Puedo ayudarte con análisis de mercado, finanzas personales y análisis de documentos. ¿En qué puedo ayudarte?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);

      // Simular respuesta IA
      setTimeout(() => {
        const responses = [
          'Basándome en el análisis actual del mercado, AAPL muestra una tendencia alcista con soporte en $170. Los indicadores técnicos sugieren momentum positivo.',
          'Tu tasa de ahorro del 23% está por encima del promedio. Te recomiendo diversificar en instrumentos de renta fija para mayor estabilidad.',
          'El análisis del Form 10-K muestra sólidos fundamentales con crecimiento consistente en ingresos y mejora en márgenes operativos.'
        ];

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responses[Math.floor(Math.random() * responses.length)]
        }]);
      }, 1000);

      setInput('');
    }
  };

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>ASISTENTE IA FINANCIERO</h2>

      <div style={styles.panel}>
        <div style={{ height: '400px', overflow: 'auto', marginBottom: '15px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: msg.role === 'user' ? '#1a1a1a' : '#0a0a0a',
              borderRadius: '4px',
              borderLeft: `3px solid ${msg.role === 'user' ? '#FF8800' : '#00FF00'}`
            }}>
              <strong>{msg.role === 'user' ? 'Usuario' : 'IA'}:</strong> {msg.content}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe tu pregunta..."
            style={{ ...styles.input, flex: 1 }}
          />
          <button onClick={sendMessage} style={{ ...styles.button, marginLeft: '10px' }}>
            ENVIAR
          </button>
        </div>
      </div>

      {/* Sugerencias */}
      <div style={styles.panel}>
        <h3>PREGUNTAS SUGERIDAS</h3>
        <div style={styles.grid}>
          <button style={{ ...styles.button, width: '100%' }}>
            ¿Cuál es el mejor momento para comprar AAPL?
          </button>
          <button style={{ ...styles.button, width: '100%' }}>
            Analiza mi portafolio de inversiones
          </button>
          <button style={{ ...styles.button, width: '100%' }}>
            ¿Cómo puedo reducir mis gastos mensuales?
          </button>
          <button style={{ ...styles.button, width: '100%' }}>
            Explica los riesgos del último Form 10-K
          </button>
        </div>
      </div>
    </div>
  );
}
