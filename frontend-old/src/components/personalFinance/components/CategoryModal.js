import React from 'react';
import { styles } from '../utils/personalFinanceStyles';

const CategoryModal = ({ 
  newCategory, 
  setNewCategory, 
  categoryType, 
  setCategoryType,
  onSave, 
  onClose 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newCategory.trim()) {
      onSave();
    }
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#FF8800', marginBottom: '20px' }}>
          AGREGAR NUEVA CATEGORÍA
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '20px' }}>
              <input
                type="radio"
                value="expense"
                checked={categoryType === 'expense'}
                onChange={(e) => setCategoryType(e.target.value)}
                style={{ marginRight: '5px' }}
              />
              Categoría de Gasto
            </label>
            <label>
              <input
                type="radio"
                value="income"
                checked={categoryType === 'income'}
                onChange={(e) => setCategoryType(e.target.value)}
                style={{ marginRight: '5px' }}
              />
              Categoría de Ingreso
            </label>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ ...styles.input, width: '100%' }}
              autoFocus
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{ ...styles.button, flex: 1 }}
            >
              AGREGAR
            </button>
            <button
              type="button"
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
        </form>
      </div>
    </div>
  );
};

export default CategoryModal; 