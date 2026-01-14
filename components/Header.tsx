import React, { useState } from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

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
        
        <div className="relative">
            <div 
                className="flex items-center space-x-2 pl-4 border-l border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowDropdown(!showDropdown)}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-200" />
              ) : (
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                    {user?.name.charAt(0)}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <span className="text-xs text-gray-500 capitalize">{user?.role === 'admin' ? 'Quản lý' : 'Nhân viên'}</span>
              </div>
            </div>

            {showDropdown && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100 animate-fade-in">
                    <button 
                        onClick={logout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Đăng xuất
                    </button>
                </div>
                </>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;