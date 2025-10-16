/**
 * Edge Function: send-email
 *
 * Wrapper genérico para Resend API
 * Permite enviar emails transaccionales desde cualquier parte de la aplicación
 *
 * IMPORTANTE: Configurar RESEND_API_KEY en Supabase secrets
 *
 * @example
 * POST /functions/v1/send-email
 * {
 *   "to": "user@example.com",
 *   "subject": "Bienvenido a nuestra plataforma",
 *   "html": "<h1>Hola!</h1>",
 *   "from": "noreply@tudominio.com" // opcional
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Tipos para el request
interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

// Respuesta de Resend API
interface ResendResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

/**
 * Handler principal de la Edge Function
 */
serve(async (req: Request) => {
  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar API Key de Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no configurado en secrets');
    }

    // Configuración por defecto del remitente
    const DEFAULT_FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

    // Parsear el body del request
    const body: SendEmailRequest = await req.json();

    // Validar campos requeridos
    if (!body.to || !body.subject || !body.html) {
      return new Response(
        JSON.stringify({
          error: 'Campos requeridos: to, subject, html',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📧 Enviando email a:', body.to);

    // Preparar payload para Resend API
    const resendPayload = {
      from: body.from || DEFAULT_FROM,
      to: Array.isArray(body.to) ? body.to : [body.to],
      subject: body.subject,
      html: body.html,
      ...(body.replyTo && { reply_to: body.replyTo }),
      ...(body.cc && { cc: body.cc }),
      ...(body.bcc && { bcc: body.bcc }),
    };

    // Llamar a Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    // Procesar respuesta de Resend
    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('❌ Error de Resend:', resendData);
      return new Response(
        JSON.stringify({
          error: 'Error al enviar email',
          details: resendData,
        }),
        {
          status: resendResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Email enviado exitosamente:', resendData.id);

    // Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        data: resendData as ResendResponse,
        message: 'Email enviado correctamente',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error en send-email function:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
