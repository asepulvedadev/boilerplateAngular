/**
 * Tipos TypeScript para Supabase Database
 *
 * NOTA: Estos tipos deben regenerarse cuando cambies el schema de la base de datos
 * Comando: supabase gen types typescript --local > src/app/core/supabase/supabase.types.ts
 */

/**
 * Tablas base del SaaS Boilerplate
 */
export interface Database {
  public: {
    Tables: {
      /**
       * Tabla de perfiles de usuario
       * Extends auth.users con información adicional
       */
      profiles: {
        Row: {
          id: string; // UUID, references auth.users(id)
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'user';
          subscription_tier: 'free' | 'pro' | 'enterprise';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user';
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user';
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          updated_at?: string;
        };
      };

      /**
       * Tabla de suscripciones (Stripe)
       */
      subscriptions: {
        Row: {
          id: string;
          user_id: string; // references profiles(id)
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status: 'active' | 'canceled' | 'past_due' | 'trialing';
          price_id: string;
          quantity: number;
          cancel_at_period_end: boolean;
          current_period_start: string;
          current_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status?: 'active' | 'canceled' | 'past_due' | 'trialing';
          price_id: string;
          quantity?: number;
          cancel_at_period_end?: boolean;
          current_period_start: string;
          current_period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'active' | 'canceled' | 'past_due' | 'trialing';
          cancel_at_period_end?: boolean;
          current_period_end?: string;
          updated_at?: string;
        };
      };

      /**
       * Tabla de logs de actividad
       */
      activity_logs: {
        Row: {
          id: string;
          user_id: string; // references profiles(id)
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Record<string, any> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Record<string, any> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          // Activity logs son inmutables
        };
      };
    };
    Views: {
      // Agregar views aquí cuando las crees
    };
    Functions: {
      // Agregar functions aquí cuando las crees
    };
    Enums: {
      user_role: 'admin' | 'user';
      subscription_tier: 'free' | 'pro' | 'enterprise';
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing';
    };
  };
}

/**
 * Helpers para tipos de tablas
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * Tipos específicos para uso en la aplicación
 */
export type Profile = Tables<'profiles'>;
export type Subscription = Tables<'subscriptions'>;
export type ActivityLog = Tables<'activity_logs'>;

export type ProfileInsert = InsertDto<'profiles'>;
export type SubscriptionInsert = InsertDto<'subscriptions'>;
export type ActivityLogInsert = InsertDto<'activity_logs'>;

export type ProfileUpdate = UpdateDto<'profiles'>;
export type SubscriptionUpdate = UpdateDto<'subscriptions'>;
