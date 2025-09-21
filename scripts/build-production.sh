#!/bin/bash

# Pawsitive Peace Production Build Script
# This script prepares the frontend for production deployment

echo "🚀 Building Pawsitive Peace for production..."

# Create production directory
PROD_DIR="production"
rm -rf "$PROD_DIR"
mkdir -p "$PROD_DIR"

# Copy frontend files to production directory
echo "📁 Copying frontend files to production directory..."
cp -r src/frontend/* "$PROD_DIR/"

# Remove development files and directories
echo "🧹 Removing development files..."
cd "$PROD_DIR"
rm -rf tests/
rm -rf coverage/
rm -rf node_modules/
rm -f .eslintrc.js
rm -f .prettierrc
rm -f jest.config.js
rm -f setup-production.sh
rm -f rotate-secrets.sh
rm -f security-check.js
rm -f build-production.sh
rm -f .renderignore

# Remove any backend files that might have been copied
rm -rf src/backend/
rm -rf src/frontend/
rm -rf config/
rm -rf docs/
rm -rf scripts/
rm -rf tests/

# Remove console.log statements from JavaScript files (keeping essential ones)
echo "🔇 Removing unnecessary console.log statements..."

# Remove console.log from script.js (keep essential checkout CTA logs)
sed -i '' 's/console\.log("✅ [^"]*");/\/\/ Removed for production/g' assets/js/script.js
sed -i '' 's/console\.log("🛒 [^"]*");/\/\/ Removed for production/g' assets/js/script.js
sed -i '' 's/console\.log("🔍 [^"]*");/\/\/ Removed for production/g' assets/js/script.js

# Remove console.log from contact.js (keep essential checkout CTA logs)
sed -i '' 's/console\.log("✅ [^"]*");/\/\/ Removed for production/g' assets/js/contact.js
sed -i '' 's/console\.log("🔄 [^"]*");/\/\/ Removed for production/g' assets/js/contact.js

# Remove console.log from catalog.js (keep essential checkout CTA logs)
sed -i '' 's/console\.log("[^"]*");/\/\/ Removed for production/g' assets/js/catalog.js

# Remove console.log from config-loader.js (keep essential error logs)
sed -i '' 's/console\.log("✅ [^"]*");/\/\/ Removed for production/g' assets/js/config-loader.js

# Create production package.json (remove dev dependencies)
echo "📦 Creating production package.json..."
cat > package.json << 'EOF'
{
  "name": "pawsitivepeace-frontend",
  "version": "1.0.0",
  "description": "Pawsitive Peace Frontend - Production Build",
  "main": "index.html",
  "scripts": {
    "start": "echo 'Frontend is static - no start needed'"
  },
  "dependencies": {},
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "e-commerce",
    "e-book",
    "recipes",
    "frontend"
  ],
  "author": "Pawsitive Peace",
  "license": "MIT"
}
EOF

# Create production README
echo "📖 Creating production README..."
cat > README.md << 'EOF'
# Pawsitive Peace Frontend - Production Build

This is the production-ready frontend for Pawsitive Peace.

## Files Included
- HTML pages (index.html, catalog.html, contact.html)
- CSS styles (styles.css)
- JavaScript files (script.js, catalog.js, contact.js)
- Service worker (sw.js)
- Configuration loader (js/config-loader.js)
- Cart manager (js/cart-manager.js)

## Deployment
This build is ready for deployment to Render, Netlify, or any static hosting service.

## Features
- Responsive design
- Service worker for offline support
- Stripe integration
- Shopping cart functionality
- Contact form with EmailJS
- E-book delivery system integration
EOF

echo "✅ Production build complete!"
echo "📁 Production files are in: $PROD_DIR/"
echo "🚀 Ready for deployment to Render!"
