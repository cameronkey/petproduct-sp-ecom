# RecipeRush - E-commerce Recipe Platform

A secure, production-ready e-commerce platform for selling digital recipe collections and cookbooks.

## 🚨 SECURITY ALERT - IMMEDIATE ACTION REQUIRED

**CRITICAL**: JWT_SECRET and SESSION_SECRET values were exposed in version control and have been compromised. 

### What Happened
- Secret values were committed to `.env.backup` file
- These secrets are now publicly visible and should be considered compromised
- All existing tokens and sessions should be invalidated immediately

### Immediate Actions Required

1. **Rotate Secrets in Production**
   - Generate new JWT_SECRET and SESSION_SECRET values
   - Update environment variables in Render dashboard
   - Restart the application

2. **Invalidate Existing Sessions**
   - The application uses in-memory token storage (downloadTokens and csrfTokens Maps)
   - Restarting the server will automatically clear all existing tokens
   - Users will need to re-authenticate/download after restart

3. **Verify Security**
   - Check Render dashboard for any exposed environment variables
   - Ensure no secrets are committed to version control
   - Review access logs for suspicious activity

### How to Generate New Secrets

```bash
# Generate new JWT_SECRET
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(64).toString('hex'))"

# Generate new SESSION_SECRET  
node -e "console.log('SESSION_SECRET:', require('crypto').randomBytes(64).toString('hex'))"
```

### Environment Variables to Update in Render

- `JWT_SECRET` - New 128-character hex string
- `SESSION_SECRET` - New 128-character hex string

## 🏗️ Project Overview

RecipeRush is a full-stack e-commerce application built with:
- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Payment**: Stripe Checkout
- **Email**: Nodemailer with Gmail
- **Hosting**: Render (Backend + Frontend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Stripe account
- Gmail account with app password

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd recipe-rush
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your development values
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Production Deployment

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete deployment instructions.

## 🔐 Security Features

- **Rate Limiting**: Configurable request limits per IP
- **CORS Protection**: Origin validation for production
- **Security Headers**: HSTS, XSS protection, content type validation
- **CSRF Protection**: Token-based CSRF prevention
- **Input Validation**: Request size limits and validation
- **Environment Isolation**: Separate configs for dev/test/prod

## 📁 Project Structure

```
recipe-rush/
├── server.js              # Main Express server
├── index.html            # Landing page
├── catalog.html          # Product catalog
├── contact.html          # Contact form
├── success.html          # Payment success page
├── cancel.html           # Payment cancellation page
├── js/                   # JavaScript modules
├── styles.css            # Main stylesheet
├── env.example           # Environment template
├── env.production        # Production config template
├── render.yaml           # Render deployment config
└── tests/                # Test suite
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test files
npm test -- tests/server.test.js
```

## 📚 Documentation

- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [Render Deployment](./RENDER_DEPLOYMENT.md)
- [Security Checklist](./PRODUCTION_READY_CHECKLIST.md)
- [Testing Guide](./TESTING.md)
- [Stripe Setup](./STRIPE_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For security issues, please contact the development team immediately.

For deployment or technical issues, check the documentation or create an issue in the repository.

---

**Remember**: Never commit secrets or sensitive information to version control. Always use environment variables for production deployments.
