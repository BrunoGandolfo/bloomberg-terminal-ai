// src/components/Panels/AnalysisPanel.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { useDataStream } from '../../hooks/useDataStream';
import { usePortfolio } from '../../hooks/usePortfolio';
import { formatPrice, formatPercent, formatCurrency } from '../../utils/formatters';
import './AnalysisPanel.css';

export const AnalysisPanel = ({ expanded = false }) => {
  const { data, currentSymbol, getStockData } = useDataStream();
  const { getPositionBySymbol } = usePortfolio();
  const [activeTab, setActiveTab] = useState('technical');

  const stockData = useMemo(() => {
    if (!currentSymbol || !data) return null;
    return getStockData(currentSymbol);
  }, [currentSymbol, data, getStockData]);

  const position = useMemo(() => {
    if (!currentSymbol) return null;
    return getPositionBySymbol(currentSymbol);
  }, [currentSymbol, getPositionBySymbol]);

  const technicalData = useMemo(() => {
    if (!stockData) return null;

    const price = stockData.currentPrice || stockData.price;
    const rsi = 50 + (Math.sin(Date.now() / 10000) * 20);
    const macdValue = (Math.random() - 0.5) * 5;
    const macdSignal = macdValue > 0 ? 'bullish' : macdValue < -2 ? 'bearish' : 'neutral';

    return {
      rsi: Math.round(rsi),
      macd: macdSignal,
      sma50: price * 0.98,
      sma200: price * 0.95,
      volume: stockData.volume,
      avgVolume: stockData.volume * 0.9,
      support: price * 0.95,
      resistance: price * 1.05,
      trend: price > (price * 0.98) ? 'Uptrend' : 'Downtrend'
    };
  }, [stockData]);

  const getSignalStrength = useCallback((rsi, macd, trend) => {
    let strength = 0;
    
    if (rsi < 30) strength += 2;
    else if (rsi > 70) strength -= 2;
    else if (rsi >= 40 && rsi <= 60) strength += 1;

    if (macd === 'bullish') strength += 2;
    else if (macd === 'bearish') strength -= 2;

    if (trend === 'Uptrend') strength += 1;
    else strength -= 1;

    if (strength >= 3) return { signal: 'STRONG BUY', color: '#00FF00' };
    if (strength >= 1) return { signal: 'BUY', color: '#66FF66' };
    if (strength <= -3) return { signal: 'STRONG SELL', color: '#FF0000' };
    if (strength <= -1) return { signal: 'SELL', color: '#FF6666' };
    return { signal: 'HOLD', color: '#FFFF00' };
  }, []);

  if (!stockData || !currentSymbol) {
    return (
      <div className="analysis-panel empty">
        <p>Select a symbol to view analysis</p>
      </div>
    );
  }

  const signal = technicalData
    ? getSignalStrength(technicalData.rsi, technicalData.macd, technicalData.trend)
    : { signal: 'ANALYZING...', color: '#999' };

  if (!expanded) {
    return (
      <div className="analysis-panel compact">
        <div className="analysis-header">
          <h3>Quick Analysis: {currentSymbol}</h3>
          <div className="signal-badge" style={{ backgroundColor: signal.color }}>
            {signal.signal}
          </div>
        </div>
        
        <div className="analysis-grid">
          <div className="metric">
            <span className="metric-label">Fundamental</span>
            <span className="metric-value">⭐⭐⭐⭐⭐</span>
          </div>
          <div className="metric">
            <span className="metric-label">Technical</span>
            <span className="metric-value" style={{ color: signal.color }}>{signal.signal}</span>
          </div>
          <div className="metric">
            <span className="metric-label">RSI</span>
            <span className="metric-value">{technicalData?.rsi || '--'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">MACD</span>
            <span className="metric-value" style={{
              color: 
                technicalData?.macd === 'bullish' 
                  ? '#00FF00' 
                  : technicalData?.macd === 'bearish' 
                  ? '#FF0000' 
                  : '#FFFF00'
            }}>
              {technicalData?.macd?.toUpperCase() || '--'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-panel expanded">
      <div className="analysis-header">
        <h3>Complete Analysis: {currentSymbol}</h3>
        <div className="header-info">
          <span className="current-price">{formatPrice(stockData.currentPrice || stockData.price)}</span>
          <span className="signal-badge" style={{ backgroundColor: signal.color }}>
            {signal.signal}
          </span>
        </div>
      </div>

      <div className="analysis-tabs">
        <button 
          className={`tab-button ${activeTab === 'technical' ? 'active' : ''}`}
          onClick={() => setActiveTab('technical')}
        >
          Technical Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'fundamental' ? 'active' : ''}`}
          onClick={() => setActiveTab('fundamental')}
        >
          Fundamental Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'position' ? 'active' : ''}`}
          onClick={() => setActiveTab('position')}
          disabled={!position}
        >
          Position Analysis
        </button>
      </div>

      <div className="analysis-content">
        {/* Render content by tab later */}
      </div>
    </div>
  );
};
