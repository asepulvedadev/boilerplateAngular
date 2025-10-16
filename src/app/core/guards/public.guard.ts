import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../supabase';

/**
 * Public Guard - Protege rutas públicas (login, register, etc)
 *
 * Este guard verifica que el usuario NO esté autenticado.
 * Si está autenticado → redirige a /dashboard
 * Si NO está autenticado → permite el acceso
 *
 * Útil para páginas de autenticación que no deberían ser
 * accesibles cuando el usuario ya tiene sesión activa.
 *
 * @example
 * ```typescript
 * {
 *   path: 'auth',
 *   loadChildren: () => import('./features/auth/auth.routes'),
 *   canActivate: [publicGuard] // Solo accesible sin autenticación
 * }
 * ```
 *
 * @param route - Ruta que se intenta activar
 * @param state - Estado del router con la URL completa
 * @returns true si puede activar la ruta, false si no
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Verificar autenticación de forma síncrona
  const isAuthenticated = supabase.isAuthenticated();

  if (isAuthenticated) {
    console.log('🔓 PublicGuard: Usuario ya autenticado, redirigiendo a dashboard');
    console.log(`   → Usuario: ${supabase.getCurrentUser()?.email}`);
    console.log(`   → Bloqueando acceso a: ${state.url}`);

    // Redirigir a dashboard
    router.navigate(['/dashboard']);

    return false;
  }

  console.log('✅ PublicGuard: Usuario no autenticado, permitiendo acceso');
  console.log(`   → Accediendo a: ${state.url}`);

  return true;
};
