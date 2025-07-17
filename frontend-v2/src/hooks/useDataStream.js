// src/hooks/useDataStream.js
import { useState, useEffect, useCallback, useRef } from 'react';
import dataStreamService from '../services/DataStreamService';

export const useDataStream = () => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    console.log('🔍 useDataStream: Iniciando configuración...');
    
    // IMPORTANTE: Registrar los event listeners ANTES de conectar
    const handleConnected = () => {
      console.log('✅ useDataStream: Evento connected recibido!');
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      console.log('❌ useDataStream: Evento disconnected recibido');
      setIsConnected(false);
    };

    const handleError = (err) => {
      console.error('🚨 useDataStream: Error recibido:', err);
      setError(err.message || 'Connection error');
      setIsConnected(false);
    };

    // Registrar los listeners PRIMERO
    dataStreamService.on('connected', handleConnected);
    dataStreamService.on('disconnected', handleDisconnected);
    dataStreamService.on('error', handleError);

    // Suscribirse a los datos
    unsubscribeRef.current = dataStreamService.subscribe((newData) => {
      setData(newData);
      setError(null);
    });

    // AHORA sí conectar
    console.log('🚀 useDataStream: Llamando a connect()...');
    dataStreamService.connect();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      dataStreamService.off('connected', handleConnected);
      dataStreamService.off('disconnected', handleDisconnected);
      dataStreamService.off('error', handleError);
      dataStreamService.disconnect();
    };
  }, []);

  const setCurrentSymbol = useCallback((symbol) => {
    if (!symbol || typeof symbol !== 'string') return;
    dataStreamService.setCurrentSymbol(symbol.toUpperCase());
  }, []);

  const addToWatchlist = useCallback((symbol, initialData) => {
    if (!symbol || typeof symbol !== 'string') return false;
    return dataStreamService.addToWatchlist(symbol.toUpperCase(), initialData);
  }, []);

  const removeFromWatchlist = useCallback((symbol) => {
    if (!symbol || typeof symbol !== 'string') return false;
    return dataStreamService.removeFromWatchlist(symbol.toUpperCase());
  }, []);

  const getStockData = useCallback((symbol) => {
    if (!data || !symbol) return null;
    return data.portfolio[symbol] || data.watchlist[symbol] || null;
  }, [data]);

  const hasSymbol = useCallback((symbol) => {
    if (!data || !symbol) return false;
    return !!(data.portfolio[symbol] || data.watchlist[symbol]);
  }, [data]);

  const getAllSymbols = useCallback(() => {
    if (!data) return [];
    return [
      ...Object.keys(data.portfolio),
      ...Object.keys(data.watchlist),
    ];
  }, [data]);

  const isMarketOpen = useCallback(() => {
    return data?.marketStatus === 'OPEN';
  }, [data]);

  const getMarketStatusText = useCallback(() => {
    if (!data?.marketStatus) return 'LOADING';
    
    switch (data.marketStatus) {
      case 'OPEN':
        return 'MARKET OPEN';
      case 'CLOSED':
        return 'MARKET CLOSED';
      case 'PRE_MARKET':
        return 'PRE-MARKET';
      case 'AFTER_HOURS':
        return 'AFTER HOURS';
      default:
        return data.marketStatus;
    }
  }, [data]);

  const reconnect = useCallback(() => {
    setError(null);
    dataStreamService.disconnect();
    setTimeout(() => {
      dataStreamService.connect();
    }, 100);
  }, []);

  return {
    data,
    isConnected,
    error,
    currentSymbol: data?.currentSymbol,
    portfolio: data?.portfolio || {},
    watchlist: data?.watchlist || {},
    chartData: data?.chartData || [],
    marketStatus: data?.marketStatus,
    lastUpdate: data?.lastUpdate,
    setCurrentSymbol,
    addToWatchlist,
    removeFromWatchlist,
    getStockData,
    hasSymbol,
    getAllSymbols,
    isMarketOpen,
    getMarketStatusText,
    reconnect,
  };
};
