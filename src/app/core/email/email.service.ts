import { Injectable, inject, signal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Servicio para envío de emails transaccionales
 *
 * Integra con Supabase Edge Function 'send-email' que usa Resend API
 * Proporciona métodos helper para los templates más comunes
 *
 * @example
 * const emailService = inject(EmailService);
 * await emailService.sendWelcomeEmail('user@example.com', 'John Doe');
 */
@Injectable({
  providedIn: 'root'
})
export class EmailService {
  // Estado reactivo para UI
  public isLoading = signal(false);
  public lastError = signal<string | null>(null);
  public lastSuccess = signal<string | null>(null);

  /**
   * Método genérico para enviar emails
   *
   * Llama a la Edge Function 'send-email' de Supabase
   *
   * @param to - Email del destinatario (o array de emails)
   * @param subject - Asunto del email
   * @param html - Contenido HTML del email
   * @param from - Email del remitente (opcional, usa default)
   * @returns Promise<boolean> - true si se envió correctamente
   */
  async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<boolean> {
    this.isLoading.set(true);
    this.lastError.set(null);
    this.lastSuccess.set(null);

    try {
      // Obtener URL de la Edge Function desde environment
      const functionUrl = `${environment.supabase.url}/functions/v1/send-email`;

      // Llamar a la Edge Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.supabase.anonKey}`,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email');
      }

      console.log('✅ Email enviado:', data.data.id);
      this.lastSuccess.set(`Email enviado a ${params.to}`);

      return true;

    } catch (error) {
      console.error('❌ Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.lastError.set(errorMessage);

      return false;

    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Reemplaza variables en un template HTML
   *
   * @param template - HTML del template con variables {{VAR_NAME}}
   * @param variables - Object con los valores a reemplazar
   * @returns HTML con variables reemplazadas
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    // Reemplazar cada variable
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });

    return result;
  }

  /**
   * Carga un template HTML desde assets
   *
   * @param templateName - Nombre del archivo sin extensión
   * @returns Promise<string> con el HTML del template
   */
  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const response = await fetch(`/assets/email-templates/${templateName}.html`);

      if (!response.ok) {
        throw new Error(`Template ${templateName} no encontrado`);
      }

      return await response.text();

    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  }

  /**
   * Envía email de bienvenida a nuevos usuarios
   *
   * @param to - Email del usuario
   * @param userName - Nombre del usuario
   * @param userId - ID del usuario (opcional)
   * @returns Promise<boolean>
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // Cargar template
      const template = await this.loadTemplate('welcome-email');

      // Variables del template
      const variables = {
        APP_NAME: environment.appName || 'SaaS Boilerplate',
        USER_NAME: userName,
        DASHBOARD_URL: `${environment.appUrl}/dashboard`,
        DOCS_URL: `${environment.appUrl}/docs`,
        SETTINGS_URL: `${environment.appUrl}/settings`,
        TUTORIALS_URL: `${environment.appUrl}/tutorials`,
        SUPPORT_URL: `${environment.appUrl}/support`,
        LOGO_URL: `${environment.appUrl}/assets/logo.png`,
        CURRENT_YEAR: new Date().getFullYear().toString(),
        COMPANY_ADDRESS: environment.companyAddress || '',
        TWITTER_URL: environment.socialMedia?.twitter || '#',
        LINKEDIN_URL: environment.socialMedia?.linkedin || '#',
        GITHUB_URL: environment.socialMedia?.github || '#',
        UNSUBSCRIBE_URL: `${environment.appUrl}/unsubscribe?user=${userId}`,
      };

      // Reemplazar variables en el template
      const html = this.replaceVariables(template, variables);

      // Enviar email
      return await this.sendEmail({
        to,
        subject: `¡Bienvenido a ${environment.appName}!`,
        html,
      });

    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Envía email de verificación de cuenta
   *
   * @param to - Email del usuario
   * @param userName - Nombre del usuario
   * @param verificationToken - Token de verificación
   * @returns Promise<boolean>
   */
  async sendVerificationEmail(
    to: string,
    userName: string,
    verificationToken: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('verify-email');

      const variables = {
        APP_NAME: environment.appName || 'SaaS Boilerplate',
        USER_NAME: userName,
        VERIFICATION_URL: `${environment.appUrl}/auth/verify?token=${verificationToken}`,
        CURRENT_YEAR: new Date().getFullYear().toString(),
        COMPANY_ADDRESS: environment.companyAddress || '',
        SUPPORT_URL: `${environment.appUrl}/support`,
      };

      const html = this.replaceVariables(template, variables);

      return await this.sendEmail({
        to,
        subject: 'Verifica tu email',
        html,
      });

    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  /**
   * Envía email para restablecer contraseña
   *
   * @param to - Email del usuario
   * @param userName - Nombre del usuario
   * @param resetToken - Token de reset
   * @param requestInfo - Información de la solicitud (IP, fecha, ubicación)
   * @returns Promise<boolean>
   */
  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string,
    requestInfo?: {
      ip?: string;
      date?: string;
      location?: string;
    }
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('password-reset');

      const variables = {
        APP_NAME: environment.appName || 'SaaS Boilerplate',
        USER_NAME: userName,
        RESET_URL: `${environment.appUrl}/auth/reset-password?token=${resetToken}`,
        REQUEST_DATE: requestInfo?.date || new Date().toLocaleString('es-ES'),
        REQUEST_IP: requestInfo?.ip || 'No disponible',
        REQUEST_LOCATION: requestInfo?.location || 'No disponible',
        CURRENT_YEAR: new Date().getFullYear().toString(),
        COMPANY_ADDRESS: environment.companyAddress || '',
        SUPPORT_URL: `${environment.appUrl}/support`,
        SECURITY_URL: `${environment.appUrl}/security`,
      };

      const html = this.replaceVariables(template, variables);

      return await this.sendEmail({
        to,
        subject: 'Restablecer contraseña',
        html,
      });

    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Envía confirmación de suscripción
   *
   * @param to - Email del usuario
   * @param userName - Nombre del usuario
   * @param subscriptionData - Datos de la suscripción
   * @returns Promise<boolean>
   */
  async sendSubscriptionConfirmation(
    to: string,
    userName: string,
    subscriptionData: {
      planName: string;
      planPrice: string;
      planPeriod: string;
      startDate: string;
      renewalDate: string;
      paymentMethod: string;
      transactionId: string;
      features: string[];
    }
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('subscription-confirmation');

      const variables = {
        APP_NAME: environment.appName || 'SaaS Boilerplate',
        USER_NAME: userName,
        PLAN_NAME: subscriptionData.planName,
        PLAN_PRICE: subscriptionData.planPrice,
        PLAN_PERIOD: subscriptionData.planPeriod,
        START_DATE: subscriptionData.startDate,
        RENEWAL_DATE: subscriptionData.renewalDate,
        PAYMENT_METHOD: subscriptionData.paymentMethod,
        TRANSACTION_ID: subscriptionData.transactionId,
        FEATURE_1: subscriptionData.features[0] || '',
        FEATURE_2: subscriptionData.features[1] || '',
        FEATURE_3: subscriptionData.features[2] || '',
        FEATURE_4: subscriptionData.features[3] || '',
        DASHBOARD_URL: `${environment.appUrl}/dashboard`,
        CUSTOMER_PORTAL_URL: `${environment.appUrl}/billing/portal`,
        BILLING_URL: `${environment.appUrl}/billing`,
        SUPPORT_URL: `${environment.appUrl}/support`,
        CURRENT_YEAR: new Date().getFullYear().toString(),
        COMPANY_ADDRESS: environment.companyAddress || '',
      };

      const html = this.replaceVariables(template, variables);

      return await this.sendEmail({
        to,
        subject: `Suscripción confirmada - ${subscriptionData.planName}`,
        html,
      });

    } catch (error) {
      console.error('Error sending subscription confirmation:', error);
      return false;
    }
  }

  /**
   * Envía notificación de cancelación de suscripción
   *
   * @param to - Email del usuario
   * @param userName - Nombre del usuario
   * @param cancellationData - Datos de la cancelación
   * @returns Promise<boolean>
   */
  async sendSubscriptionCancelled(
    to: string,
    userName: string,
    cancellationData: {
      planName: string;
      cancellationDate: string;
      endAccessDate: string;
      totalPaid: string;
      daysRemaining: number;
      features: string[];
    }
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('subscription-cancelled');

      const variables = {
        APP_NAME: environment.appName || 'SaaS Boilerplate',
        USER_NAME: userName,
        PLAN_NAME: cancellationData.planName,
        CANCELLATION_DATE: cancellationData.cancellationDate,
        END_ACCESS_DATE: cancellationData.endAccessDate,
        TOTAL_PAID: cancellationData.totalPaid,
        DAYS_REMAINING: cancellationData.daysRemaining.toString(),
        FEATURE_1: cancellationData.features[0] || '',
        FEATURE_2: cancellationData.features[1] || '',
        FEATURE_3: cancellationData.features[2] || '',
        REACTIVATE_URL: `${environment.appUrl}/billing/reactivate`,
        CUSTOMER_PORTAL_URL: `${environment.appUrl}/billing/portal`,
        FEEDBACK_URL: `${environment.appUrl}/feedback/cancellation`,
        SUPPORT_URL: `${environment.appUrl}/support`,
        CURRENT_YEAR: new Date().getFullYear().toString(),
        COMPANY_ADDRESS: environment.companyAddress || '',
      };

      const html = this.replaceVariables(template, variables);

      return await this.sendEmail({
        to,
        subject: 'Suscripción cancelada',
        html,
      });

    } catch (error) {
      console.error('Error sending cancellation email:', error);
      return false;
    }
  }

  /**
   * Envía notificación de fallo en el pago
   *
   * @param to - Email del usuario
   * @param userName - Nombre del usuario
   * @param paymentData - Datos del fallo de pago
   * @returns Promise<boolean>
   */
  async sendPaymentFailed(
    to: string,
    userName: string,
    paymentData: {
      planName: string;
      amount: string;
      currency: string;
      paymentMethod: string;
      errorReason: string;
      paymentDate: string;
      nextRetryDate: string;
      suspensionDate: string;
      daysUntilSuspension: number;
      gracePeriod: string;
    }
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('payment-failed');

      const variables = {
        APP_NAME: environment.appName || 'SaaS Boilerplate',
        USER_NAME: userName,
        PLAN_NAME: paymentData.planName,
        AMOUNT: paymentData.amount,
        CURRENCY: paymentData.currency,
        PAYMENT_METHOD: paymentData.paymentMethod,
        ERROR_REASON: paymentData.errorReason,
        PAYMENT_DATE: paymentData.paymentDate,
        NEXT_RETRY_DATE: paymentData.nextRetryDate,
        SUSPENSION_DATE: paymentData.suspensionDate,
        DAYS_UNTIL_SUSPENSION: paymentData.daysUntilSuspension.toString(),
        GRACE_PERIOD: paymentData.gracePeriod,
        UPDATE_PAYMENT_URL: `${environment.appUrl}/billing/update-payment`,
        CUSTOMER_PORTAL_URL: `${environment.appUrl}/billing/portal`,
        BILLING_FAQ_URL: `${environment.appUrl}/help/billing-faq`,
        SUPPORT_URL: `${environment.appUrl}/support`,
        CURRENT_YEAR: new Date().getFullYear().toString(),
        COMPANY_ADDRESS: environment.companyAddress || '',
      };

      const html = this.replaceVariables(template, variables);

      return await this.sendEmail({
        to,
        subject: '⚠️ Acción requerida: Problema con tu pago',
        html,
      });

    } catch (error) {
      console.error('Error sending payment failed email:', error);
      return false;
    }
  }
}
