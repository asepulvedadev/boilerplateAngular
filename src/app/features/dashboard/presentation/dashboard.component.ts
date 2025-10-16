import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services';
import { ProfileService } from '../services';

/**
 * Dashboard Component
 *
 * Página principal del dashboard del usuario autenticado.
 * Muestra información del perfil, estadísticas y acciones rápidas.
 *
 * Features:
 * - Perfil del usuario con avatar y datos
 * - Estadísticas del plan de suscripción
 * - Acciones rápidas (configuración, actualizar plan)
 * - Diseño Mobile First responsive
 * - Loading states y error handling
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class DashboardComponent implements OnInit {
  // ============================================
  // DEPENDENCY INJECTION
  // ============================================
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Servicio de perfil (público para usar en template) */
  public profileService = inject(ProfileService);

  // ============================================
  // COMPONENT STATE
  // ============================================

  /** Indica si el componente está inicializando */
  protected initializing = signal(true);

  /** Indica si está ejecutando una acción (logout, etc) */
  protected actionInProgress = signal(false);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  /**
   * Nombre de bienvenida personalizado
   * Ejemplo: "¡Hola, Juan!" o "¡Hola, Usuario!"
   */
  protected welcomeMessage = computed(() => {
    const name = this.profileService.fullName();
    return `¡Hola, ${name}!`;
  });

  /**
   * Mensaje del plan de suscripción
   * Incluye información de días restantes si está en prueba
   */
  protected planMessage = computed(() => {
    const stats = this.profileService.stats();
    if (!stats) return '';

    if (stats.trial_days_left !== null) {
      return `${stats.plan} - ${stats.trial_days_left} días de prueba restantes`;
    }

    return stats.plan;
  });

  /**
   * Color del badge del plan según el tier
   */
  protected planBadgeColor = computed(() => {
    const tier = this.profileService.subscriptionTier();
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[tier] || colors.free;
  });

  /**
   * Indica si el usuario está en período de prueba
   */
  protected isOnTrial = computed(() => {
    const stats = this.profileService.stats();
    return stats?.account_status === 'trial';
  });

  /**
   * Indica si hay un error para mostrar
   */
  protected hasError = computed(() => {
    return this.profileService.error() !== null;
  });

  /**
   * Indica si está cargando (inicial o refresh)
   */
  protected isLoading = computed(() => {
    return this.initializing() || this.profileService.loading();
  });

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  /**
   * Inicializa el componente cargando el perfil del usuario
   */
  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  // ============================================
  // MÉTODOS PÚBLICOS (para template)
  // ============================================

  /**
   * Carga los datos del dashboard
   */
  protected async loadDashboardData(): Promise<void> {
    this.initializing.set(true);

    try {
      // Cargar perfil del usuario desde Supabase
      await this.profileService.loadProfile();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      this.initializing.set(false);
    }
  }

  /**
   * Refresca los datos del dashboard
   */
  protected async refresh(): Promise<void> {
    await this.profileService.refresh();
  }

  /**
   * Cierra la sesión del usuario
   */
  protected async onLogout(): Promise<void> {
    if (this.actionInProgress()) return;

    // Confirmar antes de cerrar sesión
    const confirmed = confirm('¿Estás seguro de que quieres cerrar sesión?');
    if (!confirmed) return;

    this.actionInProgress.set(true);

    try {
      // Limpiar estado del perfil
      this.profileService.clear();

      // Cerrar sesión
      await this.authService.logout();

      // Redirigir al login (el AuthService ya lo hace, pero por si acaso)
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Error al cerrar sesión. Por favor, intenta de nuevo.');
    } finally {
      this.actionInProgress.set(false);
    }
  }

  /**
   * Navega a la página de perfil/configuración
   */
  protected goToProfile(): void {
    // TODO: Implementar navegación a perfil
    alert('Funcionalidad de perfil en desarrollo');
  }

  /**
   * Navega a la página de actualización de plan
   */
  protected goToUpgrade(): void {
    // TODO: Implementar navegación a upgrade
    alert('Funcionalidad de actualización de plan en desarrollo');
  }

  /**
   * Navega a configuración
   */
  protected goToSettings(): void {
    // TODO: Implementar navegación a settings
    alert('Funcionalidad de configuración en desarrollo');
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Retorna las iniciales del nombre para el avatar
   */
  protected getInitials(): string {
    const name = this.profileService.fullName();
    const parts = name.split(' ');

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Formatea una fecha a formato legible
   */
  protected formatDate(date: string | undefined): string {
    if (!date) return 'N/A';

    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
