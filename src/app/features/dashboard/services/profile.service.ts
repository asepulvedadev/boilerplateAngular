import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { Profile, UpdateProfileDto, ProfileStats, ProfileState } from '../models';

/**
 * ProfileService
 *
 * Servicio para gestionar el perfil del usuario en el dashboard.
 * Usa signals de Angular 20 para estado reactivo.
 *
 * @example
 * ```typescript
 * private profileService = inject(ProfileService);
 *
 * async ngOnInit() {
 *   await this.profileService.loadProfile();
 * }
 *
 * // En el template
 * {{ profileService.fullName() }}
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private supabase = inject(SupabaseService);

  // ============================================
  // SIGNALS DE ESTADO
  // ============================================

  /** Perfil del usuario actual */
  private _profile = signal<Profile | null>(null);

  /** Estadísticas del perfil */
  private _stats = signal<ProfileStats | null>(null);

  /** Indica si está cargando datos */
  private _loading = signal<boolean>(false);

  /** Mensaje de error si existe */
  private _error = signal<string | null>(null);

  // ============================================
  // SEÑALES PÚBLICAS (READ-ONLY)
  // ============================================

  /** Perfil completo (lectura) */
  public readonly profile = this._profile.asReadonly();

  /** Estadísticas (lectura) */
  public readonly stats = this._stats.asReadonly();

  /** Estado de carga (lectura) */
  public readonly loading = this._loading.asReadonly();

  /** Error (lectura) */
  public readonly error = this._error.asReadonly();

  // ============================================
  // COMPUTED SIGNALS (valores derivados)
  // ============================================

  /** Nombre completo del usuario o 'Usuario' por defecto */
  public readonly fullName = computed(() => {
    const profile = this._profile();
    return profile?.full_name || 'Usuario';
  });

  /** Email del usuario */
  public readonly email = computed(() => {
    const profile = this._profile();
    return profile?.email || '';
  });

  /** URL del avatar o imagen por defecto */
  public readonly avatarUrl = computed(() => {
    const profile = this._profile();
    return profile?.avatar_url || this.getDefaultAvatar(profile?.email);
  });

  /** Tier de suscripción formateado */
  public readonly subscriptionTier = computed(() => {
    const profile = this._profile();
    return profile?.subscription_tier || 'free';
  });

  /** Rol del usuario */
  public readonly role = computed(() => {
    const profile = this._profile();
    return profile?.role || 'user';
  });

  /** Estado completo del perfil */
  public readonly state = computed<ProfileState>(() => ({
    profile: this._profile(),
    stats: this._stats(),
    loading: this._loading(),
    error: this._error()
  }));

  // ============================================
  // MÉTODOS PÚBLICOS
  // ============================================

  /**
   * Carga el perfil del usuario actual desde Supabase
   * Aplica RLS automáticamente (solo puede ver su propio perfil)
   *
   * @returns Promise<Profile | null>
   */
  async loadProfile(): Promise<Profile | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Obtener el usuario autenticado
      const user = this.supabase.getCurrentUser();

      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Query a Supabase con RLS habilitado
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, subscription_tier, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        throw new Error('Error al cargar el perfil');
      }

      // Actualizar signals
      this._profile.set(data);

      // Cargar estadísticas derivadas
      await this.loadStats(data);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      this._error.set(errorMessage);
      console.error('ProfileService error:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Actualiza el perfil del usuario
   * Solo actualiza los campos proporcionados
   *
   * @param data - Datos a actualizar (partial)
   * @returns Promise<Profile | null>
   */
  async updateProfile(data: UpdateProfileDto): Promise<Profile | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const user = this.supabase.getCurrentUser();

      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Actualizar en Supabase
      const { data: updated, error } = await this.supabase.client
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw new Error('Error al actualizar el perfil');
      }

      // Actualizar signal local
      this._profile.set(updated);

      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar';
      this._error.set(errorMessage);
      console.error('ProfileService update error:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Refresca el perfil (alias para loadProfile)
   */
  async refresh(): Promise<void> {
    await this.loadProfile();
  }

  /**
   * Limpia el estado del servicio
   */
  clear(): void {
    this._profile.set(null);
    this._stats.set(null);
    this._loading.set(false);
    this._error.set(null);
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Carga estadísticas derivadas del perfil
   * En una implementación real, esto vendría de la base de datos
   *
   * @param profile - Perfil del usuario
   */
  private async loadStats(profile: Profile): Promise<void> {
    // Calcular estadísticas basadas en el perfil
    const stats: ProfileStats = {
      plan: this.formatPlanName(profile.subscription_tier),
      trial_days_left: this.calculateTrialDaysLeft(profile),
      account_status: this.getAccountStatus(profile),
      last_activity: new Date().toISOString()
    };

    this._stats.set(stats);
  }

  /**
   * Formatea el nombre del plan de suscripción
   */
  private formatPlanName(tier: string): string {
    const planNames: Record<string, string> = {
      free: 'Plan Gratuito',
      pro: 'Plan Profesional',
      enterprise: 'Plan Empresarial'
    };

    return planNames[tier] || 'Plan Gratuito';
  }

  /**
   * Calcula los días restantes de prueba
   * En producción, esto vendría de la base de datos
   */
  private calculateTrialDaysLeft(profile: Profile): number | null {
    // Si es plan free, asumir 14 días de prueba desde la creación
    if (profile.subscription_tier === 'free' && profile.created_at) {
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = 14 - daysSinceCreation;

      return daysLeft > 0 ? daysLeft : null;
    }

    return null;
  }

  /**
   * Determina el estado de la cuenta
   */
  private getAccountStatus(profile: Profile): 'active' | 'trial' | 'expired' | 'suspended' {
    if (profile.subscription_tier === 'free') {
      const trialDays = this.calculateTrialDaysLeft(profile);
      return trialDays !== null ? 'trial' : 'expired';
    }

    return 'active';
  }

  /**
   * Genera un avatar por defecto usando UI Avatars
   * @param email - Email del usuario
   */
  private getDefaultAvatar(email: string | undefined): string {
    if (!email) {
      return 'https://ui-avatars.com/api/?name=Usuario&background=0D8ABC&color=fff&size=128';
    }

    const name = email.split('@')[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`;
  }
}
