import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';


const supabaseUrl = "https://xahcororbsrntzcqyrvi.supabase.co"; //import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhaGNvcm9yYnNybnR6Y3F5cnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjIzNTcsImV4cCI6MjA3MzA5ODM1N30.eKQta47-dKIHEeHZJ985O6g2dbKg_r7gO1QSlGOQYis"; //import.meta.env.VITE_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Please connect to Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

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