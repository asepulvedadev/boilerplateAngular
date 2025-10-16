# 🗄️ Migrations de Supabase - SaaS Boilerplate

## 📋 Índice
- [Migrations Disponibles](#migrations-disponibles)
- [Cómo Ejecutar las Migrations](#cómo-ejecutar-las-migrations)
- [Verificación Post-Migration](#verificación-post-migration)
- [Troubleshooting](#troubleshooting)
- [Rollback](#rollback)

---

## 📦 Migrations Disponibles

### `001_initial_schema.sql` - Schema Inicial
**Fecha:** 2025-01-16
**Estado:** ✅ Listo para producción

**Descripción:**
Crea la estructura base del sistema SaaS con:
- ✅ Tabla `profiles` (información extendida de usuarios)
- ✅ Tabla `subscriptions` (integración con Stripe)
- ✅ RLS Policies (seguridad por filas)
- ✅ Triggers automáticos (crear perfil, actualizar timestamps)
- ✅ Funciones helper (sincronización de datos)
- ✅ Índices optimizados (performance en queries)

**Cambios incluidos:**
```sql
CREATE TABLE profiles (
  id, email, full_name, avatar_url,
  role, subscription_tier,
  created_at, updated_at
)

CREATE TABLE subscriptions (
  id, user_id, stripe_customer_id, stripe_subscription_id,
  plan, status, current_period_start, current_period_end,
  cancel_at_period_end, created_at, updated_at
)

+ 6 RLS Policies
+ 4 Triggers
+ 3 Functions
+ 7 Indexes
```

---

## 🚀 Cómo Ejecutar las Migrations

### Opción 1: Supabase Dashboard (Recomendado para primera vez)

**Paso 1:** Ir al SQL Editor de Supabase
```
https://wunclqnjguunowexfkyg.supabase.co/project/_/sql
```

**Paso 2:** Copiar el contenido de la migration
```bash
# Desde Windows PowerShell o CMD
type supabase\migrations\001_initial_schema.sql
```

**Paso 3:** Pegar en el editor SQL y ejecutar
- Click en "Run" (o Ctrl+Enter)
- Esperar a que termine (debería tomar ~2-3 segundos)
- Verificar que no hay errores en rojo

**Paso 4:** Verificar la migration
```bash
# Copiar y ejecutar el script de verificación
type supabase\migrations\verify_001.sql
```

---

### Opción 2: Supabase CLI (Para proyectos con Git)

**Requisitos previos:**
```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# O con Bun
bun add -g supabase
```

**Paso 1:** Login en Supabase
```bash
supabase login
```
> Te abrirá el navegador para autenticarte

**Paso 2:** Linkear el proyecto
```bash
supabase link --project-ref wunclqnjguunowexfkyg
```

**Paso 3:** Aplicar la migration
```bash
# Aplicar todas las migrations pendientes
supabase db push

# O aplicar una específica
supabase migration up
```

**Paso 4:** Verificar
```bash
# Ver el estado de las migrations
supabase migration list

# Ver las tablas creadas
supabase db diff
```

---

### Opción 3: Desde archivo local (PostgreSQL client)

**Requisitos:**
- PostgreSQL client instalado (`psql`)
- Connection string de Supabase

**Paso 1:** Obtener la connection string
```
https://wunclqnjguunowexfkyg.supabase.co/project/_/settings/database
```
> Copiar "Connection string" (modo "Transaction")

**Paso 2:** Ejecutar la migration
```bash
psql "postgresql://postgres:[PASSWORD]@db.wunclqnjguunowexfkyg.supabase.co:5432/postgres" \
  -f supabase/migrations/001_initial_schema.sql
```

---

## ✅ Verificación Post-Migration

### Test Automático (Recomendado)

**Paso 1:** Ejecutar el script de verificación
```sql
-- En Supabase SQL Editor:
-- Copiar y pegar el contenido de: verify_001.sql
```

**Paso 2:** Revisar los resultados
```
✅ TEST 1: Tablas creadas        → PASS ✓
✅ TEST 2: RLS habilitado         → PASS ✓
✅ TEST 3: Columnas de profiles   → PASS ✓
✅ TEST 4: Columnas de subscriptions → PASS ✓
✅ TEST 5: Triggers creados       → PASS ✓
✅ TEST 6: RLS Policies creadas   → PASS ✓
✅ TEST 7: Funciones creadas      → PASS ✓
✅ TEST 8: Índices creados        → PASS ✓
```

**Todos deben decir "PASS ✓"**

---

### Test Manual (Opcional)

**1. Verificar tablas:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'subscriptions');
```
> Debe retornar 2 filas

**2. Verificar RLS:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions');
```
> rowsecurity debe ser `true` en ambas

**3. Verificar triggers:**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
ORDER BY event_object_table;
```
> Debe listar: on_auth_user_created, profiles_updated_at_trigger, etc.

**4. Verificar policies:**
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
> Debe listar al menos 6 policies

---

## 🧪 Test de Integración (Probar que funciona)

### Test 1: Registro de usuario automático

**Paso 1:** Crear un usuario de prueba desde Angular
```typescript
// En tu app Angular
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123456!',
  options: {
    data: {
      full_name: 'Usuario de Prueba'
    }
  }
});
```

**Paso 2:** Verificar que se creó el perfil automáticamente
```sql
-- En Supabase SQL Editor
SELECT * FROM profiles WHERE email = 'test@example.com';
```
> Debe retornar 1 fila con los datos del usuario

**Esperado:**
- ✅ El trigger creó automáticamente el perfil
- ✅ El email se copió correctamente
- ✅ El full_name se copió desde metadata
- ✅ El role es 'user' por defecto
- ✅ El subscription_tier es 'free' por defecto

---

### Test 2: RLS funciona correctamente

**Paso 1:** Autenticarte como usuario normal
```typescript
await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'Test123456!'
});
```

**Paso 2:** Intentar ver tu propio perfil
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

console.log(data); // ✅ Debe funcionar
```

