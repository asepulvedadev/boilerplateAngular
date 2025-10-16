# 📋 CHECKLIST DE TESTING MANUAL - SaaS Boilerplate Angular 20

**Fecha:** 2025-10-16
**Proyecto:** SaaS Boilerplate Angular 20 + Supabase
**Estado del Servidor:** ✅ Corriendo en http://localhost:4201
**Build Status:** ✅ Compilación exitosa (sin errores)

---

## 🎯 OBJETIVO

Verificar que el flujo completo de autenticación + base de datos funciona correctamente end-to-end.

---

## ⚙️ PRE-REQUISITOS

### Base de Datos Supabase
- [ ] Confirmar que la migración `001_initial_schema.sql` fue ejecutada en Supabase
- [ ] Verificar que existen las tablas `profiles` y `subscriptions`
- [ ] Confirmar que RLS (Row Level Security) está habilitado
- [ ] Verificar que los triggers están activos

**Cómo verificar:**
```bash
# Ir a Supabase Dashboard → SQL Editor
# Ejecutar:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('profiles', 'subscriptions');

# Debería retornar 2 filas
```

### Variables de Entorno
- [ ] Archivo `.env` existe y contiene:
  - `VITE_SUPABASE_URL` ✅ (configurado)
  - `VITE_SUPABASE_ANON_KEY` ✅ (configurado)
  - `VITE_API_URL` ✅ (configurado)

### Servidor de Desarrollo
- [ ] Servidor corriendo en `http://localhost:4201`
- [ ] Sin errores de compilación en la consola

**Comando para verificar:**
```bash
cd C:\Users\asepulvedadev\dev\boilerplate-angular
bun run dev
```

---

## 🧪 TESTS MANUALES - FASE 1: GUARDS Y REDIRECCIONES

### TEST 1.1: Redirección inicial (sin autenticación)
**Objetivo:** Verificar que el PublicGuard funciona correctamente

**Pasos:**
1. Abrir navegador en modo incógnito
2. Navegar a: `http://localhost:4201`

**Resultado Esperado:**
- ✅ Redirige automáticamente a `/auth/login`
- ✅ Se muestra el formulario de login
- ✅ NO aparecen errores en la consola del navegador

**Verificar en consola del navegador:**
```
✅ PublicGuard: Usuario no autenticado, permitiendo acceso
   → Accediendo a: /auth/login
```

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 1.2: Bloqueo de rutas privadas (sin autenticación)
**Objetivo:** Verificar que el AuthGuard bloquea acceso no autorizado

**Pasos:**
1. Sin iniciar sesión, intentar acceder a: `http://localhost:4201/dashboard`

**Resultado Esperado:**
- ✅ NO permite el acceso
- ✅ Redirige a `/auth/login`
- ✅ Mensaje en consola indicando bloqueo

**Verificar en consola del navegador:**
```
🔒 AuthGuard: Usuario no autenticado, redirigiendo a login
   → URL solicitada: /dashboard
```

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 🧪 TESTS MANUALES - FASE 2: REGISTRO DE USUARIOS

### TEST 2.1: Registro exitoso con email/password
**Objetivo:** Verificar flujo completo de registro

**Pre-condición:**
- Usuario NO debe existir previamente en Supabase

**Pasos:**
1. Ir a: `http://localhost:4201/auth/register`
2. Completar el formulario:
   - Email: `test-{timestamp}@example.com` (usar timestamp para evitar duplicados)
   - Password: `Password123!` (mínimo 8 caracteres)
   - Full Name: `Usuario de Prueba`
3. Hacer clic en "Registrarse"

**Resultado Esperado:**
- ✅ Formulario se valida correctamente
- ✅ Spinner de loading aparece
- ✅ NO hay errores en consola
- ✅ Redirige a `/dashboard` o `/auth/verify-email` (según configuración de Supabase)
- ✅ Se crea el usuario en `auth.users`
- ✅ Se crea automáticamente el perfil en `public.profiles` (via trigger)

**Verificar en Supabase Dashboard:**
```sql
-- SQL Editor → Ejecutar:
SELECT id, email, full_name, role, subscription_tier, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 1;

-- Debería mostrar el usuario recién creado con:
-- - role: 'user'
-- - subscription_tier: 'free'
```

**Verificar en consola del navegador:**
```
✅ Registro exitoso: test-xxx@example.com
```

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

**Notas:**
- Si falla el registro pero el usuario se creó: Verificar que el trigger `on_auth_user_created` esté activo
- Si el trigger falla: Revisar en Supabase Dashboard → Database → Functions

