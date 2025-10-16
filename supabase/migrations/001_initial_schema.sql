-- ============================================================================
-- MIGRATION 001: SCHEMA INICIAL - PROFILES & SUBSCRIPTIONS
-- ============================================================================
-- Descripción: Crea las tablas base del sistema SaaS con RLS y triggers
-- Fecha: 2025-01-16
-- Autor: Supabase Backend Agent
-- ============================================================================

-- ============================================================================
-- PASO 1: HABILITAR EXTENSIONES NECESARIAS
-- ============================================================================

-- uuid-ossp: Para generar UUIDs automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PASO 2: CREAR TABLA PROFILES
-- ============================================================================
-- Descripción: Almacena información extendida de los usuarios
-- Relación: 1:1 con auth.users (creada automáticamente por trigger)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary Key: Referencia directa al usuario de auth.users
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- Información básica del usuario
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,

  -- Roles y permisos
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- Información de suscripción (desnormalizado para queries rápidos)
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),

  -- Timestamps automáticos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON public.profiles(subscription_tier);

-- Comentarios para documentación
COMMENT ON TABLE public.profiles IS 'Perfiles extendidos de usuarios del sistema';
COMMENT ON COLUMN public.profiles.id IS 'UUID del usuario (FK a auth.users)';
COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario: user (default) o admin';
COMMENT ON COLUMN public.profiles.subscription_tier IS 'Tier de suscripción: free, pro, enterprise';

-- ============================================================================
-- PASO 3: CREAR TABLA SUBSCRIPTIONS
-- ============================================================================
-- Descripción: Almacena información de suscripciones de Stripe
-- Relación: 1:1 con profiles (un usuario puede tener una suscripción activa)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  -- Primary Key: UUID autogenerado
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Key: Referencia al perfil del usuario
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Información de Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Información del plan
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),

  -- Fechas de período de facturación
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Control de cancelación
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

-- Constraint: Un usuario solo puede tener una suscripción activa
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_active_unique
  ON public.subscriptions(user_id)
  WHERE status = 'active';

-- Comentarios
COMMENT ON TABLE public.subscriptions IS 'Suscripciones de usuarios (integración con Stripe)';
COMMENT ON COLUMN public.subscriptions.status IS 'Estado: active, canceled, past_due, trialing, incomplete';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Si TRUE, se cancela al final del período actual';

-- ============================================================================
-- PASO 4: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 5: CREAR RLS POLICIES PARA PROFILES
-- ============================================================================

-- POLICY: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- POLICY: Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLICY: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- No pueden cambiar su propio role (solo admins)
    auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- POLICY: Los admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLICY: Los usuarios NO pueden insertarse directamente (solo via trigger)
-- Esta política se deja vacía para que solo el trigger pueda crear perfiles

-- POLICY: Solo los admins pueden eliminar perfiles
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PASO 6: CREAR RLS POLICIES PARA SUBSCRIPTIONS
-- ============================================================================

-- POLICY: Los usuarios pueden ver su propia suscripción
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- POLICY: Los admins pueden ver todas las suscripciones
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLICY: Solo service_role puede insertar/actualizar subscriptions
-- (Las operaciones se harán desde Edge Functions con service_role key)
-- Por seguridad, NO creamos policies de INSERT/UPDATE para usuarios normales

-- ============================================================================
-- PASO 7: CREAR FUNCIÓN PARA AUTO-UPDATE DE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualiza automáticamente el campo updated_at
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function para actualizar updated_at automáticamente';

-- ============================================================================
-- PASO 8: CREAR TRIGGER PARA updated_at EN PROFILES
-- ============================================================================

DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON public.profiles;

CREATE TRIGGER profiles_updated_at_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- PASO 9: CREAR TRIGGER PARA updated_at EN SUBSCRIPTIONS
-- ============================================================================

DROP TRIGGER IF EXISTS subscriptions_updated_at_trigger ON public.subscriptions;

CREATE TRIGGER subscriptions_updated_at_trigger
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- PASO 10: CREAR FUNCIÓN PARA AUTO-CREAR PROFILE AL REGISTRARSE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserta un perfil automáticamente cuando se crea un usuario en auth.users
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si el perfil ya existe, no hacer nada
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log del error pero no fallar el registro
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil cuando se registra un nuevo usuario';

-- ============================================================================
-- PASO 11: CREAR TRIGGER PARA AUTO-CREAR PROFILE
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PASO 12: CREAR FUNCIÓN PARA SINCRONIZAR subscription_tier
-- ============================================================================
-- Descripción: Cuando cambia una subscription, actualiza el tier en profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si la suscripción está activa
  IF NEW.status = 'active' THEN
    UPDATE public.profiles
    SET subscription_tier = NEW.plan
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sync_subscription_tier() IS 'Sincroniza el tier de suscripción en profiles cuando cambia en subscriptions';

-- ============================================================================
-- PASO 13: CREAR TRIGGER PARA SINCRONIZAR TIER
-- ============================================================================

DROP TRIGGER IF EXISTS subscriptions_sync_tier_trigger ON public.subscriptions;

CREATE TRIGGER subscriptions_sync_tier_trigger
  AFTER INSERT OR UPDATE OF status, plan ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_tier();

-- ============================================================================
-- PASO 14: INSERTAR DATOS DE PRUEBA (OPCIONAL - COMENTADO)
-- ============================================================================
-- Descomenta esta sección solo en desarrollo para tener datos de prueba
-- ============================================================================

/*
-- Insertar perfil de admin de prueba (requiere un usuario existente en auth.users)
-- REEMPLAZA 'tu-uuid-de-usuario' con un UUID real de auth.users

INSERT INTO public.profiles (id, email, full_name, role, subscription_tier)
VALUES (
  'tu-uuid-de-usuario'::UUID,
  'admin@example.com',
  'Admin User',
  'admin',
  'enterprise'
)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- ============================================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- ============================================================================
--
-- OPCIÓN 1: Desde Supabase Dashboard (Recomendado para primera vez)
-- --------------------------------------------------------
-- 1. Ir a: https://wunclqnjguunowexfkyg.supabase.co/project/_/sql
-- 2. Copiar y pegar TODO el contenido de este archivo
-- 3. Click en "Run" (ejecutar)
-- 4. Verificar que no hay errores en la consola
--
-- OPCIÓN 2: Desde Supabase CLI (Para proyectos con control de versiones)
-- --------------------------------------------------------
-- 1. Instalar Supabase CLI: npm install -g supabase
-- 2. Login: supabase login
-- 3. Link project: supabase link --project-ref wunclqnjguunowexfkyg
-- 4. Aplicar migration: supabase db push
--
-- OPCIÓN 3: Desde archivo local
-- --------------------------------------------------------
-- 1. Guardar este archivo como: supabase/migrations/001_initial_schema.sql
-- 2. Ejecutar: supabase db push
--
-- ============================================================================
-- VERIFICACIÓN POST-MIGRATION:
-- ============================================================================
--
-- Ejecuta estas queries para verificar que todo funciona:
--
-- 1. Verificar que las tablas existen:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public' AND table_name IN ('profiles', 'subscriptions');
--
-- 2. Verificar que RLS está habilitado:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public' AND tablename IN ('profiles', 'subscriptions');
--
-- 3. Verificar que los triggers existen:
--    SELECT trigger_name, event_object_table FROM information_schema.triggers
--    WHERE trigger_schema = 'public';
--
-- 4. Verificar que las policies existen:
--    SELECT schemaname, tablename, policyname FROM pg_policies
--    WHERE schemaname = 'public';
--
-- ============================================================================
