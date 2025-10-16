# 🚀 Configuración de Variables de Entorno en Vercel

## 📋 Variables Configuradas

Tu proyecto Supabase ya está configurado con estas credenciales:

```
Supabase URL: https://wunclqnjguunowexfkyg.supabase.co
Supabase Anon Key: eyJhbGci... (ver .env)
```

## 🔧 Configurar en Vercel Dashboard

### Paso 1: Acceder a la Configuración
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto: **boilerplate-angular**
3. Click en **Settings** > **Environment Variables**

### Paso 2: Agregar Variables
Agrega las siguientes variables para **Production, Preview y Development**:

#### Variables Requeridas:

**1. VITE_SUPABASE_URL**
```
https://wunclqnjguunowexfkyg.supabase.co
```
✅ Marcar: Production, Preview, Development

**2. VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bmNscW5qZ3V1bm93ZXhma3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjAyMTQsImV4cCI6MjA3NjE5NjIxNH0.FaXvsMBBtRGaKA7Yo_WTBe0qAeF6jbxQSQm_juD9l_I
```
✅ Marcar: Production, Preview, Development

**3. VITE_STRIPE_PUBLISHABLE_KEY**
```
pk_test_TU_STRIPE_KEY_AQUI
```
✅ Marcar: Production (usar pk_live_... para producción)
✅ Marcar: Preview, Development (usar pk_test_...)

**4. VITE_API_URL**
```
https://wunclqnjguunowexfkyg.supabase.co
```
✅ Marcar: Production, Preview, Development

### Paso 3: Variables Adicionales (Backend Only)

Estas NO deben ir en el cliente, solo en Edge Functions si las usas:

**SUPABASE_SERVICE_ROLE_KEY** (Solo para Edge Functions)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bmNscW5qZ3V1bm93ZXhma3lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYyMDIxNCwiZXhwIjoyMDc2MTk2MjE0fQ.j1Xsqht4jfn85V88c2Z5gQyJ5rf80lMBd6d-VGF5zpg
```

**POSTGRES_URL** (Si usas Prisma o conexión directa)
```
postgres://postgres.wunclqnjguunowexfkyg:FoTwvVacsOFJXoOB@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
```

## 🔄 Re-deploy después de Configurar

Después de agregar las variables:
1. Click en **Deployments**
2. Click en el deployment más reciente
3. Click en **...** > **Redeploy**
4. Selecciona **Use existing Build Cache** (opcional)
5. Click **Redeploy**

O simplemente haz un nuevo push a tu repositorio:
```bash
git add .
git commit -m "Update environment configuration"
git push
```

## ✅ Verificar que Funciona

Después del deploy, abre tu aplicación y verifica en las DevTools del navegador:
```javascript
// Abre la consola del navegador (F12)
// Esto NO debería mostrar las keys (están en el build)
console.log(window);
```

Las variables estarán compiladas en tu código pero no accesibles desde window.

## 🔒 Seguridad

**⚠️ IMPORTANTE:**
- ✅ `VITE_*` variables son públicas (se incluyen en el bundle del cliente)
- ❌ NUNCA pongas Secret Keys con prefijo `VITE_`
- ✅ Service Role Key y Postgres Password solo en backend/Edge Functions
- ✅ El Anon Key es seguro exponerlo (tiene RLS en Supabase)

## 📝 Próximos Pasos

1. ✅ Variables configuradas
2. ⏳ Crear SupabaseService en Angular
3. ⏳ Implementar autenticación
4. ⏳ Configurar RLS policies en Supabase

---

**Proyecto:** boilerplate-angular
**Supabase Project:** wunclqnjguunowexfkyg
**Vercel:** Configurado ✅
