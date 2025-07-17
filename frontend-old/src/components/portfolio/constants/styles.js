/**
 * Estilos para el módulo de Portfolio
 * Extraído de PortfolioModule.js para mejor organización
 */

// Colores Bloomberg
export const BLOOMBERG_COLORS = {
  primary: '#FF8800',
  success: '#00FF00',
  danger: '#FF0000',
  background: '#0a0a0a',
  backgroundSecondary: '#1a1a1a',
  border: '#333',
  textSecondary: '#888888',
  neutral: '#666666'
};

// Estilos necesarios para el módulo
const styles = {
  panel: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '4px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FF8800',
    border: '1px solid #FF8800',
    padding: '8px',
    fontSize: '12px',
    width: '200px',
    marginRight: '10px'
  },
  button: {
    backgroundColor: '#FF8800',
    color: '#000',
    border: 'none',
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  priceUp: {
    color: '#00FF00'
  },
  priceDown: {
    color: '#FF0000'
  },
  deleteButton: {
    backgroundColor: '#666666',
    color: '#FF8800',
    border: '1px solid #333333',
    padding: '3px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    transition: 'background-color 0.2s, color 0.2s',
  }
};

export default styles; 