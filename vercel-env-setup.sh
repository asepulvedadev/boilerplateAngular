#!/bin/bash

#################################################
# Script para configurar variables de entorno
# en Vercel usando Vercel CLI
#################################################

echo "🚀 Configurando variables de entorno en Vercel..."
echo ""

# Verificar si vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado."
    echo "📦 Instalando Vercel CLI globalmente..."
    npm install -g vercel
fi

echo "📝 Configura las siguientes variables de entorno:"
echo ""

# Supabase URL
echo "1️⃣ VITE_SUPABASE_URL (Supabase Project URL)"
read -p "   Valor: " SUPABASE_URL
vercel env add VITE_SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add VITE_SUPABASE_URL preview <<< "$SUPABASE_URL"
vercel env add VITE_SUPABASE_URL development <<< "$SUPABASE_URL"

echo ""

# Supabase Anon Key
echo "2️⃣ VITE_SUPABASE_ANON_KEY (Supabase Anon/Public Key)"
read -p "   Valor: " SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
vercel env add VITE_SUPABASE_ANON_KEY preview <<< "$SUPABASE_ANON_KEY"
vercel env add VITE_SUPABASE_ANON_KEY development <<< "$SUPABASE_ANON_KEY"

echo ""

# Stripe Publishable Key
echo "3️⃣ VITE_STRIPE_PUBLISHABLE_KEY (Stripe Publishable Key)"
read -p "   Valor: " STRIPE_KEY
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production <<< "$STRIPE_KEY"
vercel env add VITE_STRIPE_PUBLISHABLE_KEY preview <<< "$STRIPE_KEY"
vercel env add VITE_STRIPE_PUBLISHABLE_KEY development <<< "$STRIPE_KEY"

echo ""

# API URL
echo "4️⃣ VITE_API_URL (API URL - generalmente tu Supabase URL)"
read -p "   Valor: " API_URL
vercel env add VITE_API_URL production <<< "$API_URL"
vercel env add VITE_API_URL preview <<< "$API_URL"
vercel env add VITE_API_URL development <<< "$API_URL"

echo ""
echo "✅ Variables de entorno configuradas exitosamente en Vercel!"
echo ""
echo "🔄 Próximos pasos:"
echo "   1. Ejecuta: vercel --prod"
echo "   2. O haz push a tu repositorio para deploy automático"
echo ""
