/**
 * EDGE FUNCTION: Stripe Checkout
 *
 * Crea una sesión de checkout de Stripe para procesar pagos de suscripción.
 * Esta función se ejecuta del lado del servidor para mantener seguras las claves de Stripe.
 *
 * @endpoint POST /stripe-checkout
 * @auth Required (JWT token)
 *
 * @body {
 *   priceId: string;  // ID del price de Stripe (price_xxx)
 *   userId: string;   // UUID del usuario
 * }
 *
 * @returns {
 *   sessionId: string;  // ID de la sesión de Stripe
 *   url: string;        // URL para redirigir al usuario al checkout
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

// Configuración CORS para peticiones desde Angular
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ============================================
    // 1. VALIDAR AUTENTICACIÓN
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ============================================
    // 2. OBTENER DATOS DEL REQUEST
    // ============================================
    const { priceId, userId } = await req.json();

    // Validar campos requeridos
    if (!priceId || !userId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'priceId and userId are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Creating checkout session for:', { userId, priceId });

    // ============================================
    // 3. INICIALIZAR STRIPE
    // ============================================
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // ============================================
    // 4. OBTENER URL BASE PARA REDIRECTS
    // ============================================
    // En producción, usar la URL de la app
    // En desarrollo, permitir localhost
    const origin = req.headers.get('origin') || 'http://localhost:4200';

    // URLs de éxito y cancelación
    const successUrl = `${origin}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing?canceled=true`;

    // ============================================
    // 5. CREAR CHECKOUT SESSION
    // ============================================
    const session = await stripe.checkout.sessions.create({
      // Modo de pago: subscription (recurrente)
      mode: 'subscription',

      // ID del price de Stripe
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      // URLs de redirect después del pago
      success_url: successUrl,
      cancel_url: cancelUrl,

      // Metadata para identificar al usuario
      // Esto se enviará en los webhooks
      metadata: {
        userId,
      },

      // Client reference para tracking
      client_reference_id: userId,

      // Permitir códigos de promoción
      allow_promotion_codes: true,

      // Recolectar dirección de facturación
      billing_address_collection: 'auto',

      // Configurar el customer portal
      customer_creation: 'always',

      // Período de prueba (si el price lo tiene configurado)
      subscription_data: {
        metadata: {
          userId,
        },
        // Aquí podrías agregar trial_period_days si lo necesitas
      },

      // Configurar emails automáticos
      customer_email: undefined, // Stripe lo pedirá en el checkout

      // Configuración de impuestos (opcional)
      automatic_tax: {
        enabled: false, // Cambiar a true si usas Stripe Tax
      },
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      userId,
      priceId,
    });

    // ============================================
    // 6. RETORNAR RESPUESTA
    // ============================================
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url, // URL para redirigir al usuario
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    // ============================================
    // 7. MANEJO DE ERRORES
    // ============================================
    console.error('Error creating checkout session:', error);

    // Diferenciar tipos de error
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Stripe.errors.StripeError) {
      // Errores específicos de Stripe
      statusCode = error.statusCode || 500;
      errorMessage = error.message;

      console.error('Stripe error:', {
        type: error.type,
        code: error.code,
        message: error.message,
      });
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * NOTAS DE USO:
 *
 * 1. Configurar en Supabase Dashboard:
 *    - STRIPE_SECRET_KEY (sk_test_xxx o sk_live_xxx)
 *
 * 2. Deployar:
 *    supabase functions deploy stripe-checkout
 *
 * 3. Llamar desde Angular:
 *    const response = await fetch(
 *      'https://PROJECT_ID.supabase.co/functions/v1/stripe-checkout',
 *      {
 *        method: 'POST',
 *        headers: {
 *          'Authorization': `Bearer ${supabaseToken}`,
 *          'Content-Type': 'application/json',
 *        },
 *        body: JSON.stringify({
 *          priceId: 'price_xxx',
 *          userId: 'user-uuid',
 *        }),
 *      }
 *    );
 *
 * 4. Price IDs de ejemplo:
 *    - Free: null (no requiere checkout)
 *    - Pro: price_xxx
 *    - Enterprise: price_yyy
 *
 * 5. Testing local:
 *    supabase functions serve stripe-checkout --env-file .env.local
 */
