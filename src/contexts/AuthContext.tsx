import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

export interface UserRole {
  role: 'admin' | 'project_manager' | 'translator' | 'reviewer';
  project_id: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  primary_role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUserId: (userId: string) => void;
  hasRole: (role: string, projectId?: string) => boolean;
  canEdit: (projectId?: string) => boolean;
  canReview: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // Load user ID from localStorage or use default
    const savedUserId = localStorage.getItem('x-user-id') || '00000000-0000-0000-0000-000000000003'; // Default: translator
    setCurrentUserId(savedUserId);
    loadUser(savedUserId);
  }, []);

  const loadUser = async (userId: string) => {
    try {
      setLoading(true);
      const userData = await api.getCurrentUser(userId);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const setUserId = (userId: string) => {
    localStorage.setItem('x-user-id', userId);
    setCurrentUserId(userId);
    loadUser(userId);
  };

  const hasRole = (role: string, projectId?: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.roles.some(r => r.role === 'admin')) return true;
    
    // Check for specific role
    return user.roles.some(
      r => r.role === role && (!projectId || r.project_id === projectId || r.project_id === null)
    );
  };

  const canEdit = (projectId?: string): boolean => {
    if (!user) return false;
    return hasRole('admin') || hasRole('project_manager', projectId) || hasRole('translator', projectId);
  };

  const canReview = (): boolean => {
    if (!user) return false;
    return hasRole('admin') || hasRole('project_manager') || hasRole('reviewer');
  };

  const isAdmin = (): boolean => {
    if (!user) return false;
    return hasRole('admin');
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUserId, hasRole, canEdit, canReview, isAdmin }}>
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
