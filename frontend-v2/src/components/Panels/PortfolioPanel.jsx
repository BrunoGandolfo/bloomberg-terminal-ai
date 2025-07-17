// src/components/Panels/PortfolioPanel.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { usePortfolio } from '../../hooks/usePortfolio';
import { formatCurrency, formatPercent, getPriceColor } from '../../utils/formatters';
import { PORTFOLIO_COLUMNS } from '../../utils/constants';
import './PortfolioPanel.css';

export const PortfolioPanel = () => {
  const { portfolio, selectSymbol, currentSymbol } = usePortfolio();
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState(new Set());

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedPositions = useMemo(() => {
    if (!portfolio?.positions) return [];
    
    const positions = [...portfolio.positions];
    if (sortConfig.key) {
      positions.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        
        const result = aValue > bValue ? 1 : -1;
        return sortConfig.direction === 'asc' ? result : -result;
      });
    }
    
    return positions;
  }, [portfolio, sortConfig]);

  const handleRowClick = useCallback((symbol, event) => {
    if (event.target.type === 'checkbox') return;
    selectSymbol(symbol);
  }, [selectSymbol]);

  const handleSelectRow = useCallback((symbol, isSelected) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(symbol);
      else newSet.delete(symbol);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedRows(new Set(sortedPositions.map(p => p.symbol)));
    } else {
      setSelectedRows(new Set());
    }
  }, [sortedPositions]);

  if (!portfolio) {
    return (
      <div className="portfolio-panel loading">
        <div className="loading-spinner">Loading portfolio data...</div>
      </div>
    );
  }

  const { summary } = portfolio;
  const allSelected = selectedRows.size === sortedPositions.length && sortedPositions.length > 0;

  return (
    <div className="portfolio-panel">
      <div className="portfolio-summary">
        <div className="summary-item">
          <span className="summary-label">Total Value</span>
          <span className="summary-value">{formatCurrency(summary.totalValue)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total P&L</span>
          <span className="summary-value" style={{ color: getPriceColor(summary.totalGain) }}>
            {formatCurrency(summary.totalGain)} ({formatPercent(summary.totalGainPercent)})
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Day P&L</span>
          <span className="summary-value" style={{ color: getPriceColor(summary.dayGain) }}>
            {formatCurrency(summary.dayGain)} ({formatPercent(summary.dayGainPercent)})
          </span>
        </div>
      </div>

      <div className="portfolio-table-container">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              {PORTFOLIO_COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {sortConfig.key === col.key && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPositions.map(position => {
              const isSelected = selectedRows.has(position.symbol);
              const isActive = currentSymbol === position.symbol;
              
              return (
                <tr
                  key={position.symbol}
                  className={`portfolio-row ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => handleRowClick(position.symbol, e)}
                >
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(position.symbol, e.target.checked)}
                    />
                  </td>
                  <td className="symbol-cell">{position.symbol}</td>
                  <td className="numeric-cell">{position.shares}</td>
                  <td className="numeric-cell">{formatCurrency(position.currentPrice)}</td>
                  <td className="numeric-cell">{formatCurrency(position.value)}</td>
                  <td className="numeric-cell" style={{ color: getPriceColor(position.gain) }}>
                    {formatCurrency(position.gain)}
                  </td>
                  <td className="numeric-cell" style={{ color: getPriceColor(position.gainPercent) }}>
                    {formatPercent(position.gainPercent)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRows.size > 0 && (
        <div className="portfolio-actions">
          <span className="selected-count">{selectedRows.size} selected</span>
          <button className="action-button">Sell Selected</button>
          <button className="action-button">Add to Watchlist</button>
        </div>
      )}
    </div>
  );
};
