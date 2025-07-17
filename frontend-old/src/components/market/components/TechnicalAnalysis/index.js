import React, { useState, useEffect, useCallback } from 'react';
import { marketApi } from '../../services/marketApiService';
import {
  getSignalColor,
  getSignalColorForSummary,
  getRecommendationColor,
  getConfidenceColor,
  formatValue
} from '../../utils/dataFormatters';

// Componente de Análisis Técnico
const TechnicalAnalysisPanel = ({ symbol, currentPrice, colors, typography, tokens }) => {
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTechnicalIndicators = useCallback(async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await marketApi.getTechnicalIndicators(
        symbol,
        ['rsi', 'macd', 'sma', 'ema'],
        currentPrice
      );
      setIndicators(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching technical indicators:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, currentPrice]);

  useEffect(() => {
    if (symbol) {
      fetchTechnicalIndicators();
    }
  }, [symbol, fetchTechnicalIndicators]);

  const panelStyle = {
    border: '1px solid #333333',
    padding: '15px',
    backgroundColor: '#0a0a0a',
    borderRadius: '4px',
    marginTop: '15px'
  };

  const indicatorBoxStyle = {
    border: '1px solid #333333',
    padding: '12px',
    backgroundColor: '#000000',
    borderRadius: '4px',
    marginBottom: '10px'
  };

  const titleStyle = {
    color: colors.primary.orange || '#FF8800',
    marginBottom: tokens?.spacing?.[3] || '12px',
    fontSize: typography?.fontSize?.xl || '20px'
  };

  const indicatorNameStyle = {
    color: '#FF8800',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '4px',
    fontFamily: 'monospace'
  };

  const valueStyle = {
    color: colors.neutral?.textLight || '#CCCCCC',
    fontSize: '16px',
    fontFamily: 'monospace'
  };

  const interpretationStyle = {
    fontSize: '12px',
    marginTop: '4px'
  };

  if (!symbol) {
    return (
      <div style={panelStyle}>
        <h4 style={titleStyle}>Análisis Técnico</h4>
        <p style={{ color: '#888888' }}>
          Seleccione un símbolo para ver los indicadores técnicos
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <h4 style={titleStyle}>Análisis Técnico - {symbol}</h4>
      
      {loading && (
        <p style={{ color: '#888888' }}>Cargando indicadores técnicos...</p>
      )}
      
      {error && (
        <p style={{ color: '#FF0000' }}>Error: {error}</p>
      )}
      
      {indicators && !loading && (
        <div>
          {/* Executive Summary */}
          {indicators.executiveSummary && (
            <div style={{
              border: '2px solid #FF8800',
              padding: '15px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#FF8800',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center'
              }}>
                📊 SÍNTESIS EJECUTIVA
                <div style={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: '#FF8800',
                  marginLeft: '10px'
                }}></div>
              </div>
              
              <div style={{
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ color: '#888888', fontSize: '14px' }}>Señal:</span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: getSignalColorForSummary(indicators.executiveSummary.signal)
                }}>
                  {indicators.executiveSummary.signal}
                </span>
              </div>
              
              <div style={{
                color: '#CCCCCC',
                fontSize: '14px',
                lineHeight: '1.5',
                marginBottom: '12px',
                fontStyle: 'italic'
              }}>
                "{indicators.executiveSummary.summary}"
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #333333',
                paddingTop: '10px'
              }}>
                <div>
                  <span style={{ color: '#888888', fontSize: '12px' }}>Recomendación: </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: getRecommendationColor(indicators.executiveSummary.recommendation)
                  }}>
                    {indicators.executiveSummary.recommendation}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#888888', fontSize: '12px' }}>Confianza: </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: getConfidenceColor(indicators.executiveSummary.confidence)
                  }}>
                    {indicators.executiveSummary.confidence}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* RSI */}
          {indicators.indicators && indicators.indicators.rsi && (
            <div style={indicatorBoxStyle}>
              <div style={indicatorNameStyle}>RSI (14)</div>
              <div style={valueStyle}>
                {formatValue(indicators.indicators.rsi.latest?.rsi || indicators.indicators.rsi.latest)}
              </div>
              {indicators.indicators.rsi.interpretation && (
                <div style={{
                  ...interpretationStyle,
                  color: getSignalColor(indicators.indicators.rsi.interpretation.signal)
                }}>
                  {indicators.indicators.rsi.interpretation.message}
                </div>
              )}
            </div>
          )}
          
          {/* MACD */}
          {indicators.indicators && indicators.indicators.macd && (
            <div style={indicatorBoxStyle}>
              <div style={indicatorNameStyle}>MACD (12, 26, 9)</div>
              <div style={valueStyle}>
                MACD: {formatValue(indicators.indicators.macd.latest?.macd || indicators.indicators.macd.latest?.MACD)} | 
                Señal: {formatValue(indicators.indicators.macd.latest?.signal || indicators.indicators.macd.latest?.MACD_Signal)} | 
                Histograma: {formatValue(indicators.indicators.macd.latest?.histogram || indicators.indicators.macd.latest?.MACD_Hist)}
              </div>
              {indicators.indicators.macd.interpretation && (
                <div style={{
                  ...interpretationStyle,
                  color: getSignalColor(indicators.indicators.macd.interpretation.signal)
                }}>
                  {indicators.indicators.macd.interpretation.message}
                </div>
              )}
            </div>
          )}
          
          {/* SMA */}
          {indicators.indicators && indicators.indicators.sma && (
            <div style={indicatorBoxStyle}>
              <div style={indicatorNameStyle}>SMA (50)</div>
              <div style={valueStyle}>
                {formatValue(indicators.indicators.sma.latest?.sma || indicators.indicators.sma.latest)}
              </div>
              {currentPrice && indicators.indicators.sma.latest && (
                <div style={{
                  ...interpretationStyle,
                  color: currentPrice > (indicators.indicators.sma.latest?.sma || indicators.indicators.sma.latest) ? '#00FF00' : '#FF0000'
                }}>
                  Precio {currentPrice > (indicators.indicators.sma.latest?.sma || indicators.indicators.sma.latest) ? 'sobre' : 'bajo'} SMA50: 
                  Tendencia {currentPrice > (indicators.indicators.sma.latest?.sma || indicators.indicators.sma.latest) ? 'alcista' : 'bajista'} de mediano plazo
                </div>
              )}
            </div>
          )}
          
          {/* EMA */}
          {indicators.indicators && indicators.indicators.ema && (
            <div style={indicatorBoxStyle}>
              <div style={indicatorNameStyle}>EMA (20)</div>
              <div style={valueStyle}>
                {formatValue(indicators.indicators.ema.latest?.ema || indicators.indicators.ema.latest)}
              </div>
              {currentPrice && indicators.indicators.ema.latest && (
                <div style={{
                  ...interpretationStyle,
                  color: currentPrice > (indicators.indicators.ema.latest?.ema || indicators.indicators.ema.latest) ? '#00FF00' : '#FF0000'
                }}>
                  Precio {currentPrice > (indicators.indicators.ema.latest?.ema || indicators.indicators.ema.latest) ? 'sobre' : 'bajo'} EMA20: 
                  Momentum {currentPrice > (indicators.indicators.ema.latest?.ema || indicators.indicators.ema.latest) ? 'positivo' : 'negativo'} de corto plazo
                </div>
              )}
            </div>
          )}
          
          <div style={{ 
            marginTop: '12px', 
            fontSize: '11px', 
            color: '#666666',
            borderTop: '1px solid #333333',
            paddingTop: '8px'
          }}>
            Última actualización: {new Date(indicators.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalAnalysisPanel; 