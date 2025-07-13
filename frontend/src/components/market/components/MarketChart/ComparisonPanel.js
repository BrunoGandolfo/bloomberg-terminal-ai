import React from 'react';
import { colors } from '../../../../styles/colors';
import { typography } from '../../../../styles/typography';
import { tokens } from '../../../../styles/tokens';

const ComparisonPanel = ({ comparison }) => {
  if (!comparison) return null;

  const styles = {
    panel: {
      backgroundColor: '#1a1a1a',
      border: '1px solid #FF8800',
      borderRadius: '4px',
      padding: tokens.spacing[3],
      marginBottom: tokens.spacing[3],
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    dataSection: {
      display: 'flex',
      gap: tokens.spacing[4]
    },
    dataItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    label: {
      fontSize: '12px',
      fontWeight: 'bold'
    },
    value: {
      color: colors.neutral.textLight
    },
    resultsSection: {
      textAlign: 'right'
    },
    changePercent: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold
    },
    changeAmount: {
      fontSize: typography.fontSize.sm
    }
  };

  const changeColor = comparison.changePercent >= 0 ? '#00FF00' : '#FF0000';

  return (
    <div style={styles.panel}>
      <div style={styles.dataSection}>
        <div style={styles.dataItem}>
          <span style={{ ...styles.label, color: '#FFA500' }}>
            INICIO:
          </span>
          <span style={styles.value}>
            ${comparison.startPrice.toFixed(2)} ({comparison.startDate})
          </span>
        </div>
        <div style={styles.dataItem}>
          <span style={{ ...styles.label, color: '#00BFFF' }}>
            FIN:
          </span>
          <span style={styles.value}>
            ${comparison.endPrice.toFixed(2)} ({comparison.endDate})
          </span>
        </div>
      </div>
      
      <div style={styles.resultsSection}>
        <div style={{ ...styles.changePercent, color: changeColor }}>
          {comparison.changePercent >= 0 ? '+' : ''}{comparison.changePercent.toFixed(2)}%
        </div>
        <div style={{ ...styles.changeAmount, color: changeColor }}>
          {comparison.changeAmount >= 0 ? '+' : ''}${comparison.changeAmount.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default ComparisonPanel; 