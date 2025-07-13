import { useState } from 'react';

export const usePersonalFinance = () => {
  // Estado de transacciones
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2024-01-15', description: 'Salario Mensual', amount: 5000, type: 'income', category: 'Salario' },
    { id: 2, date: '2024-01-16', description: 'Supermercado Walmart', amount: -150, type: 'expense', category: 'Alimentación' },
    { id: 3, date: '2024-01-17', description: 'Gasolina Shell', amount: -60, type: 'expense', category: 'Transporte' },
    { id: 4, date: '2024-01-18', description: 'Proyecto Freelance', amount: 800, type: 'income', category: 'Freelance' },
    { id: 5, date: '2024-01-19', description: 'Netflix', amount: -15, type: 'expense', category: 'Suscripciones' },
    { id: 6, date: '2024-01-20', description: 'Dividendos AAPL', amount: 125, type: 'income', category: 'Inversiones' }
  ]);

  // Categorías
  const [expenseCategories, setExpenseCategories] = useState([
    'Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Suscripciones',
    'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Mascotas', 'Otros'
  ]);

  const [incomeCategories, setIncomeCategories] = useState([
    'Salario', 'Freelance', 'Inversiones', 'Alquiler', 'Ventas',
    'Bonos', 'Reembolsos', 'Regalos', 'Otros'
  ]);

  // Presupuesto y ahorros
  const [monthlyBudget, setMonthlyBudget] = useState(3000);
  const [savings, setSavings] = useState(1250);

  // Estados de UI
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryType, setCategoryType] = useState('expense');

  // Estado para nueva transacción
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: ''
  });

  // Funciones
  const addTransaction = () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.category) {
      setTransactions([...transactions, {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        ...newTransaction,
        amount: newTransaction.type === 'expense' ? 
          -Math.abs(Number(newTransaction.amount)) : 
          Math.abs(Number(newTransaction.amount))
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

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return {
    // Estado
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
    
    // Setters
    setTransactions,
    setExpenseCategories,
    setIncomeCategories,
    setMonthlyBudget,
    setSavings,
    setShowBudgetModal,
    setShowCategoryModal,
    setNewCategory,
    setCategoryType,
    setNewTransaction,
    
    // Acciones
    addTransaction,
    addCategory,
    deleteTransaction
  };
}; 