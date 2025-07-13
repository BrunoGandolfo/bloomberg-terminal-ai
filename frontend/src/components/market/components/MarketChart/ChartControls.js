import React from 'react';

const ChartControls = ({ 
  comparisonMode, 
  onComparisonModeToggle, 
  selectedRange, 
  onRangeChange, 
  daysMap 
}) => {
  const styles = {
    controlsContainer: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center'
    },
    rangeButtons: {
      display: 'flex',
      gap: '15px'
    },
    button: {
      padding: '4px 10px',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: 'bold',
      border: '1px solid #FF8800',
      transition: 'all 0.2s ease'
    },
    activeButton: {
      backgroundColor: '#FF8800',
      color: '#000'
    },
    inactiveButton: {
      backgroundColor: 'transparent',
      color: '#FF8800'
    }
  };

  return (
    <div style={styles.controlsContainer}>
      <button
        onClick={onComparisonModeToggle}
        style={{
          ...styles.button,
          ...(comparisonMode ? styles.activeButton : styles.inactiveButton)
        }}
      >
        Modo Comparación
      </button>
      
      <div style={styles.rangeButtons}>
        {Object.keys(daysMap).map((range) => (
          <button
            key={range}
            onClick={() => onRangeChange(range)}
            style={{
              ...styles.button,
              ...(selectedRange === range ? styles.activeButton : styles.inactiveButton)
            }}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChartControls; 