**Paso 3:** Intentar ver otros perfiles
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*');

console.log(data); // ❌ Solo verás tu propio perfil
```

**Esperado:**
- ✅ Puedes ver tu propio perfil
- ✅ NO puedes ver perfiles de otros usuarios
- ✅ Solo admins pueden ver todos los perfiles

---

## 🐛 Troubleshooting

### Error: "permission denied for table profiles"

**Causa:** RLS está habilitado pero falta autenticación

**Solución:**
```typescript
// Asegúrate de estar autenticado
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Usuario no autenticado
  await supabase.auth.signIn(...);
}
```

---

### Error: "duplicate key value violates unique constraint"

**Causa:** Intentando crear un perfil que ya existe

**Solución:**
```sql
-- Eliminar perfiles duplicados (solo en desarrollo)
DELETE FROM profiles WHERE email = 'test@example.com';

-- Luego volver a registrar el usuario
```

---

### Error: "trigger function does not exist"

**Causa:** Las funciones no se crearon correctamente

**Solución:**
```sql
-- Verificar que existen
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'handle_updated_at', 'sync_subscription_tier');

-- Si no existen, volver a ejecutar la migration completa
```

---

### La migration no se aplica

**Solución 1:** Verificar permisos
```sql
-- Verificar que estás usando la connection correcta
SELECT current_user, current_database();
```

**Solución 2:** Ejecutar en partes
```sql
-- Dividir la migration en bloques más pequeños
-- Ejecutar uno por uno en el SQL Editor
```

**Solución 3:** Rollback y volver a intentar
```sql
-- Ver sección de Rollback más abajo
```

---

## ⏮️ Rollback

### Rollback completo de la migration 001

**⚠️ ADVERTENCIA:** Esto eliminará TODAS las tablas y datos

```sql
-- ============================================================================
-- ROLLBACK DE MIGRATION 001
-- ============================================================================

-- Eliminar triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON public.profiles;
DROP TRIGGER IF EXISTS subscriptions_updated_at_trigger ON public.subscriptions;
DROP TRIGGER IF EXISTS subscriptions_sync_tier_trigger ON public.subscriptions;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.sync_subscription_tier() CASCADE;

-- Eliminar tablas (CASCADE elimina las foreign keys)
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Verificar que se eliminaron
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'subscriptions');
-- Debe retornar 0 filas

-- ============================================================================
```

---

## 📊 Estructura Final

Después de ejecutar la migration 001, tu base de datos tendrá:

```
┌─────────────────────────────────────────┐
│         auth.users (Supabase)           │
│  - id (UUID)                            │
│  - email                                │
│  - encrypted_password                   │
│  - raw_user_meta_data                   │
└──────────────┬──────────────────────────┘
               │
               │ FK (id)
               │
               ▼
┌─────────────────────────────────────────┐
│         public.profiles                 │
│  - id (PK, FK → auth.users)             │
│  - email                                │
│  - full_name                            │
│  - avatar_url                           │
│  - role (user/admin)                    │
│  - subscription_tier (free/pro/ent)     │
│  - created_at, updated_at               │
│  🔒 RLS: Users see own profile          │
└──────────────┬──────────────────────────┘
               │
               │ FK (user_id)
               │
               ▼
┌─────────────────────────────────────────┐
│       public.subscriptions              │
│  - id (PK)                              │
│  - user_id (FK → profiles)              │
│  - stripe_customer_id                   │
│  - stripe_subscription_id               │
│  - plan (free/pro/enterprise)           │
│  - status (active/canceled/past_due)    │
│  - current_period_start                 │
│  - current_period_end                   │
│  - cancel_at_period_end                 │
│  - created_at, updated_at               │
│  🔒 RLS: Users see own subscription     │
└─────────────────────────────────────────┘
```

---

## 🔗 Recursos Adicionales

- **Supabase Dashboard:** https://wunclqnjguunowexfkyg.supabase.co
- **SQL Editor:** https://wunclqnjguunowexfkyg.supabase.co/project/_/sql
- **Table Editor:** https://wunclqnjguunowexfkyg.supabase.co/project/_/editor
- **Documentación RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Documentación Triggers:** https://supabase.com/docs/guides/database/postgres/triggers

---

## 📞 Soporte

Si tienes problemas ejecutando la migration:

1. Revisa la sección [Troubleshooting](#troubleshooting)
2. Ejecuta el script de verificación (`verify_001.sql`)
3. Revisa los logs en Supabase Dashboard → Logs
4. Verifica tu connection string y permisos

---

**Última actualización:** 2025-01-16
**Versión:** 1.0.0
**Autor:** Supabase Backend Agent
