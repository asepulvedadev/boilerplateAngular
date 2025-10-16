/**
 * EJEMPLO DE USO COMPLETO - EmailService
 *
 * Este archivo muestra cómo usar el EmailService en diferentes escenarios
 * comunes del SaaS Boilerplate.
 *
 * NO es un archivo ejecutable, es solo documentación con código de ejemplo.
 */

import { Component, inject } from '@angular/core';
import { EmailService } from '@core/email';

// ============================================
// EJEMPLO 1: Registro de nuevo usuario
// ============================================
@Component({
  selector: 'app-register',
  template: `
    <form (ngSubmit)="onRegister()">
      <input [(ngModel)]="email" type="email" placeholder="Email" required>
      <input [(ngModel)]="name" type="text" placeholder="Nombre" required>
      <input [(ngModel)]="password" type="password" placeholder="Contraseña" required>

      <button type="submit" [disabled]="emailService.isLoading()">
        {{ emailService.isLoading() ? 'Registrando...' : 'Registrarse' }}
      </button>

      @if (emailService.lastError()) {
        <div class="error">{{ emailService.lastError() }}</div>
      }
    </form>
  `
})
export class RegisterComponent {
  protected emailService = inject(EmailService);

  protected email = '';
  protected name = '';
  protected password = '';

  async onRegister() {
    try {
      // 1. Registrar usuario en Supabase
      const { data: user, error } = await supabase.auth.signUp({
        email: this.email,
        password: this.password,
        options: {
          data: { name: this.name }
        }
      });

      if (error) throw error;

      // 2. Enviar email de bienvenida
      await this.emailService.sendWelcomeEmail(
        this.email,
        this.name,
        user.user?.id
      );

      // 3. Enviar email de verificación
      // (Supabase lo envía automáticamente, pero si lo deshabilitas:)
      // await this.emailService.sendVerificationEmail(
      //   this.email,
      //   this.name,
      //   verificationToken
      // );

      console.log('✅ Usuario registrado y email enviado');

    } catch (error) {
      console.error('Error en registro:', error);
    }
  }
}


// ============================================
// EJEMPLO 2: Reset de contraseña
// ============================================
@Component({
  selector: 'app-forgot-password',
  template: `
    <form (ngSubmit)="onResetPassword()">
      <input [(ngModel)]="email" type="email" placeholder="Email" required>

      <button type="submit" [disabled]="emailService.isLoading()">
        {{ emailService.isLoading() ? 'Enviando...' : 'Recuperar contraseña' }}
      </button>

      @if (emailService.lastSuccess()) {
        <div class="success">
          Email enviado. Revisa tu bandeja de entrada.
        </div>
      }

      @if (emailService.lastError()) {
        <div class="error">{{ emailService.lastError() }}</div>
      }
    </form>
  `
})
export class ForgotPasswordComponent {
  protected emailService = inject(EmailService);

  protected email = '';

  async onResetPassword() {
    try {
      // 1. Generar token de reset (Supabase lo hace automáticamente)
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        this.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      );

      if (error) throw error;

      // 2. Obtener información del request para seguridad
      const requestInfo = {
        ip: await this.getUserIP(),
        date: new Date().toLocaleString('es-ES'),
        location: await this.getUserLocation(),
      };

      // 3. Enviar email personalizado (si no usas el de Supabase)
      // await this.emailService.sendPasswordResetEmail(
      //   this.email,
      //   userName,
      //   resetToken,
      //   requestInfo
      // );

      console.log('✅ Email de reset enviado');

    } catch (error) {
      console.error('Error al enviar reset:', error);
    }
  }

  // Helper para obtener IP del usuario
  private async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'No disponible';
    }
  }

  // Helper para obtener ubicación aproximada
  private async getUserLocation(): Promise<string> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return `${data.city}, ${data.country_name}`;
    } catch {
      return 'No disponible';
    }
  }
}


// ============================================
// EJEMPLO 3: Webhook de Stripe - Suscripción exitosa
// ============================================
@Component({
  selector: 'app-stripe-webhook-handler',
  template: `<!-- Este es un componente backend/serverless -->`
})
export class StripeWebhookHandler {
  protected emailService = inject(EmailService);

