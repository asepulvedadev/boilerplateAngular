# 🚀 Deployment Guide - Resend Email System

Guía paso a paso para desplegar el sistema de emails en producción.

---

## ✅ Pre-requisitos

Antes de comenzar, asegúrate de tener:

- [ ] Cuenta de Resend creada: https://resend.com
- [ ] Dominio propio verificado
- [ ] Proyecto de Supabase activo
- [ ] Supabase CLI instalado: `npm install -g supabase`

---

## 📋 Pasos de Deployment

### 1. Configurar Resend

#### 1.1. Crear cuenta y obtener API Key

```bash
# 1. Ir a https://resend.com/signup
# 2. Crear cuenta
# 3. Ir a API Keys: https://resend.com/api-keys
# 4. Crear nueva API Key
# 5. Copiar el key: re_xxxxxxxxxxxxx
```

#### 1.2. Agregar y verificar dominio

```bash
# 1. Ir a https://resend.com/domains
# 2. Hacer clic en "Add Domain"
# 3. Ingresar tu dominio: tudominio.com
```

Configurar registros DNS:

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM Record
Type: TXT
Name: resend._domainkey
Value: [Copiado desde Resend Dashboard]

# DMARC Record (opcional pero recomendado)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@tudominio.com
```

**Verificación:**
```bash
# Esperar 5-10 minutos para propagación DNS
# Hacer clic en "Verify" en Resend Dashboard
```

---

### 2. Configurar Supabase Edge Function

#### 2.1. Login en Supabase CLI

```bash
supabase login
```

#### 2.2. Link al proyecto

```bash
# Obtener project ref desde: https://app.supabase.com/project/_/settings/general
supabase link --project-ref tu-proyecto-ref
```

#### 2.3. Desplegar Edge Function

```bash
# Desde la raíz del proyecto
cd C:\Users\asepulvedadev\dev\boilerplate-angular

# Desplegar función
supabase functions deploy send-email

# Output esperado:
# ✅ Function deployed successfully
# URL: https://tu-proyecto-ref.supabase.co/functions/v1/send-email
```

#### 2.4. Configurar Secrets

```bash
# RESEND_API_KEY
supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui

# FROM EMAIL (debe estar verificado en Resend)
supabase secrets set RESEND_FROM_EMAIL=noreply@tudominio.com

# Verificar secrets configurados
supabase secrets list
```

---

### 3. Copiar Templates HTML a Public

Los templates deben estar accesibles desde el frontend:

```bash
# Opción 1: Copiar a public/assets (recomendado)
mkdir -p public/assets/email-templates
cp email-templates/*.html public/assets/email-templates/

# Opción 2: Copiar a src/assets
mkdir -p src/assets/email-templates
cp email-templates/*.html src/assets/email-templates/
```

**Verificar en angular.json:**
```json
{
  "projects": {
    "tu-proyecto": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              "src/assets",
              "public",
              {
                "glob": "**/*",
                "input": "email-templates",
                "output": "assets/email-templates"
              }
            ]
          }
        }
      }
    }
  }
}
```

---

### 4. Actualizar Environment Variables

#### 4.1. Development (.env.development.local)

```bash
# Resend
RESEND_API_KEY=re_test_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tudominio.com
RESEND_FROM_NAME=SaaS Boilerplate [DEV]

# App URLs (development)
VITE_APP_URL=http://localhost:4200
```

#### 4.2. Production (Vercel Environment Variables)

```bash
# 1. Ir a Vercel Dashboard > Settings > Environment Variables
# 2. Agregar:

# Resend (se configura en Supabase, no en Vercel)
# NO agregar RESEND_API_KEY en Vercel

# App Configuration
VITE_APP_URL=https://tudominio.com
VITE_APP_NAME=SaaS Boilerplate
```

---

### 5. Testing

#### 5.1. Test local de Edge Function

```bash
# Ejecutar Supabase localmente
supabase start

# Servir Edge Function localmente
supabase functions serve send-email

# En otra terminal, hacer test
curl -X POST \
  http://localhost:54321/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello World</h1>"
  }'
```

#### 5.2. Test desde Angular

```typescript
// Crear componente de test
@Component({
  selector: 'app-email-test',
  template: `
    <button (click)="sendTestEmail()">Send Test Email</button>
    @if (emailService.isLoading()) {
      <p>Sending...</p>
    }
    @if (emailService.lastSuccess()) {
      <p class="success">{{ emailService.lastSuccess() }}</p>
    }
    @if (emailService.lastError()) {
      <p class="error">{{ emailService.lastError() }}</p>
    }
  `
})
export class EmailTestComponent {
  protected emailService = inject(EmailService);

