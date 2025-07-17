// src/components/Layout/Ticker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { formatPrice, formatPercent, getPriceColor } from '../../utils/formatters';
import './Ticker.css';

export const Ticker = () => {
  const [tickerData] = useState([
    { symbol: 'SPX', name: 'S&P 500', price: 4502.88, change: 23.42, changePercent: 0.52 },
    { symbol: 'DJI', name: 'Dow Jones', price: 35061.55, change: 133.24, changePercent: 0.38 },
    { symbol: 'IXIC', name: 'NASDAQ', price: 14229.91, change: -42.68, changePercent: -0.30 },
    { symbol: 'RUT', name: 'Russell 2000', price: 1998.45, change: 12.34, changePercent: 0.62 },
    { symbol: 'VIX', name: 'Volatility', price: 13.25, change: -0.28, changePercent: -2.07 },
    { symbol: 'DXY', name: 'Dollar Index', price: 103.45, change: 0.22, changePercent: 0.21 },
    { symbol: 'GC=F', name: 'Gold', price: 2042.30, change: 8.40, changePercent: 0.41 },
    { symbol: 'CL=F', name: 'Crude Oil', price: 77.82, change: -0.94, changePercent: -1.19 },
    { symbol: 'BTC-USD', name: 'Bitcoin', price: 43256.78, change: 892.34, changePercent: 2.11 },
    { symbol: 'EUR/USD', name: 'Euro/Dollar', price: 1.0923, change: 0.0012, changePercent: 0.11 }
  ]);

  const tickerRef = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    const scrollTicker = () => {
      setOffset(prev => {
        const newOffset = prev - 1;
        const tickerWidth = ticker.scrollWidth / 2;
        
        if (Math.abs(newOffset) >= tickerWidth) {
          return 0;
        }
        
        return newOffset;
      });
    };

    const interval = setInterval(scrollTicker, 30);
    return () => clearInterval(interval);
  }, []);

  const renderTickerItem = (item, index) => {
    const color = getPriceColor(item.change);
    const arrow = item.change >= 0 ? '▲' : '▼';

    return (
      <div key={`${item.symbol}-${index}`} className="ticker-item">
        <span className="ticker-symbol">{item.symbol}</span>
        <span className="ticker-price">{formatPrice(item.price)}</span>
        <span className="ticker-change" style={{ color }}>
          {arrow} {formatPrice(Math.abs(item.change))} ({formatPercent(item.changePercent)})
        </span>
      </div>
    );
  };

  return (
    <div className="ticker-container">
      <div className="ticker-label">MARKETS</div>
      <div className="ticker-content">
        <div
          ref={tickerRef}
          className="ticker-scroll"
          style={{ transform: `translateX(${offset}px)` }}
        >
          {tickerData.map((item, index) => renderTickerItem(item, index))}
          {tickerData.map((item, index) => renderTickerItem(item, `dup-${index}`))}
        </div>
      </div>
      <div className="ticker-timestamp">
        Last Update: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};
