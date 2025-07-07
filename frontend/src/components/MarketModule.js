// frontend/src/components/MarketModule.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table } from './ui/Table';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { tokens } from '../styles/tokens';

function MarketModule() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [marketData, setMarketData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRange, setSelectedRange] = useState('1 mes');
  const [showScreener, setShowScreener] = useState(false);
  
  // Ref para el debounce timer
  const debounceTimer = useRef(null);

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
  const handleSearch = async (symbol = null) => {
    const searchTerm = symbol || searchSymbol;
    if (!searchTerm) return;

    setLoading(true);
    setError('');
    setSearchSuggestions([]);

    try {
      // Usar el endpoint completo que trae TODO
      const [fullData, historicalResponse] = await Promise.all([
        apiCall(`/api/market/full/${searchTerm.toUpperCase()}`),
        apiCall(`/api/market/history/${searchTerm.toUpperCase()}?days=${daysMap[selectedRange]}`)
      ]);

      // Logs removidos para evitar re-renders
      
      // Mapear datos correctamente desde el endpoint full
      const mappedData = {
        symbol: fullData.symbol,
        name: fullData.fundamentals?.name || fullData.symbol,
        price: fullData.price,
        change: fullData.change,
        change_percent: fullData.changePercent,
        volume: fullData.volume,
        open: fullData.open,
        high: fullData.high,
        low: fullData.low,
        market_cap: fullData.fundamentals?.marketCapRaw || null,
        pe_ratio: fullData.fundamentals?.peRatio || null,
        dataSource: fullData.fundamentals?.dataSource || 'alphavantage'
      };
      
      // Logs removidos para evitar re-renders
      
      updateMarketData(mappedData);
      
      // El backend devuelve directamente el array, no un objeto con propiedad historical
      setHistoricalData(Array.isArray(historicalResponse) ? historicalResponse : []);
    } catch (err) {
      setError(`Error al obtener datos de ${searchTerm}`);
      updateMarketData(null);
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar rango temporal
  const handleRangeChange = async (range) => {
    setSelectedRange(range);
    if (marketData && marketData.symbol) {
      // Solo mostrar loading si realmente vamos a hacer una llamada
      // No mostrar loading si ya tenemos los datos o si es el mismo rango
      if (range !== selectedRange) {
        setLoading(true);
        try {
          const response = await apiCall(
            `/api/market/history/${marketData.symbol}?days=${daysMap[range]}`
          );
          // El backend devuelve directamente el array
          setHistoricalData(Array.isArray(response) ? response : []);
        } catch (err) {
          console.error('Error fetching historical data:', err);
        } finally {
          setLoading(false);
        }
      }
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
      marginBottom: tokens.spacing[2]
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
      <Card style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <Input
              type="text"
              placeholder="Buscar símbolo (AAPL, MSFT, GOOGL)..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            
            {/* Suggestions Dropdown */}
            {searchSuggestions.length > 0 && (
              <div style={styles.suggestionsDropdown}>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    style={styles.suggestionItem}
                    onClick={() => {
                      setSearchSymbol(suggestion.symbol);
                      handleSearch(suggestion.symbol);
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
            <Button 
              onClick={() => handleSearch()} 
              disabled={loading || !searchSymbol}
            >
              BUSCAR
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={() => setShowScreener(!showScreener)}
            >
              SCREENER
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div style={styles.errorMessage}>{error}</div>
      )}

      {/* Market Data */}
      {marketData && !loading && (
        <>
          {/* Quote Section */}
          <Card variant="elevated" hoverable style={styles.quoteSection}>
            <div style={styles.quoteHeader}>
              <h3 style={styles.symbolName}>
                {marketData.symbol} - {marketData.name || marketData.symbol}
              </h3>
              
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
                <span style={styles.statLabel}>Cap. Mercado</span>
                <span style={styles.statValue}>
                  {(() => {
                    if (!marketData || marketData.market_cap === undefined || marketData.market_cap === null) {
                      return <span style={{ fontSize: '11px', opacity: 0.6 }}>N/A</span>;
                    }
                    if (marketData.market_cap === 0 && marketData.dataSource !== 'alphavantage') {
                      return <span style={{ fontSize: '11px', opacity: 0.6, color: '#FF8800' }}>Plan Pro</span>;
                    }
                    return formatNumber(marketData.market_cap);
                  })()}
                </span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>P/E Ratio</span>
                <span style={styles.statValue}>
                  {(() => {
                    if (!marketData || marketData.pe_ratio === undefined || marketData.pe_ratio === null) {
                      return <span style={{ fontSize: '11px', opacity: 0.6 }}>N/A</span>;
                    }
                    if (marketData.pe_ratio === 0 && marketData.dataSource !== 'alphavantage') {
                      return <span style={{ fontSize: '11px', opacity: 0.6, color: '#FF8800' }}>Plan Pro</span>;
                    }
                    return marketData.pe_ratio.toFixed(2);
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
          </Card>

          {/* Chart Section */}
          <Card variant="elevated" style={styles.chartSection}>
            <div style={styles.chartHeader}>
              <h4 style={styles.chartTitle}>Gráfico de Precios</h4>
              <div style={styles.rangeButtons}>
                {Object.keys(daysMap).map((range) => (
                  <Button
                    key={range}
                    size="sm"
                    variant={selectedRange === range ? 'primary' : 'ghost'}
                    onClick={() => handleRangeChange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>

            {/* Gráfico Recharts - MANTENIDO EXACTAMENTE */}
            <div style={styles.chartContainer}>
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#FF8800" />
                    <YAxis stroke="#FF8800" domain={['auto', 'auto']} />
                    <Tooltip
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
          </Card>

          {/* Technical Analysis Panel (placeholder) */}
          <Card>
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
          </Card>
        </>
      )}

      {/* Empty State */}
      {!marketData && !loading && !error && (
        <Card variant="neon" glowing>
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>
              Bienvenido al Terminal de Mercados
            </h3>
            <p style={styles.emptyText}>
              Busca cualquier símbolo para ver datos en tiempo real
            </p>
          </div>
        </Card>
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
}

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
      <Card style={screenerStyles}>
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
        <Button onClick={() => onSelectSymbol('AAPL')}>
          Seleccionar AAPL (Demo)
        </Button>
      </Card>
    </>
  );
}

export default MarketModule;
