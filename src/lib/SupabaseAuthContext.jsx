import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getOrganizerProfile } from './supabase';

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
        await loadOrganizerProfile(session.user.id);
      } else {
        setUser(null);
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
        await loadOrganizerProfile(session.user.id);
      }
    } catch (err) {
      console.error('[Auth] Session check error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizerProfile = async (userId) => {
    try {
      const profile = await getOrganizerProfile(userId);
      setOrganizer(profile);
    } catch (err) {
      console.error('[Auth] Organizer profile error:', err);
      // L'utilisateur n'est peut-être pas un organisateur
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

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setOrganizer(null);
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    organizer,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isOrganizer: !!organizer,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
