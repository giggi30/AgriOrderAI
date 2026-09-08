"use server";

import { createClient } from './supabase';
import { cookies } from 'next/headers';

/**
 * Interfaccia Utente aggiornata per Supabase.
 */
export interface User {
  id: string;
  companyName: string;
  email: string;
  loyaltyPoints?: number;
  badges?: string[];
  redemptions?: Record<string, number>;
}

export const registerUser = async (companyName: string, email: string, password: string): Promise<{ success: boolean, message: string }> => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName,
        }
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Registrazione completata. Controlla la tua email (se configurato) o effettua il login.' };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Errore durante la registrazione' };
  }
};

export const loginUser = async (email: string, password: string): Promise<{ success: boolean, user?: User, message: string }> => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return { success: false, message: 'Email non confermata. Controlla la tua posta per il link di attivazione.' };
      }
      return { success: false, message: 'Credenziali non valide' };
    }

    // Recupera i dati extra dal profilo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    const sessionUser: User = {
      id: data.user.id,
      email: data.user.email || '',
      companyName: profile?.company_name || 'Nuova Azienda',
      loyaltyPoints: profile?.loyalty_points || 0,
      badges: profile?.badges || [],
      redemptions: profile?.redemptions || {},
    };

    return { success: true, user: sessionUser, message: 'Login effettuato' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Errore durante il login' };
  }
};

export const updateLoyalty = async (userId: string, points: number, badges: string[], redemptions: Record<string, number>): Promise<{ success: boolean }> => {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        loyalty_points: points,
        badges: badges,
        redemptions: redemptions
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update loyalty error:', error);
    return { success: false };
  }
};

export const getSessionUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email || '',
    companyName: profile?.company_name || 'Nuova Azienda',
    loyaltyPoints: profile?.loyalty_points || 0,
    badges: profile?.badges || [],
    redemptions: profile?.redemptions || {},
  };
};

export const logout = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
};
