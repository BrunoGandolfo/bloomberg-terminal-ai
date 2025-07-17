// Estilos Bloomberg para módulo de análisis fundamental

export const styles = {
  terminal: {
    backgroundColor: '#000000',
    color: '#FF8800',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    minHeight: '100vh',
    padding: '20px',
    position: 'relative'
  },
  panel: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  panelHover: {
    '&:hover': {
      borderColor: '#FF8800',
      boxShadow: '0 0 10px rgba(255, 136, 0, 0.3)'
    }
  },
  neonBorder: {
    border: '1px solid #FF8800',
    boxShadow: '0 0 5px rgba(255, 136, 0, 0.3), inset 0 0 5px rgba(255, 136, 0, 0.1)'
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '2px solid #FF8800',
    borderRadius: '4px',
    padding: '10px',
    fontFamily: 'Courier New, monospace',
    fontSize: '14px',
    width: '200px',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  button: {
    backgroundColor: '#FF8800',
    color: '#000000',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: '10px',
    transition: 'all 0.3s ease'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  scorePanel: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FF8800',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(255, 136, 0, 0.4)'
  },
  scoreNumber: {
    fontSize: '72px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textShadow: '0 0 20px currentColor'
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #333',
    transition: 'background-color 0.3s ease'
  },
  metricLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase'
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: 'bold'
  },
  excellent: { color: '#00FF00' },
  good: { color: '#FFFF00' },
  warning: { color: '#FFA500' },
  poor: { color: '#FF0000' },
  explanation: {
    backgroundColor: '#0f0f0f',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '10px',
    marginTop: '10px',
    fontSize: '11px',
    color: '#CCC'
  },
  glowText: {
    textShadow: '0 0 10px rgba(255, 136, 0, 0.8)',
    animation: 'pulse 2s infinite'
  },
  comparisonTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  },
  comparisonHeader: {
    backgroundColor: '#1a1a1a',
    borderBottom: '2px solid #FF8800'
  },
  strengthWeaknessGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  }
};

// Animaciones CSS
export const animationStyles = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
  }
  
  @keyframes dataUpdate {
    0% { background-color: rgba(255, 136, 0, 0.2); }
    100% { background-color: transparent; }
  }
  
  @keyframes glow {
    0% { box-shadow: 0 0 5px rgba(255, 136, 0, 0.3); }
    50% { box-shadow: 0 0 20px rgba(255, 136, 0, 0.6); }
    100% { box-shadow: 0 0 5px rgba(255, 136, 0, 0.3); }
  }
  
  @keyframes needleMove {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(var(--rotation)); }
  }
`; 