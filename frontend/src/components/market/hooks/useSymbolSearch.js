/**
 * Custom hook para manejar la búsqueda de símbolos
 * Extrae toda la lógica de búsqueda de MarketModule.js
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { marketApi } from '../services/marketApiService';

/**
 * Hook para gestionar la búsqueda de símbolos con autocompletado
 * @param {function} onSymbolSelect - Callback cuando se selecciona un símbolo
 * @returns {object} Estados y funciones para manejar la búsqueda
 */
export const useSymbolSearch = (onSymbolSelect) => {
  // Estados de búsqueda
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs para debouncing
  const searchTimeout = useRef(null);

  // Buscar sugerencias de ticker
  const searchTicker = async (query) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await marketApi.searchSymbol(query);
      setSuggestions(data.slice(0, 10));
    } catch (err) {
      console.error('Error searching ticker:', err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    // Cancelar búsqueda anterior si existe
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Si no hay símbolo, limpiar sugerencias
    if (!searchValue) {
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }
    
    // Configurar nuevo timer
    searchTimeout.current = setTimeout(() => {
      searchTicker(searchValue);
    }, 300);

    // Cleanup
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchValue]);

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = useCallback((value) => {
    setSearchValue(value.toUpperCase());
    setIsDropdownVisible(true);
    setSelectedSuggestionIndex(-1);
  }, []);

  // Manejar navegación con teclado
  const handleKeyDown = useCallback((event) => {
    if (!isDropdownVisible || suggestions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > -1 ? prev - 1 : -1
        );
        break;
      
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selected = suggestions[selectedSuggestionIndex];
          selectSymbol(selected.symbol, selected.name);
        } else if (searchValue) {
          // Si no hay selección pero hay texto, buscar directamente
          selectSymbol(searchValue, null);
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        setIsDropdownVisible(false);
        setSelectedSuggestionIndex(-1);
        break;
      
      default:
        // No hacer nada para otras teclas
        break;
    }
  }, [isDropdownVisible, suggestions, selectedSuggestionIndex, searchValue, onSymbolSelect]);

  // Seleccionar un símbolo
  const selectSymbol = useCallback((symbol, name = null) => {
    setSearchValue(symbol);
    setIsDropdownVisible(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    if (onSymbolSelect) {
      onSymbolSelect(symbol, name);
    }
  }, [onSymbolSelect]);

  // Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchValue('');
    setSuggestions([]);
    setIsDropdownVisible(false);
    setSelectedSuggestionIndex(-1);
    setIsSearching(false);
  }, []);

  // Cerrar dropdown con delay (para permitir clicks)
  const closeDropdownWithDelay = useCallback(() => {
    setTimeout(() => setIsDropdownVisible(false), 200);
  }, []);

  return {
    // Estados
    searchValue,
    suggestions,
    isDropdownVisible,
    selectedSuggestionIndex,
    isSearching,
    // Funciones
    handleSearchChange,
    handleKeyDown,
    selectSymbol,
    clearSearch,
    closeDropdownWithDelay,
    setIsDropdownVisible
  };
}; 