// frontend/src/components/MarketModule.js
import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table } from './ui/Table';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { tokens } from '../styles/tokens';
import CompanyLogo from './CompanyLogo';

const MarketModule = forwardRef((props, ref) => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [marketData, setMarketData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [fullHistoricalData, setFullHistoricalData] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRange, setSelectedRange] = useState('1 mes');
  const [showScreener, setShowScreener] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonLines, setComparisonLines] = useState({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(null); // 'start' o 'end'
  
  // Ref para el debounce timer
  const debounceTimer = useRef(null);
  // Ref para el contenedor del gráfico
  const chartContainerRef = useRef(null);

  const daysMap = {
    '1 día': 1,
    '5 días': 5,
    '1 mes': 30,
    '3 meses': 90,
    '6 meses': 180,
    '1 año': 365,
    '5 años': 1825
  };

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('API call failed:', err);
      throw err;
    }
  };

  // Buscar sugerencias de ticker
  const searchTicker = async (query) => {
    if (query.length < 1) {
      setSearchSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await apiCall(`/api/search/ticker?q=${encodeURIComponent(query)}`);
      setSearchSuggestions(data.slice(0, 10));
    } catch (err) {
      console.error('Error searching ticker:', err);
      setSearchSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    // Cancelar búsqueda anterior si existe
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Si no hay símbolo, limpiar sugerencias
    if (!searchSymbol) {
      setSearchSuggestions([]);
      return;
    }
    
    // Configurar nuevo timer
    debounceTimer.current = setTimeout(() => {
      searchTicker(searchSymbol);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchSymbol]);

  // Buscar datos del símbolo
  const handleSearch = async (symbol = null, name = null) => {
    const searchTerm = symbol || searchSymbol;
    if (!searchTerm) return;

    setIsDropdownVisible(false);
    setLoading(true);
    setError('');

    try {
      // Usar el endpoint completo que trae TODO
      const [fullData, historicalResponse] = await Promise.all([
        apiCall(`/api/market/full/${searchTerm.toUpperCase()}`),
        apiCall(`/api/market/history/${searchTerm.toUpperCase()}?days=1825`)
      ]);

      // Lógica robusta para obtener el nombre de la compañía
      let finalName = name || fullData.fundamentals?.name;
      if (!finalName || finalName.toUpperCase() === fullData.symbol.toUpperCase()) {
        try {
          const searchResults = await apiCall(`/api/search/ticker?q=${encodeURIComponent(searchTerm)}`);
          const bestMatch = searchResults?.find(r => r.symbol.toUpperCase() === searchTerm.toUpperCase());
          if (bestMatch?.name) {
            finalName = bestMatch.name;
          }
        } catch (searchError) {
          console.error("Error fetching company name as a fallback:", searchError);
        }
      }
      
      // Mapear datos correctamente desde el endpoint full
      const mappedData = {
        symbol: fullData.symbol,
        name: finalName || fullData.symbol, // Fallback final al símbolo
        price: fullData.price,
        change: fullData.change,
        change_percent: fullData.changePercent,
        volume: fullData.volume,
        open: fullData.open,
        high: fullData.high,
        low: fullData.low,
        marketCap: fullData.marketCap || fullData.fundamentals?.marketCapRaw || null,
        trailingPE: fullData.trailingPE || fullData.fundamentals?.peRatio || null,
        market_cap: fullData.fundamentals?.marketCapRaw || null,
        pe_ratio: fullData.fundamentals?.peRatio || null,
        dataSource: fullData.fundamentals?.dataSource || 'yahoo'
      };
      
      updateMarketData(mappedData);
      
      const fullData5Years = (Array.isArray(historicalResponse) ? historicalResponse : []).reverse();
      setFullHistoricalData(fullData5Years);
      
      const daysToShow = daysMap[selectedRange];
      const filteredData = fullData5Years.slice(-daysToShow);
      setHistoricalData(filteredData);
    } catch (err) {
      setError(`Error al obtener datos de ${searchTerm}`);
      updateMarketData(null);
      setHistoricalData([]);
      setFullHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar rango temporal
  const handleRangeChange = (range) => {
    setSelectedRange(range);
    if (fullHistoricalData.length > 0) {
      // Filtrar los datos existentes para obtener los últimos N días
      const daysToShow = daysMap[range];
      const filteredData = fullHistoricalData.slice(-daysToShow);
      setHistoricalData(filteredData);
    }
  };

  // Seleccionar símbolo del screener
  const handleSelectSymbolFromScreener = useCallback((selectedSymbol) => {
    setSearchSymbol(selectedSymbol.toUpperCase());
    handleSearch(selectedSymbol.toUpperCase());
    setShowScreener(false);
  }, []);

  // Helpers de formato
  const getPriceColor = (change) => {
    return change >= 0 ? '#00FF00' : '#FF0000';
  };

  // Memoizar la función formatNumber para evitar recrearla
  const formatNumber = useCallback((num) => {
    if (!num || num === 0) return '--';
    
    const absNum = Math.abs(num);
    if (absNum >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (absNum >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (absNum >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (absNum >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    
    return num.toFixed(2);
  }, []);

  const formatPercent = (num) => {
    return `${num >= 0 ? '+' : ''}${num?.toFixed(2) || '0.00'}%`;
  };

  // Función para manejar clicks en el gráfico
  const handleChartClick = (event) => {
    if (!comparisonMode || !historicalData.length) return;
    
    // Debug logs para entender el evento
    console.log('Evento completo:', event);
    console.log('ActiveTooltipIndex:', event.activeTooltipIndex);
    console.log('ActiveLabel:', event.activeLabel);
    
    let index = null;
    
    // Si Recharts provee activeTooltipIndex, úsalo
    if (event.activeTooltipIndex !== undefined) {
      index = event.activeTooltipIndex;
      console.log('Click detectado con índice:', index);
    } else if (event.activePayload && event.activePayload.length > 0) {
      // Buscar el índice basado en los datos
      const clickedDate = event.activeLabel;
      index = historicalData.findIndex(item => item.date === clickedDate);
      console.log('Click detectado con fecha:', clickedDate, 'índice:', index);
    }
    
    // Si no pudimos obtener un índice válido, salir
    if (index === null || index === -1) {
      console.log('No se pudo determinar el índice del click');
      return;
    }
    
    // Debug log del estado actual
    console.log('Click detectado:', { comparisonLines, index });
    
    if (!comparisonLines.start) {
      // Establecer línea de inicio
      setComparisonLines({ start: index, end: null });
    } else if (!comparisonLines.end) {
      // Establecer línea de fin
      setComparisonLines(prev => ({ ...prev, end: index }));
    } else {
      // Resetear a nueva posición de inicio
      setComparisonLines({ start: index, end: null });
    }
  };

  // Función para manejar el arrastre de líneas
  const handleMouseMove = (event) => {
    if (!isDragging || !comparisonMode || !historicalData.length) return;
    
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = event.clientX - rect.left;
    const chartWidth = rect.width;
    const mouseRatio = mouseX / chartWidth;
    const dataIndex = Math.round(mouseRatio * (historicalData.length - 1));
    const clampedIndex = Math.max(0, Math.min(dataIndex, historicalData.length - 1));
    
    setComparisonLines(prev => ({
      ...prev,
      [isDragging]: clampedIndex
    }));
  };

  // Calcular porcentaje de cambio entre líneas
  const calculateComparison = () => {
    if (!comparisonLines.start || !comparisonLines.end || !historicalData.length) return null;
    
    const startPrice = historicalData[comparisonLines.start]?.close;
    const endPrice = historicalData[comparisonLines.end]?.close;
    const startDate = historicalData[comparisonLines.start]?.date;
    const endDate = historicalData[comparisonLines.end]?.date;
    
    if (!startPrice || !endPrice) return null;
    
    const changePercent = ((endPrice - startPrice) / startPrice) * 100;
    const changeAmount = endPrice - startPrice;
    
    return {
      startPrice,
      endPrice,
      startDate,
      endDate,
      changePercent,
      changeAmount
    };
  };

  // Función updateMarketData mejorada para evitar actualizaciones innecesarias
  const updateMarketData = useCallback((data) => {
    if (!data) return;
    
    // Solo actualizar si hay cambios reales
    setMarketData(prevData => {
      // Si no hay datos previos, actualizar
      if (!prevData || !prevData.symbol) return data;
      
      // Si es el mismo símbolo y los mismos valores clave, no actualizar
      if (prevData.symbol === data.symbol && 
          prevData.price === data.price &&
          prevData.market_cap === data.market_cap &&
          prevData.pe_ratio === data.pe_ratio) {
        return prevData; // No cambiar el estado
      }
      
      return data; // Actualizar con nuevos datos
    });
  }, []);

  // Exponer función refreshData
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      if (marketData && marketData.symbol) {
        console.log('🔄 MarketModule: Actualizando datos para', marketData.symbol);
        setLoading(true);
        try {
          await handleSearch(marketData.symbol);
          console.log('✅ MarketModule: Datos actualizados');
        } catch (error) {
          console.error('❌ MarketModule: Error en actualización:', error);
        } finally {
          setLoading(false);
        }
      }
    }
  }));

  // Estilos
  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: tokens.spacing[5],
      backgroundColor: colors.primary.black,
      overflowY: 'auto',
      position: 'relative'
    },
    header: {
      marginBottom: tokens.spacing[4]
    },
    title: {
      fontSize: typography.fontSize['2xl'],
      color: colors.primary.orange,
      marginBottom: tokens.spacing[3],
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide
    },
    searchSection: {
      marginBottom: tokens.spacing[4],
      overflow: 'visible',
      position: 'relative'
    },
    searchContainer: {
      display: 'flex',
      gap: tokens.spacing[2],
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      position: 'relative',
      overflow: 'visible'
    },
    searchWrapper: {
      position: 'relative',
      flex: '0 0 200px',  // Aumentado de 150px a 200px
      maxWidth: '200px',   // Aumentado de 150px a 200px
      marginRight: '20px',
      zIndex: 1000,
      overflow: 'visible'
    },
    buttonGroup: {
      display: 'flex',
      gap: tokens.spacing[2]
    },
    suggestionsDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      width: '200px',  // Mismo ancho que el input (200px)
      minWidth: '200px',
      maxWidth: '200px',
      // Sin maxHeight ni scroll
      marginTop: '8px',
      backgroundColor: '#0a0a0a',
      border: '2px solid #ff6600',
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(255, 102, 0, 0.2)',
      zIndex: 99999,
      display: 'block'
    },
    suggestionItem: {
      padding: '6px 8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      borderBottom: '1px solid #222',
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ff6600',
      letterSpacing: '0.5px'
    },
    quoteSection: {
      marginBottom: tokens.spacing[4]
    },
    quoteHeader: {
      marginBottom: tokens.spacing[3]
    },
    symbolName: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.primary.orange,
      marginBottom: '5px',
      display: 'flex',
      alignItems: 'center'
    },
    companyName: {
      fontSize: typography.fontSize.lg,
      color: colors.neutral.textLight,
      marginTop: 0,
      marginLeft: '52px'
    },
    priceRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: tokens.spacing[3],
      marginBottom: tokens.spacing[3]
    },
    price: {
      fontSize: typography.fontSize['5xl'],
      fontWeight: typography.fontWeight.bold
    },
    change: {
      fontSize: typography.fontSize['2xl']
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: tokens.spacing[3]
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[1]
    },
    statLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.neutral.text,
      textTransform: 'uppercase'
    },
    statValue: {
      fontSize: typography.fontSize.lg,
      color: colors.neutral.textLight,
      fontWeight: typography.fontWeight.bold
    },
    chartSection: {
      marginBottom: tokens.spacing[4]
    },
    chartHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacing[3]
    },
    chartTitle: {
      fontSize: typography.fontSize.xl,
      color: colors.primary.orange
    },
    rangeButtons: {
      display: 'flex',
      gap: tokens.spacing[1]
    },
    chartContainer: {
      width: '100%',
      height: '400px',
      marginBottom: tokens.spacing[3]
    },
    chartInfo: {
      fontSize: typography.fontSize.sm,
      color: colors.neutral.text
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: tokens.zIndices.modal
    },
    loadingText: {
      color: colors.primary.orange,
      fontSize: typography.fontSize.lg,
      animation: 'pulse 1.5s infinite'
    },
    errorMessage: {
      padding: tokens.spacing[3],
      backgroundColor: `${colors.status.danger}20`,
      border: `1px solid ${colors.status.danger}`,
      borderRadius: tokens.radii.base,
      color: colors.status.danger,
      textAlign: 'center',
      marginBottom: tokens.spacing[3]
    },
    emptyState: {
      textAlign: 'center',
      padding: tokens.spacing[8],
      color: colors.neutral.text
    },
    emptyTitle: {
      fontSize: typography.fontSize['2xl'],
      color: colors.primary.orange,
      marginBottom: tokens.spacing[3]
    },
    emptyText: {
      fontSize: typography.fontSize.lg,
      color: colors.neutral.textLight
    }
  };

  return (
    <div style={styles.container}>
      {/* Loading Overlay */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingText}>Cargando datos del mercado...</div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Terminal de Mercados</h2>
      </div>

      {/* Search Section */}
      <div style={{ ...styles.searchSection, border: '1px solid #333333', padding: '15px', backgroundColor: '#0a0a0a', borderRadius: '4px' }}>
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <Input
              type="text"
              placeholder="Buscar símbolo (AAPL, MSFT, GOOGL)..."
              value={searchSymbol}
              onChange={(e) => {
                setSearchSymbol(e.target.value.toUpperCase());
                setIsDropdownVisible(true);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onBlur={() => setTimeout(() => setIsDropdownVisible(false), 200)}
            />
            
            {/* Suggestions Dropdown */}
            {searchSuggestions.length > 0 && isDropdownVisible && (
              <div style={styles.suggestionsDropdown}>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    style={styles.suggestionItem}
                    onClick={() => {
                      setSearchSymbol(suggestion.symbol);
                      handleSearch(suggestion.symbol, suggestion.name);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                      e.currentTarget.style.color = '#ffaa00';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#ff6600';
                    }}
                  >
                    <div>
                      <strong>{suggestion.symbol}</strong>
                    </div>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                      {suggestion.name.length > 30 ? suggestion.name.substring(0, 30) + '...' : suggestion.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={styles.buttonGroup}>
            <button 
              onClick={() => handleSearch()} 
              disabled={loading || !searchSymbol}
              style={{
                backgroundColor: '#FF8800',
                color: '#000',
                border: 'none',
                padding: '8px 20px',
                cursor: loading || !searchSymbol ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                minWidth: '100px',
                marginRight: '10px'
              }}
            >
              {loading ? '...' : 'BUSCAR'}
            </button>
            
            <button 
              onClick={() => setShowScreener(!showScreener)}
              style={{
                backgroundColor: '#FF8800',
                color: '#000',
                border: 'none',
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                minWidth: '100px',
                marginRight: '10px'
              }}
            >
              SCREENER
            </button>
            
            <button 
              onClick={() => {
                if (marketData && marketData.symbol) {
                  handleSearch(marketData.symbol);
                }
              }}
              disabled={loading || !marketData}
              style={{
                backgroundColor: '#FF8800',
                color: '#000',
                border: 'none',
                padding: '8px 20px',
                cursor: loading || !marketData ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                minWidth: '100px'
              }}
            >
              {loading ? '...' : '🔄 ACTUALIZAR'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorMessage}>{error}</div>
      )}

      {/* Market Data */}
      {marketData && !loading && (
        <>
          {/* Quote Section */}
          <div style={{ ...styles.quoteSection, border: '1px solid #333333', padding: '15px', backgroundColor: '#0a0a0a', borderRadius: '4px' }}>
            <div style={styles.quoteHeader}>
              <div>
                <h3 style={styles.symbolName}>
                  <CompanyLogo symbol={marketData.symbol} size={40} />
                  {marketData.symbol}
                </h3>
                <p style={styles.companyName}>{marketData.name || ''}</p>
              </div>
              
              <div style={styles.priceRow}>
                <span style={{
                  ...styles.price,
                  color: getPriceColor(marketData.change)
                }}>
                  ${marketData.price?.toFixed(2) || '0.00'}
                </span>
                
                <span style={{
                  ...styles.change,
                  color: getPriceColor(marketData.change)
                }}>
                  {marketData.change >= 0 ? '▲' : '▼'} {Math.abs(marketData.change)?.toFixed(2)} 
                  ({formatPercent(marketData.change_percent)})
                </span>
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Apertura</span>
                <span style={styles.statValue}>${marketData.open?.toFixed(2) || '-'}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Máximo</span>
                <span style={styles.statValue}>${marketData.high?.toFixed(2) || '-'}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Mínimo</span>
                <span style={styles.statValue}>${marketData.low?.toFixed(2) || '-'}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Volumen</span>
                <span style={styles.statValue}>{formatNumber(marketData.volume)}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>P/E Ratio</span>
                <span style={styles.statValue}>
                  {(() => {
                    // Formatear P/E usando la misma lógica que WatchlistModule
                    const formatPE = (pe) => {
                      if (!pe || pe === 0) return 'N/A';
                      return pe.toFixed(1);
                    };
                    
                    // Usar trailingPE directamente de stockData si está disponible
                    if (marketData.trailingPE) {
                      return formatPE(marketData.trailingPE);
                    }
                    // Fallback al campo antiguo pe_ratio para compatibilidad
                    if (marketData.pe_ratio) {
                      return formatPE(marketData.pe_ratio);
                    }
                    return 'N/A';
                  })()}
                </span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Market Cap</span>
                <span style={styles.statValue}>
                  {(() => {
                    // Formatear Market Cap usando la misma lógica que WatchlistModule
                    const formatMarketCap = (marketCap) => {
                      if (!marketCap || marketCap === 0) return 'N/A';
                      if (marketCap >= 1_000_000_000_000) return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
                      if (marketCap >= 1_000_000_000) return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
                      if (marketCap >= 1_000_000) return `$${(marketCap / 1_000_000).toFixed(2)}M`;
                      return `$${marketCap}`;
                    };
                    
                    // Usar marketCap directamente de stockData si está disponible
                    if (marketData.marketCap) {
                      return formatMarketCap(marketData.marketCap);
                    }
                    // Fallback al campo antiguo market_cap para compatibilidad
                    if (marketData.market_cap) {
                      return formatMarketCap(marketData.market_cap);
                    }
                    return 'N/A';
                  })()}
                </span>
              </div>

            </div>
            
            {/* Indicador de fuente de datos */}
            {marketData && marketData.dataSource && marketData.dataSource !== 'alphavantage' && (
              <div style={{
                fontSize: '10px',
                color: '#FF8800',
                opacity: 0.7,
                marginTop: '5px',
                textAlign: 'center'
              }}>
                Datos via {marketData.dataSource === 'perplexity' ? 'Perplexity AI' : marketData.dataSource}
              </div>
            )}
          </div>

          {/* Chart Section */}
          <div style={{ ...styles.chartSection, border: '1px solid #333333', padding: '15px', backgroundColor: '#0a0a0a', borderRadius: '4px' }}>
            <div style={{...styles.chartHeader, marginBottom: '20px'}}>
              <h4 style={styles.chartTitle}>Gráfico de Precios</h4>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setComparisonMode(!comparisonMode);
                    if (!comparisonMode) {
                      setComparisonLines({ start: null, end: null });
                      setIsDragging(null);
                    }
                  }}
                  style={{
                    backgroundColor: comparisonMode ? '#FF8800' : 'transparent',
                    color: comparisonMode ? '#000' : '#FF8800',
                    border: '1px solid #FF8800',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  Modo Comparación
                </button>
                <div style={{...styles.rangeButtons, gap: '15px'}}>
                  {Object.keys(daysMap).map((range) => (
                    <button
                      key={range}
                      onClick={() => handleRangeChange(range)}
                      style={{
                        backgroundColor: selectedRange === range ? '#FF8800' : 'transparent',
                        color: selectedRange === range ? '#000' : '#FF8800',
                        border: '1px solid #FF8800',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel de comparación */}
            {comparisonMode && calculateComparison() && (
              <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #FF8800',
                borderRadius: '4px',
                padding: tokens.spacing[3],
                marginBottom: tokens.spacing[3],
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: tokens.spacing[4] }}>
                  <div>
                    <span style={{ color: '#FFA500', fontSize: '12px', fontWeight: 'bold' }}>
                      INICIO: 
                    </span>
                    <span style={{ color: colors.neutral.textLight, marginLeft: '8px' }}>
                      ${calculateComparison().startPrice.toFixed(2)} ({calculateComparison().startDate})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#00BFFF', fontSize: '12px', fontWeight: 'bold' }}>
                      FIN: 
                    </span>
                    <span style={{ color: colors.neutral.textLight, marginLeft: '8px' }}>
                      ${calculateComparison().endPrice.toFixed(2)} ({calculateComparison().endDate})
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: calculateComparison().changePercent >= 0 ? '#00FF00' : '#FF0000',
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold
                  }}>
                    {calculateComparison().changePercent >= 0 ? '+' : ''}{calculateComparison().changePercent.toFixed(2)}%
                  </div>
                  <div style={{ 
                    color: calculateComparison().changeAmount >= 0 ? '#00FF00' : '#FF0000',
                    fontSize: typography.fontSize.sm
                  }}>
                    {calculateComparison().changeAmount >= 0 ? '+' : ''}${calculateComparison().changeAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Gráfico Recharts - MANTENIDO EXACTAMENTE */}
            <div style={styles.chartContainer} ref={chartContainerRef}>
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={historicalData}
                    onMouseDown={(e) => {
                      if (e && e.activeCoordinate) {
                        handleChartClick(e);
                      }
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => setIsDragging(null)}
                    onMouseLeave={() => setIsDragging(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#FF8800" />
                    <YAxis stroke="#FF8800" domain={['auto', 'auto']} />
                    <Tooltip
                      cursor={comparisonMode ? false : true}
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid #FF8800' 
                      }}
                      formatter={(value, name, props) => {
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
                    />
                    
                    {/* Líneas de comparación */}
                    {comparisonMode && comparisonLines.start !== null && (
                      <ReferenceLine 
                        x={historicalData[comparisonLines.start]?.date}
                        stroke="#FFA500"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.cursor = 'ew-resize';
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsDragging('start');
                        }}
                      />
                    )}
                    
                    {comparisonMode && comparisonLines.end !== null && (
                      <ReferenceLine 
                        x={historicalData[comparisonLines.end]?.date}
                        stroke="#00BFFF"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.cursor = 'ew-resize';
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsDragging('end');
                        }}
                      />
                    )}
                    
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#00FF00" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: colors.neutral.text 
                }}>
                  No hay datos históricos disponibles
                </div>
              )}
            </div>

            {historicalData.length > 0 && (
              <div style={styles.chartInfo}>
                <p>
                  Mostrando {historicalData.length} días de datos 
                  ({historicalData[0]?.date} - {historicalData[historicalData.length - 1]?.date})
                </p>
                <p>Fuente: Twelve Data | Última actualización: {new Date().toLocaleTimeString()}</p>
              </div>
            )}
          </div>

          {/* Technical Analysis Panel */}
          <div style={{ border: '1px solid #333333', padding: '15px', backgroundColor: '#0a0a0a', borderRadius: '4px', marginTop: '15px' }}>
            <h4 style={{ 
              color: colors.primary.orange, 
              marginBottom: tokens.spacing[3],
              fontSize: typography.fontSize.xl 
            }}>
              Análisis Técnico
            </h4>
            <p style={{ color: colors.neutral.text }}>
              Próximamente: Indicadores técnicos, patrones de velas y señales de trading.
            </p>
          </div>
        </>
      )}

      {/* Empty State */}
      {!marketData && !loading && !error && (
        <div style={{ border: '1px solid #333333', padding: '15px', backgroundColor: '#0a0a0a', borderRadius: '4px' }}>
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>
              Bienvenido al Terminal de Mercados
            </h3>
            <p style={styles.emptyText}>
              Busca cualquier símbolo para ver datos en tiempo real
            </p>
          </div>
        </div>
      )}

      {/* Screener Modal */}
      {showScreener && (
        <ScreenerPanel onSelectSymbol={handleSelectSymbolFromScreener} />
      )}
      
      {/* Animaciones CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
});

// Componente ScreenerPanel (placeholder temporal)
function ScreenerPanel({ onSelectSymbol }) {
  const screenerStyles = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '800px',
    maxHeight: '600px',
    backgroundColor: colors.neutral.background,
    border: `2px solid ${colors.primary.orange}`,
    borderRadius: tokens.radii.base,
    padding: tokens.spacing[5],
    overflowY: 'auto',
    zIndex: tokens.zIndices.modal,
    boxShadow: tokens.shadows.xl
  };

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: tokens.zIndices.modalBackdrop
  };

  return (
    <>
      <div style={overlayStyles} onClick={() => onSelectSymbol(null)} />
      <div style={screenerStyles}>
        <h3 style={{ 
          color: colors.primary.orange, 
          marginBottom: tokens.spacing[3],
          fontSize: typography.fontSize.xl 
        }}>
          Stock Screener
        </h3>
        <p style={{ color: colors.neutral.text, marginBottom: tokens.spacing[3] }}>
          (El screener completo se integrará próximamente)
        </p>
        <button onClick={() => onSelectSymbol('AAPL')} style={{backgroundColor: '#FF8800', color: '#000', border: 'none', padding: '8px 20px'}}>
          Seleccionar AAPL (Demo)
        </button>
      </div>
    </>
  );
}

export default MarketModule;
