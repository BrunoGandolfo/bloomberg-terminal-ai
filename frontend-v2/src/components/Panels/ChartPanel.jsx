// src/components/Panels/ChartPanel.jsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useDataStream } from '../../hooks/useDataStream';
import {
  formatPrice,
  formatTime,
  formatVolume,
  getPriceColor,
} from '../../utils/formatters';
import { CHART_RANGES } from '../../utils/constants';
import './ChartPanel.css';

export const ChartPanel = () => {
  const { data } = useDataStream();
  const [timeRange, setTimeRange] = useState('1D');
  const [showVolume, setShowVolume] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const currentStock = useMemo(() => {
    if (!data) return null;
    const symbol = data.currentSymbol;
    return data.portfolio[symbol] || data.watchlist[symbol];
  }, [data]);

  const chartData = useMemo(() => {
    return data?.chartData || [];
  }, [data]);

  const priceRange = useMemo(() => {
    if (!chartData.length) return { min: 0, max: 0 };
    
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    
    return {
      min: min - padding,
      max: max + padding,
    };
  }, [chartData]);

  const averagePrice = useMemo(() => {
    if (!chartData.length) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.price, 0);
    return sum / chartData.length;
  }, [chartData]);

  const CustomTooltip = useCallback(
    ({ active, payload }) => {
      if (!active || !payload || !payload.length) return null;

      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <div className="tooltip-time">{formatTime(data.time)}</div>
          <div className="tooltip-price">{formatPrice(data.price)}</div>
          {showVolume && (
            <div className="tooltip-volume">Vol: {formatVolume(data.volume)}</div>
          )}
        </div>
      );
    },
    [showVolume]
  );

  const formatYAxis = useCallback(value => formatPrice(value, 0), []);

  const formatXAxis = useCallback(timestamp => {
    const date = new Date(timestamp);
    const minutes = date.getMinutes();
    
    if (minutes === 0 || minutes === 30) {
      return formatTime(timestamp);
    }
    return '';
  }, []);

  if (!data || !currentStock) {
    return (
      <div className="chart-panel loading">
        <div className="loading-message">Loading chart data...</div>
      </div>
    );
  }

  const currentPrice = currentStock.currentPrice || currentStock.price;
  const priceChange = currentStock.change;
  const priceChangePercent = currentStock.changePercent;
  const priceColor = getPriceColor(priceChange);

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div className="chart-info">
          <div className="chart-symbol">{data.currentSymbol}</div>
          <div className="chart-price-info">
            <span className="current-price">{formatPrice(currentPrice)}</span>
            <span className="price-change" style={{ color: priceColor }}>
              {priceChange >= 0 ? '+' : ''}
              {formatPrice(priceChange)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="chart-controls">
          <div className="time-range-selector">
            {Object.keys(CHART_RANGES).map(range => (
              <button
                key={range}
                className={`range-button ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          
          <div className="chart-options">
            <button
              className={`option-button ${showGrid ? 'active' : ''}`}
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid"
            >
              ⊞
            </button>
            <button
              className={`option-button ${showVolume ? 'active' : ''}`}
              onClick={() => setShowVolume(!showVolume)}
              title="Toggle Volume"
            >
              ▮
            </button>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            )}
            <XAxis
              dataKey="time"
              tickFormatter={formatXAxis}
              stroke="#666"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[priceRange.min, priceRange.max]}
              tickFormatter={formatYAxis}
              stroke="#666"
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#FF8800', strokeWidth: 1 }}
            />
            <ReferenceLine
              y={averagePrice}
              stroke="#666"
              strokeDasharray="5 5"
              label={{ value: 'AVG', position: 'right', fill: '#666', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={priceColor}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">High</span>
            <span className="stat-value">
              {formatPrice(currentStock.dayHigh || Math.max(...chartData.map(d => d.price)))}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Low</span>
            <span className="stat-value">
              {formatPrice(currentStock.dayLow || Math.min(...chartData.map(d => d.price)))}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Volume</span>
            <span className="stat-value">{formatVolume(currentStock.volume)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg</span>
            <span className="stat-value">{formatPrice(averagePrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
