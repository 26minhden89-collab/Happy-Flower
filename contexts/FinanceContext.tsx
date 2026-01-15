import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Transaction } from '../types';

interface FinanceContextType {
  transactions: Transaction[]; 
  addExpense: (transaction: Omit<Transaction, 'id' | 'type'>) => void;
  deleteTransaction: (id: string) => void;
  getTotalExpenses: () => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY = 'happy_flower_finance_data';

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);

  // Load data on mount
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      setTransactionsState(JSON.parse(storedData));
    } else {
      setTransactionsState([]);
    }
  }, []);

  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactionsState(newTransactions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
  };

  const addExpense = (transactionData: Omit<Transaction, 'id' | 'type'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      type: 'EXPENSE',
      id: Math.random().toString(36).substr(2, 9),
    };
    saveTransactions([newTransaction, ...transactions]);
  };

  const deleteTransaction = (id: string) => {
    const newTransactions = transactions.filter(t => t.id !== id);
    saveTransactions(newTransactions);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <FinanceContext.Provider value={{ transactions, addExpense, deleteTransaction, getTotalExpenses }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};