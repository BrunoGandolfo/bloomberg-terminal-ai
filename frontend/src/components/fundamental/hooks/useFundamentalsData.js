import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../../services/api';

export const useFundamentalsData = (initialSymbol = 'AAPL') => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [fundamentals, setFundamentals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para modo comparación
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonSymbols, setComparisonSymbols] = useState([]);
  const [comparisonData, setComparisonData] = useState({});
  const [newComparisonSymbol, setNewComparisonSymbol] = useState('');
  const [loadingComparison, setLoadingComparison] = useState(false);

  const analyzeFundamentals = useCallback(async (symbolParam) => {
    const targetSymbol = (symbolParam || symbol || '').toUpperCase();
    if (!targetSymbol) return;
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const data = await apiCall(`/api/fundamentals-perplexity/${targetSymbol}`);
      setFundamentals(data);
      
      // Si estamos en modo comparación, actualizar también los datos de comparación
      if (comparisonMode && comparisonSymbols.includes(targetSymbol)) {
        setComparisonData(prev => ({
          ...prev,
          [targetSymbol]: data
        }));
      }
    } catch (err) {
      setError(`Error al obtener datos de ${targetSymbol}: ${err.message}`);
    }

    setLoading(false);
  }, [symbol, loading, comparisonMode, comparisonSymbols]);

  const addToComparison = useCallback(async (symbolToAdd) => {
    const targetSymbol = (symbolToAdd || newComparisonSymbol || '').toUpperCase();
    if (!targetSymbol) return;
    
    if (comparisonSymbols.includes(targetSymbol)) {
      setError(`${targetSymbol} ya está en la comparación`);
      return;
    }
    
    if (comparisonSymbols.length >= 5) {
      setError('Máximo 5 empresas en comparación');
      return;
    }
    
    setLoadingComparison(true);
    try {
      const data = await apiCall(`/api/fundamentals-perplexity/${targetSymbol}`);
      setComparisonSymbols(prev => [...prev, targetSymbol]);
      setComparisonData(prev => ({
        ...prev,
        [targetSymbol]: data
      }));
      setNewComparisonSymbol('');
    } catch (err) {
      setError(`Error al obtener datos de ${targetSymbol}: ${err.message}`);
    }
    setLoadingComparison(false);
  }, [newComparisonSymbol, comparisonSymbols]);

  const removeFromComparison = useCallback((symbolToRemove) => {
    setComparisonSymbols(prev => prev.filter(s => s !== symbolToRemove));
    setComparisonData(prev => {
      const newData = { ...prev };
      delete newData[symbolToRemove];
      return newData;
    });
  }, []);

  // Cargar símbolo inicial automáticamente
  useEffect(() => {
    analyzeFundamentals(initialSymbol);
  }, [analyzeFundamentals, initialSymbol]); // Agregar dependencias faltantes

  return {
    // Estado
    symbol,
    fundamentals,
    loading,
    error,
    comparisonMode,
    comparisonSymbols,
    comparisonData,
    newComparisonSymbol,
    loadingComparison,
    
    // Acciones
    setSymbol,
    setError,
    setComparisonMode,
    setNewComparisonSymbol,
    analyzeFundamentals,
    addToComparison,
    removeFromComparison
  };
}; 