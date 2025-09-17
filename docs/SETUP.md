# RecipeRush E-Book Delivery System Setup Guide

## 🚀 Overview

This guide will help you set up the complete e-book delivery system for RecipeRush. The system includes:

- **Backend server** with Node.js/Express
- **Stripe Checkout** integration
- **Automated e-book delivery** via email
- **Secure download system** with expiring links
- **Webhook handling** for payment confirmation

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Stripe account with live keys
- Gmail account for sending emails
- Domain name (for production)

## 🛠️ Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Server Configuration
PORT=3000
BASE_URL=https://reciperush.uk

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Production Settings
NODE_ENV=production
```

### 3. Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an App Password for "Mail"
4. Use this password in `EMAIL_PASS`

### 4. Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Create endpoint: `https://reciperush.uk/webhook/stripe`
3. Select events: `checkout.session.completed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 5. E-Book File

1. Place your actual PDF e-book in `ebooks/complete-recipe-collection.pdf`
2. Ensure file size is optimized (<10MB for email delivery)
3. File should be 90 pages with 80+ recipes

## 🚀 Running the System

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## 🔄 How It Works

### 1. Customer Checkout Flow

1. Customer adds e-book to cart
2. Clicks "Pay Now" button
3. Frontend creates Stripe Checkout session
4. Customer redirected to Stripe Checkout
5. After payment, customer redirected to success page

### 2. E-Book Delivery Flow

1. Stripe sends webhook to `/webhook/stripe`
2. Server generates secure download token
3. Server sends delivery email with download link
4. Customer clicks link to download e-book
5. Download link expires after 7 days

### 3. Security Features

- **Download tokens** expire after 7 days
- **Maximum downloads** limited to 5 per token
- **Secure token generation** using crypto.randomBytes
- **Webhook signature verification** for Stripe events

## 📧 Email Templates

The system sends professional HTML emails with:

- **Branded header** with RecipeRush styling
- **Clear download instructions**
- **Security information** about link expiry
- **Contact details** for support
- **Professional layout** optimized for all email clients

## 🌐 Production Deployment

### 1. Domain Setup

- Point your domain to your server
- Set up SSL certificate (HTTPS required)
- Update `BASE_URL` in `.env`

### 2. Server Requirements

- **Node.js** v16+
- **PM2** for process management
- **Nginx** for reverse proxy
- **SSL certificate** (Let's Encrypt)

### 3. PM2 Configuration

```bash
npm install -g pm2
pm2 start server.js --name "reciperush"
pm2 startup
pm2 save
```

### 4. Nginx Configuration

```nginx
server {
    listen 80;
    server_name reciperush.uk;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name reciperush.uk;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Testing

### 1. Test Mode

```bash
# Use Stripe test keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 2. Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### 3. Webhook Testing

Use Stripe CLI for local testing:

```bash
stripe listen --forward-to localhost:3000/webhook/stripe
```

## 📊 Monitoring

### 1. Health Check

```bash
curl https://reciperush.uk/health
```

### 2. Logs

```bash
pm2 logs reciperush
```

### 3. Error Tracking

Monitor server logs for:
- Payment failures
- Email delivery issues
- Download errors
- Webhook verification failures

## 🔧 Troubleshooting

### Common Issues

1. **Email not sending**
   - Check Gmail app password
   - Verify email credentials
   - Check server logs

2. **Webhook failures**
   - Verify webhook secret
   - Check endpoint URL
   - Ensure HTTPS is enabled

3. **Download errors**
   - Verify e-book file exists
   - Check file permissions
   - Verify token generation

### Support

For technical support:
- Email: reciperush01@gmail.com
- Check server logs for error details
- Verify all environment variables are set

## 🎯 Next Steps

After setup:

1. **Test the complete flow** with test payments
2. **Customize email templates** to match your brand
3. **Set up monitoring** and error tracking
4. **Configure backup systems** for e-book storage
5. **Implement analytics** to track conversions

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [Email Delivery Best Practices](https://sendgrid.com/blog/email-delivery-best-practices/)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)

---

**Need help?** Contact the development team at reciperush01@gmail.com
