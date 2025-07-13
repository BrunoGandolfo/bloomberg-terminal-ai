/**
 * Hook personalizado para manejar los datos del portfolio
 * Gestiona el estado, carga de datos y operaciones CRUD
 */

import { useState, useCallback, useEffect } from 'react';
import { portfolioApi } from '../services/portfolioService';
import { isCrypto } from '../utils/formatters';

export const usePortfolioData = () => {
  const [portfolioData, setPortfolioData] = useState({ positions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Refresca los datos del portfolio con cotizaciones actualizadas
   * @param {boolean} showLoader - Si mostrar el loader durante la actualización
   * @returns {Object} Datos actualizados del portfolio y cambios de precio
   */
  const refreshPortfolio = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    
    try {
      const portfolio = await portfolioApi.getPortfolio();
      let priceChanges = {};

      if (portfolio && portfolio.positions.length > 0) {
        const symbols = portfolio.positions.map(p => p.symbol);
        const quotes = await portfolioApi.getBatchQuotes(symbols);

        const updatedPositions = portfolio.positions.map(p => {
          const newQuote = quotes[p.symbol];
          const oldPrice = p.currentPrice;
          const newPrice = newQuote?.price;

          // Detectar cambios de precio para animaciones
          if (newQuote && newPrice && oldPrice && Math.abs(newPrice - oldPrice) > 0.001) {
            priceChanges[p.symbol] = newPrice > oldPrice ? 'up' : 'down';
          }

          return {
            ...p,
            currentPrice: newPrice || oldPrice,
            trailingPE: newQuote?.trailingPE || null,
            marketCap: newQuote?.marketCap || null,
          };
        });

        setPortfolioData({ ...portfolio, positions: updatedPositions });
      } else {
        setPortfolioData({ positions: [] });
      }
      
      setLastUpdated(new Date());
      return { priceChanges }; // Solo retornar los cambios de precio para animaciones
      
    } catch (error) {
      console.error("❌ PortfolioModule: Error refreshing portfolio data:", error);
      return { priceChanges: {} };
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []); // Dependencias vacías para evitar recreación

  /**
   * Agrega una nueva posición al portfolio
   * @param {Object} newPosition - Datos de la nueva posición
   */
  const handleAddPosition = useCallback(async (newPosition) => {
    if (!newPosition.symbol || !newPosition.shares || !newPosition.avgCost) {
      return;
    }

    const newPositionData = {
      symbol: newPosition.symbol.toUpperCase(),
      name: `${newPosition.symbol.toUpperCase()} Inc.`, // Nombre simulado
      shares: isCrypto(newPosition.symbol) ? 
        parseFloat(newPosition.shares) : 
        parseInt(newPosition.shares),
      avgCost: parseFloat(newPosition.avgCost),
      currentPrice: parseFloat(newPosition.avgCost), // Precio inicial = costo promedio
      lastUpdated: new Date().toISOString()
    };

    // Actualizar UI primero para respuesta inmediata
    setPortfolioData(prev => ({
      ...prev,
      positions: [...prev.positions, newPositionData]
    }));

    try {
      await portfolioApi.addPosition(portfolioData, newPositionData);
      // Refrescar para obtener datos actualizados del servidor
      await refreshPortfolio();
      return true; // Éxito
    } catch (error) {
      console.error('Error saving portfolio:', error);
      // Revertir cambio en caso de error
      await refreshPortfolio();
      return false; // Error
    }
  }, [portfolioData, refreshPortfolio]);

  /**
   * Elimina una posición del portfolio
   * @param {string} symbol - Símbolo de la posición a eliminar
   */
  const handleRemovePosition = useCallback(async (symbol) => {
    // Actualizar UI primero
    setPortfolioData(prev => ({
      ...prev,
      positions: prev.positions.filter(p => p.symbol !== symbol)
    }));

    try {
      await portfolioApi.removePosition(portfolioData, symbol);
      await refreshPortfolio();
    } catch (error) {
      console.error('Error al guardar portafolio tras eliminar posición:', error);
      // Revertir cambio en caso de error
      await refreshPortfolio();
    }
  }, [portfolioData, refreshPortfolio]);

  /**
   * Calcula el tiempo transcurrido desde la última actualización
   */
  const renderTimeAgo = useCallback(() => {
    if (!lastUpdated) return 'Nunca';
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 10) return 'justo ahora';
    if (seconds < 60) return `hace ${seconds} segundos`;
    return `hace ${Math.floor(seconds / 60)} min`;
  }, [lastUpdated]);

  // Cargar portfolio al montar el componente
  useEffect(() => {
    refreshPortfolio();
  }, []);

  return {
    portfolioData,
    isLoading,
    lastUpdated,
    refreshPortfolio,
    handleAddPosition,
    handleRemovePosition,
    renderTimeAgo
  };
}; 