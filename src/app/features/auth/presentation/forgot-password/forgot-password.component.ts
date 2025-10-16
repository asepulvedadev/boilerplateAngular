import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Forgot Password Component (Placeholder)
 * TODO: Implementar formulario de recuperación de contraseña
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Recuperar Contraseña</h1>
        <p class="text-gray-600 mb-6">
          Componente en desarrollo. Próximamente formulario de recuperación de contraseña.
        </p>
        <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-700 font-semibold">
          ← Volver al login
        </a>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {}
