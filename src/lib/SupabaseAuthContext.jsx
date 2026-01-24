import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const SupabaseAuthContext = createContext(null);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Vérifier la session au chargement
    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event);
      if (session?.user) {
        setUser(session.user);
        await loadUserRole(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
        setOrganizer(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadUserRole(session.user.id);
      }
    } catch (err) {
      console.error('[Auth] Session check error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async (userId) => {
    try {
      // Charger le rôle de l'utilisateur depuis user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleError) {
        console.error('[Auth] Role lookup error:', roleError);
        setUserRole(null);
        setOrganizer(null);
        return;
      }

      setUserRole(roleData?.role);
      console.log('[Auth] User role:', roleData?.role);

      // Si c'est un organisateur ou scan_agent, charger le profil organisateur
      if (roleData?.role === 'organizer' || roleData?.role === 'scan_agent') {
        const { data: orgData, error: orgError } = await supabase
          .from('organizers')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (!orgError && orgData) {
          setOrganizer(orgData);
          console.log('[Auth] Organizer profile loaded:', orgData.company_name);
        } else {
          console.log('[Auth] No organizer profile found');
          setOrganizer(null);
        }
      } else {
        setOrganizer(null);
      }
    } catch (err) {
      console.error('[Auth] Load user role error:', err);
      setUserRole(null);
      setOrganizer(null);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
        }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setOrganizer(null);
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur peut scanner (organizer ou scan_agent)
  const canScan = userRole === 'organizer' || userRole === 'scan_agent';

  const value = {
    user,
    userRole,
    organizer,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isOrganizer: userRole === 'organizer',
    isScanAgent: userRole === 'scan_agent',
    canScan,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
