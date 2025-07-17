// src/components/Layout/Header.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDataStream } from '../../hooks/useDataStream';
import { DISPLAY_MODES } from '../../utils/constants';
import './Header.css';

export const Header = ({ mode, onModeChange }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { setCurrentSymbol, data } = useDataStream();
  const searchRef = useRef(null);

  const getSuggestions = useCallback((query) => {
    if (!query) return [];
    
    const allSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD',
      'NFLX', 'DIS', 'PYPL', 'INTC', 'CSCO', 'ADBE', 'CRM', 'ORCL',
    ];
    
    return allSymbols.filter(symbol => 
      symbol.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, []);

  const handleSearch = useCallback((e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      const symbol = searchValue.trim().toUpperCase();
      setCurrentSymbol(symbol);
      setSearchValue('');
      setShowSuggestions(false);
    }
  }, [searchValue, setCurrentSymbol]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (value) {
      setSearchSuggestions(getSuggestions(value));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [getSuggestions]);

  const selectSuggestion = useCallback((symbol) => {
    setCurrentSymbol(symbol);
    setSearchValue('');
    setShowSuggestions(false);
  }, [setCurrentSymbol]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bloomberg-header">
      <div className="header-left">
        <h1 className="header-title">BLOOMBERG TERMINAL AI</h1>
        <div className="market-status">
          <span className={`status-indicator ${data?.marketStatus?.toLowerCase()}`} />
          <span className="status-text">{data?.marketStatus || 'LOADING'}</span>
        </div>
      </div>

      <div className="header-center">
        <div className="search-container" ref={searchRef}>
          <input
            className="search-input"
            placeholder="Enter symbol (e.g., TSLA)"
            value={searchValue}
            onChange={handleSearchChange}
            onKeyPress={handleSearch}
            onFocus={() => searchValue && setShowSuggestions(true)}
          />
          <span className="search-icon">⌕</span>
          
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {searchSuggestions.map((symbol) => (
                <div
                  key={symbol}
                  className="suggestion-item"
                  onClick={() => selectSuggestion(symbol)}
                >
                  <span className="suggestion-symbol">{symbol}</span>
                  <span className="suggestion-name">{symbol} Corporation</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="mode-switcher">
          <button
            className={`mode-button ${mode === DISPLAY_MODES.TRADING ? 'active' : ''}`}
            onClick={() => onModeChange(DISPLAY_MODES.TRADING)}
          >
            <span className="mode-icon">📊</span>
            TRADING MODE
          </button>
          <button
            className={`mode-button ${mode === DISPLAY_MODES.RESEARCH ? 'active' : ''}`}
            onClick={() => onModeChange(DISPLAY_MODES.RESEARCH)}
          >
            <span className="mode-icon">📚</span>
            RESEARCH MODE
          </button>
        </div>
        <div className="header-time">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </header>
  );
};
