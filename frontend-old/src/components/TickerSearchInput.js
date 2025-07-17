import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../services/api';
import CompanyLogo from './CompanyLogo';

/**
 * Input de búsqueda de tickers con autocompletado.
 * @param {{
 *   onSelectTicker: (tickerObj) => void,
 *   placeholder?: string,
 *   style?: React.CSSProperties
 * }} props
 */
function TickerSearchInput({ onSelectTicker, placeholder = 'Buscar ticker…', style = {} }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef();
  const containerRef = useRef(null);

  // Debounce de 300 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length === 0) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiCall(`/api/search/ticker?q=${encodeURIComponent(query)}`);
        setResults(Array.isArray(data) ? data.slice(0, 5) : []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error buscando tickers:', err);
      }
    }, 300);
  }, [query]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ticker) => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    onSelectTicker && onSelectTicker(ticker);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', ...style }}
    >
      <input
        type="text"
        name="ticker-search"
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={{
          width: '100%',
          backgroundColor: '#000',
          color: '#00FF00',
          border: '1px solid #333',
          padding: '6px 8px',
          fontFamily: 'monospace',
          outline: 'none',
        }}
      />
      {showDropdown && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '470px',
            marginTop: '8px',
            backgroundColor: '#0a0a0a',
            border: '2px solid #ff6600',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(255, 102, 0, 0.2)',
            opacity: showDropdown ? 1 : 0,
            transform: showDropdown ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            zIndex: 9999,
            right: 'auto',
          }}
        >
          {results.map((r, idx) => (
            <div
              key={r.symbol}
              onClick={() => handleSelect(r)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                color: '#ff6600',
                fontSize: '13px',
                letterSpacing: '0.5px',
                borderBottom: idx !== results.length - 1 ? '1px solid #222' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.color = '#ffaa00';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ff6600';
              }}
            >
              <CompanyLogo symbol={r.symbol} size={20} />
              <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>{r.symbol}</span>
              <span style={{ color: '#888', marginLeft: '10px' }}>{r.name.length > 30 ? `${r.name.substring(0, 30)}...` : r.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TickerSearchInput; 