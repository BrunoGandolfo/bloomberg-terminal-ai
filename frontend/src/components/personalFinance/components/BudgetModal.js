import React, { useState } from 'react';
import { styles } from '../utils/personalFinanceStyles';

const BudgetModal = ({ monthlyBudget, onSave, onClose }) => {
  const [newBudget, setNewBudget] = useState(monthlyBudget.toString());

  const handleSave = () => {
    const budget = parseFloat(newBudget);
    if (!isNaN(budget) && budget > 0) {
      onSave(budget);
      onClose();
    }
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#FF8800', marginBottom: '20px' }}>
          CONFIGURAR PRESUPUESTO MENSUAL
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#888' }}>
            Presupuesto mensual ($)
          </label>
          <input
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            style={{ ...styles.input, width: '100%' }}
            step="100"
            min="0"
            autoFocus
          />
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          color: '#888', 
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          <p>💡 Consejos para establecer tu presupuesto:</p>
          <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>Comienza con tus gastos fijos mensuales</li>
            <li>Añade un 20-30% para gastos variables</li>
            <li>Incluye un margen para imprevistos (10%)</li>
            <li>Ajusta mensualmente según tu experiencia</li>
          </ul>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            style={{ ...styles.button, flex: 1 }}
          >
            GUARDAR
          </button>
          <button
            onClick={onClose}
            style={{ 
              ...styles.button, 
              flex: 1,
              backgroundColor: '#333',
              color: '#FF8800'
            }}
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetModal; 