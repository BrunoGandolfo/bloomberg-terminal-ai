// src/components/Panels/WatchlistPanel.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { useDataStream } from '../../hooks/useDataStream';
import { formatPrice, formatPercent, formatVolume, getPriceColor } from '../../utils/formatters';
import { WATCHLIST_COLUMNS } from '../../utils/constants';
import './WatchlistPanel.css';

export const WatchlistPanel = () => {
  const { watchlist, addToWatchlist, removeFromWatchlist, setCurrentSymbol, currentSymbol } = useDataStream();
  const [sortConfig, setSortConfig] = useState({ key: 'changePercent', direction: 'desc' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedWatchlist = useMemo(() => {
    if (!watchlist) return [];
    
    const entries = Object.entries(watchlist).map(([symbol, data]) => ({ symbol, ...data }));
    
    if (sortConfig.key) {
      entries.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        
        const result = aValue > bValue ? 1 : -1;
        return sortConfig.direction === 'asc' ? result : -result;
      });
    }
    
    return entries;
  }, [watchlist, sortConfig]);

  const handleRowClick = useCallback((symbol) => {
    setCurrentSymbol(symbol);
  }, [setCurrentSymbol]);

  const handleRemove = useCallback((e, symbol) => {
    e.stopPropagation();
    removeFromWatchlist(symbol);
  }, [removeFromWatchlist]);

  const handleAddSymbol = useCallback(() => {
    const symbol = newSymbol.trim().toUpperCase();
    if (symbol && !watchlist[symbol]) {
      addToWatchlist(symbol, {
        price: 100 + Math.random() * 400,
        volume: Math.floor(Math.random() * 100000000)
      });
      setNewSymbol('');
      setShowAddModal(false);
    }
  }, [newSymbol, watchlist, addToWatchlist]);

  const marketStats = useMemo(() => {
    const stocks = sortedWatchlist;
    if (stocks.length === 0) return null;

    const gainers = stocks.filter(s => s.changePercent > 0).length;
    const losers = stocks.filter(s => s.changePercent < 0).length;
    const unchanged = stocks.filter(s => s.changePercent === 0).length;
    const topGainer = stocks.reduce((max, stock) => stock.changePercent > max.changePercent ? stock : max, stocks[0]);
    const topLoser = stocks.reduce((min, stock) => stock.changePercent < min.changePercent ? stock : min, stocks[0]);

    return { gainers, losers, unchanged, topGainer, topLoser };
  }, [sortedWatchlist]);

  if (sortedWatchlist.length === 0) {
    return (
      <div className="watchlist-panel empty">
        <div className="empty-state">
          <p>No symbols in watchlist</p>
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            + Add Your First Symbol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-panel">
      {marketStats && (
        <div className="watchlist-summary">
          <div className="summary-stat">
            <span className="stat-value" style={{ color: '#00FF00' }}>{marketStats.gainers}</span>
            <span className="stat-label">Gainers</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value" style={{ color: '#FF0000' }}>{marketStats.losers}</span>
            <span className="stat-label">Losers</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value" style={{ color: '#999' }}>{marketStats.unchanged}</span>
            <span className="stat-label">Unchanged</span>
          </div>
        </div>
      )}

      <div className="watchlist-table-container">
        <table className="watchlist-table">
          <thead>
            <tr>
              {WATCHLIST_COLUMNS.map(col => (
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
              <th className="actions-column"></th>
            </tr>
          </thead>
          <tbody>
            {sortedWatchlist.map(stock => {
              const isActive = currentSymbol === stock.symbol;
              const priceColor = getPriceColor(stock.change);
              
              return (
                <tr
                  key={stock.symbol}
                  className={`watchlist-row ${isActive ? 'active' : ''}`}
                  onClick={() => handleRowClick(stock.symbol)}
                >
                  <td className="symbol-cell">{stock.symbol}</td>
                  <td className="numeric-cell">{formatPrice(stock.price)}</td>
                  <td className="numeric-cell" style={{ color: priceColor }}>
                    {stock.change >= 0 ? '+' : ''}{formatPrice(stock.change)}
                  </td>
                  <td className="numeric-cell" style={{ color: priceColor }}>
                    {formatPercent(stock.changePercent)}
                  </td>
                  <td className="numeric-cell">{formatVolume(stock.volume)}</td>
                  <td className="actions-column">
                    <button
                      className="remove-button"
                      onClick={(e) => handleRemove(e, stock.symbol)}
                      title="Remove from watchlist"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="watchlist-footer">
        <button className="add-button" onClick={() => setShowAddModal(true)}>
          + Add Symbol
        </button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add Symbol to Watchlist</h3>
            <input
              className="symbol-input"
              placeholder="Enter symbol (e.g., TSLA)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="confirm-button" onClick={handleAddSymbol}>
                Add Symbol
              </button>
              <button className="cancel-button" onClick={() => {
                setShowAddModal(false);
                setNewSymbol('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
