import { useMemo } from 'react';

export const useBudgetCalculations = (transactions, monthlyBudget) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filtrar transacciones del mes actual
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  // Calcular totales
  const totals = useMemo(() => {
    return monthlyTransactions.reduce((acc, t) => {
      if (t.amount > 0) acc.income += t.amount;
      else acc.expenses += Math.abs(t.amount);
      return acc;
    }, { income: 0, expenses: 0, balance: 0 });
  }, [monthlyTransactions]);

  // Agregar balance a totals
  totals.balance = totals.income - totals.expenses;

  // Cálculos de presupuesto
  const budgetCalculations = useMemo(() => {
    const budgetRemaining = monthlyBudget - totals.expenses;
    const budgetUsedPercent = monthlyBudget > 0 ? (totals.expenses / monthlyBudget * 100) : 0;
    const potentialSavingsPercent = budgetRemaining > 0 ? (budgetRemaining / monthlyBudget * 100) : 0;
    
    return {
      budgetRemaining,
      budgetUsedPercent,
      potentialSavingsPercent,
      isOverBudget: budgetRemaining < 0,
      budgetStatus: budgetUsedPercent > 90 ? 'critical' : 
                    budgetUsedPercent > 70 ? 'warning' : 'good'
    };
  }, [monthlyBudget, totals.expenses]);

  // Gastos por categoría
  const categorySpending = useMemo(() => {
    const spending = {};
    monthlyTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + Math.abs(t.amount);
      });
    return spending;
  }, [monthlyTransactions]);

  // Ingresos por categoría
  const categoryIncome = useMemo(() => {
    const income = {};
    monthlyTransactions
      .filter(t => t.amount > 0)
      .forEach(t => {
        income[t.category] = (income[t.category] || 0) + t.amount;
      });
    return income;
  }, [monthlyTransactions]);

  // Datos para gráficos
  const categoryChartData = useMemo(() => {
    return Object.entries(categorySpending).map(([category, spent]) => ({
      name: category,
      value: spent
    }));
  }, [categorySpending]);

  // Calcular presupuesto restante después de cada transacción
  const getRunningBudget = (transactionIndex) => {
    const previousExpenses = transactions
      .slice(0, transactionIndex)
      .filter(tr => tr.amount < 0 && new Date(tr.date).getMonth() === currentMonth)
      .reduce((sum, tr) => sum + Math.abs(tr.amount), 0);
    
    const currentTransaction = transactions[transactionIndex];
    const expense = currentTransaction.amount < 0 ? Math.abs(currentTransaction.amount) : 0;
    
    return monthlyBudget - previousExpenses - expense;
  };

  return {
    monthlyTransactions,
    totals,
    ...budgetCalculations,
    categorySpending,
    categoryIncome,
    categoryChartData,
    getRunningBudget
  };
}; 