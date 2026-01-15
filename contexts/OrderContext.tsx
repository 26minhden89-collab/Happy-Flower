import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order } from '../types';
import { MOCK_ORDERS } from '../services/mockData';

interface OrderContextType {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  deleteOrder: (id: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = 'happy_flower_orders_data';

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrdersState] = useState<Order[]>([]);

  // Load data on mount
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (storedData) {
      setOrdersState(JSON.parse(storedData));
    } else {
      // First time? Give them mock data
      setOrdersState(MOCK_ORDERS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ORDERS));
    }
  }, []);

  const setOrders = (newOrders: Order[]) => {
    setOrdersState(newOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
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