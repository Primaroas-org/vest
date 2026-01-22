import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  register: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock User
const mockUser: User = {
  id: 'u1',
  name: 'Battulga Erden',
  email: 'battulga@example.com',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8m9Ay_gcICqYNambA7M9ltd2-ipZdoBPxjl-BlhAQ7LD3OuIjSFoFaQaeOMsBqLDL40EECv3E2dzu2aM-9g82kMPIpEwv1cfqXFin3Q7DMoOYwEqi1FJ0VlmPbHdUerdTJQhAYPPL7gWQ8a0GKqE6OKvS9zyEDXCz9ibS4t8LkcTTZzlrM72sUMzW-ZGUqiwIg9LbJTs8r6_Wya-d60YTfVfSPWP5nT4KDd7UX8H6nXladIo5tUjpockgF7BaVq8pPz5SCAZ1qR0',
  isVerified: true,
  balance: 5400000
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = () => {
    // Simulate API call
    setUser(mockUser);
  };

  const register = () => {
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, register }}>
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