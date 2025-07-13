// Estilos Bloomberg Terminal para módulo de finanzas personales

export const styles = {
  panel: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '4px'
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FF8800',
    borderRadius: '8px',
    padding: '30px',
    width: '400px'
  },
  progressBar: {
    width: '100%',
    height: '25px',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '12px'
  },
  categoryCard: {
    padding: '10px',
    marginBottom: '5px',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    borderBottom: '1px solid #FF8800'
  },
  tableCell: {
    padding: '10px'
  }
};

// Colores para el gráfico de pie
export const CHART_COLORS = ['#FF8800', '#00FF00', '#FF0000', '#FFFF00', '#00FFFF', '#FF00FF']; 