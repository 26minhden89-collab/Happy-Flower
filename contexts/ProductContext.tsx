import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../services/mockData';
import { useAuth } from './AuthContext';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProductsState] = useState<Product[]>([]);

  // Load data for specific user
  useEffect(() => {
    if (user) {
      const storageKey = `happy_flower_products_${user.id}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        setProductsState(JSON.parse(storedData));
      } else {
        setProductsState(MOCK_PRODUCTS);
        localStorage.setItem(storageKey, JSON.stringify(MOCK_PRODUCTS));
      }
    } else {
      setProductsState([]);
    }
  }, [user]);

  const saveProducts = (newProducts: Product[]) => {
    setProductsState(newProducts);
    if (user) {
      const storageKey = `happy_flower_products_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(newProducts));
    }
  };

  const addProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: Math.random().toString(36).substr(2, 9),
    };
    saveProducts([newProduct, ...products]);
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    saveProducts(updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};