import React from 'react';
import { getPriceColor, formatPercent } from '../../utils/dataFormatters';
import { typography } from '../../../../styles/typography';
import { tokens } from '../../../../styles/tokens';

const PriceDisplay = ({ marketData }) => {
  const styles = {
    priceRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: tokens.spacing[3],
      marginBottom: tokens.spacing[3]
    },
    price: {
      fontSize: typography.fontSize['5xl'],
      fontWeight: typography.fontWeight.bold,
      color: getPriceColor(marketData.change)
    },
    change: {
      fontSize: typography.fontSize['2xl'],
      color: getPriceColor(marketData.change)
    }
  };

  return (
    <div style={styles.priceRow}>
      <span style={styles.price}>
        ${marketData.price?.toFixed(2) || '0.00'}
      </span>
      
      <span style={styles.change}>
        {marketData.change >= 0 ? '▲' : '▼'} {Math.abs(marketData.change)?.toFixed(2)} 
        ({formatPercent(marketData.change_percent)})
      </span>
    </div>
  );
};

export default PriceDisplay; 