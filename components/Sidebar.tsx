import React from 'react';
import { LayoutDashboard, ShoppingCart, Settings, Flower2, PackageSearch, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-500' 
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800';
  };

  return (
    <div className="fixed left-0 top-0 h-screen bg-white shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out w-20 hover:w-64 group overflow-hidden border-r border-gray-100">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 shrink-0 border-b border-gray-100 whitespace-nowrap overflow-hidden">
        <Flower2 className="w-8 h-8 text-orange-500 min-w-[32px]" />
        <span className="ml-3 text-xl font-bold text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
          Happy Flower
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 space-y-2">
        <Link 
          to="/" 
          className={`flex items-center px-6 py-3 transition-all duration-200 whitespace-nowrap overflow-hidden h-12 ${isActive('/')}`}
          title="Tổng quan"
        >
          <LayoutDashboard className="w-6 h-6 min-w-[24px]" />
          <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
            Tổng quan
          </span>
        </Link>
        <Link 
          to="/orders" 
          className={`flex items-center px-6 py-3 transition-all duration-200 whitespace-nowrap overflow-hidden h-12 ${isActive('/orders')}`}
          title="Quản lý đơn hàng"
        >
          <ShoppingCart className="w-6 h-6 min-w-[24px]" />
          <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
            Quản lý đơn hàng
          </span>
        </Link>
        <Link 
          to="/inventory" 
          className={`flex items-center px-6 py-3 transition-all duration-200 whitespace-nowrap overflow-hidden h-12 ${isActive('/inventory')}`}
          title="Quản lý kho"
        >
          <PackageSearch className="w-6 h-6 min-w-[24px]" />
          <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
            Quản lý kho
          </span>
        </Link>
        <Link 
          to="/finance" 
          className={`flex items-center px-6 py-3 transition-all duration-200 whitespace-nowrap overflow-hidden h-12 ${isActive('/finance')}`}
          title="Quản lý Chi"
        >
          <Wallet className="w-6 h-6 min-w-[24px]" />
          <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
            Quản lý Chi
          </span>
        </Link>
      </nav>

      {/* Settings Section */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <div className="flex items-center px-2 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-lg cursor-pointer whitespace-nowrap overflow-hidden h-12 transition-colors">
          <Settings className="w-6 h-6 min-w-[24px]" />
          <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
            Cấu hình
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;