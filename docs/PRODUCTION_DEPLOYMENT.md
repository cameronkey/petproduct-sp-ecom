# RecipeRush Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables Setup

**IMPORTANT**: Before deploying, you MUST update these values in your Render dashboard:

#### Stripe Configuration
- `STRIPE_SECRET_KEY`: Your live Stripe secret key (starts with `sk_live_`)
- `STRIPE_PUBLISHABLE_KEY`: Your live Stripe publishable key (starts with `pk_live_`)
- `STRIPE_WEBHOOK_SECRET`: Your live Stripe webhook secret (starts with `whsec_`)

#### Email Configuration
- `EMAIL_USER`: `reciperush01@gmail.com`
- `EMAIL_PASS`: Your Gmail App Password (16 characters)

#### Security
- `JWT_SECRET`: Generate using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `SESSION_SECRET`: Generate using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 2. Frontend Stripe Keys Update

**CRITICAL**: You must update the frontend JavaScript files with your live Stripe publishable key:

1. **Backend Configuration**: Ensure `/api/config` endpoint returns the correct live Stripe publishable key
2. **Environment Variables**: Set `STRIPE_PUBLISHABLE_KEY` in Render dashboard
3. **Frontend**: Verify all JavaScript files use `window.RECIPE_RUSH_CONFIG.stripe.publishableKey` instead of hardcoded keys

Replace `pk_live_your_actual_live_publishable_key_here` with your actual live key from Stripe dashboard.

### 3. Stripe Production Setup

1. **Switch to Live Mode** in your Stripe dashboard
2. **Update Webhook Endpoint** to: `https://reciperush-backend.onrender.com/webhook/stripe`
3. **Copy Live Keys** from Stripe dashboard
4. **Test Live Payment** with a small amount

### 4. File Verification

- ✅ `recipe-rush-lean-and-loaded.pdf` is in the root directory
- ✅ All HTML files have correct brand links
- ✅ Email content matches website features
- ✅ Success page CTA is centered

## 🔧 Render Deployment

### 1. Connect Repository
- Connect your GitHub repository to Render
- Set build command: `npm install`
- Set start command: `npm start`

### 2. Environment Variables
Add all environment variables from the checklist above in Render dashboard.

### 3. Deploy
- Click "Deploy" in Render
- Wait for build to complete
- Verify server starts successfully

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://reciperush-backend.onrender.com/health
```

### 2. Test Email System
```bash
curl https://reciperush-backend.onrender.com/test-email
```
**⚠️ PRODUCTION SECURITY**: This endpoint must be disabled or protected in production. Recommended action: Remove the route in production config or gate behind environment-variable-enabled feature flag.

### 3. Test Webhook
```bash
curl https://reciperush-backend.onrender.com/test-webhook
```
**⚠️ PRODUCTION SECURITY**: This endpoint must be disabled or protected in production. Recommended action: Remove the route in production config or enable authentication middleware.

### 4. Full Payment Flow Test
1. Make a real purchase with live Stripe
2. Verify webhook receives payment
3. Verify email is sent to customer
4. Verify download link works
5. Verify e-book downloads correctly

## 🔒 Production Security Features

- ✅ Rate limiting (100 requests per 15 minutes per IP)
- ✅ Security headers (XSS protection, content type options, etc.)
- ✅ CORS restrictions to allowed domains only
- ✅ Request size limits (10MB max)
- ✅ Production error handling
- ✅ Graceful shutdown handling

## 📊 Monitoring

### Logs
- Check Render logs for any errors
- Monitor Stripe webhook delivery
- Monitor email delivery success rates

### Performance
- Monitor response times
- Check memory usage
- Monitor download success rates

## 🚨 Emergency Procedures

### If Payment Processing Fails
1. Check Stripe dashboard for errors
2. Verify webhook endpoint is accessible
3. Check server logs for errors
4. Verify environment variables are set

### If Emails Stop Working
1. Check Gmail App Password validity
2. Verify email credentials in environment
3. Check Gmail account status
4. Test email endpoint

### If Downloads Fail
1. Verify PDF file exists on server
2. Check file permissions
3. Verify download tokens are being generated
4. Check server storage space

## 📞 Support Contacts

- **Technical Issues**: Check server logs and Stripe dashboard
- **Payment Issues**: Contact Stripe support
- **Email Issues**: Check Gmail account settings
- **General Support**: reciperush01@gmail.com

## 🔄 Updates and Maintenance

### Regular Tasks
- Monitor Stripe webhook delivery
- Check email delivery success rates
- Monitor server performance
- Update dependencies monthly

### Before Updates
- Test in development environment
- Backup current production data
- Schedule maintenance window
- Notify users if necessary

---

**Remember**: Always test thoroughly in development before deploying to production!
