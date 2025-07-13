/**
 * Componente de formulario para agregar nuevas posiciones
 * Maneja la entrada de símbolo, cantidad y costo promedio
 */

import React from 'react';
import { isCrypto } from '../utils/formatters';

const AddPositionForm = ({ newPosition, setNewPosition, onSubmit, styles }) => {
  return (
    <div style={styles.panel}>
      <h3>AGREGAR POSICIÓN</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Símbolo (ej: AAPL)"
          value={newPosition.symbol}
          onChange={(e) => setNewPosition({...newPosition, symbol: e.target.value})}
          style={{ ...styles.input, width: '100%' }}
        />
        <input
          type="number"
          step={isCrypto(newPosition.symbol) ? "0.00000001" : "1"}
          placeholder={isCrypto(newPosition.symbol) ? "Ej: 0.0534" : "Cantidad de acciones"}
          value={newPosition.shares}
          onChange={(e) => setNewPosition({...newPosition, shares: e.target.value})}
          style={{ ...styles.input, width: '100%' }}
        />
        <input
          type="number"
          placeholder="Costo promedio por acción"
          value={newPosition.avgCost}
          onChange={(e) => setNewPosition({...newPosition, avgCost: e.target.value})}
          style={{ ...styles.input, width: '100%' }}
        />
        <button 
          onClick={onSubmit} 
          style={styles.button}
          disabled={!newPosition.symbol || !newPosition.shares || !newPosition.avgCost}
        >
          AGREGAR
        </button>
      </div>
    </div>
  );
};

export default AddPositionForm; 