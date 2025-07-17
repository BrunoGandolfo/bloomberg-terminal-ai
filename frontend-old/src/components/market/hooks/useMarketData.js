/**
 * Custom hook para manejar los datos del mercado
 * Extrae toda la lógica de datos de MarketModule.js
 */

import { useState, useCallback } from 'react';
import { marketApi } from '../services/marketApiService';

// Mapa de días para rangos temporales
const daysMap = {
  '1 día': 1,
  '5 días': 5,
  '1 mes': 30,
  '3 meses': 90,
  '6 meses': 180,
  '1 año': 365,
  '5 años': 1825,
  '10 años': 3650,
  '20 años': 7300,
  '30 años': 10950
};

/**
 * Hook para gestionar datos de mercado
 * @param {string|null} initialSymbol - Símbolo inicial opcional
 * @returns {object} Estados y funciones para manejar datos de mercado
 */
export const useMarketData = (initialSymbol = null) => {
  // Estados relacionados con datos de mercado
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol);
  const [marketData, setMarketData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [fullHistoricalData, setFullHistoricalData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('1 mes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Función updateMarketData mejorada para evitar actualizaciones innecesarias
  const updateMarketData = useCallback((data) => {
    if (!data) {
      setMarketData(null);
      return;
    }
    
    // Solo actualizar si hay cambios reales
    setMarketData(prevData => {
      // Si no hay datos previos, actualizar
      if (!prevData || !prevData.symbol) return data;
      
      // Si es el mismo símbolo y los mismos valores clave, no actualizar
      if (prevData.symbol === data.symbol && 
          prevData.price === data.price &&
          prevData.market_cap === data.market_cap &&
          prevData.pe_ratio === data.pe_ratio) {
        return prevData; // No cambiar el estado
      }
      
      return data; // Actualizar con nuevos datos
    });
  }, []);

  // Función para cargar datos de un símbolo
  const loadSymbol = async (symbol, name = null) => {
    if (!symbol) return;

    setLoading(true);
    setError('');
    setCurrentSymbol(symbol);

    try {
      // Usar el endpoint completo que trae TODO
      const [fullData, historicalResponse] = await Promise.all([
        marketApi.getMarketData(symbol),
        marketApi.getHistoricalData(symbol, 10950)
      ]);

      // Lógica robusta para obtener el nombre de la compañía
      let finalName = name || fullData.fundamentals?.name;
      if (!finalName || finalName.toUpperCase() === fullData.symbol.toUpperCase()) {
        const companyName = await marketApi.getCompanyName(symbol);
        if (companyName) {
          finalName = companyName;
        }
      }
      
      // Mapear datos correctamente desde el endpoint full
      const mappedData = {
        symbol: fullData.symbol,
        name: finalName || fullData.symbol, // Fallback final al símbolo
        price: fullData.price,
        change: fullData.change,
        change_percent: fullData.changePercent,
        volume: fullData.volume,
        open: fullData.open,
        high: fullData.high,
        low: fullData.low,
        marketCap: fullData.marketCap || fullData.fundamentals?.marketCapRaw || null,
        trailingPE: fullData.trailingPE || fullData.fundamentals?.peRatio || null,
        market_cap: fullData.fundamentals?.marketCapRaw || null,
        pe_ratio: fullData.fundamentals?.peRatio || null,
        dataSource: fullData.fundamentals?.dataSource || 'yahoo'
      };
      
      updateMarketData(mappedData);
      
      const fullData30Years = (Array.isArray(historicalResponse) ? historicalResponse : []).reverse();
      setFullHistoricalData(fullData30Years);
      
      const daysToShow = daysMap[selectedRange];
      const filteredData = fullData30Years.slice(0, daysToShow);
      // Revertir nuevamente para que esté en orden cronológico ascendente para el gráfico
      const dataForChart = [...filteredData].reverse();
      setHistoricalData(dataForChart);
    } catch (err) {
      setError(`Error al obtener datos de ${symbol}`);
      updateMarketData(null);
      setHistoricalData([]);
      setFullHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar el rango temporal
  const updateRange = (range) => {
    setSelectedRange(range);
    if (fullHistoricalData.length > 0) {
      // Filtrar los datos existentes para obtener los últimos N días
      const daysToShow = daysMap[range];
      const filteredData = fullHistoricalData.slice(0, daysToShow);
      // Revertir nuevamente para que esté en orden cronológico ascendente para el gráfico
      const dataForChart = [...filteredData].reverse();
      setHistoricalData(dataForChart);
    }
  };

  // Función para refrescar los datos actuales
  const refreshData = async () => {
    if (marketData && marketData.symbol) {
      console.log('🔄 MarketModule: Actualizando datos para', marketData.symbol);
      await loadSymbol(marketData.symbol);
      console.log('✅ MarketModule: Datos actualizados');
    }
  };

  return {
    // Estados
    currentSymbol,
    marketData,
    historicalData,
    selectedRange,
    loading,
    error,
    // Funciones
    loadSymbol,
    updateRange,
    refreshData,
    // Datos adicionales útiles
    daysMap
  };
}; 