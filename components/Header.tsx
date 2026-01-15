import React from 'react';
import { Bell, Search } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 fixed top-0 left-20 right-0 z-40 transition-all duration-300">
      <div className="flex items-center w-96">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Tìm kiếm mã đơn, SĐT khách hàng..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        
        <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                HF
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">Shop Manager</span>
              <span className="text-xs text-gray-500">Happy Flower</span>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;