---

### TEST 2.2: Validación de email duplicado
**Objetivo:** Verificar manejo de errores al registrar email existente

**Pasos:**
1. Intentar registrar el mismo email del TEST 2.1
2. Usar la misma contraseña

**Resultado Esperado:**
- ✅ Muestra error: "El email ya está registrado"
- ✅ NO redirige
- ✅ Formulario permanece visible

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 2.3: Validación de contraseña débil
**Objetivo:** Verificar validación de fortaleza de contraseña

**Pasos:**
1. Ir a: `http://localhost:4201/auth/register`
2. Ingresar email válido
3. Ingresar contraseña de menos de 8 caracteres: `Pass1`
4. Intentar submit

**Resultado Esperado:**
- ✅ Formulario no se envía
- ✅ Muestra error de validación: "Mínimo 8 caracteres"
- ✅ NO hace request a Supabase

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 🧪 TESTS MANUALES - FASE 3: LOGIN DE USUARIOS

### TEST 3.1: Login exitoso con credenciales válidas
**Objetivo:** Verificar flujo completo de autenticación

**Pre-condición:**
- Usar el usuario creado en TEST 2.1

**Pasos:**
1. Cerrar sesión si está activa
2. Ir a: `http://localhost:4201/auth/login`
3. Ingresar credenciales:
   - Email: (del TEST 2.1)
   - Password: `Password123!`
4. Hacer clic en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Spinner de loading aparece
- ✅ NO hay errores en consola
- ✅ Redirige a `/dashboard`
- ✅ Se carga el dashboard con datos del usuario

**Verificar en consola del navegador:**
```
✅ Login exitoso: test-xxx@example.com
Auth state changed: SIGNED_IN
✅ AuthGuard: Usuario autenticado, permitiendo acceso
   → Usuario: test-xxx@example.com
```

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 3.2: Login con credenciales inválidas
**Objetivo:** Verificar manejo de errores de autenticación

**Pasos:**
1. Ir a: `http://localhost:4201/auth/login`
2. Ingresar:
   - Email: `noexiste@example.com`
   - Password: `WrongPassword123`
3. Intentar login

**Resultado Esperado:**
- ✅ Muestra error: "Email o contraseña incorrectos"
- ✅ NO redirige
- ✅ Formulario permanece visible
- ✅ Spinner de loading desaparece

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 3.3: Validación de formulario vacío
**Objetivo:** Verificar validación en el cliente

**Pasos:**
1. Ir a: `http://localhost:4201/auth/login`
2. Dejar campos vacíos
3. Intentar submit

**Resultado Esperado:**
- ✅ Formulario marca campos como touched
- ✅ Muestra errores de validación: "Este campo es requerido"
- ✅ NO hace request a Supabase

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 🧪 TESTS MANUALES - FASE 4: DASHBOARD Y PERFIL

### TEST 4.1: Carga del Dashboard autenticado
**Objetivo:** Verificar que el Dashboard carga correctamente el perfil

**Pre-condición:**
- Usuario autenticado (TEST 3.1)

**Pasos:**
1. Estar en el Dashboard (`/dashboard`)
2. Verificar que se muestran los datos del perfil

**Resultado Esperado:**
- ✅ Muestra mensaje de bienvenida: "¡Hola, Usuario de Prueba!" (o nombre del usuario)
- ✅ Muestra email del usuario en el header
- ✅ Muestra avatar (generado por UI Avatars)
- ✅ Muestra plan: "Free"
- ✅ Muestra días de prueba restantes (14 días - días transcurridos)
- ✅ Muestra estado de cuenta: "trial" o "expired"
- ✅ NO hay errores en consola

**Verificar en consola del navegador:**
```
(No debería haber errores de carga)
```

**Verificar llamadas de red (DevTools → Network):**
- ✅ Request a Supabase REST API: `/rest/v1/profiles?id=eq.{user-id}`
- ✅ Status: 200 OK
- ✅ Response contiene datos del perfil

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 4.2: Signals reactivos en ProfileService
**Objetivo:** Verificar que los computed signals funcionan

**Pasos:**
1. Estar en el Dashboard
2. Abrir DevTools → Console
3. Ejecutar:
```javascript
// Ver el estado del ProfileService (si es accesible)
console.log('Profile loaded:', document.querySelector('app-dashboard'));
```

**Resultado Esperado:**
- ✅ Los datos se muestran correctamente en la UI
- ✅ Los computed values (`fullName`, `email`, `avatarUrl`) se calculan correctamente
- ✅ El planMessage incluye información de días de prueba si aplica

