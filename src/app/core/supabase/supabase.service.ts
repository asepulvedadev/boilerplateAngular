import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * SupabaseService - Cliente Singleton para Supabase
 *
 * Proporciona acceso centralizado a:
 * - Autenticación (auth)
 * - Base de datos (database)
 * - Storage (archivos)
 * - Real-time (subscriptions)
 *
 * @example
 * ```typescript
 * private supabase = inject(SupabaseService);
 *
 * // Usar el cliente
 * const { data } = await this.supabase.client
 *   .from('users')
 *   .select('*');
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /**
   * Cliente de Supabase
   * Usar este cliente para todas las operaciones
   */
  public readonly client: SupabaseClient;

  /**
   * Usuario actual autenticado (Observable)
   * null si no hay sesión activa
   */
  private _currentUser$ = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this._currentUser$.asObservable();

  /**
   * Sesión actual (Observable)
   */
  private _currentSession$ = new BehaviorSubject<Session | null>(null);
  public currentSession$: Observable<Session | null> = this._currentSession$.asObservable();

  /**
   * Indica si el usuario está autenticado
   */
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this._isAuthenticated$.asObservable();

  constructor() {
    // Crear cliente de Supabase
    this.client = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Provide async storage methods that match the expected
          // storage interface used by supabase-js. Using Promises
          // helps avoid supabase-js attempting to acquire a
          // Navigator Lock in some browser/runtime environments.
          storage: {
            // The library may expect either sync or async storage;
            // make these async to be safe.
            getItem: async (key: string) => {
              try {
                if (typeof window === 'undefined' || !window.localStorage) return null;
                return Promise.resolve(window.localStorage.getItem(key));
              } catch {
                return null;
              }
            },
            setItem: async (key: string, value: string) => {
              try {
                if (typeof window === 'undefined' || !window.localStorage) return;
                await Promise.resolve(window.localStorage.setItem(key, value));
              } catch {
                // Ignore errors
              }
            },
            removeItem: async (key: string) => {
              try {
                if (typeof window === 'undefined' || !window.localStorage) return;
                await Promise.resolve(window.localStorage.removeItem(key));
              } catch {
                // Ignore errors
              }
            },
          },
        },
      }
    );

    // Inicializar sesión del usuario
    this.initializeAuth();
  }

  /**
   * Inicializa la autenticación y escucha cambios de sesión
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Obtener sesión actual si existe
      const { data: { session } } = await this.client.auth.getSession();

      if (session) {
        this._currentSession$.next(session);
        this._currentUser$.next(session.user);
        this._isAuthenticated$.next(true);
      }

      // Escuchar cambios en la autenticación
      this.client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);

        if (session) {
          this._currentSession$.next(session);
          this._currentUser$.next(session.user);
          this._isAuthenticated$.next(true);
        } else {
          this._currentSession$.next(null);
          this._currentUser$.next(null);
          this._isAuthenticated$.next(false);
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  /**
   * Obtiene el usuario actual de forma síncrona
   * @returns Usuario actual o null
   */
  getCurrentUser(): User | null {
    return this._currentUser$.value;
  }

  /**
   * Obtiene la sesión actual de forma síncrona
   * @returns Sesión actual o null
   */
  getCurrentSession(): Session | null {
    return this._currentSession$.value;
  }

  /**
   * Verifica si hay un usuario autenticado
   * @returns true si está autenticado
   */
  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  /**
   * Cierra sesión del usuario actual
   */
  async signOut(): Promise<void> {
    try {
      await this.client.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}
