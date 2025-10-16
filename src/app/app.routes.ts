import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards';

/**
 * Rutas principales de la aplicación
 *
 * Guards disponibles:
 * - authGuard: Protege rutas privadas (requiere autenticación)
 * - publicGuard: Protege rutas públicas (solo accesible sin autenticación)
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    canActivate: [publicGuard] // Solo accesible sin autenticación
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/presentation/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard], // Requiere autenticación
    title: 'Dashboard'
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
