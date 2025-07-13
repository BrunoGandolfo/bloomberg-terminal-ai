import React from 'react';
import { formatNumber, formatPE, formatMarketCap } from '../../utils/dataFormatters';
import { colors } from '../../../../styles/colors';
import { typography } from '../../../../styles/typography';
import { tokens } from '../../../../styles/tokens';

const StatsGrid = ({ marketData }) => {
  const styles = {
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: tokens.spacing[3]
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[1]
    },
    statLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.neutral.text,
      textTransform: 'uppercase'
    },
    statValue: {
      fontSize: typography.fontSize.lg,
      color: colors.neutral.textLight,
      fontWeight: typography.fontWeight.bold
    }
  };

  const stats = [
    {
      label: 'Apertura',
      value: marketData.open ? `$${marketData.open.toFixed(2)}` : '-'
    },
    {
      label: 'Máximo',
      value: marketData.high ? `$${marketData.high.toFixed(2)}` : '-'
    },
    {
      label: 'Mínimo',
      value: marketData.low ? `$${marketData.low.toFixed(2)}` : '-'
    },
    {
      label: 'Volumen',
      value: formatNumber(marketData.volume)
    },
    {
      label: 'P/E Ratio',
      value: (() => {
        // Usar trailingPE directamente de stockData si está disponible
        if (marketData.trailingPE) {
          return formatPE(marketData.trailingPE);
        }
        // Fallback al campo antiguo pe_ratio para compatibilidad
        if (marketData.pe_ratio) {
          return formatPE(marketData.pe_ratio);
        }
        return '-';
      })()
    },
    {
      label: 'Market Cap',
      value: (() => {
        // Usar marketCap directamente de stockData si está disponible
        if (marketData.marketCap) {
          return formatMarketCap(marketData.marketCap);
        }
        // Fallback al campo antiguo market_cap para compatibilidad
        if (marketData.market_cap) {
          return formatMarketCap(marketData.market_cap);
        }
        return '-';
      })()
    }
  ];

  return (
    <div style={styles.statsGrid}>
      {stats.map((stat, index) => (
        <div key={index} style={styles.statItem}>
          <span style={styles.statLabel}>{stat.label}</span>
          <span style={styles.statValue}>{stat.value}</span>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid; 