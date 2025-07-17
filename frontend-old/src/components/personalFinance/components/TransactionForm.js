import React from 'react';
import { styles } from '../utils/personalFinanceStyles';

const TransactionForm = ({ 
  newTransaction, 
  setNewTransaction, 
  expenseCategories, 
  incomeCategories,
  onSubmit 
}) => {
  const categories = newTransaction.type === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div style={styles.panel}>
      <h3>NUEVA TRANSACCIÓN</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '20px' }}>
            <input
              type="radio"
              value="expense"
              checked={newTransaction.type === 'expense'}
              onChange={(e) => setNewTransaction({
                ...newTransaction, 
                type: e.target.value,
                category: ''
              })}
              style={{ marginRight: '5px' }}
            />
            Gasto
          </label>
          <label>
            <input
              type="radio"
              value="income"
              checked={newTransaction.type === 'income'}
              onChange={(e) => setNewTransaction({
                ...newTransaction, 
                type: e.target.value,
                category: ''
              })}
              style={{ marginRight: '5px' }}
            />
            Ingreso
          </label>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '10px',
          marginBottom: '10px' 
        }}>
          <input
            type="text"
            placeholder="Descripción"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({
              ...newTransaction, 
              description: e.target.value
            })}
            style={styles.input}
            required
          />
          <input
            type="number"
            placeholder="Monto"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({
              ...newTransaction, 
              amount: e.target.value
            })}
            style={styles.input}
            step="0.01"
            min="0.01"
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <select
            value={newTransaction.category}
            onChange={(e) => setNewTransaction({
              ...newTransaction, 
              category: e.target.value
            })}
            style={{ ...styles.input, width: '100%' }}
            required
          >
            <option value="">Seleccionar categoría</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          style={{ ...styles.button, width: '100%' }}
        >
          AGREGAR {newTransaction.type === 'expense' ? 'GASTO' : 'INGRESO'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm; 