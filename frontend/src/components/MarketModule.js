// frontend/src/components/MarketModule.js
import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table } from './ui/Table';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { tokens } from '../styles/tokens';
import CompanyLogo from './CompanyLogo';
import { 
  getPriceColor, 
  formatNumber, 
  formatPercent, 
  formatPE, 
  formatMarketCap
} from './market/utils/dataFormatters';
import { useMarketData } from './market/hooks/useMarketData';
import { useSymbolSearch } from './market/hooks/useSymbolSearch';
import TechnicalAnalysisPanel from './market/components/TechnicalAnalysis';
import MarketChart from './market/components/MarketChart';

const MarketModule = forwardRef((props, ref) => {
  // Custom hook para manejo de datos de mercado
  const {
    currentSymbol,
    marketData,
    historicalData,
    selectedRange,
    loading,
    error,
    loadSymbol,
    updateRange,
    refreshData,
    daysMap
  } = useMarketData();

  // Buscar datos del símbolo (wrapper para mantener compatibilidad)
  const handleSearch = async (symbol = null, name = null) => {
    const searchTerm = symbol || searchValue;
    if (!searchTerm) return;
    
    setIsDropdownVisible(false);
    await loadSymbol(searchTerm, name);
  };

  // Custom hook para búsqueda de símbolos
  const {
    searchValue,
    suggestions,
    isDropdownVisible,
    selectedSuggestionIndex,
    isSearching,
    handleSearchChange,
    handleKeyDown,
    selectSymbol,
    clearSearch,
    closeDropdownWithDelay,
    setIsDropdownVisible
  } = useSymbolSearch(handleSearch);

  // Estados locales para UI
  const [showScreener, setShowScreener] = useState(false);



  // Wrapper para handleRangeChange
  const handleRangeChange = (range) => {
    updateRange(range);
  };

  // Seleccionar símbolo del screener
  const handleSelectSymbolFromScreener = useCallback((selectedSymbol) => {
    selectSymbol(selectedSymbol.toUpperCase());
    setShowScreener(false);
  }, [selectSymbol]);

  // Exponer función refreshData
  useImperativeHandle(ref, () => ({
    refreshData: refreshData
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
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
              onBlur={closeDropdownWithDelay}
            />
            
            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && isDropdownVisible && (
              <div style={styles.suggestionsDropdown}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.suggestionItem,
                      backgroundColor: index === selectedSuggestionIndex ? '#1a1a1a' : 'transparent',
                      color: index === selectedSuggestionIndex ? '#ffaa00' : '#ff6600'
                    }}
                    onClick={() => selectSymbol(suggestion.symbol, suggestion.name)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                      e.currentTarget.style.color = '#ffaa00';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index === selectedSuggestionIndex ? '#1a1a1a' : 'transparent';
                      e.currentTarget.style.color = index === selectedSuggestionIndex ? '#ffaa00' : '#ff6600';
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
              onClick={() => selectSymbol(searchValue)} 
              disabled={loading || !searchValue}
              style={{
                backgroundColor: '#FF8800',
                color: '#000',
                border: 'none',
                padding: '8px 20px',
                cursor: loading || !searchValue ? 'not-allowed' : 'pointer',
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
                  loadSymbol(marketData.symbol);
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
                    // Usar trailingPE directamente de stockData si está disponible
                    if (marketData.trailingPE) {
                      return formatPE(marketData.trailingPE);
                    }
                    // Fallback al campo antiguo pe_ratio para compatibilidad
                    if (marketData.pe_ratio) {
                      return formatPE(marketData.pe_ratio);
                    }
                    return '-';
                  })()}
                </span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Market Cap</span>
                <span style={styles.statValue}>
                  {(() => {
                    // Usar marketCap directamente de stockData si está disponible
                    if (marketData.marketCap) {
                      return formatMarketCap(marketData.marketCap);
                    }
                    // Fallback al campo antiguo market_cap para compatibilidad
                    if (marketData.market_cap) {
                      return formatMarketCap(marketData.market_cap);
                    }
                    return '-';
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

          {/* Chart Section - usando el nuevo componente */}
          <MarketChart
            historicalData={historicalData}
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
            currentSymbol={currentSymbol}
            marketData={marketData}
            daysMap={daysMap}
          />

          {/* Technical Analysis Panel */}
          <TechnicalAnalysisPanel 
            symbol={marketData?.symbol} 
            currentPrice={marketData?.price}
            colors={colors}
            typography={typography}
            tokens={tokens}
          />
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
