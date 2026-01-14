import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock initial data if localStorage is empty
const INITIAL_USERS: User[] = [
  {
    id: 'admin',
    name: 'Admin Manager',
    email: 'admin@happyflower.com',
    password: '123', 
    role: 'admin',
    isVerified: true,
    avatar: 'https://ui-avatars.com/api/?name=Admin+Manager&background=f97316&color=fff'
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('happy_flower_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Helper to get all registered users
  const getUsers = (): User[] => {
    const users = localStorage.getItem('happy_flower_db_users');
    return users ? JSON.parse(users) : INITIAL_USERS;
  };

  // Helper to save users
  const saveUsers = (users: User[]) => {
    localStorage.setItem('happy_flower_db_users', JSON.stringify(users));
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (foundUser) {
      if (!foundUser.isVerified) {
        setIsLoading(false);
        return { success: false, message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.' };
      }

      const { password, ...safeUser } = foundUser;
      setUser(safeUser as User);
      localStorage.setItem('happy_flower_user', JSON.stringify(safeUser));
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, message: 'Email hoặc mật khẩu không chính xác.' };
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      setIsLoading(false);
      return { success: false, message: 'Email này đã được sử dụng.' };
    }

    // Mock verification code
    const verificationCode = '123456'; 

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      password,
      role: 'staff',
      isVerified: false,
      verificationCode,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    
    // Do not login immediately, require verification
    setIsLoading(false);
    console.log(`[MOCK EMAIL] Verification code for ${email}: ${verificationCode}`);
    return { success: true };
  };

  const verifyEmail = async (email: string, code: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
        setIsLoading(false);
        return { success: false, message: 'Không tìm thấy người dùng.' };
    }

    if (users[userIndex].verificationCode === code) {
        users[userIndex].isVerified = true;
        users[userIndex].verificationCode = undefined; // Clear code
        saveUsers(users);
        setIsLoading(false);
        return { success: true };
    }

    setIsLoading(false);
    return { success: false, message: 'Mã xác thực không đúng.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('happy_flower_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, verifyEmail, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};