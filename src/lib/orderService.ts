"use server";

import { supabase } from './supabase';

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  items: Record<string, number>;
  status: string;
  created_at: string;
}

export const saveOrder = async (userId: string, totalAmount: number, items: Record<string, number>): Promise<{ success: boolean, order?: Order }> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          total_amount: totalAmount,
          items: items
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, order: data as Order };
  } catch (error) {
    console.error('Save order error:', error);
    return { success: false };
  }
};

export const getOrders = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get orders error:', error);
    return [];
  }
};
