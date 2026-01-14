import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
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
    password: '123', // Demo password
    role: 'admin',
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (foundUser) {
      const { password, ...safeUser } = foundUser;
      setUser(safeUser as User);
      localStorage.setItem('happy_flower_user', JSON.stringify(safeUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      setIsLoading(false);
      return false; // Email already exists
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      password,
      role: 'staff', // Default role
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    
    // Auto login after register
    const { password: _, ...safeUser } = newUser;
    setUser(safeUser as User);
    localStorage.setItem('happy_flower_user', JSON.stringify(safeUser));
    
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('happy_flower_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading }}>
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