  async handleCheckoutCompleted(event: any) {
    const session = event.data.object;

    try {
      // 1. Obtener datos del usuario desde la sesión
      const userId = session.client_reference_id;
      const email = session.customer_email;

      // 2. Obtener usuario de Supabase
      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      // 3. Obtener detalles de la suscripción
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      const plan = subscription.items.data[0].price;

      // 4. Formatear datos para el email
      const subscriptionData = {
        planName: plan.nickname || 'Plan Pro',
        planPrice: (plan.unit_amount! / 100).toFixed(2),
        planPeriod: plan.recurring?.interval === 'month' ? 'mes' : 'año',
        startDate: new Date(subscription.current_period_start * 1000).toLocaleDateString('es-ES'),
        renewalDate: new Date(subscription.current_period_end * 1000).toLocaleDateString('es-ES'),
        paymentMethod: `${session.payment_method_types[0]} •••• ${session.payment_method_details?.card?.last4 || 'XXXX'}`,
        transactionId: session.payment_intent,
        features: [
          'Acceso ilimitado a todas las funcionalidades',
          'Dashboard avanzado con analytics en tiempo real',
          '100 GB de almacenamiento en la nube',
          'API access con 10,000 requests/mes',
        ]
      };

      // 5. Enviar email de confirmación
      await this.emailService.sendSubscriptionConfirmation(
        email,
        user.name,
        subscriptionData
      );

      console.log('✅ Email de confirmación enviado');

    } catch (error) {
      console.error('Error al procesar webhook:', error);
    }
  }
}


// ============================================
// EJEMPLO 4: Cancelación de suscripción
// ============================================
@Component({
  selector: 'app-cancel-subscription',
  template: `
    <div class="cancel-modal">
      <h2>¿Seguro que quieres cancelar?</h2>
      <p>Perderás acceso a todas las funcionalidades premium.</p>

      <button (click)="onCancelSubscription()" [disabled]="emailService.isLoading()">
        {{ emailService.isLoading() ? 'Cancelando...' : 'Sí, cancelar' }}
      </button>

      <button (click)="onClose()">No, mantener suscripción</button>
    </div>
  `
})
export class CancelSubscriptionComponent {
  protected emailService = inject(EmailService);

  async onCancelSubscription() {
    try {
      // 1. Obtener suscripción actual
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 2. Cancelar en Stripe (al final del periodo)
      const canceledSub = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      // 3. Actualizar en base de datos
      await supabase
        .from('subscriptions')
        .update({ status: 'canceling' })
        .eq('id', subscription.id);

      // 4. Calcular días restantes
      const endDate = new Date(canceledSub.current_period_end * 1000);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 5. Preparar datos para email
      const cancellationData = {
        planName: subscription.plan_name,
        cancellationDate: today.toLocaleDateString('es-ES'),
        endAccessDate: endDate.toLocaleDateString('es-ES'),
        totalPaid: subscription.total_paid || '0.00',
        daysRemaining,
        features: [
          'Acceso ilimitado a todas las funcionalidades',
          'Dashboard avanzado con analytics',
          '100 GB de almacenamiento',
        ]
      };

      // 6. Enviar email de confirmación de cancelación
      await this.emailService.sendSubscriptionCancelled(
        userEmail,
        userName,
        cancellationData
      );

      console.log('✅ Suscripción cancelada y email enviado');

    } catch (error) {
      console.error('Error al cancelar:', error);
    }
  }

  onClose() {
    // Cerrar modal
  }
}


// ============================================
// EJEMPLO 5: Webhook de Stripe - Fallo en el pago
// ============================================
@Component({
  selector: 'app-payment-failed-handler',
  template: `<!-- Backend/Serverless handler -->`
})
export class PaymentFailedHandler {
  protected emailService = inject(EmailService);

  async handleInvoicePaymentFailed(event: any) {
    const invoice = event.data.object;

    try {
      // 1. Obtener datos del cliente
      const customer = await stripe.customers.retrieve(invoice.customer);
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('stripe_customer_id', invoice.customer)
        .single();

      // 2. Calcular días hasta suspensión (7 días de gracia)
      const suspensionDate = new Date();
      suspensionDate.setDate(suspensionDate.getDate() + 7);

      // 3. Siguiente intento de cobro
      const nextRetryDate = new Date();
      nextRetryDate.setDate(nextRetryDate.getDate() + 2);

      // 4. Preparar datos para el email
      const paymentData = {
        planName: invoice.lines.data[0].description || 'Plan Pro',
        amount: (invoice.amount_due / 100).toFixed(2),
        currency: invoice.currency.toUpperCase(),
        paymentMethod: customer.invoice_settings?.default_payment_method
          ? 'Tarjeta registrada'
          : 'Sin método de pago',
        errorReason: this.getErrorMessage(invoice.last_finalization_error?.code),
        paymentDate: new Date(invoice.created * 1000).toLocaleDateString('es-ES'),
        nextRetryDate: nextRetryDate.toLocaleDateString('es-ES'),
        suspensionDate: suspensionDate.toLocaleDateString('es-ES'),
        daysUntilSuspension: 7,
        gracePeriod: '30 días',
      };

      // 5. Enviar email urgente
      await this.emailService.sendPaymentFailed(
        customer.email,
        user.name,
        paymentData
      );

      console.log('⚠️ Email de fallo de pago enviado');

    } catch (error) {
      console.error('Error al procesar fallo de pago:', error);
    }
  }

