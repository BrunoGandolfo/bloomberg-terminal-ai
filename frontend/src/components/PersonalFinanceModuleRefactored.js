import React, { forwardRef, useImperativeHandle } from 'react';
import { usePersonalFinance } from './personalFinance/hooks/usePersonalFinance';
import { useBudgetCalculations } from './personalFinance/hooks/useBudgetCalculations';
import { styles } from './personalFinance/utils/personalFinanceStyles';

// Importaciones normales de componentes
import BudgetManager from './personalFinance/components/BudgetManager';
import TransactionForm from './personalFinance/components/TransactionForm';
import ExpenseChart from './personalFinance/components/ExpenseChart';
import IncomeSourcesList from './personalFinance/components/IncomeSourcesList';
import TransactionList from './personalFinance/components/TransactionList';
import BudgetModal from './personalFinance/components/BudgetModal';
import CategoryModal from './personalFinance/components/CategoryModal';

const PersonalFinanceModuleRefactored = forwardRef((props, ref) => {
  const {
    transactions,
    expenseCategories,
    incomeCategories,
    monthlyBudget,
    savings,
    showBudgetModal,
    showCategoryModal,
    newCategory,
    categoryType,
    newTransaction,
    setMonthlyBudget,
    setShowBudgetModal,
    setShowCategoryModal,
    setNewCategory,
    setCategoryType,
    setNewTransaction,
    addTransaction,
    addCategory
  } = usePersonalFinance();

  const {
    monthlyTransactions,
    totals,
    budgetRemaining,
    budgetUsedPercent,
    potentialSavingsPercent,
    budgetStatus,
    categorySpending,
    categoryIncome,
    categoryChartData
  } = useBudgetCalculations(transactions, monthlyBudget);

  // Exponer función refreshData
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      console.log('🔄 PersonalFinanceModule: Datos locales, no requiere actualización');
      console.log('✅ PersonalFinanceModule: Sincronización completada');
    }
  }));

  const currentMonth = new Date().getMonth();

  return (
    <div>
      <h2 style={{ color: '#FF8800', marginBottom: '20px' }}>FINANZAS PERSONALES</h2>

      {/* Botones de Acción */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowCategoryModal(true)}
          style={styles.button}
        >
          AGREGAR CATEGORÍA
        </button>
      </div>

      {/* Resumen Financiero y Formulario */}
      <div style={styles.grid}>
        <div style={styles.panel}>
          <h3>RESUMEN FINANCIERO</h3>
          <div style={{ fontSize: '18px' }}>
            <div>
              Ingresos: 
              <span style={{ ...styles.priceUp, marginLeft: '10px' }}>
                ${totals.income.toFixed(2)}
              </span>
            </div>
            <div>
              Gastos: 
              <span style={{ ...styles.priceDown, marginLeft: '10px' }}>
                ${totals.expenses.toFixed(2)}
              </span>
            </div>
            <div style={{ 
              borderTop: '1px solid #FF8800', 
              marginTop: '10px', 
              paddingTop: '10px',
              fontWeight: 'bold'
            }}>
              Balance: 
              <span style={{ 
                color: totals.balance >= 0 ? '#00FF00' : '#FF0000',
                marginLeft: '10px'
              }}>
                ${totals.balance.toFixed(2)}
              </span>
            </div>
            <div style={{ marginTop: '10px' }}>
              Ahorros Acumulados: 
              <span style={{ color: '#FFFF00', marginLeft: '10px' }}>
                ${savings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <TransactionForm
          newTransaction={newTransaction}
          setNewTransaction={setNewTransaction}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          onSubmit={addTransaction}
        />
      </div>

      {/* Presupuesto y Gráficos */}
      <div style={styles.grid}>
        <BudgetManager
          monthlyBudget={monthlyBudget}
          totals={totals}
          budgetRemaining={budgetRemaining}
          budgetUsedPercent={budgetUsedPercent}
          potentialSavingsPercent={potentialSavingsPercent}
          budgetStatus={budgetStatus}
          onConfigureBudget={() => setShowBudgetModal(true)}
        />

        <ExpenseChart categoryChartData={categoryChartData} />

        <IncomeSourcesList 
          incomeCategories={incomeCategories}
          categoryIncome={categoryIncome}
        />
      </div>

      {/* Lista de Transacciones */}
      <TransactionList 
        transactions={transactions}
        monthlyBudget={monthlyBudget}
        currentMonth={currentMonth}
      />

      {/* Modales */}
      {showBudgetModal && (
        <BudgetModal
          monthlyBudget={monthlyBudget}
          onSave={setMonthlyBudget}
          onClose={() => setShowBudgetModal(false)}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          categoryType={categoryType}
          setCategoryType={setCategoryType}
          onSave={addCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  );
});

PersonalFinanceModuleRefactored.displayName = 'PersonalFinanceModuleRefactored';

export default PersonalFinanceModuleRefactored; 