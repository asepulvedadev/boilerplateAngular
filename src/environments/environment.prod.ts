/**
 * Environment de producción
 * Configuración para deploy en Vercel
 *
 * IMPORTANTE: Configurar estas variables en Vercel Dashboard:
 * Settings > Environment Variables
 */
export const environment = {
  production: true,

  /**
   * Supabase Configuration (Production)
   * Reemplazar estos valores con tus credenciales de producción
   * O usar file replacement en angular.json
   */
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-production-anon-key',
  },

  /**
   * Stripe Configuration (Production)
   * Usar tu publishable key de producción
   */
  stripe: {
    publishableKey: 'pk_live_...',
  },

  /**
   * Resend Configuration (servidor-side only)
   * No exponer en el cliente - se maneja en Edge Functions
   */
  resend: {
    apiKey: '', // Se configura en Supabase Edge Functions
  },

  /**
   * App Configuration
   */
  app: {
    name: 'SaaS Boilerplate',
    version: '1.0.0',
    apiUrl: 'https://your-project.supabase.co',
  },
};
