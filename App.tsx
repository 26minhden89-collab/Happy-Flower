import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import InventoryList from './components/InventoryList';
import FinanceList from './components/FinanceList';
import ProductList from './components/ProductList';
import { OrderProvider } from './contexts/OrderContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { ProductProvider } from './contexts/ProductContext';
import { FinanceProvider } from './contexts/FinanceContext';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-20 flex flex-col transition-all duration-300">
        <Header />
        <main className="flex-1 mt-16 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <FinanceProvider>
      <OrderProvider>
        <InventoryProvider>
          <ProductProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/orders" element={<OrderList />} />
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/inventory" element={<InventoryList />} />
                  <Route path="/finance" element={<FinanceList />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Router>
          </ProductProvider>
        </InventoryProvider>
      </OrderProvider>
    </FinanceProvider>
  );
}

export default App;