import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/supabase';

/**
 * Componente de Verificación de Email
 *
 * Se muestra después del registro cuando Supabase requiere
 * confirmación de email antes de permitir el acceso.
 *
 * Features:
 * - Mensaje de confirmación claro
 * - Botón para reenviar email
 * - Link para volver al login
 * - Auto-detección si el email ya fue verificado
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // Estado del componente
  protected email = signal<string>('');
  protected loading = signal(false);
  protected resendSuccess = signal(false);
  protected error = signal<string | null>(null);

  async ngOnInit() {
    // Obtener el email del usuario que se acaba de registrar
    const user = this.supabase.getCurrentUser();

    if (user?.email) {
      this.email.set(user.email);
    }

    // Si ya tiene sesión activa, redirigir al dashboard
    if (this.supabase.isAuthenticated()) {
      console.log('✅ Usuario ya verificado, redirigiendo al dashboard');
      await this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Reenvía el email de verificación
   */
  protected async resendVerificationEmail(): Promise<void> {
    const emailValue = this.email();

    if (!emailValue) {
      this.error.set('Email no disponible');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.resendSuccess.set(false);

    try {
      const { error } = await this.supabase.client.auth.resend({
        type: 'signup',
        email: emailValue,
      });

      if (error) {
        console.error('Error reenviando email:', error);
        this.error.set('Error al reenviar el email. Intenta más tarde.');
      } else {
        console.log('✅ Email de verificación reenviado');
        this.resendSuccess.set(true);
      }
    } catch (err) {
      console.error('Exception reenviando email:', err);
      this.error.set('Error de conexión. Verifica tu internet.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Vuelve a la página de login
   */
  protected goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
