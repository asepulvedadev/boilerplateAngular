import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services';
import { AuthValidators } from '../../models';

/**
 * Componente de Login
 * Pantalla de inicio de sesión con email/password y OAuth
 *
 * Features:
 * - Login con email/password
 * - Login con Google/GitHub
 * - Validación de formulario
 * - Manejo de errores
 * - Diseño mobile-first
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Estado del componente
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected showPassword = signal(false);

  // Formulario reactivo
  protected loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false]
  });

  /**
   * Maneja el submit del formulario
   */
  protected async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;

    const result = await this.authService.login({ email, password });

    if (!result.success) {
      this.error.set(result.error || 'Error al iniciar sesión');
      this.loading.set(false);
    }
    // Si es exitoso, el AuthService redirige automáticamente
  }

  /**
   * Login con Google
   */
  protected async loginWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    await this.authService.loginWithGoogle();
  }

  /**
   * Login con GitHub
   */
  protected async loginWithGitHub(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    await this.authService.loginWithGitHub();
  }

  /**
   * Toggle de visibilidad de contraseña
   */
  protected togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Helper para mostrar errores de campos
   */
  protected getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);

    if (!field || !field.touched || !field.errors) {
      return null;
    }

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }

    if (field.errors['email']) {
      return 'Email inválido';
    }

    if (field.errors['minlength']) {
      return 'Mínimo 8 caracteres';
    }

    return null;
  }
}
