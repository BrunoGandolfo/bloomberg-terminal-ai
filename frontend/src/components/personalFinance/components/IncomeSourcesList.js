import React from 'react';
import { styles } from '../utils/personalFinanceStyles';

const IncomeSourcesList = ({ incomeCategories, categoryIncome }) => {
  const totalIncome = Object.values(categoryIncome).reduce((sum, amount) => sum + amount, 0);

  return (
    <div style={styles.panel}>
      <h3>INGRESOS POR FUENTE</h3>
      {Object.keys(categoryIncome).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
          No hay ingresos registrados este mes
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '15px' }}>
            {incomeCategories.map(category => {
              const amount = categoryIncome[category] || 0;
              if (amount === 0) return null;

              const percentage = totalIncome > 0 ? (amount / totalIncome * 100) : 0;

              return (
                <div key={category} style={styles.categoryCard}>
                  <div>
                    <span>{category}</span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#888',
                      marginLeft: '10px' 
                    }}>
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <span style={styles.priceUp}>
                    ${amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div style={{
            borderTop: '1px solid #FF8800',
            paddingTop: '10px',
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            <span>Total Ingresos:</span>
            <span style={styles.priceUp}>${totalIncome.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default IncomeSourcesList; 