**Verificar visualmente:**
- Nombre completo se muestra en el header
- Email se muestra debajo del nombre
- Avatar con iniciales o imagen de UI Avatars
- Stats cards con información correcta

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 4.3: Manejo de errores al cargar perfil
**Objetivo:** Verificar error handling cuando falla la carga

**Pasos:**
1. Simular error de red (DevTools → Network → Offline)
2. Recargar el dashboard (`F5`)

**Resultado Esperado:**
- ✅ Muestra mensaje de error: "Error al cargar el dashboard"
- ✅ Muestra botón "Reintentar"
- ✅ NO se rompe la aplicación
- ✅ Se puede hacer clic en "Reintentar" para volver a intentar

**Restaurar:**
- Quitar modo offline
- Hacer clic en "Reintentar"

**Resultado después de reintentar:**
- ✅ Carga los datos correctamente

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 🧪 TESTS MANUALES - FASE 5: LOGOUT Y SESIÓN

### TEST 5.1: Logout exitoso
**Objetivo:** Verificar que el logout funciona correctamente

**Pre-condición:**
- Usuario autenticado

**Pasos:**
1. Estar en el Dashboard
2. Hacer clic en el botón "Salir" (icono rojo en header)
3. Confirmar en el diálogo de confirmación

**Resultado Esperado:**
- ✅ Muestra confirmación: "¿Estás seguro de que quieres cerrar sesión?"
- ✅ Al confirmar, cierra la sesión
- ✅ Redirige a `/auth/login`
- ✅ Se limpia el estado del ProfileService
- ✅ Ya NO puede acceder a `/dashboard` sin autenticarse

**Verificar en consola del navegador:**
```
✅ Logout exitoso
Auth state changed: SIGNED_OUT
```

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 5.2: Persistencia de sesión (refresh de página)
**Objetivo:** Verificar que la sesión persiste al recargar

**Pasos:**
1. Iniciar sesión (TEST 3.1)
2. Ir al Dashboard
3. Recargar la página (`F5`)

**Resultado Esperado:**
- ✅ NO redirige al login
- ✅ Permanece en el Dashboard
- ✅ Los datos del perfil se cargan nuevamente
- ✅ La sesión se mantiene activa

**Verificar en localStorage (DevTools → Application → Local Storage):**
- ✅ Existe key: `sb-{project-ref}-auth-token`
- ✅ Contiene el token de sesión válido

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 5.3: Redirección desde login si ya está autenticado
**Objetivo:** Verificar que PublicGuard funciona para usuarios autenticados

**Pre-condición:**
- Usuario autenticado

**Pasos:**
1. Estando autenticado, intentar navegar a: `http://localhost:4201/auth/login`

**Resultado Esperado:**
- ✅ NO permite acceder a `/auth/login`
- ✅ Redirige automáticamente a `/dashboard`

**Verificar en consola:**
```
🔓 PublicGuard: Usuario ya autenticado, redirigiendo a dashboard
   → Usuario: test-xxx@example.com
```

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 🧪 TESTS MANUALES - FASE 6: RLS (ROW LEVEL SECURITY)

### TEST 6.1: Usuario solo ve su propio perfil
**Objetivo:** Verificar que RLS previene acceso a perfiles de otros usuarios

**Pre-condición:**
- Tener 2 usuarios creados en Supabase
- Iniciar sesión con Usuario A

**Pasos:**
1. Iniciar sesión con Usuario A
2. Abrir DevTools → Network
3. Observar el request a `/rest/v1/profiles`

**Resultado Esperado:**
- ✅ El request incluye filtro: `?id=eq.{user-a-id}`
- ✅ La respuesta solo contiene 1 perfil (el del usuario A)
- ✅ NO puede ver perfiles de otros usuarios

**Verificar manualmente en SQL (Supabase Dashboard):**
```sql
-- Ejecutar como Usuario A (via RLS)
SELECT * FROM public.profiles;

-- Debería retornar SOLO 1 fila (su propio perfil)
```

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 6.2: Usuario puede actualizar su propio perfil
**Objetivo:** Verificar que RLS permite UPDATE en propio perfil

**Pasos:**
1. Iniciar sesión
2. Implementar actualización de perfil (actualmente en desarrollo)
3. Intentar actualizar el `full_name`

