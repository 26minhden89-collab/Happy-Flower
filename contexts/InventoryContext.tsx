import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { InventoryItem } from '../types';
import { MOCK_INVENTORY } from '../services/mockData';
import { useAuth } from './AuthContext';

interface InventoryContextType {
  inventory: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [inventory, setInventoryState] = useState<InventoryItem[]>([]);

  // Load data for specific user
  useEffect(() => {
    if (user) {
      const storageKey = `happy_flower_inventory_${user.id}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        setInventoryState(JSON.parse(storedData));
      } else {
        setInventoryState(MOCK_INVENTORY);
        localStorage.setItem(storageKey, JSON.stringify(MOCK_INVENTORY));
      }
    } else {
      setInventoryState([]);
    }
  }, [user]);

  const saveInventory = (newInventory: InventoryItem[]) => {
    setInventoryState(newInventory);
    if (user) {
        const storageKey = `happy_flower_inventory_${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(newInventory));
    }
  };

  const addItem = (newItem: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const item: InventoryItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
    };
    saveInventory([item, ...inventory]);
  };

  const updateItem = (id: string, updatedFields: Partial<InventoryItem>) => {
    const updatedInv = inventory.map((item) =>
        item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item
    );
    saveInventory(updatedInv);
  };

  const deleteItem = (id: string) => {
    const updatedInv = inventory.filter((item) => item.id !== id);
    saveInventory(updatedInv);
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