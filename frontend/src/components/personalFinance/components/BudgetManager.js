import React from 'react';
import { styles } from '../utils/personalFinanceStyles';

const BudgetManager = ({ 
  monthlyBudget, 
  totals, 
  budgetRemaining, 
  budgetUsedPercent, 
  potentialSavingsPercent,
  budgetStatus,
  onConfigureBudget 
}) => {
  const getProgressBarColor = () => {
    switch(budgetStatus) {
      case 'critical': return '#FF0000';
      case 'warning': return '#FFFF00';
      default: return '#00FF00';
    }
  };

  return (
    <div style={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>PRESUPUESTO MENSUAL</h3>
        <button
          onClick={onConfigureBudget}
          style={{ ...styles.button, padding: '5px 15px', fontSize: '11px' }}
        >
          CONFIGURAR
        </button>
      </div>
      
      <div style={{ fontSize: '18px' }}>
        <div>
          Presupuesto Total: 
          <span style={{ color: '#FFFF00', marginLeft: '10px' }}>
            ${monthlyBudget.toFixed(2)}
          </span>
        </div>
        
        <div>
          Gastos del Mes: 
          <span style={{ ...styles.priceDown, marginLeft: '10px' }}>
            ${totals.expenses.toFixed(2)}
          </span>
        </div>
        
        <div>
          Presupuesto Restante:
          <span style={{
            color: budgetRemaining > 0 ? '#00FF00' : '#FF0000',
            marginLeft: '10px'
          }}>
            ${budgetRemaining.toFixed(2)} ({potentialSavingsPercent.toFixed(1)}%)
          </span>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${Math.min(budgetUsedPercent, 100)}%`,
              backgroundColor: getProgressBarColor()
            }}>
              {budgetUsedPercent.toFixed(0)}%
            </div>
          </div>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#888', 
            marginTop: '5px',
            textAlign: 'center'
          }}>
            {budgetStatus === 'critical' && '⚠️ PRESUPUESTO CRÍTICO'}
            {budgetStatus === 'warning' && '⚠️ ATENCIÓN AL GASTO'}
            {budgetStatus === 'good' && '✅ BUEN CONTROL DE GASTOS'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager; 