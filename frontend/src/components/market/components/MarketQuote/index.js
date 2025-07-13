import React from 'react';
import CompanyLogo from '../../../CompanyLogo';
import PriceDisplay from './PriceDisplay';
import StatsGrid from './StatsGrid';
import { colors } from '../../../../styles/colors';
import { typography } from '../../../../styles/typography';
import { tokens } from '../../../../styles/tokens';

const MarketQuote = ({ marketData }) => {
  if (!marketData) return null;

  const styles = {
    quoteSection: {
      border: '1px solid #333333',
      padding: '15px',
      backgroundColor: '#0a0a0a',
      borderRadius: '4px',
      marginBottom: tokens.spacing[4]
    },
    quoteHeader: {
      marginBottom: tokens.spacing[3]
    },
    symbolName: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.primary.orange,
      marginBottom: '5px',
      display: 'flex',
      alignItems: 'center'
    },
    companyName: {
      fontSize: typography.fontSize.lg,
      color: colors.neutral.textLight,
      marginTop: 0,
      marginLeft: '52px'
    },
    dataSourceIndicator: {
      fontSize: '10px',
      color: '#FF8800',
      opacity: 0.7,
      marginTop: '5px',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.quoteSection}>
      <div style={styles.quoteHeader}>
        <div>
          <h3 style={styles.symbolName}>
            <CompanyLogo symbol={marketData.symbol} size={40} />
            {marketData.symbol}
          </h3>
          <p style={styles.companyName}>{marketData.name || ''}</p>
        </div>
        
        <PriceDisplay marketData={marketData} />
      </div>

      <StatsGrid marketData={marketData} />
      
      {/* Indicador de fuente de datos */}
      {marketData.dataSource && marketData.dataSource !== 'alphavantage' && (
        <div style={styles.dataSourceIndicator}>
          Datos via {marketData.dataSource === 'perplexity' ? 'Perplexity AI' : marketData.dataSource}
        </div>
      )}
    </div>
  );
};

export default MarketQuote; 