  async sendTestEmail() {
    await this.emailService.sendWelcomeEmail(
      'tu-email@example.com',
      'Test User',
      'test-123'
    );
  }
}
```

#### 5.3. Verificar en Resend Dashboard

```bash
# 1. Ir a https://resend.com/emails
# 2. Ver emails enviados
# 3. Revisar estado (delivered, bounced, complained)
```

---

### 6. Monitoreo y Logs

#### 6.1. Logs de Edge Function

```bash
# Ver logs en tiempo real
supabase functions logs send-email --follow

# Ver logs recientes
supabase functions logs send-email --limit 50
```

#### 6.2. Dashboard de Resend

```bash
# Métricas disponibles:
# - Emails enviados
# - Delivery rate
# - Bounce rate
# - Click rate (si usas tracking)

# URL: https://resend.com/overview
```

---

## 🔒 Seguridad

### Configurar CORS en Edge Function

Ya está configurado en `_shared/cors.ts`, pero para producción:

```typescript
// En production, cambiar '*' por tu dominio
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tudominio.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

### Rate Limiting

Implementar rate limiting en Edge Function:

```typescript
// Limitar a 10 emails por minuto por usuario
const RATE_LIMIT = 10;
const WINDOW = 60000; // 1 minuto

// Implementación con Redis o Supabase
```

### Validar emails del remitente

```typescript
// Solo permitir emails desde dominios verificados
const ALLOWED_DOMAINS = ['tudominio.com', 'app.tudominio.com'];

if (!ALLOWED_DOMAINS.some(domain => fromEmail.endsWith(domain))) {
  throw new Error('Dominio no autorizado');
}
```

---

## 📊 Métricas y Analytics

### Tracking de emails (opcional)

Agregar parámetros UTM a los links:

```typescript
const trackingParams = '?utm_source=email&utm_medium=transactional&utm_campaign=welcome';

const variables = {
  DASHBOARD_URL: `${environment.appUrl}/dashboard${trackingParams}`,
  // ... resto de URLs
};
```

### Webhooks de Resend

Configurar webhooks para eventos:

```bash
# 1. Ir a https://resend.com/webhooks
# 2. Agregar endpoint: https://tudominio.com/api/webhooks/resend
# 3. Seleccionar eventos:
#    - email.delivered
#    - email.bounced
#    - email.complained
#    - email.opened (si habilitas tracking)
```

---

## ✅ Checklist Final

Antes de ir a producción, verificar:

### Resend
- [ ] Dominio verificado (SPF, DKIM, DMARC)
- [ ] API Key de producción creada
- [ ] Email del remitente verificado

### Supabase
- [ ] Edge Function desplegada
- [ ] Secrets configurados (RESEND_API_KEY, RESEND_FROM_EMAIL)
- [ ] CORS configurado correctamente
- [ ] Logs funcionando

### Angular
- [ ] Templates HTML copiados a public/assets
- [ ] EmailService importado en módulos necesarios
- [ ] Environment.prod.ts con URLs correctas
- [ ] Build de producción exitoso: `bun run build`

### Testing
- [ ] Email de bienvenida funciona
- [ ] Email de verificación funciona
- [ ] Email de reset password funciona
- [ ] Emails de suscripción funcionan
- [ ] Emails de pago funcionan
- [ ] Variables se reemplazan correctamente
- [ ] Diseño responsive en mobile
- [ ] Links funcionan correctamente

### Monitoreo
- [ ] Logs de Edge Function accesibles
- [ ] Dashboard de Resend configurado
- [ ] Alertas configuradas (opcional)
- [ ] Webhooks configurados (opcional)

---

## 🆘 Problemas Comunes

### "Domain not verified"
**Solución:** Esperar propagación DNS (hasta 48 horas). Verificar registros con:
```bash
dig TXT tudominio.com
dig TXT resend._domainkey.tudominio.com
```

### "Invalid API Key"
**Solución:** Verificar que el secret esté configurado correctamente:
```bash
supabase secrets list
# Si no aparece, volver a configurar:
supabase secrets set RESEND_API_KEY=re_...
```

### "Template not found"
**Solución:** Verificar que los templates estén en la carpeta correcta:
```bash
ls public/assets/email-templates/
# Debe mostrar: welcome-email.html, verify-email.html, etc.
```

### Emails van a spam
**Solución:**
1. Verificar SPF, DKIM, DMARC
2. Usar dominio verificado (no Gmail/Outlook personal)
3. Evitar palabras spam en subject
4. Incluir link de unsubscribe
5. Warmup del dominio (enviar gradualmente)

---

## 📚 Referencias

- **Resend Docs:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Email Best Practices:** https://sendgrid.com/blog/email-best-practices/
- **DNS Configuration:** https://mxtoolbox.com/

---

**¡Listo!** Tu sistema de emails está desplegado en producción 🎉

Si tienes problemas, revisa los logs:
```bash
supabase functions logs send-email --follow
```

O contacta a soporte:
- Resend: https://resend.com/support
- Supabase: https://supabase.com/support
