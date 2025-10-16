/**
 * Environment de producción
 * Configuración para deploy en Vercel
 */
export const environment = {
  production: true,

  /**
   * Supabase Configuration (Production)
   * Variables de entorno en Vercel:
   * - VITE_SUPABASE_URL
   * - VITE_SUPABASE_ANON_KEY
   */
  supabase: {
    url: import.meta.env['VITE_SUPABASE_URL'] || '',
    anonKey: import.meta.env['VITE_SUPABASE_ANON_KEY'] || '',
  },

  /**
   * Stripe Configuration (Production)
   * Variable de entorno: VITE_STRIPE_PUBLISHABLE_KEY
   */
  stripe: {
    publishableKey: import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'] || '',
  },

  /**
   * Resend Configuration (servidor-side only)
   * No exponer en el cliente
   */
  resend: {
    apiKey: '', // Se maneja en Edge Functions
  },

  /**
   * App Configuration
   */
  app: {
    name: 'SaaS Boilerplate',
    version: '1.0.0',
    apiUrl: import.meta.env['VITE_API_URL'] || '',
  },
};
