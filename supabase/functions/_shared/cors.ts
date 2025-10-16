/**
 * Configuración de CORS para Edge Functions de Supabase
 *
 * Permite que las Edge Functions sean llamadas desde el frontend
 * en diferentes entornos (development, production)
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // En producción, cambiar por tu dominio
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