**Resultado Esperado:**
- ✅ UPDATE exitoso
- ✅ Los cambios se reflejan en la UI
- ✅ El campo `updated_at` se actualiza automáticamente (trigger)

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A
**Nota:** Este test requiere implementar la funcionalidad de edición de perfil

---

## 🧪 TESTS MANUALES - FASE 7: RESPONSIVE DESIGN (MOBILE FIRST)

### TEST 7.1: Login en mobile (320px)
**Objetivo:** Verificar diseño responsive en mobile

**Pasos:**
1. DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Seleccionar: iPhone SE (375x667)
3. Navegar a `/auth/login`

**Resultado Esperado:**
- ✅ Formulario se adapta correctamente
- ✅ Botones son accesibles (mínimo 44x44px)
- ✅ Texto legible (mínimo 16px para evitar zoom automático)
- ✅ NO hay scroll horizontal
- ✅ OAuth buttons se muestran en grid de 2 columnas

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 7.2: Dashboard en tablet (768px)
**Objetivo:** Verificar diseño en tablets

**Pasos:**
1. DevTools → Seleccionar: iPad (768x1024)
2. Iniciar sesión y navegar a Dashboard

**Resultado Esperado:**
- ✅ Stats cards se muestran en grid de 3 columnas
- ✅ Header se adapta correctamente
- ✅ Quick actions legibles y accesibles
- ✅ Footer responsive

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 7.3: Dashboard en desktop (1920px)
**Objetivo:** Verificar diseño en desktop

**Pasos:**
1. DevTools → Responsive → 1920x1080
2. Navegar a Dashboard

**Resultado Esperado:**
- ✅ Contenido centrado con `max-w-7xl`
- ✅ NO hay desperdicio excesivo de espacio
- ✅ Tipografía legible a distancia
- ✅ Hover states funcionan en botones

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 🧪 TESTS MANUALES - FASE 8: ACCESIBILIDAD (A11Y)

### TEST 8.1: Navegación por teclado
**Objetivo:** Verificar que la app es usable sin mouse

**Pasos:**
1. Ir a `/auth/login`
2. Usar SOLO el teclado:
   - `Tab` para navegar entre campos
   - `Enter` para enviar formulario
   - `Space` para checkboxes

**Resultado Esperado:**
- ✅ Todos los elementos interactivos son accesibles con `Tab`
- ✅ El orden de foco es lógico (top → bottom, left → right)
- ✅ El elemento con foco tiene indicador visible (outline)
- ✅ `Enter` envía el formulario correctamente

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 8.2: Lector de pantalla (Screen Reader)
**Objetivo:** Verificar que la app es usable con screen readers

**Herramienta:** NVDA (Windows) o VoiceOver (Mac)

**Pasos:**
1. Activar screen reader
2. Navegar por la página de login

**Resultado Esperado:**
- ✅ Los labels de inputs se leen correctamente
- ✅ Los errores de validación se anuncian
- ✅ Los botones tienen texto descriptivo
- ✅ Las imágenes tienen `alt` text apropiado

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 8.3: Contraste de colores
**Objetivo:** Verificar que el contraste cumple WCAG 2.1 AA

**Herramienta:** Lighthouse (DevTools → Lighthouse → Accessibility)

**Pasos:**
1. Ir a `/auth/login`
2. Ejecutar Lighthouse audit

**Resultado Esperado:**
- ✅ Score de Accesibilidad: > 90
- ✅ NO hay issues de contraste
- ✅ Textos legibles con ratio mínimo 4.5:1

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 🧪 TESTS MANUALES - FASE 9: RENDIMIENTO

### TEST 9.1: Lighthouse Performance Score
**Objetivo:** Verificar que la app tiene buen rendimiento

**Pasos:**
1. Ir a `/dashboard`
2. DevTools → Lighthouse → Performance
3. Ejecutar audit

**Resultado Esperado:**
- ✅ Performance Score: > 90
- ✅ First Contentful Paint (FCP): < 1.8s
- ✅ Time to Interactive (TTI): < 3.8s
- ✅ Largest Contentful Paint (LCP): < 2.5s

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 9.2: Bundle Size
**Objetivo:** Verificar que el bundle no es excesivamente grande

**Pasos:**
1. Build de producción:
```bash
bun run build
```
2. Revisar output en consola

**Resultado Esperado:**
- ✅ `main.js`: < 20 KB
- ✅ `polyfills.js`: < 40 KB
- ✅ Lazy chunks (login, dashboard): < 50 KB cada uno
- ✅ Tamaño total estimado transfer: < 150 KB

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 🧪 TESTS MANUALES - FASE 10: EDGE CASES

