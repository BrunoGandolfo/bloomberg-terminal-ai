import React from 'react';
import { useFundamentalsData } from './fundamental/hooks/useFundamentalsData';
import TickerSearchInput from './TickerSearchInput';
import BuffettScorePanel from './fundamental/components/BuffettScorePanel';
import StrengthsWeaknesses from './fundamental/components/StrengthsWeaknesses';
import { styles, animationStyles } from './fundamental/utils/fundamentalStyles';
import { formatValue } from './fundamental/utils/fundamentalFormatters';

function FundamentalAnalysisModuleRefactored() {
  const {
    symbol,
    fundamentals,
    loading,
    error,
    comparisonMode,
    comparisonSymbols,
    comparisonData,
    newComparisonSymbol,
    loadingComparison,
    setSymbol,
    setError,
    setComparisonMode,
    setNewComparisonSymbol,
    analyzeFundamentals,
    addToComparison,
    removeFromComparison
  } = useFundamentalsData('AAPL');

  // Inject animation styles
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = animationStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    analyzeFundamentals();
  };

  const handleComparisonSubmit = (e) => {
    e.preventDefault();
    addToComparison();
  };

  return (
    <div style={styles.terminal}>
      <style>{animationStyles}</style>
      
      {/* Header con búsqueda */}
      <div style={styles.panel}>
        <h2 style={{ color: '#FF8800', marginBottom: '20px', fontSize: '24px' }}>
          ANÁLISIS FUNDAMENTAL - WARREN BUFFETT
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <TickerSearchInput 
            value={symbol}
            onChange={setSymbol}
            onSelect={(selectedSymbol) => {
              setSymbol(selectedSymbol);
              analyzeFundamentals(selectedSymbol);
            }}
            placeholder="Buscar símbolo..."
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'ANALIZANDO...' : 'ANALIZAR'}
          </button>
        </form>

        {error && (
          <div style={{ color: '#FF0000', marginTop: '10px', fontSize: '12px' }}>
            {error}
          </div>
        )}
      </div>

      {/* Modo comparación */}
      <div style={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontSize: '14px' }}>MODO COMPARACIÓN</span>
          </label>
          
          {comparisonMode && (
            <form onSubmit={handleComparisonSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newComparisonSymbol}
                onChange={(e) => setNewComparisonSymbol(e.target.value)}
                placeholder="Agregar símbolo..."
                style={{ ...styles.input, width: '150px' }}
              />
              <button type="submit" style={{ ...styles.button, marginLeft: 0 }} disabled={loadingComparison}>
                {loadingComparison ? 'CARGANDO...' : 'AGREGAR'}
              </button>
            </form>
          )}
        </div>
        
        {comparisonMode && comparisonSymbols.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
              Comparando: {symbol && `${symbol} vs `}
              {comparisonSymbols.map((sym, idx) => (
                <span key={sym}>
                  {sym}
                  <button
                    onClick={() => removeFromComparison(sym)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FF0000',
                      cursor: 'pointer',
                      marginLeft: '5px',
                      fontSize: '12px'
                    }}
                  >
                    ✖
                  </button>
                  {idx < comparisonSymbols.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      {fundamentals && !comparisonMode && (
        <>
          {/* Panel de información básica */}
          <div style={styles.panel}>
            <h3 style={{ color: '#FF8800', marginBottom: '15px' }}>
              {fundamentals.companyInfo?.name || symbol} ({symbol})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#888' }}>SECTOR</div>
                <div style={{ fontSize: '14px', color: '#FFF' }}>
                  {formatValue(fundamentals.companyInfo?.sector)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#888' }}>INDUSTRIA</div>
                <div style={{ fontSize: '14px', color: '#FFF' }}>
                  {formatValue(fundamentals.companyInfo?.industry)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#888' }}>CAPITALIZACIÓN</div>
                <div style={{ fontSize: '14px', color: '#FFF' }}>
                  {formatValue(fundamentals.companyInfo?.market_cap)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#888' }}>EMPLEADOS</div>
                <div style={{ fontSize: '14px', color: '#FFF' }}>
                  {formatValue(fundamentals.companyInfo?.employees)}
                </div>
              </div>
            </div>
            {fundamentals.companyInfo?.description && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>DESCRIPCIÓN</div>
                <div style={{ fontSize: '12px', color: '#CCC', marginTop: '5px', lineHeight: '1.5' }}>
                  {fundamentals.companyInfo.description}
                </div>
              </div>
            )}
          </div>

          {/* Score de Buffett */}
          <BuffettScorePanel fundamentals={fundamentals} />

          {/* Fortalezas y Debilidades */}
          <StrengthsWeaknesses fundamentals={fundamentals} />

          {/* Análisis detallado */}
          {fundamentals.perplexityAnalysis?.analysis && (
            <div style={styles.panel}>
              <h3 style={{ color: '#FF8800', marginBottom: '15px' }}>ANÁLISIS DETALLADO</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '12px', color: '#CCC' }}>
                {fundamentals.perplexityAnalysis.analysis}
              </div>
            </div>
          )}

          {/* Conclusión */}
          {fundamentals.perplexityAnalysis?.investment_thesis && (
            <div style={{ ...styles.panel, ...styles.neonBorder }}>
              <h3 style={{ color: '#FFFF00', marginBottom: '15px' }}>TESIS DE INVERSIÓN</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#FFF' }}>
                {fundamentals.perplexityAnalysis.investment_thesis}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modo comparación - tabla */}
      {comparisonMode && comparisonSymbols.length > 0 && (
        <div style={styles.panel}>
          <h3 style={{ color: '#FF8800', marginBottom: '20px' }}>COMPARACIÓN DE EMPRESAS</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.comparisonTable}>
              <thead>
                <tr style={styles.comparisonHeader}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#FF8800' }}>MÉTRICA</th>
                  {symbol && fundamentals && (
                    <th style={{ padding: '10px', textAlign: 'center', color: '#FFF' }}>{symbol}</th>
                  )}
                  {comparisonSymbols.map(sym => (
                    <th key={sym} style={{ padding: '10px', textAlign: 'center', color: '#FFF' }}>{sym}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', color: '#888' }}>Warren Buffett Score</td>
                  {symbol && fundamentals && (
                    <td style={{ padding: '10px', textAlign: 'center', color: '#FF8800', fontWeight: 'bold' }}>
                      {fundamentals.perplexityAnalysis?.buffett_score || '-'}
                    </td>
                  )}
                  {comparisonSymbols.map(sym => (
                    <td key={sym} style={{ padding: '10px', textAlign: 'center', color: '#FF8800', fontWeight: 'bold' }}>
                      {comparisonData[sym]?.perplexityAnalysis?.buffett_score || '-'}
                    </td>
                  ))}
                </tr>
                {/* Agregar más filas para otras métricas */}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default FundamentalAnalysisModuleRefactored; 