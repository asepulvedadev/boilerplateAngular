import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './core/supabase';

/**
 * Componente raíz de la aplicación
 * Inicializa Supabase y maneja el estado de autenticación global
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html'
})
export class App implements OnInit {
  // Inyectar SupabaseService
  private supabase = inject(SupabaseService);

  // Estado de la aplicación
  protected readonly title = signal('SaaS Boilerplate');
  protected readonly isAuthenticated = signal(false);
  protected readonly userEmail = signal<string | null>(null);

  async ngOnInit() {
    // Suscribirse al estado de autenticación
    this.supabase.isAuthenticated$.subscribe((isAuth) => {
      this.isAuthenticated.set(isAuth);
    });

    // Suscribirse al usuario actual
    this.supabase.currentUser$.subscribe((user) => {
      this.userEmail.set(user?.email || null);
    });

    console.log('🚀 Supabase inicializado:', {
      isAuthenticated: this.supabase.isAuthenticated(),
    });
  }
}
