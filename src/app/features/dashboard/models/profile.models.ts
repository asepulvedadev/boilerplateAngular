/**
 * Modelos de Perfil de Usuario
 *
 * Define las interfaces para la gestión de perfiles en el dashboard.
 * Basado en la tabla 'profiles' de Supabase con RLS habilitado.
 */

/**
 * Perfil completo del usuario
 * Mapea directamente a la tabla 'profiles' en Supabase
 */
export interface Profile {
  /** ID único del usuario (UUID de Supabase Auth) */
  id: string;

  /** Email del usuario (sincronizado con auth.users) */
  email: string;

  /** Nombre completo del usuario */
  full_name: string | null;

  /** URL del avatar del usuario (Supabase Storage) */
  avatar_url: string | null;

  /** Rol del usuario en la plataforma */
  role: 'user' | 'admin' | 'moderator';

  /** Tier de suscripción actual */
  subscription_tier: 'free' | 'pro' | 'enterprise';

  /** Fecha de creación del perfil */
  created_at?: string;

  /** Fecha de última actualización */
  updated_at?: string;
}

/**
 * DTO para actualizar el perfil
 * Solo incluye campos que el usuario puede modificar
 */
export interface UpdateProfileDto {
  /** Nombre completo (opcional) */
  full_name?: string;

  /** URL del avatar (opcional) */
  avatar_url?: string;
}

/**
 * Estadísticas del perfil para mostrar en el dashboard
 */
export interface ProfileStats {
  /** Plan de suscripción actual */
  plan: string;

  /** Días restantes de prueba (null si no aplica) */
  trial_days_left: number | null;

  /** Estado de la cuenta */
  account_status: 'active' | 'trial' | 'expired' | 'suspended';

  /** Fecha de última actividad */
  last_activity: string;
}

/**
 * Estado de carga del perfil
 */
export interface ProfileState {
  /** Datos del perfil */
  profile: Profile | null;

  /** Estadísticas del perfil */
  stats: ProfileStats | null;

  /** Indica si está cargando */
  loading: boolean;

  /** Mensaje de error si existe */
  error: string | null;
}
