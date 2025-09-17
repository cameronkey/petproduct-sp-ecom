#!/bin/bash

# RecipeRush Production Build Script
# This script prepares the frontend for production deployment

echo "🚀 Building RecipeRush for production..."

# Create production directory
PROD_DIR="production"
rm -rf "$PROD_DIR"
mkdir -p "$PROD_DIR"

# Copy all files to production directory
echo "📁 Copying files to production directory..."
cp -r * "$PROD_DIR/"

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

# Remove console.log statements from JavaScript files (keeping essential ones)
echo "🔇 Removing unnecessary console.log statements..."

# Remove console.log from script.js (keep essential checkout CTA logs)
sed -i '' 's/console\.log("✅ [^"]*");/\/\/ Removed for production/g' script.js
sed -i '' 's/console\.log("🛒 [^"]*");/\/\/ Removed for production/g' script.js
sed -i '' 's/console\.log("🔍 [^"]*");/\/\/ Removed for production/g' script.js

# Remove console.log from contact.js (keep essential checkout CTA logs)
sed -i '' 's/console\.log("✅ [^"]*");/\/\/ Removed for production/g' contact.js
sed -i '' 's/console\.log("🔄 [^"]*");/\/\/ Removed for production/g' contact.js

# Remove console.log from catalog.js (keep essential checkout CTA logs)
sed -i '' 's/console\.log("[^"]*");/\/\/ Removed for production/g' catalog.js

# Remove console.log from config-loader.js (keep essential error logs)
sed -i '' 's/console\.log("✅ [^"]*");/\/\/ Removed for production/g' js/config-loader.js

# Create production package.json (remove dev dependencies)
echo "📦 Creating production package.json..."
cat > package.json << 'EOF'
{
  "name": "reciperush-frontend",
  "version": "1.0.0",
  "description": "RecipeRush Frontend - Production Build",
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
  "author": "RecipeRush",
  "license": "MIT"
}
EOF

# Create production README
echo "📖 Creating production README..."
cat > README.md << 'EOF'
# RecipeRush Frontend - Production Build

This is the production-ready frontend for RecipeRush.

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
