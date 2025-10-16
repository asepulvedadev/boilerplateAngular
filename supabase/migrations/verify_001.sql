-- ============================================================================
-- SCRIPT DE VERIFICACIÓN: Migration 001
-- ============================================================================
-- Descripción: Verifica que la migration inicial se ejecutó correctamente
-- Uso: Ejecutar en Supabase SQL Editor después de aplicar la migration
-- ============================================================================

-- ============================================================================
-- TEST 1: Verificar que las tablas existen
-- ============================================================================

SELECT
  '✅ TEST 1: Tablas creadas' AS test_name,
  CASE
    WHEN COUNT(*) = 2 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Se esperaban 2 tablas, se encontraron ' || COUNT(*)
  END AS result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'subscriptions');

-- ============================================================================
-- TEST 2: Verificar que RLS está habilitado
-- ============================================================================

SELECT
  '✅ TEST 2: RLS habilitado' AS test_name,
  CASE
    WHEN COUNT(*) = 2 AND COUNT(*) FILTER (WHERE rowsecurity = true) = 2
      THEN 'PASS ✓'
    ELSE 'FAIL ✗ - RLS no está habilitado en todas las tablas'
  END AS result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions');

-- ============================================================================
-- TEST 3: Verificar columnas de la tabla profiles
-- ============================================================================

SELECT
  '✅ TEST 3: Columnas de profiles' AS test_name,
  CASE
    WHEN COUNT(*) >= 8 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Faltan columnas. Se encontraron: ' || COUNT(*)
  END AS result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'id', 'email', 'full_name', 'avatar_url',
    'role', 'subscription_tier', 'created_at', 'updated_at'
  );

-- ============================================================================
-- TEST 4: Verificar columnas de la tabla subscriptions
-- ============================================================================

SELECT
  '✅ TEST 4: Columnas de subscriptions' AS test_name,
  CASE
    WHEN COUNT(*) >= 11 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Faltan columnas. Se encontraron: ' || COUNT(*)
  END AS result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscriptions'
  AND column_name IN (
    'id', 'user_id', 'stripe_customer_id', 'stripe_subscription_id',
    'plan', 'status', 'current_period_start', 'current_period_end',
    'cancel_at_period_end', 'created_at', 'updated_at'
  );

-- ============================================================================
-- TEST 5: Verificar triggers
-- ============================================================================

SELECT
  '✅ TEST 5: Triggers creados' AS test_name,
  CASE
    WHEN COUNT(*) >= 4 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Se esperaban 4+ triggers, se encontraron ' || COUNT(*)
  END AS result
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('profiles', 'subscriptions')
  OR (trigger_schema = 'auth' AND event_object_table = 'users');

-- ============================================================================
-- TEST 6: Verificar RLS policies
-- ============================================================================

SELECT
  '✅ TEST 6: RLS Policies creadas' AS test_name,
  CASE
    WHEN COUNT(*) >= 6 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Se esperaban 6+ policies, se encontraron ' || COUNT(*)
  END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions');

-- ============================================================================
-- TEST 7: Verificar funciones
-- ============================================================================

SELECT
  '✅ TEST 7: Funciones creadas' AS test_name,
  CASE
    WHEN COUNT(*) >= 3 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Se esperaban 3+ funciones, se encontraron ' || COUNT(*)
  END AS result
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_updated_at',
    'handle_new_user',
    'sync_subscription_tier'
  );

-- ============================================================================
-- TEST 8: Verificar índices
-- ============================================================================

SELECT
  '✅ TEST 8: Índices creados' AS test_name,
  CASE
    WHEN COUNT(*) >= 6 THEN 'PASS ✓'
    ELSE 'FAIL ✗ - Se esperaban 6+ índices, se encontraron ' || COUNT(*)
  END AS result
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions');

-- ============================================================================
-- RESUMEN DETALLADO
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════' AS separator;
SELECT 'RESUMEN DETALLADO DE LA MIGRATION' AS titulo;
SELECT '═══════════════════════════════════════════════════════' AS separator;

-- Listar todas las tablas
SELECT '📊 TABLAS CREADAS:' AS info;
SELECT
  table_name AS tabla,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'subscriptions')
ORDER BY table_name;

SELECT '═══════════════════════════════════════════════════════' AS separator;

-- Listar todas las policies
SELECT '🔒 RLS POLICIES:' AS info;
SELECT
  tablename AS tabla,
  policyname AS policy,
  cmd AS comando
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions')
ORDER BY tablename, policyname;

SELECT '═══════════════════════════════════════════════════════' AS separator;

-- Listar todos los triggers
SELECT '⚡ TRIGGERS:' AS info;
SELECT
  event_object_table AS tabla,
  trigger_name AS trigger,
  event_manipulation AS evento
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
  AND (
    event_object_table IN ('profiles', 'subscriptions')
    OR (trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created')
  )
ORDER BY event_object_table, trigger_name;

SELECT '═══════════════════════════════════════════════════════' AS separator;

-- Listar todas las funciones
SELECT '⚙️ FUNCIONES:' AS info;
SELECT
  routine_name AS funcion,
  routine_type AS tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_updated_at',
    'handle_new_user',
    'sync_subscription_tier'
  )
ORDER BY routine_name;

SELECT '═══════════════════════════════════════════════════════' AS separator;

-- Listar todos los índices
SELECT '📇 ÍNDICES:' AS info;
SELECT
  tablename AS tabla,
  indexname AS indice
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions')
ORDER BY tablename, indexname;

SELECT '═══════════════════════════════════════════════════════' AS separator;
SELECT '✅ VERIFICACIÓN COMPLETA' AS resultado;
SELECT '═══════════════════════════════════════════════════════' AS separator;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
--
-- 1. Copiar y pegar este script completo en Supabase SQL Editor
-- 2. Ejecutar (Run)
-- 3. Revisar que todos los tests digan "PASS ✓"
-- 4. Si algún test falla, revisar la migration 001 y volver a ejecutarla
--
-- ============================================================================
