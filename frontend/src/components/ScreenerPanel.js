import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import CompanyLogo from './CompanyLogo';

// Estilos Bloomberg Terminal
const styles = {
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
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '1px solid #FF8800',
    padding: '8px',
    fontSize: '12px',
    width: '200px',
    marginRight: '10px'
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
  priceUp: {
    color: '#00FF00'
  },
  priceDown: {
    color: '#FF0000'
  }
};

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
        const data = await apiCall('/api/screener/sectors');
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
            url = '/api/screener/realtime/most_actives';
          } else {
            url = `/api/screener/by-sector/${encodeURIComponent(selectedSector)}`;
          }
          break;
        case 'ETFs':
          url = '/api/screener/etfs';
          break;
        case 'Bonos':
          url = '/api/screener/bonds';
          break;
        default:
          break;
      }

      if (url) {
        try {
          const fetchedData = await apiCall(url);
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
      const fetchedData = await apiCall(`/api/screener/search?q=${encodeURIComponent(searchQuery)}`);
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
                {data.map((item, index) => (
                  <tr key={index} onClick={() => onSelectSymbol(item.símbolo)} style={{ cursor: 'pointer', borderBottom: '1px solid #222' }} className="hover-row">
                    <td style={{ padding: '8px' }}><CompanyLogo symbol={item.símbolo} size={20} /></td>
                    <td style={{ padding: '8px' }}>{item.símbolo}</td>
                    <td style={{ padding: '8px' }}>{item.nombre.length > 40 ? `${item.nombre.substring(0, 40)}...` : item.nombre}</td>
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

export default ScreenerPanel; 