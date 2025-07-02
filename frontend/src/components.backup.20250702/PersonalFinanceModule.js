import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// Estilos Bloomberg Terminal
const styles = {
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
  }
};

// Módulo de Finanzas Personales
function PersonalFinanceModule() {
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2024-01-15', description: 'Salario Mensual', amount: 5000, type: 'income', category: 'Salario' },
    { id: 2, date: '2024-01-16', description: 'Supermercado Walmart', amount: -150, type: 'expense', category: 'Alimentación' },
    { id: 3, date: '2024-01-17', description: 'Gasolina Shell', amount: -60, type: 'expense', category: 'Transporte' },
    { id: 4, date: '2024-01-18', description: 'Proyecto Freelance', amount: 800, type: 'income', category: 'Freelance' },
    { id: 5, date: '2024-01-19', description: 'Netflix', amount: -15, type: 'expense', category: 'Suscripciones' },
    { id: 6, date: '2024-01-20', description: 'Dividendos AAPL', amount: 125, type: 'income', category: 'Inversiones' }
  ]);

  // Categorías separadas para ingresos y gastos
  const [expenseCategories, setExpenseCategories] = useState([
    'Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Suscripciones',
    'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Mascotas', 'Otros'
  ]);

  const [incomeCategories, setIncomeCategories] = useState([
    'Salario', 'Freelance', 'Inversiones', 'Alquiler', 'Ventas',
    'Bonos', 'Reembolsos', 'Regalos', 'Otros'
  ]);

  // Presupuesto mensual único
  const [monthlyBudget, setMonthlyBudget] = useState(3000);
  const [savings, setSavings] = useState(1250); // Ahorro acumulado

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: ''
  });

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryType, setCategoryType] = useState('expense');

  const addTransaction = () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.category) {
      setTransactions([...transactions, {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        ...newTransaction,
        amount: newTransaction.type === 'expense' ? -Math.abs(Number(newTransaction.amount)) : Math.abs(Number(newTransaction.amount))
      }]);
      setNewTransaction({ description: '', amount: '', type: 'expense', category: '' });
    }
  };

  const addCategory = () => {
    if (newCategory.trim()) {
      if (categoryType === 'expense') {
        setExpenseCategories([...expenseCategories, newCategory]);
      } else {
        setIncomeCategories([...incomeCategories, newCategory]);
      }
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  // Calcular totales y presupuesto restante
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totals = monthlyTransactions.reduce((acc, t) => {
    if (t.amount > 0) acc.income += t.amount;
    else acc.expenses += Math.abs(t.amount);
    return acc;
  }, { income: 0, expenses: 0 });

  totals.balance = totals.income - totals.expenses;

  // Cálculo del presupuesto restante
  const budgetRemaining = monthlyBudget - totals.expenses;
  const budgetUsedPercent = monthlyBudget > 0 ? (totals.expenses / monthlyBudget * 100) : 0;
  const potentialSavingsPercent = budgetRemaining > 0 ? (budgetRemaining / monthlyBudget * 100) : 0;

  // Gastos por categoría
  const categorySpending = {};
  monthlyTransactions.filter(t => t.amount < 0).forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
  });

  // Datos para gráficos
  const categoryData = Object.entries(categorySpending).map(([category, spent]) => ({
    name: category,
    value: spent
  }));

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>FINANZAS PERSONALES</h2>

      {/* Botones de Acción */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowBudgetModal(true)}
          style={{ ...styles.button, marginRight: '10px' }}
        >
          CONFIGURAR PRESUPUESTO MENSUAL
        </button>
        <button
          onClick={() => setShowCategoryModal(true)}
          style={styles.button}
        >
          AGREGAR CATEGORÍA
        </button>
      </div>

      {/* Resumen Financiero y Presupuesto */}
      <div style={styles.grid}>
        <div style={styles.panel}>
          <h3>PRESUPUESTO MENSUAL</h3>
          <div style={{ fontSize: '18px' }}>
            <div>Presupuesto Total: <span style={{ color: '#FFFF00' }}>${monthlyBudget.toFixed(2)}</span></div>
            <div>Gastos del Mes: <span style={styles.priceDown}>${totals.expenses.toFixed(2)}</span></div>
            <div>Presupuesto Restante:
              <span style={budgetRemaining > 0 ? styles.priceUp : styles.priceDown}>
                ${budgetRemaining.toFixed(2)} ({potentialSavingsPercent.toFixed(1)}%)
              </span>
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{
                width: '100%',
                height: '25px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(budgetUsedPercent, 100)}%`,
                  height: '100%',
                  backgroundColor: budgetUsedPercent > 90 ? '#FF0000' : budgetUsedPercent > 70 ? '#FFFF00' : '#00FF00',
                  transition: 'width 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  {budgetUsedPercent > 10 && `${budgetUsedPercent.toFixed(0)}%`}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <h3>CUENTA DE AHORRO</h3>
          <div style={{ fontSize: '18px' }}>
            <div>Ahorro Acumulado: <span style={styles.priceUp}>${savings.toFixed(2)}</span></div>
            <div>Potencial este mes:
              <span style={budgetRemaining > 0 ? styles.priceUp : { color: '#888' }}>
                ${budgetRemaining > 0 ? budgetRemaining.toFixed(2) : '0.00'}
              </span>
            </div>
            <div>% Ahorro del Presupuesto:
              <span style={{ color: potentialSavingsPercent > 20 ? '#00FF00' : potentialSavingsPercent > 10 ? '#FFFF00' : '#FF8800' }}>
                {potentialSavingsPercent.toFixed(1)}%
              </span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
              Meta recomendada: 20% del presupuesto
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del Mes */}
      <div style={styles.panel}>
        <h3>RESUMEN COMPLETO DEL MES</h3>
        <div style={styles.grid}>
          <div>
            <div style={{ marginBottom: '10px' }}>Ingresos Totales: <span style={styles.priceUp}>${totals.income.toFixed(2)}</span></div>
            <div style={{ marginBottom: '10px' }}>Gastos Totales: <span style={styles.priceDown}>${totals.expenses.toFixed(2)}</span></div>
            <div>Balance Real: <span style={totals.balance > 0 ? styles.priceUp : styles.priceDown}>${totals.balance.toFixed(2)}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#FF8800' }}>Estado del Presupuesto:</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>
              {budgetRemaining > 0 ? (
                <span style={styles.priceUp}>EN PRESUPUESTO ✓</span>
              ) : (
                <span style={styles.priceDown}>SOBREPASADO ✗</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agregar Transacción */}
      <div style={styles.panel}>
        <h3>NUEVA TRANSACCIÓN</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <input
            type="text"
            placeholder="Descripción"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
            style={{ ...styles.input, width: '100%', margin: 0 }}
          />
          <input
            type="number"
            placeholder="Monto"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
            style={{ ...styles.input, width: '100%', margin: 0 }}
          />
          <select
            value={newTransaction.type}
            onChange={(e) => {
              setNewTransaction({
                ...newTransaction,
                type: e.target.value,
                category: ''
              });
            }}
            style={{ ...styles.input, width: '100%', margin: 0 }}
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
          <select
            value={newTransaction.category}
            onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
            style={{ ...styles.input, width: '100%', margin: 0 }}
          >
            <option value="">Categoría</option>
            {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={addTransaction} style={{ ...styles.button, margin: 0 }}>+</button>
        </div>
      </div>

      {/* Gráficos */}
      <div style={styles.grid}>
        <div style={styles.panel}>
          <h3>DISTRIBUCIÓN DE GASTOS</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#FF8800', '#00FF00', '#FF0000', '#FFFF00', '#00FFFF', '#FF00FF'][index % 6]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.panel}>
          <h3>INGRESOS POR FUENTE</h3>
          <div>
            {incomeCategories.map(cat => {
              const amount = monthlyTransactions
                .filter(t => t.amount > 0 && t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);

              if (amount === 0) return null;

              return (
                <div key={cat} style={{
                  padding: '10px',
                  marginBottom: '5px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{cat}</span>
                  <span style={styles.priceUp}>${amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de Transacciones */}
      <div style={styles.panel}>
        <h3>TRANSACCIONES RECIENTES</h3>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #FF8800' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Descripción</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Categoría</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Monto</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Presupuesto</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice().reverse().map((t, index) => {
                // Calcular presupuesto restante después de cada transacción
                const previousExpenses = transactions
                  .slice(0, transactions.length - index - 1)
                  .filter(tr => tr.amount < 0 && new Date(tr.date).getMonth() === currentMonth)
                  .reduce((sum, tr) => sum + Math.abs(tr.amount), 0);

                const budgetAfter = monthlyBudget - previousExpenses - (t.amount < 0 ? Math.abs(t.amount) : 0);

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px' }}>{t.date}</td>
                    <td style={{ padding: '10px' }}>{t.description}</td>
                    <td style={{ padding: '10px' }}>{t.category}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: t.amount > 0 ? '#00FF00' : '#FF0000' }}>
                      {t.amount > 0 ? '+' : ''} ${Math.abs(t.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: budgetAfter > 0 ? '#00FF00' : '#FF0000' }}>
                      ${budgetAfter.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Presupuesto */}
      {showBudgetModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '2px solid #FF8800',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>CONFIGURAR PRESUPUESTO MENSUAL</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                Presupuesto para gastos del mes:
              </label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                style={{ ...styles.input, width: '100%' }}
                placeholder="Ej: 3000"
              />
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>
              Este es el monto máximo que planeas gastar este mes.
              Lo que sobre irá automáticamente a tu cuenta de ahorro.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowBudgetModal(false)} style={styles.button}>
                GUARDAR
              </button>
              <button
                onClick={() => setShowBudgetModal(false)}
                style={{ ...styles.button, backgroundColor: '#FF0000' }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categorías */}
      {showCategoryModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '2px solid #FF8800',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>AGREGAR NUEVA CATEGORÍA</h3>
            <select
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value)}
              style={{ ...styles.input, width: '100%', marginBottom: '10px' }}
            >
              <option value="expense">Categoría de Gasto</option>
              <option value="income">Categoría de Ingreso</option>
            </select>
            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ ...styles.input, width: '100%', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={addCategory} style={styles.button}>
                AGREGAR
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory('');
                }}
                style={{ ...styles.button, backgroundColor: '#FF0000' }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonalFinanceModule; 