import { Routes } from '@angular/router';

/**
 * Rutas del feature de Autenticación
 */
export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/login/login.component').then(m => m.LoginComponent),
    title: 'Iniciar Sesión'
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./presentation/register/register.component').then(m => m.RegisterComponent),
    title: 'Registrarse'
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./presentation/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Recuperar Contraseña'
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./presentation/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
    title: 'Verificar Email'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
