/**
 * Environment de desarrollo
 * Configuración para desarrollo local
 */
export const environment = {
  production: false,

  /**
   * Supabase Configuration
   * Obtener de: https://app.supabase.com/project/_/settings/api
   */
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
  },

  /**
   * Stripe Configuration
   * Obtener de: https://dashboard.stripe.com/test/apikeys
   */
  stripe: {
    publishableKey: 'pk_test_...',
  },

  /**
   * Resend Configuration (para emails)
   * Obtener de: https://resend.com/api-keys
   */
  resend: {
    apiKey: 're_...',
  },

  /**
   * App Configuration
   */
  app: {
    name: 'SaaS Boilerplate',
    version: '1.0.0',
    apiUrl: 'http://localhost:54321', // Supabase local
  },
};
