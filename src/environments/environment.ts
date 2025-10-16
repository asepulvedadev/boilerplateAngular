/**
 * Environment Configuration
 * Archivo único que maneja desarrollo y producción
 * Usa variables de entorno del archivo .env o variables de sistema
 */

/**
 * Helper para leer variables de entorno de forma segura
 * Funciona tanto en build time como en runtime
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Intentar leer de process.env (build time)
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env && (globalThis as any).process.env[key]) {
    return (globalThis as any).process.env[key] as string;
  }
  // Fallback al valor por defecto
  return defaultValue;
}

/**
 * Configuración del proyecto Supabase
 * Valores por defecto tomados de tu proyecto:
 * wunclqnjguunowexfkyg.supabase.co
 */
const supabaseConfig = {
  url: getEnvVar(
    'VITE_SUPABASE_URL',
    getEnvVar('SUPABASE_URL', 'https://wunclqnjguunowexfkyg.supabase.co')
  ),
  anonKey: getEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    getEnvVar('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bmNscW5qZ3V1bm93ZXhma3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjAyMTQsImV4cCI6MjA3NjE5NjIxNH0.FaXvsMBBtRGaKA7Yo_WTBe0qAeF6jbxQSQm_juD9l_I')
  ),
};

const stripeConfig = {
  publishableKey: getEnvVar(
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'pk_test_...' // Reemplazar con tu key de Stripe
  ),
};

const apiConfig = {
  apiUrl: getEnvVar(
    'VITE_API_URL',
    getEnvVar('SUPABASE_URL', 'https://wunclqnjguunowexfkyg.supabase.co')
  ),
};

export const environment = {
  production: false, // Cambiar a true en producción

  /**
   * Supabase Configuration
   */
  supabase: supabaseConfig,

  /**
   * Stripe Configuration
   */
  stripe: stripeConfig,

  /**
   * Resend Configuration (para emails)
   * Se maneja en Edge Functions, no en el cliente
   */
  resend: {
    apiKey: '', // No exponer en el cliente - se configura en Supabase
    fromEmail: 'noreply@tudominio.com',
    fromName: 'SaaS Boilerplate',
  },

  /**
   * App Configuration
   */
  appName: 'SaaS Boilerplate',
  appUrl: 'http://localhost:4200', // Cambiar a tu dominio en producción
  companyAddress: 'Tu Empresa S.L., Calle Principal 123, 28001 Madrid, España',

  /**
   * Social Media Links
   */
  socialMedia: {
    twitter: 'https://twitter.com/tuempresa',
    linkedin: 'https://linkedin.com/company/tuempresa',
    github: 'https://github.com/tuempresa',
  },

  /**
   * Legacy App Config (mantener por compatibilidad)
   */
  app: {
    name: 'SaaS Boilerplate',
    version: '1.0.0',
    apiUrl: apiConfig.apiUrl,
  },
};
