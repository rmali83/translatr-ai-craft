import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface UserRole {
  role: 'admin' | 'project_manager' | 'translator' | 'reviewer';
  project_id: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  roles: UserRole[];
  primary_role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: string, projectId?: string) => boolean;
  canEdit: (projectId?: string) => boolean;
  canReview: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, project_id')
        .eq('user_id', authUser.id);

      if (rolesError) throw rolesError;

      // Determine primary role (first global role or first role)
      const globalRole = roles?.find(r => r.project_id === null);
      const primaryRole = globalRole?.role || roles?.[0]?.role || 'translator';

      setUser({
        id: authUser.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
        roles: roles || [],
        primary_role: primaryRole,
      });

      // Store user ID for API calls
      localStorage.setItem('x-user-id', authUser.id);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('x-user-id');
    setUser(null);
  };

  const hasRole = (role: string, projectId?: string): boolean => {
    if (!user) return false;

    // Admin has access to everything
    if (user.roles.some(r => r.role === 'admin' && r.project_id === null)) {
      return true;
    }

    // Check specific role
    if (projectId) {
      return user.roles.some(
        r => r.role === role && (r.project_id === projectId || r.project_id === null)
      );
    }

    return user.roles.some(r => r.role === role);
  };

  const canEdit = (projectId?: string): boolean => {
    if (!user) return false;
    return (
      isAdmin() ||
      hasRole('project_manager', projectId) ||
      hasRole('translator', projectId)
    );
  };

  const canReview = (): boolean => {
    if (!user) return false;
    return isAdmin() || hasRole('reviewer');
  };

  const isAdmin = (): boolean => {
    if (!user) return false;
    return hasRole('admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        hasRole,
        canEdit,
        canReview,
        isAdmin,
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
