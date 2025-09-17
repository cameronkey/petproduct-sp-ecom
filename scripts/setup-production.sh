#!/bin/bash

# Strict shell options for fail-fast behavior and bug prevention
set -euo pipefail
IFS=$'\n\t'

echo "🚀 RecipeRush Production Environment Setup"
echo "=========================================="
echo ""

# Generate security secrets
echo "🔐 Generating security secrets..."

# Function to generate 64-byte hex secret
generate_secret() {
    if command -v node >/dev/null 2>&1; then
        echo "📦 Using Node.js crypto.randomBytes() for secret generation"
        node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    elif command -v openssl >/dev/null 2>&1; then
        echo "🔐 Using OpenSSL for secret generation"
        openssl rand -hex 64
    elif [ -r /dev/urandom ]; then
        echo "🎲 Using /dev/urandom for secret generation"
        head -c 64 /dev/urandom | hexdump -ve '1/1 "%.2x"'
    else
        echo "❌ ERROR: No suitable method found for generating secrets"
        echo "   Required: Node.js, OpenSSL, or /dev/urandom access"
        echo "   Please install Node.js or OpenSSL and try again"
        exit 1
    fi
}

# Generate secrets using the best available method
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)

echo "✅ Generated JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "✅ Generated SESSION_SECRET: ${SESSION_SECRET:0:20}..."
echo ""
echo "⚠️  WARNING: Full secrets will be displayed below. Consider running:"
echo "   history -c && history -w  # to clear shell history after copying"
echo ""
echo ""

echo "📋 Production Environment Variables to set in Render:"
echo "====================================================="
echo ""
echo "⚠️  IMPORTANT:"
echo "1. Copy these values to your Render dashboard environment variables"
echo "2. Replace Stripe keys with your actual live keys from Stripe dashboard"
echo "3. Replace EMAIL_PASS with your actual Gmail App Password"
echo "4. Ensure your backend /api/config returns the correct STRIPE_PUBLISHABLE_KEY for the frontend"
echo "5. Test thoroughly before going live!"
echo ""
echo "🔑 Frontend Stripe Configuration:"
echo "   - Frontend loads /api/config at runtime and reads config.stripe.publishableKey"
echo "   - No manual edits in script.js/contact.js/catalog.js required"
echo ""
echo ""
echo "# Security (Generated above)"
echo "JWT_SECRET=${JWT_SECRET}"
echo "SESSION_SECRET=${SESSION_SECRET}"
echo ""
echo "# Production Settings"
echo "LOG_LEVEL=error"
echo "ENABLE_DEBUG=false"
echo "MAX_FILE_SIZE=10485760"
echo "RATE_LIMIT_WINDOW_MS=900000"
echo "RATE_LIMIT_MAX_REQUESTS=100"
echo ""

# (The entire outdated echo block has been removed; no remaining lines in this snippet.)

echo "📚 See PRODUCTION_DEPLOYMENT.md for complete deployment guide"
