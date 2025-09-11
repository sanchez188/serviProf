import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

const supabaseUrl = environment.supabaseUrl;
const supabaseAnonKey = environment.supabaseAnonKey;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== '' && supabaseAnonKey !== '' &&
    supabaseUrl.includes('supabase.co'));
};

// Test connection function
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
  }
};

// Create Supabase client
export const supabase = isSupabaseConfigured() ? createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: true
    },
    global: {
      headers: {
        'X-Client-Info': 'serviprof-app'
      }
    }
  }
) : createClient('https://placeholder.supabase.co', 'placeholder-key');
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          user_type: string | null;
          phone: string | null;
          address: string | null;
          avatar: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          user_type?: string | null;
          phone?: string | null;
          address?: string | null;
          avatar?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          user_type?: string | null;
          phone?: string | null;
          address?: string | null;
          avatar?: string | null;
          created_at?: string | null;
        };
      };
      professionals: {
        Row: {
          id: string;
          category_id: string | null;
          hourly_rate: number;
          description: string | null;
          skills: string[] | null;
          experience: number | null;
          location: string | null;
          is_verified: boolean | null;
          rating: number | null;
          review_count: number | null;
          completed_jobs: number | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          category_id?: string | null;
          hourly_rate: number;
          description?: string | null;
          skills?: string[] | null;
          experience?: number | null;
          location?: string | null;
          is_verified?: boolean | null;
          rating?: number | null;
          review_count?: number | null;
          completed_jobs?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          hourly_rate?: number;
          description?: string | null;
          skills?: string[] | null;
          experience?: number | null;
          location?: string | null;
          is_verified?: boolean | null;
          rating?: number | null;
          review_count?: number | null;
          completed_jobs?: number | null;
          created_at?: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          user_id: string | null;
          category_id: string | null;
          title: string;
          description: string | null;
          price_type: string | null;
          price: number | null;
          hourly_rate: number | null;
          location: string | null;
          images: string[] | null;
          tags: string[] | null;
          availability_schedule: any | null;
          is_active: boolean | null;
          rating: number | null;
          review_count: number | null;
          total_orders: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          category_id?: string | null;
          title: string;
          description?: string | null;
          price_type?: string | null;
          price?: number | null;
          hourly_rate?: number | null;
          location?: string | null;
          images?: string[] | null;
          tags?: string[] | null;
          availability_schedule?: any | null;
          is_active?: boolean | null;
          rating?: number | null;
          review_count?: number | null;
          total_orders?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          category_id?: string | null;
          title?: string;
          description?: string | null;
          price_type?: string | null;
          price?: number | null;
          hourly_rate?: number | null;
          location?: string | null;
          images?: string[] | null;
          tags?: string[] | null;
          availability_schedule?: any | null;
          is_active?: boolean | null;
          rating?: number | null;
          review_count?: number | null;
          total_orders?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          color: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          created_at?: string | null;
        };
      };
      availability: {
        Row: {
          id: string;
          professional_id: string | null;
          day_of_week: number | null;
          start_time: string;
          end_time: string;
          is_available: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          professional_id?: string | null;
          day_of_week?: number | null;
          start_time: string;
          end_time: string;
          is_available?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          professional_id?: string | null;
          day_of_week?: number | null;
          start_time?: string;
          end_time?: string;
          is_available?: boolean | null;
          created_at?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string | null;
          professional_id: string | null;
          date: string;
          start_time: string;
          end_time: string;
          hours: number;
          total_price: number;
          status: string | null;
          description: string | null;
          created_at: string | null;
          completed_at: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          review_id: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          professional_id?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          hours: number;
          total_price: number;
          status?: string | null;
          description?: string | null;
          created_at?: string | null;
          completed_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          review_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          professional_id?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          hours?: number;
          total_price?: number;
          status?: string | null;
          description?: string | null;
          created_at?: string | null;
          completed_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          review_id?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string | null;
          user_id: string | null;
          professional_id: string | null;
          rating: number | null;
          comment: string | null;
          service_type: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          user_id?: string | null;
          professional_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          service_type?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          user_id?: string | null;
          professional_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          service_type?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
};