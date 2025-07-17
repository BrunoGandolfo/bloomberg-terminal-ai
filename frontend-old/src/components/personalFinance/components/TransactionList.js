import React from 'react';
import { styles } from '../utils/personalFinanceStyles';

const TransactionList = ({ transactions, monthlyBudget, currentMonth }) => {
  // Calcular presupuesto restante después de cada transacción
  const calculateRunningBudget = (index) => {
    const previousExpenses = transactions
      .slice(0, transactions.length - index - 1)
      .filter(tr => tr.amount < 0 && new Date(tr.date).getMonth() === currentMonth)
      .reduce((sum, tr) => sum + Math.abs(tr.amount), 0);

    const transaction = transactions[transactions.length - index - 1];
    const expense = transaction.amount < 0 ? Math.abs(transaction.amount) : 0;
    
    return monthlyBudget - previousExpenses - expense;
  };

  return (
    <div style={styles.panel}>
      <h3>TRANSACCIONES RECIENTES</h3>
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.tableCell, textAlign: 'left' }}>Fecha</th>
              <th style={{ ...styles.tableCell, textAlign: 'left' }}>Descripción</th>
              <th style={{ ...styles.tableCell, textAlign: 'left' }}>Categoría</th>
              <th style={{ ...styles.tableCell, textAlign: 'right' }}>Monto</th>
              <th style={{ ...styles.tableCell, textAlign: 'right' }}>Presupuesto</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice().reverse().map((transaction, index) => {
              const budgetAfter = calculateRunningBudget(index);
              
              return (
                <tr key={transaction.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={styles.tableCell}>{transaction.date}</td>
                  <td style={styles.tableCell}>{transaction.description}</td>
                  <td style={styles.tableCell}>{transaction.category}</td>
                  <td style={{ 
                    ...styles.tableCell, 
                    textAlign: 'right', 
                    color: transaction.amount > 0 ? '#00FF00' : '#FF0000' 
                  }}>
                    {transaction.amount > 0 ? '+' : ''} ${Math.abs(transaction.amount).toFixed(2)}
                  </td>
                  <td style={{ 
                    ...styles.tableCell, 
                    textAlign: 'right', 
                    color: budgetAfter > 0 ? '#00FF00' : '#FF0000' 
                  }}>
                    ${budgetAfter.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ 
                  ...styles.tableCell, 
                  textAlign: 'center', 
                  padding: '30px',
                  color: '#888' 
                }}>
                  No hay transacciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList; 