### TEST 10.1: Token expirado (sesión inválida)
**Objetivo:** Verificar manejo de token expirado

**Pasos:**
1. Iniciar sesión
2. DevTools → Application → Local Storage
3. Modificar el token manualmente (corromperlo)
4. Recargar la página

**Resultado Esperado:**
- ✅ Detecta token inválido
- ✅ Redirige a `/auth/login`
- ✅ Muestra mensaje de sesión expirada (opcional)

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 10.2: Sin conexión a internet
**Objetivo:** Verificar manejo de errores de red

**Pasos:**
1. DevTools → Network → Offline
2. Intentar iniciar sesión

**Resultado Esperado:**
- ✅ Muestra error: "Error de conexión. Intenta nuevamente"
- ✅ NO se rompe la aplicación
- ✅ El spinner de loading desaparece

**Restaurar conexión:**
3. Quitar modo offline
4. Reintentar login

**Resultado:**
- ✅ Funciona correctamente

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

### TEST 10.3: Supabase caído (500 error)
**Objetivo:** Verificar manejo de errores del servidor

**Pasos:**
1. Cambiar temporalmente `VITE_SUPABASE_URL` a URL inválida
2. Intentar login

**Resultado Esperado:**
- ✅ Muestra error genérico
- ✅ NO expone detalles técnicos al usuario
- ✅ La app no se rompe

**Restaurar:**
- Volver a poner la URL correcta

**Estado:** [ ] PASS / [ ] FAIL / [ ] N/A

---

## 📊 RESUMEN DE RESULTADOS

### Resumen por Fase
| Fase | Total Tests | PASS | FAIL | N/A | % Éxito |
|------|-------------|------|------|-----|---------|
| 1. Guards y Redirecciones | 2 | ___ | ___ | ___ | ___% |
| 2. Registro | 3 | ___ | ___ | ___ | ___% |
| 3. Login | 3 | ___ | ___ | ___ | ___% |
| 4. Dashboard y Perfil | 3 | ___ | ___ | ___ | ___% |
| 5. Logout y Sesión | 3 | ___ | ___ | ___ | ___% |
| 6. RLS | 2 | ___ | ___ | ___ | ___% |
| 7. Responsive Design | 3 | ___ | ___ | ___ | ___% |
| 8. Accesibilidad | 3 | ___ | ___ | ___ | ___% |
| 9. Rendimiento | 2 | ___ | ___ | ___ | ___% |
| 10. Edge Cases | 3 | ___ | ___ | ___ | ___% |
| **TOTAL** | **27** | **___** | **___** | **___** | **___%** |

---

## 🐛 ISSUES ENCONTRADOS

### Issue Template
```markdown
### ISSUE #X: [Título descriptivo]

**Fase:** [Número de fase]
**Test:** [Número de test]
**Severidad:** [ ] Crítico / [ ] Alto / [ ] Medio / [ ] Bajo

**Descripción:**
[Descripción del problema]

**Pasos para reproducir:**
1.
2.
3.

**Resultado actual:**
[Lo que sucede]

**Resultado esperado:**
[Lo que debería suceder]

**Screenshots/Logs:**
[Si aplica]

**Posible causa:**
[Hipótesis técnica]

**Fix propuesto:**
[Solución sugerida]
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

Para considerar el testing EXITOSO, debe cumplirse:

- [ ] **Mínimo 90%** de tests en estado PASS
- [ ] **0 issues críticos** sin resolver
- [ ] **Todos los tests de Fase 1-5** deben pasar (funcionalidad core)
- [ ] **Build de producción** exitoso sin warnings críticos
- [ ] **Lighthouse Score** > 85 en todas las categorías

---

## 📝 NOTAS DEL TESTER

**Fecha de ejecución:** __________________

**Ejecutado por:** __________________

**Navegador:** __________________

**Observaciones generales:**
```
[Espacio para notas adicionales]
```

---

## 🔄 PRÓXIMOS PASOS

Después de completar este checklist:

1. **Si todos los tests pasan:**
   - Crear PR con los resultados
   - Solicitar code review
   - Preparar deploy a staging

2. **Si hay issues críticos:**
   - Crear issues en GitHub
   - Asignar a desarrollador correspondiente
   - Re-ejecutar tests después de fixes

3. **Tests automatizados pendientes:**
   - Convertir tests manuales a E2E (Playwright/Cypress)
   - Implementar tests de integración
   - Configurar CI/CD con tests automáticos

---

**Fin del Checklist de Testing Manual**
