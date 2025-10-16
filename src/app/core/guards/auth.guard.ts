import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../supabase';

/**
 * Auth Guard - Protege rutas privadas que requieren autenticación
 *
 * Este guard verifica si el usuario está autenticado.
 * Si NO está autenticado → redirige a /auth/login
 * Si está autenticado → permite el acceso
 *
 * @example
 * ```typescript
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard], // Requiere autenticación
 *   title: 'Dashboard'
 * }
 * ```
 *
 * @param route - Ruta que se intenta activar
 * @param state - Estado del router con la URL completa
 * @returns true si puede activar la ruta, false si no
 */
export const authGuard: CanActivateFn = (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Verificar autenticación de forma síncrona
  const isAuthenticated = supabase.isAuthenticated();

  if (!isAuthenticated) {
    console.log('🔒 AuthGuard: Usuario no autenticado, redirigiendo a login');
    console.log(`   → URL solicitada: ${state.url}`);

    // Redirigir a login guardando la URL solicitada
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });

    return false;
  }

  console.log('✅ AuthGuard: Usuario autenticado, permitiendo acceso');
  console.log(`   → Usuario: ${supabase.getCurrentUser()?.email}`);

  return true;
};
