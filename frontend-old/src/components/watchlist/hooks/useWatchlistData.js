/**
 * Hook personalizado para manejar los datos de watchlist
 * Gestiona el estado, persistencia y operaciones CRUD
 */

import { useState, useCallback, useEffect } from 'react';
import { watchlistService } from '../services/watchlistService';

export const useWatchlistData = () => {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error al leer la watchlist de localStorage:", error);
      return [];
    }
  });

  const [watchlistData, setWatchlistData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Persistir watchlist en localStorage y backend
   */
  const persistWatchlist = useCallback(async (list) => {
    try {
      localStorage.setItem('watchlist', JSON.stringify(list));
      await watchlistService.updateWatchlist(list);
    } catch (error) {
      console.error('Error al guardar la watchlist:', error);
    }
  }, []);

  /**
   * Cargar watchlist desde backend al montar
   */
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const data = await watchlistService.getWatchlist();
        if (data.length > 0) {
          setWatchlist(data);
          localStorage.setItem('watchlist', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Backend watchlist fetch failed:', err);
      }
    };
    loadWatchlist();
  }, []);

  /**
   * Sincronizar con localStorage cuando cambie watchlist
   */
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  /**
   * Refrescar datos de cotización
   */
  const refreshWatchlist = useCallback(async (showLoader = false) => {
    if (watchlist.length === 0) {
      setWatchlistData({});
      return { priceChanges: {} };
    }

    if (showLoader) setIsLoading(true);

    try {
      const data = await watchlistService.getBatchQuotes(watchlist);
      let priceChanges = {};

      // Detectar cambios de precio para animaciones
      Object.keys(data || {}).forEach(symbol => {
        const oldPrice = watchlistData[symbol]?.price;
        const newPrice = data[symbol]?.price;
        if (oldPrice && newPrice && Math.abs(oldPrice - newPrice) > 0.001) {
          priceChanges[symbol] = newPrice > oldPrice ? 'up' : 'down';
        }
      });

      setWatchlistData(data || {});
      setLastUpdated(Date.now());
      
      return { priceChanges };
    } catch (error) {
      console.error('❌ WatchlistModule: Error al refrescar:', error);
      return { priceChanges: {} };
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [watchlist, watchlistData]);

  /**
   * Agregar símbolo a la watchlist
   */
  const handleAddSymbol = useCallback(async (symbol) => {
    const symbolToAdd = symbol.trim().toUpperCase();
    if (!symbolToAdd || watchlist.includes(symbolToAdd)) return false;

    setIsLoading(true);
    try {
      const isValid = await watchlistService.validateSymbol(symbolToAdd);
      if (isValid) {
        const updated = [...watchlist, symbolToAdd].sort();
        setWatchlist(updated);
        await persistWatchlist(updated);
        return true;
      } else {
        alert(`Símbolo '${symbolToAdd}' no es válido o no se encontró.`);
        return false;
      }
    } catch (error) {
      console.error(`Error al validar el símbolo ${symbolToAdd}:`, error);
      alert(`Error al agregar '${symbolToAdd}'.`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [watchlist, persistWatchlist]);

  /**
   * Eliminar símbolo de la watchlist
   */
  const handleRemoveSymbol = useCallback(async (symbolToRemove) => {
    const updated = watchlist.filter(symbol => symbol !== symbolToRemove);
    setWatchlist(updated);
    await persistWatchlist(updated);
  }, [watchlist, persistWatchlist]);

  /**
   * Calcular tiempo transcurrido
   */
  const renderTimeAgo = useCallback(() => {
    if (!lastUpdated) return 'Nunca';
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 10) return 'justo ahora';
    if (seconds < 60) return `hace ${seconds} segundos`;
    return `hace ${Math.floor(seconds / 60)} min`;
  }, [lastUpdated]);

  // Cargar datos al inicio
  useEffect(() => {
    if (watchlist.length > 0) {
      refreshWatchlist(true);
    }
  }, [refreshWatchlist, watchlist.length]);

  return {
    watchlist,
    watchlistData,
    isLoading,
    lastUpdated,
    refreshWatchlist,
    handleAddSymbol,
    handleRemoveSymbol,
    renderTimeAgo
  };
}; 