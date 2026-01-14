import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order } from '../types';
import { MOCK_ORDERS } from '../services/mockData';

interface OrderContextType {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  deleteOrder: (id: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const deleteOrder = (id: string) => {
    setOrders((prevOrders) => prevOrders.filter((o) => o.id !== id));
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