  private getErrorMessage(errorCode?: string): string {
    const errorMessages: Record<string, string> = {
      'card_declined': 'Tarjeta rechazada por el banco',
      'insufficient_funds': 'Fondos insuficientes',
      'expired_card': 'Tarjeta vencida',
      'incorrect_cvc': 'Código de seguridad incorrecto',
      'processing_error': 'Error al procesar el pago',
    };

    return errorMessages[errorCode || ''] || 'Error desconocido';
  }
}


// ============================================
// EJEMPLO 6: Email genérico personalizado
// ============================================
@Component({
  selector: 'app-custom-email-sender',
  template: `
    <button (click)="sendCustomEmail()">Enviar email personalizado</button>
  `
})
export class CustomEmailSender {
  protected emailService = inject(EmailService);

  async sendCustomEmail() {
    // Método 1: HTML directo
    await this.emailService.sendEmail({
      to: 'user@example.com',
      subject: 'Notificación importante',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h1 style="color: #2563eb;">Título del email</h1>
          <p>Contenido del mensaje...</p>
          <a href="https://app.com/action" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Botón de acción
          </a>
        </div>
      `
    });

    // Método 2: Con múltiples destinatarios
    await this.emailService.sendEmail({
      to: ['user1@example.com', 'user2@example.com'],
      cc: ['manager@example.com'],
      bcc: ['admin@example.com'],
      subject: 'Newsletter mensual',
      html: '<h1>Tu newsletter aquí</h1>',
      replyTo: 'support@tudominio.com'
    });
  }
}


// ============================================
// EJEMPLO 7: Uso con Signals reactivas
// ============================================
@Component({
  selector: 'app-email-with-signals',
  template: `
    <div class="email-status">
      @if (emailService.isLoading()) {
        <div class="loading">
          <spinner />
          <p>Enviando email...</p>
        </div>
      }

      @if (emailService.lastSuccess()) {
        <div class="success alert">
          <icon name="check-circle" />
          <p>{{ emailService.lastSuccess() }}</p>
        </div>
      }

      @if (emailService.lastError()) {
        <div class="error alert">
          <icon name="alert-circle" />
          <p>{{ emailService.lastError() }}</p>
          <button (click)="retry()">Reintentar</button>
        </div>
      }
    </div>
  `
})
export class EmailWithSignals {
  protected emailService = inject(EmailService);

  async sendWelcome() {
    await this.emailService.sendWelcomeEmail(
      'user@example.com',
      'Juan Pérez',
      'user-123'
    );

    // Los signals se actualizan automáticamente:
    // - isLoading() -> true mientras envía
    // - lastSuccess() -> mensaje si tuvo éxito
    // - lastError() -> mensaje si falló
  }

  retry() {
    this.sendWelcome();
  }
}


// ============================================
// EJEMPLO 8: Testing del servicio
// ============================================
describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmailService]
    });
    emailService = TestBed.inject(EmailService);
  });

  it('debe enviar email de bienvenida', async () => {
    const result = await emailService.sendWelcomeEmail(
      'test@example.com',
      'Test User',
      'test-123'
    );

    expect(result).toBe(true);
    expect(emailService.lastSuccess()).toBeTruthy();
    expect(emailService.lastError()).toBeNull();
  });

  it('debe manejar errores correctamente', async () => {
    // Mock de fetch para simular error
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve(new Response(
        JSON.stringify({ error: 'Invalid API Key' }),
        { status: 401 }
      ))
    );

    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<h1>Test</h1>'
    });

    expect(result).toBe(false);
    expect(emailService.lastError()).toBeTruthy();
  });
});


/**
 * NOTAS ADICIONALES
 * =================
 *
 * 1. Todos los métodos son async/await
 * 2. Siempre verificar el resultado (true/false)
 * 3. Los signals se actualizan automáticamente
 * 4. En desarrollo, los emails se loguean pero no se envían
 * 5. En producción, verificar que RESEND_API_KEY esté configurado
 *
 * Para más ejemplos, ver:
 * - email-templates/README.md
 * - email-templates/DEPLOYMENT.md
 */
