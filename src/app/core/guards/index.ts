/**
 * Guards de Autenticación
 *
 * Exporta todos los guards disponibles para proteger rutas.
 *
 * @module guards
 */

export { authGuard } from './auth.guard';
export { publicGuard } from './public.guard';

/**
 * @deprecated Usar `publicGuard` en su lugar
 * Este alias se mantiene por compatibilidad con código existente
 */
export { publicGuard as guestGuard } from './public.guard';
