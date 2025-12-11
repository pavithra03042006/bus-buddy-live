import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types/bus';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user storage (in production, this would be a database)
const mockUsers: Map<string, { user: User; password: string }> = new Map();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('bus_tracker_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const stored = mockUsers.get(email);
    if (stored && stored.password === password) {
      setUser(stored.user);
      localStorage.setItem('bus_tracker_user', JSON.stringify(stored.user));
      return true;
    }

    // Demo login - allow any email/password for testing
    const demoUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'passenger',
    };
    setUser(demoUser);
    localStorage.setItem('bus_tracker_user', JSON.stringify(demoUser));
    return true;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (mockUsers.has(email)) {
        return false; // User already exists
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        phone,
        role: 'passenger',
      };

      mockUsers.set(email, { user: newUser, password });
      setUser(newUser);
      localStorage.setItem('bus_tracker_user', JSON.stringify(newUser));
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('bus_tracker_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
