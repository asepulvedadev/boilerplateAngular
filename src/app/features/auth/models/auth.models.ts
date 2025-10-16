/**
 * Modelos y DTOs para el feature de Autenticación
 */

import { User, Session } from '@supabase/supabase-js';

/**
 * DTO para login
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * DTO para registro
 */
export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

/**
 * DTO para reset de contraseña
 */
export interface ForgotPasswordDto {
  email: string;
}

/**
 * DTO para cambio de contraseña
 */
export interface ResetPasswordDto {
  password: string;
  confirmPassword: string;
}

/**
 * Respuesta de autenticación exitosa
 */
export interface AuthResponse {
  user: User;
  session: Session;
}

/**
 * Estado de autenticación en la UI
 */
export interface AuthState {
  loading: boolean;
  error: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

/**
 * Errores comunes de autenticación
 */
export enum AuthError {
  INVALID_CREDENTIALS = 'Email o contraseña incorrectos',
  EMAIL_ALREADY_EXISTS = 'El email ya está registrado',
  WEAK_PASSWORD = 'La contraseña debe tener al menos 8 caracteres',
  NETWORK_ERROR = 'Error de conexión. Intenta nuevamente',
  UNKNOWN_ERROR = 'Ocurrió un error inesperado',
}

/**
 * Validadores de formulario
 */
export class AuthValidators {
  /**
   * Valida formato de email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida fortaleza de contraseña
   * Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
   */
  static isStrongPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Valida que las contraseñas coincidan
   */
  static passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
}
