import React, { createContext, useContext, useState, ReactNode } from 'react';
import { InventoryItem } from '../types';
import { MOCK_INVENTORY } from '../services/mockData';

interface InventoryContextType {
  inventory: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);

  const addItem = (newItem: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const item: InventoryItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
    };
    setInventory([item, ...inventory]);
  };

  const updateItem = (id: string, updatedFields: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <InventoryContext.Provider value={{ inventory, addItem, updateItem, deleteItem }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};