/**
 * EDGE FUNCTION: Stripe Webhook Handler
 *
 * Maneja eventos de webhook enviados por Stripe cuando ocurren cambios
 * en subscripciones, pagos, cancelaciones, etc.
 *
 * Esta función es CRÍTICA para mantener sincronizado el estado de
 * las suscripciones entre Stripe y Supabase.
 *
 * @endpoint POST /stripe-webhook
 * @auth None (Stripe firma el request)
 *
 * Eventos manejados:
 * - checkout.session.completed: Pago inicial exitoso
 * - customer.subscription.created: Nueva suscripción creada
 * - customer.subscription.updated: Cambio en suscripción (upgrade/downgrade)
 * - customer.subscription.deleted: Suscripción cancelada
 * - invoice.payment_succeeded: Pago recurrente exitoso
 * - invoice.payment_failed: Pago recurrente falló
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
  try {
    // ============================================
    // 1. INICIALIZAR STRIPE
    // ============================================
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error('Missing Stripe configuration');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // ============================================
    // 2. VERIFICAR FIRMA DEL WEBHOOK
    // ============================================
    // Esto es CRÍTICO para seguridad - verifica que el webhook
    // realmente viene de Stripe y no es una petición maliciosa
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response('Webhook signature missing', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Webhook received:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

    // ============================================
    // 3. INICIALIZAR SUPABASE CLIENT
    // ============================================
    // Usamos service role key para tener acceso completo a la DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // 4. PROCESAR EVENTO SEGÚN TIPO
    // ============================================
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // ============================================
    // 5. RETORNAR RESPUESTA A STRIPE
    // ============================================
    // Stripe requiere un 200 para confirmar que recibimos el evento
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// HANDLERS PARA CADA TIPO DE EVENTO
// ============================================

/**
 * Maneja cuando se completa un checkout (pago inicial exitoso)
 * Crea la suscripción en nuestra base de datos
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  console.log('Processing checkout.session.completed:', session.id);

  // Obtener userId de los metadatos
  const userId = session.metadata?.userId || session.client_reference_id;
  if (!userId) {
    console.error('No userId found in session metadata');
    return;
  }

  // Obtener detalles de la suscripción
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  console.log('Creating subscription:', {
    userId,
    subscriptionId,
    customerId,
  });

  // Crear registro de suscripción en Supabase
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (subError) {
    console.error('Error creating subscription:', subError);
    throw subError;
  }

  // Actualizar perfil de usuario con tier Pro
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'pro', // O determinar según price_id
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    throw profileError;
  }

  console.log('✅ Subscription created successfully');
}

/**
 * Maneja cuando se crea una nueva suscripción
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Processing customer.subscription.created:', subscription.id);

  // Obtener userId de los metadatos
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Determinar el tier según el price_id
  const priceId = subscription.items.data[0]?.price.id;
  const tier = determineTierFromPriceId(priceId);

  // Crear/actualizar suscripción
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }

  // Actualizar tier en profile
  await updateUserTier(userId, tier, supabase);

  console.log('✅ Subscription created:', { userId, tier });
}

/**
 * Maneja cuando se actualiza una suscripción (upgrade/downgrade/reactivate)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = determineTierFromPriceId(priceId);

  // Actualizar suscripción
  const { error } = await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  // Actualizar tier en profile
  await updateUserTier(userId, tier, supabase);

  console.log('✅ Subscription updated:', { userId, tier, status: subscription.status });
}

/**
 * Maneja cuando se cancela/elimina una suscripción
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Marcar suscripción como cancelada
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }

  // Regresar a tier Free
  await updateUserTier(userId, 'free', supabase);

  console.log('✅ Subscription canceled:', userId);
}

/**
 * Maneja cuando un pago recurrente es exitoso
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Actualizar fecha del próximo pago
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: new Date(invoice.period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription after payment:', error);
    throw error;
  }

  console.log('✅ Payment succeeded for subscription:', subscriptionId);
}

/**
 * Maneja cuando un pago recurrente falla
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Marcar suscripción como past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription after failed payment:', error);
    throw error;
  }

  // TODO: Enviar email al usuario notificando el pago fallido
  // await sendPaymentFailedEmail(userId);

  console.log('⚠️ Payment failed for subscription:', subscriptionId);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determina el tier según el price_id de Stripe
 * Esto debería coincidir con los IDs configurados en .env
 */
function determineTierFromPriceId(priceId: string): string {
  const proPriceId = Deno.env.get('STRIPE_PRICE_ID_PRO');
  const enterprisePriceId = Deno.env.get('STRIPE_PRICE_ID_ENTERPRISE');

  if (priceId === enterprisePriceId) return 'enterprise';
  if (priceId === proPriceId) return 'pro';
  return 'free';
}

/**
 * Actualiza el tier del usuario en la tabla profiles
 */
async function updateUserTier(userId: string, tier: string, supabase: any) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user tier:', error);
    throw error;
  }
}

/**
 * CONFIGURACIÓN DEL WEBHOOK EN STRIPE:
 *
 * 1. Ir a: https://dashboard.stripe.com/webhooks
 * 2. Crear endpoint con URL: https://PROJECT_ID.supabase.co/functions/v1/stripe-webhook
 * 3. Seleccionar eventos:
 *    - checkout.session.completed
 *    - customer.subscription.created
 *    - customer.subscription.updated
 *    - customer.subscription.deleted
 *    - invoice.payment_succeeded
 *    - invoice.payment_failed
 * 4. Copiar "Signing secret" (whsec_xxx)
 * 5. Configurar en Supabase:
 *    STRIPE_WEBHOOK_SECRET=whsec_xxx
 *
 * TESTING LOCAL:
 * 1. Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Login: stripe login
 * 3. Forward webhooks:
 *    stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
 * 4. Copiar webhook secret del CLI y usarlo localmente
 *
 * DEPLOY:
 * supabase functions deploy stripe-webhook
 */
