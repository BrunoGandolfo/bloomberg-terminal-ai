// frontend/src/components/MarketModule.js
import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table } from './ui/Table';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { tokens } from '../styles/tokens';
import { useMarketData } from './market/hooks/useMarketData';
import { useSymbolSearch } from './market/hooks/useSymbolSearch';
import TechnicalAnalysisPanel from './market/components/TechnicalAnalysis';
import MarketChart from './market/components/MarketChart';
import ScreenerModal from './market/components/ScreenerModal';
import MarketQuote from './market/components/MarketQuote';

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
          {/* Quote Section - usando el nuevo componente */}
          <MarketQuote marketData={marketData} />

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
        <ScreenerModal onSelectSymbol={handleSelectSymbolFromScreener} />
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





export default MarketModule;
