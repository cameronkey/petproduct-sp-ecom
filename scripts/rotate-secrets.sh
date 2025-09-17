#!/bin/bash
set -euo pipefail

# Ensure dependencies exist
if ! command -v node >/dev/null 2>&1 && ! command -v openssl >/dev/null 2>&1; then
  echo "Error: Requires Node.js or OpenSSL to generate secure random bytes." >&2
  exit 1
fi

# Restrict default permissions for any files we create
umask 077

# RecipeRush Secret Rotation Script
# Use this script to generate new secrets after the security incident

echo "🔐 RecipeRush Secret Rotation Script"
echo "====================================="
echo ""
echo "🚨 SECURITY ALERT: JWT_SECRET and SESSION_SECRET were exposed in version control"
echo "This script will generate new secure secrets for production use."
echo ""
# Generate new JWT_SECRET
echo "Generating new JWT_SECRET..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "✅ New JWT_SECRET: ${JWT_SECRET}"
echo ""

# Generate new SESSION_SECRET
echo "Generating new SESSION_SECRET..."
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "✅ New SESSION_SECRET: ${SESSION_SECRET}"
echo ""

echo "📋 NEXT STEPS:"
echo "=============="
echo ""
echo "1. Copy these new secrets to your Render dashboard:"
echo "   - JWT_SECRET: ${JWT_SECRET}"
echo "   - SESSION_SECRET: ${SESSION_SECRET}"
echo ""
echo "2. Restart your application to invalidate existing tokens"
echo ""
echo "3. Monitor logs for any suspicious activity"
echo ""
echo "4. Update your team about the secret rotation"
echo ""
echo "⚠️  IMPORTANT: Keep these secrets secure and never commit them to version control!"
echo ""
echo "🔒 Security Note: All existing download tokens and CSRF tokens will be invalidated"
echo "   when you restart the application. Users may need to re-authenticate."
echo ""

# Save to a temporary file for easy copying
cat > /tmp/new-secrets.txt << EOF
# RecipeRush New Secrets - Generated $(date)
# ⚠️  SECURITY: Delete this file after use!

JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# Instructions:
# 1. Copy these values to Render dashboard environment variables
# 2. Restart the application
# 3. Delete this file
# 4. Monitor logs for suspicious activity
EOF

echo "💾 New secrets saved to /tmp/new-secrets.txt for easy copying"
echo "   Remember to delete this file after updating your environment variables!"
echo ""
echo "✅ Secret rotation script completed successfully!"
