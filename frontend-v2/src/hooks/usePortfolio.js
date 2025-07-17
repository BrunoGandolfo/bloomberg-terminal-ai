// src/hooks/usePortfolio.js
import { useMemo, useCallback } from 'react';
import { useDataStream } from './useDataStream';

export const usePortfolio = () => {
  const { data, setCurrentSymbol } = useDataStream();

  const portfolioData = useMemo(() => {
    if (!data?.portfolio) return null;

    const portfolio = data.portfolio;
    const positions = Object.entries(portfolio).map(([symbol, stock]) => {
      const value = stock.currentPrice * stock.shares;
      const cost = stock.avgCost * stock.shares;
      const gain = value - cost;
      const gainPercent = (gain / cost) * 100;

      return {
        symbol,
        shares: stock.shares,
        avgCost: stock.avgCost,
        currentPrice: stock.currentPrice,
        value,
        cost,
        gain,
        gainPercent,
        change: stock.change,
        changePercent: stock.changePercent,
        dayHigh: stock.dayHigh,
        dayLow: stock.dayLow,
        volume: stock.volume,
      };
    });

    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    const totalCost = positions.reduce((sum, pos) => sum + pos.cost, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    const dayGain = positions.reduce((sum, pos) => sum + pos.change * pos.shares, 0);
    const dayGainPercent = totalValue > 0 ? (dayGain / (totalValue - dayGain)) * 100 : 0;

    return {
      positions,
      summary: {
        totalValue,
        totalCost,
        totalGain,
        totalGainPercent,
        dayGain,
        dayGainPercent,
        positionCount: positions.length,
      },
    };
  }, [data]);

  const selectSymbol = useCallback(
    (symbol) => {
      setCurrentSymbol(symbol);
    },
    [setCurrentSymbol]
  );

  const getPositionBySymbol = useCallback(
    (symbol) => {
      return portfolioData?.positions.find((pos) => pos.symbol === symbol);
    },
    [portfolioData]
  );

  const calculateAllocation = useMemo(() => {
    if (!portfolioData) return [];

    const { positions, summary } = portfolioData;
    return positions
      .map((pos) => ({
        symbol: pos.symbol,
        value: pos.value,
        percentage: (pos.value / summary.totalValue) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [portfolioData]);

  const getTopPerformers = useCallback(
    (count = 3) => {
      if (!portfolioData) return [];
      return [...portfolioData.positions].sort((a, b) => b.gainPercent - a.gainPercent).slice(0, count);
    },
    [portfolioData]
  );

  const getWorstPerformers = useCallback(
    (count = 3) => {
      if (!portfolioData) return [];
      return [...portfolioData.positions].sort((a, b) => a.gainPercent - b.gainPercent).slice(0, count);
    },
    [portfolioData]
  );

  return {
    portfolio: portfolioData,
    selectSymbol,
    getPositionBySymbol,
    allocation: calculateAllocation,
    getTopPerformers,
    getWorstPerformers,
    isLoading: !data,
    currentSymbol: data?.currentSymbol,
  };
};
