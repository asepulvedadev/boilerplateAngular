import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/supabase';
import { LoginDto, RegisterDto, ForgotPasswordDto, AuthError } from '../models';

/**
 * AuthService - Maneja toda la lógica de autenticación
 *
 * Métodos principales:
 * - login(): Iniciar sesión con email/password
 * - register(): Registrar nuevo usuario
 * - logout(): Cerrar sesión
 * - forgotPassword(): Enviar email de recuperación
 * - resetPassword(): Cambiar contraseña con token
 *
 * @example
 * ```typescript
 * private authService = inject(AuthService);
 *
 * async onLogin() {
 *   const result = await this.authService.login({
 *     email: 'user@example.com',
 *     password: 'password123'
 *   });
 *
 *   if (result.success) {
 *     // Redirigir al dashboard
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  /**
   * Inicia sesión con email y contraseña
   *
   * @param credentials - Email y contraseña del usuario
   * @returns Resultado de la operación con mensaje de error si falla
   */
  async login(credentials: LoginDto): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('Login error:', error);
        return {
          success: false,
          error: this.mapSupabaseError(error.message),
        };
      }

      if (data.user) {
        console.log('✅ Login exitoso:', data.user.email);

        // Obtener returnUrl de la URL actual (query params)
        // Si el usuario fue redirigido desde una ruta protegida, volver ahí
        const urlTree = this.router.parseUrl(this.router.url);
        const returnUrl = urlTree.queryParams['returnUrl'] || '/dashboard';

        console.log('🔄 Redirigiendo a:', returnUrl);
        await this.router.navigateByUrl(returnUrl);

        return { success: true };
      }

      return {
        success: false,
        error: AuthError.UNKNOWN_ERROR,
      };
    } catch (error) {
      console.error('Login exception:', error);
      return {
        success: false,
        error: AuthError.NETWORK_ERROR,
      };
    }
  }

  /**
   * Registra un nuevo usuario
   *
   * @param data - Datos del nuevo usuario (email, password, fullName)
   * @returns Resultado de la operación
   */
  async register(data: RegisterDto): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.supabase.client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        console.error('Register error:', authError);
        return {
          success: false,
          error: this.mapSupabaseError(authError.message),
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: AuthError.UNKNOWN_ERROR,
        };
      }

      // 2. El perfil se crea automáticamente mediante el trigger 'on_auth_user_created'
      // El trigger está definido en supabase/migrations/001_initial_schema.sql
      // y se ejecuta automáticamente cuando se registra un usuario en auth.users

      console.log('✅ Registro exitoso:', authData.user.email);

      // Redirigir al dashboard o a página de confirmación de email
      if (authData.session) {
        await this.router.navigate(['/dashboard']);
      } else {
        // Si requiere confirmación de email
        await this.router.navigate(['/auth/verify-email']);
      }

      return { success: true };
    } catch (error) {
      console.error('Register exception:', error);
      return {
        success: false,
        error: AuthError.NETWORK_ERROR,
      };
    }
  }

  /**
   * Cierra la sesión del usuario actual
   */
  async logout(): Promise<void> {
    try {
      await this.supabase.signOut();
      console.log('✅ Logout exitoso');
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Envía email de recuperación de contraseña
   *
   * @param data - Email del usuario
   * @returns Resultado de la operación
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.client.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Forgot password error:', error);
        return {
          success: false,
          error: this.mapSupabaseError(error.message),
        };
      }

      console.log('✅ Email de recuperación enviado a:', data.email);
      return { success: true };
    } catch (error) {
      console.error('Forgot password exception:', error);
      return {
        success: false,
        error: AuthError.NETWORK_ERROR,
      };
    }
  }

  /**
   * Cambia la contraseña del usuario (con token de recuperación)
   *
   * @param newPassword - Nueva contraseña
   * @returns Resultado de la operación
   */
  async resetPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Reset password error:', error);
        return {
          success: false,
          error: this.mapSupabaseError(error.message),
        };
      }

      console.log('✅ Contraseña actualizada exitosamente');
      await this.router.navigate(['/dashboard']);
      return { success: true };
    } catch (error) {
      console.error('Reset password exception:', error);
      return {
        success: false,
        error: AuthError.NETWORK_ERROR,
      };
    }
  }

  /**
   * Login con Google OAuth
   */
  async loginWithGoogle(): Promise<void> {
    try {
      const { error } = await this.supabase.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('Google login error:', error);
      }
    } catch (error) {
      console.error('Google login exception:', error);
    }
  }

  /**
   * Login con GitHub OAuth
   */
  async loginWithGitHub(): Promise<void> {
    try {
      const { error } = await this.supabase.client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('GitHub login error:', error);
      }
    } catch (error) {
      console.error('GitHub login exception:', error);
    }
  }

  /**
   * Mapea errores de Supabase a mensajes user-friendly
   */
  private mapSupabaseError(errorMessage: string): string {
    if (errorMessage.includes('Invalid login credentials')) {
      return AuthError.INVALID_CREDENTIALS;
    }
    if (errorMessage.includes('User already registered')) {
      return AuthError.EMAIL_ALREADY_EXISTS;
    }
    if (errorMessage.includes('Password should be at least')) {
      return AuthError.WEAK_PASSWORD;
    }
    return AuthError.UNKNOWN_ERROR;
  }
}
