/**
 * Dashboard Feature - Barrel Export
 *
 * API pública del feature Dashboard.
 * Exporta solo los elementos necesarios para uso externo.
 *
 * @example
 * ```typescript
 * import { DashboardComponent, ProfileService } from '@features/dashboard';
 * ```
 */

// Componentes
export { DashboardComponent } from './presentation/dashboard.component';

// Servicios
export { ProfileService } from './services';

// Modelos
export type {
  Profile,
  UpdateProfileDto,
  ProfileStats,
  ProfileState
} from './models';
