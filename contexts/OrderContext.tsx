import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order } from '../types';
import { MOCK_ORDERS } from '../services/mockData';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  deleteOrder: (id: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrdersState] = useState<Order[]>([]);

  // 1. Load data when user changes
  useEffect(() => {
    if (user) {
      const storageKey = `happy_flower_orders_${user.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        setOrdersState(JSON.parse(storedData));
      } else {
        // First time user? Give them mock data or empty array
        // For demo, we give MOCK_ORDERS to new users so they see something
        setOrdersState(MOCK_ORDERS);
        localStorage.setItem(storageKey, JSON.stringify(MOCK_ORDERS));
      }
    } else {
      setOrdersState([]);
    }
  }, [user]);

  // 2. Helper to set orders and save to specific user storage
  const setOrders = (newOrders: Order[]) => {
    setOrdersState(newOrders);
    if (user) {
       const storageKey = `happy_flower_orders_${user.id}`;
       localStorage.setItem(storageKey, JSON.stringify(newOrders));
    }
  };

  const deleteOrder = (id: string) => {
    const newOrders = orders.filter((o) => o.id !== id);
    setOrders(newOrders);
  };

  return (
    <OrderContext.Provider value={{ orders, setOrders, deleteOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};