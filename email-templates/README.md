# 📧 Email Templates - Documentación

Sistema de emails transaccionales integrado con **Resend** y **Supabase Edge Functions**.

---

## 📋 Tabla de Contenidos

- [Templates Disponibles](#templates-disponibles)
- [Variables por Template](#variables-por-template)
- [Uso desde Angular](#uso-desde-angular)
- [Configuración](#configuración)
- [Personalización](#personalización)
- [Testing Local](#testing-local)
- [Despliegue a Producción](#despliegue-a-producción)
- [Troubleshooting](#troubleshooting)

---

## 📨 Templates Disponibles

### 1. **welcome-email.html**
**Cuándo se usa:** Después del registro de un nuevo usuario

**Características:**
- Saludo personalizado con nombre del usuario
- Tarjetas con funcionalidades principales
- Links a recursos útiles (docs, tutorials, settings)
- CTA principal: "Ir a mi Dashboard"
- Footer con redes sociales

**Vista previa:**
```
🎉 ¡Bienvenido a SaaS Boilerplate!
Hola Juan,
¡Nos emociona tenerte con nosotros!...
[Ver código completo en welcome-email.html]
```

---

### 2. **verify-email.html**
**Cuándo se usa:** Confirmación de email después del registro

**Características:**
- Botón grande de verificación
- Link alternativo para copiar/pegar
- Advertencia de expiración (24 horas)
- Información de seguridad

**Vista previa:**
```
✉️ Verifica tu dirección de email
Un paso más para completar tu registro...
[Ver código completo en verify-email.html]
```

---

### 3. **password-reset.html**
**Cuándo se usa:** Usuario solicita restablecer contraseña

**Características:**
- Botón de reset prominente
- Detalles de la solicitud (IP, fecha, ubicación)
- Recomendaciones de seguridad
- Aviso si no fue el usuario quien solicitó

**Vista previa:**
```
🔐 Restablecer contraseña
Recibimos una solicitud para restablecer tu contraseña...
[Ver código completo en password-reset.html]
```

---

### 4. **subscription-confirmation.html**
**Cuándo se usa:** Confirmación de pago de suscripción

**Características:**
- Card visual del plan adquirido
- Tabla con detalles de la suscripción
- Lista de features incluidas
- Links a Dashboard y Customer Portal

**Vista previa:**
```
🎉 ¡Suscripción confirmada!
Tu pago ha sido procesado exitosamente...
[Ver código completo en subscription-confirmation.html]
```

---

### 5. **subscription-cancelled.html**
**Cuándo se usa:** Usuario cancela su suscripción

**Características:**
- Fecha final de acceso destacada
- Lista de features que se perderán
- Botón para reactivar suscripción
- Formulario de feedback (opcional)

**Vista previa:**
```
😢 Suscripción cancelada
Lamentamos verte partir...
[Ver código completo en subscription-cancelled.html]
```

---

### 6. **payment-failed.html**
**Cuándo se usa:** Fallo en el procesamiento de pago

**Características:**
- Alerta urgente con countdown
- Detalles del error
- Motivos comunes de fallo
- Pasos para resolver el problema
- Link a actualizar método de pago

**Vista previa:**
```
⚠️ Problema con tu pago
Tu cuenta será suspendida en X días...
[Ver código completo en payment-failed.html]
```

---

## 🔧 Variables por Template

### welcome-email.html
```typescript
{
  APP_NAME: 'SaaS Boilerplate',
  USER_NAME: 'Juan Pérez',
  DASHBOARD_URL: 'https://app.com/dashboard',
  DOCS_URL: 'https://app.com/docs',
  SETTINGS_URL: 'https://app.com/settings',
  TUTORIALS_URL: 'https://app.com/tutorials',
  SUPPORT_URL: 'https://app.com/support',
  LOGO_URL: 'https://app.com/assets/logo.png',
  CURRENT_YEAR: '2025',
  COMPANY_ADDRESS: 'Tu Empresa S.L., Madrid, España',
  TWITTER_URL: 'https://twitter.com/...',
  LINKEDIN_URL: 'https://linkedin.com/...',
  GITHUB_URL: 'https://github.com/...',
  UNSUBSCRIBE_URL: 'https://app.com/unsubscribe?user=123'
}
```

### verify-email.html
```typescript
{
  APP_NAME: 'SaaS Boilerplate',
  USER_NAME: 'Juan Pérez',
  VERIFICATION_URL: 'https://app.com/auth/verify?token=abc123',
  CURRENT_YEAR: '2025',
  COMPANY_ADDRESS: 'Tu Empresa S.L., Madrid, España',
  SUPPORT_URL: 'https://app.com/support'
}
```

### password-reset.html
```typescript
{
  APP_NAME: 'SaaS Boilerplate',
  USER_NAME: 'Juan Pérez',
  RESET_URL: 'https://app.com/auth/reset-password?token=xyz789',
  REQUEST_DATE: '16 octubre 2025, 14:30',
  REQUEST_IP: '192.168.1.1',
  REQUEST_LOCATION: 'Madrid, España',
  CURRENT_YEAR: '2025',
  COMPANY_ADDRESS: 'Tu Empresa S.L., Madrid, España',
  SUPPORT_URL: 'https://app.com/support',
  SECURITY_URL: 'https://app.com/security'
}
```

### subscription-confirmation.html
```typescript
{
  APP_NAME: 'SaaS Boilerplate',
  USER_NAME: 'Juan Pérez',
  PLAN_NAME: 'Plan Pro',
  PLAN_PRICE: '29.99',
  PLAN_PERIOD: 'mes',
  START_DATE: '16 octubre 2025',
  RENEWAL_DATE: '16 noviembre 2025',
  PAYMENT_METHOD: 'Visa •••• 4242',
  TRANSACTION_ID: 'ch_1ABC2DEF3GHI',
  FEATURE_1: 'Acceso ilimitado a todas las funcionalidades',
  FEATURE_2: 'Dashboard avanzado con analytics',
  FEATURE_3: '100 GB de almacenamiento',
  FEATURE_4: 'API access con 10,000 requests/mes',
  DASHBOARD_URL: 'https://app.com/dashboard',
  CUSTOMER_PORTAL_URL: 'https://app.com/billing/portal',
  BILLING_URL: 'https://app.com/billing',
  SUPPORT_URL: 'https://app.com/support',
  CURRENT_YEAR: '2025',
  COMPANY_ADDRESS: 'Tu Empresa S.L., Madrid, España'
}
```

### subscription-cancelled.html
```typescript
{
  APP_NAME: 'SaaS Boilerplate',
  USER_NAME: 'Juan Pérez',
  PLAN_NAME: 'Plan Pro',
  CANCELLATION_DATE: '16 octubre 2025',
  END_ACCESS_DATE: '16 noviembre 2025',
  TOTAL_PAID: '89.97',
  DAYS_REMAINING: '30',
  FEATURE_1: 'Acceso ilimitado a todas las funcionalidades',
  FEATURE_2: 'Dashboard avanzado con analytics',
  FEATURE_3: '100 GB de almacenamiento',
  REACTIVATE_URL: 'https://app.com/billing/reactivate',
  CUSTOMER_PORTAL_URL: 'https://app.com/billing/portal',
  FEEDBACK_URL: 'https://app.com/feedback/cancellation',
  SUPPORT_URL: 'https://app.com/support',
  CURRENT_YEAR: '2025',
  COMPANY_ADDRESS: 'Tu Empresa S.L., Madrid, España'
}
```

### payment-failed.html
```typescript
{
  APP_NAME: 'SaaS Boilerplate',
  USER_NAME: 'Juan Pérez',
  PLAN_NAME: 'Plan Pro',
  AMOUNT: '29.99',
  CURRENCY: 'EUR',
  PAYMENT_METHOD: 'Visa •••• 4242',
  ERROR_REASON: 'Fondos insuficientes',
  PAYMENT_DATE: '16 octubre 2025, 14:30',
  NEXT_RETRY_DATE: '18 octubre 2025',
  SUSPENSION_DATE: '23 octubre 2025',
  DAYS_UNTIL_SUSPENSION: '7',
  GRACE_PERIOD: '30',
  UPDATE_PAYMENT_URL: 'https://app.com/billing/update-payment',
  CUSTOMER_PORTAL_URL: 'https://app.com/billing/portal',
  BILLING_FAQ_URL: 'https://app.com/help/billing-faq',
  SUPPORT_URL: 'https://app.com/support',
  CURRENT_YEAR: '2025',
  COMPANY_ADDRESS: 'Tu Empresa S.L., Madrid, España'
}
```

---

## 💻 Uso desde Angular

### Importar el servicio

```typescript
import { Component, inject } from '@angular/core';
import { EmailService } from '@core/email';

@Component({
  selector: 'app-register',
  standalone: true,
  template: `...`
})
export class RegisterComponent {
  private emailService = inject(EmailService);

  async onRegister(email: string, name: string) {
    // Registrar usuario...

    // Enviar email de bienvenida
    const success = await this.emailService.sendWelcomeEmail(
      email,
      name,
      userId
    );

    if (success) {
      console.log('Email enviado correctamente');
    }
  }
}
```

### Métodos disponibles

#### 1. sendWelcomeEmail()
```typescript
await emailService.sendWelcomeEmail(
  'user@example.com',
  'Juan Pérez',
  'user-id-123'
);
```

#### 2. sendVerificationEmail()
```typescript
await emailService.sendVerificationEmail(
  'user@example.com',
  'Juan Pérez',
  'verification-token-abc123'
);
```

#### 3. sendPasswordResetEmail()
```typescript
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'Juan Pérez',
  'reset-token-xyz789',
  {
    ip: '192.168.1.1',
    date: '16 octubre 2025, 14:30',
    location: 'Madrid, España'
  }
);
```

#### 4. sendSubscriptionConfirmation()
```typescript
await emailService.sendSubscriptionConfirmation(
  'user@example.com',
  'Juan Pérez',
  {
    planName: 'Plan Pro',
    planPrice: '29.99',
    planPeriod: 'mes',
    startDate: '16 octubre 2025',
    renewalDate: '16 noviembre 2025',
    paymentMethod: 'Visa •••• 4242',
    transactionId: 'ch_1ABC2DEF3GHI',
    features: [
      'Acceso ilimitado',
      'Dashboard avanzado',
      '100 GB storage',
      'API access'
    ]
  }
);
```

#### 5. sendSubscriptionCancelled()
```typescript
await emailService.sendSubscriptionCancelled(
  'user@example.com',
  'Juan Pérez',
  {
    planName: 'Plan Pro',
    cancellationDate: '16 octubre 2025',
    endAccessDate: '16 noviembre 2025',
    totalPaid: '89.97',
    daysRemaining: 30,
    features: ['Feature 1', 'Feature 2', 'Feature 3']
  }
);
```

#### 6. sendPaymentFailed()
```typescript
await emailService.sendPaymentFailed(
  'user@example.com',
  'Juan Pérez',
  {
    planName: 'Plan Pro',
    amount: '29.99',
    currency: 'EUR',
    paymentMethod: 'Visa •••• 4242',
    errorReason: 'Fondos insuficientes',
    paymentDate: '16 octubre 2025',
    nextRetryDate: '18 octubre 2025',
    suspensionDate: '23 octubre 2025',
    daysUntilSuspension: 7,
    gracePeriod: '30 días'
  }
);
```

#### 7. sendEmail() - Método genérico
```typescript
// Para emails personalizados
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Tu asunto aquí',
  html: '<h1>Tu HTML aquí</h1>',
  from: 'custom@tudominio.com', // opcional
  cc: ['cc@example.com'],        // opcional
  bcc: ['bcc@example.com']       // opcional
});
```

### Signals reactivas

El servicio expone signals para UI reactiva:

```typescript
@Component({
  template: `
    @if (emailService.isLoading()) {
      <p>Enviando email...</p>
    }

    @if (emailService.lastError()) {
      <div class="error">{{ emailService.lastError() }}</div>
    }

    @if (emailService.lastSuccess()) {
      <div class="success">{{ emailService.lastSuccess() }}</div>
    }
  `
})
export class MyComponent {
  protected emailService = inject(EmailService);
}
```

---

## ⚙️ Configuración

### 1. Variables de entorno (.env)

```bash
# Resend API Key (obtener en https://resend.com/api-keys)
RESEND_API_KEY=re_123abc456def

# Email del remitente (debe estar verificado en Resend)
RESEND_FROM_EMAIL=noreply@tudominio.com
RESEND_FROM_NAME=SaaS Boilerplate
```

### 2. Configurar Supabase Edge Function

```bash
# Desplegar la Edge Function
supabase functions deploy send-email

# Configurar secrets en Supabase
supabase secrets set RESEND_API_KEY=re_123abc456def
supabase secrets set RESEND_FROM_EMAIL=noreply@tudominio.com
```

### 3. Verificar dominio en Resend

1. Ir a https://resend.com/domains
2. Agregar tu dominio
3. Configurar registros DNS (SPF, DKIM, DMARC)
4. Verificar dominio

---

## 🎨 Personalización

### Cambiar colores

Los templates usan variables CSS. Edita los gradientes en cada template:

```css
/* Azul a Púrpura (default) */
background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);

/* Verde (success) */
background: linear-gradient(135deg, #10b981 0%, #059669 100%);

/* Naranja (warning) */
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);

/* Rojo (error) */
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
```

### Cambiar logo

Reemplaza la variable `{{LOGO_URL}}` en `environment.ts`:

```typescript
export const environment = {
  // ...
  logoUrl: 'https://tudominio.com/assets/logo.png'
};
```

### Crear template custom

1. Duplica un template existente
2. Modifica el HTML según necesites
3. Define las variables `{{VARIABLE_NAME}}`
4. Crea método en `EmailService`:

```typescript
async sendCustomEmail(to: string, data: CustomData): Promise<boolean> {
  const template = await this.loadTemplate('mi-template');
  const variables = { /* mapear data aquí */ };
  const html = this.replaceVariables(template, variables);

  return await this.sendEmail({
    to,
    subject: 'Mi asunto',
    html
  });
}
```

---

## 🧪 Testing Local

### Opción 1: Resend Test Mode

Resend tiene un modo de testing que no envía emails reales:

```typescript
// En development, los emails se loguean pero no se envían
// Revisar en: https://resend.com/emails
```

### Opción 2: MailTrap / Mailtrap.io

```bash
# Configurar en .env
RESEND_API_KEY=tu_mailtrap_api_key
```

### Opción 3: Preview en navegador

Crea un componente de preview:

```typescript
@Component({
  selector: 'app-email-preview',
  template: `
    <iframe [srcdoc]="emailHtml" width="100%" height="800px"></iframe>
  `
})
export class EmailPreviewComponent {
  protected emailHtml = '';

  async ngOnInit() {
    // Cargar template
    const response = await fetch('/assets/email-templates/welcome-email.html');
    let html = await response.text();

    // Reemplazar variables de ejemplo
    html = html.replace(/{{APP_NAME}}/g, 'SaaS Boilerplate');
    html = html.replace(/{{USER_NAME}}/g, 'Juan Pérez');
    // ... más variables

    this.emailHtml = html;
  }
}
```

---

## 🚀 Despliegue a Producción

### 1. Verificar dominio en Resend

✅ Dominio verificado
✅ Registros DNS configurados (SPF, DKIM, DMARC)

### 2. Copiar templates a public/assets

```bash
# Crear carpeta en public
mkdir -p public/assets/email-templates

# Copiar todos los templates
cp email-templates/*.html public/assets/email-templates/
```

### 3. Configurar Supabase Production

```bash
# Desplegar Edge Function a producción
supabase functions deploy send-email --project-ref tu-proyecto-id

# Configurar secrets en producción
supabase secrets set RESEND_API_KEY=re_live_... --project-ref tu-proyecto-id
supabase secrets set RESEND_FROM_EMAIL=noreply@tudominio.com --project-ref tu-proyecto-id
```

### 4. Actualizar environment.prod.ts

```typescript
export const environment = {
  production: true,
  appUrl: 'https://tudominio.com', // URL real
  // ... resto de config
};
```

---

## 🐛 Troubleshooting

### Error: "Template not found"

**Causa:** El archivo HTML no está en `/public/assets/email-templates/`

**Solución:**
```bash
cp email-templates/*.html public/assets/email-templates/
```

### Error: "RESEND_API_KEY not configured"

**Causa:** Secret no configurado en Supabase

**Solución:**
```bash
supabase secrets set RESEND_API_KEY=re_...
```

### Email no se envía

**Verificar:**
1. ✅ API Key correcta en Supabase secrets
2. ✅ Dominio verificado en Resend
3. ✅ Edge Function desplegada
4. ✅ Logs en Supabase: `supabase functions logs send-email`
5. ✅ Dashboard de Resend: https://resend.com/emails

### Variables no se reemplazan

**Causa:** Nombre de variable incorrecta

**Solución:**
- Usar exactamente `{{VARIABLE_NAME}}` (mayúsculas, sin espacios)
- Verificar que la variable existe en el objeto `variables`

### Email va a spam

**Solución:**
1. Configurar SPF, DKIM, DMARC correctamente
2. Usar dominio verificado (no @gmail.com)
3. Evitar palabras spam en el subject
4. Incluir link de unsubscribe
5. Warmup del dominio (enviar gradualmente más emails)

---

## 📚 Recursos Adicionales

- **Resend Docs:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Email Testing:** https://www.mail-tester.com/
- **HTML Email Guide:** https://www.campaignmonitor.com/css/

---

## 📝 Changelog

### v1.0.0 (2025-01-16)
- ✅ 6 templates HTML profesionales
- ✅ EmailService integrado
- ✅ Edge Function send-email
- ✅ Variables dinámicas
- ✅ Mobile-first responsive
- ✅ Documentación completa

---

**Mantenido por:** Equipo de desarrollo
**Última actualización:** Octubre 2025
