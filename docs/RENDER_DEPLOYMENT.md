# 🚀 RecipeRush Render Deployment Guide

## Overview
This guide will help you deploy both the frontend and backend of RecipeRush on Render, a modern cloud platform that's perfect for Node.js applications.

## 📋 Prerequisites
- [Render account](https://render.com) (free tier available)
- Stripe account with live keys
- Gmail account for email delivery
- Domain name (optional, for custom URLs)

## 🏗️ Architecture
- **Backend**: Node.js/Express API service
- **Frontend**: Static HTML/CSS/JS files
- **Database**: In-memory storage (upgrade to PostgreSQL for production)

## 🚀 Deployment Steps

### 1. Prepare Your Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy Backend Service

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect your GitHub/GitLab repository
   - Select the `recipe-rush` repository

3. **Configure Backend Service**
   ```
   Name: reciperush-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Starter (Free)
   ```

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   STRIPE_SECRET_KEY=sk_live_your_actual_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   JWT_SECRET=your_random_jwt_secret
   SESSION_SECRET=your_random_session_secret
   BASE_URL=https://reciperush-backend.onrender.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment

### 3. Deploy Frontend Service

1. **Create Another Web Service**
   - Click "New +" → "Web Service"

2. **Configure Frontend Service**
   ```
   Name: reciperush-frontend
   Environment: Static Site
   Build Command: echo "Static site - no build needed"
   Start Command: echo "Static site - no start needed"
   ```

3. **Deploy**
   - Click "Create Web Service"
   - Frontend will be available at `https://reciperush-frontend.onrender.com`

### 4. Configure Stripe Webhooks

1. **Go to Stripe Dashboard**
   - Visit [dashboard.stripe.com](https://dashboard.stripe.com)
   - Go to Developers → Webhooks

2. **Add Endpoint**
   ```
   URL: https://reciperush-backend.onrender.com/webhook/stripe
   Events: checkout.session.completed
   ```

3. **Copy Webhook Secret**
   - Copy the webhook signing secret
   - Add it to your Render environment variables

### 5. Test Your Deployment

1. **Backend Health Check**
   ```
   https://reciperush-backend.onrender.com/health
   ```

2. **Frontend Access**
   ```
   https://reciperush-frontend.onrender.com
   ```

3. **Test Checkout Flow**
   - Use Stripe test cards
   - Verify email delivery
   - Test download functionality

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature | `whsec_...` |
| `EMAIL_USER` | Gmail address | `your@email.com` |
| `EMAIL_PASS` | Gmail app password | `abcd efgh ijkl mnop` |
| `JWT_SECRET` | JWT signing secret | `random_string_64_chars` |
| `SESSION_SECRET` | Session encryption | `random_string_64_chars` |
| `BASE_URL` | Backend service URL | `https://reciperush-backend.onrender.com` |

## 🚨 Important Notes

### Security
- Never commit `.env` files
- Use strong, random secrets for JWT and sessions
- Enable HTTPS (automatic on Render)

### 🚨 CRITICAL SECURITY ALERT
**JWT_SECRET and SESSION_SECRET were exposed in version control and must be rotated immediately.**

#### Immediate Actions Required:
1. **Generate new secrets** using the commands below
2. **Update Render environment variables** with new values
3. **Restart the application** to invalidate all existing tokens
4. **Monitor logs** for suspicious activity

#### Generate New Secrets:
```bash
# Generate new JWT_SECRET (128 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate new SESSION_SECRET (128 characters)  
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Why This Matters:
- **JWT_SECRET**: Used for signing download tokens and CSRF tokens
- **SESSION_SECRET**: Used for session encryption (if sessions are implemented)
- **Current Impact**: All existing tokens are compromised and must be invalidated
- **Solution**: Restarting the server clears in-memory token stores automatically

### Performance
- Free tier has cold starts
- Consider upgrading to paid plans for production
- Monitor memory usage

### Limitations
- Free tier: 750 hours/month
- 512MB RAM, 0.1 CPU
- Sleeps after 15 minutes of inactivity

## 🔄 Auto-Deployment
- Render automatically deploys on git push
- Each service has its own deployment pipeline
- Monitor deployment logs for issues

## 📊 Monitoring
- View logs in Render dashboard
- Set up alerts for errors
- Monitor response times and uptime

## 🆘 Troubleshooting

### Common Issues
1. **Build Failures**: Check `package.json` and dependencies
2. **Environment Variables**: Verify all required vars are set
3. **Port Conflicts**: Ensure PORT is set to 10000
4. **CORS Errors**: Check origin configuration in server.js

### Getting Help
- Render documentation: [docs.render.com](https://docs.render.com)
- Community forum: [community.render.com](https://community.render.com)
- Support: Available on paid plans

## 🎉 Success!
Once deployed, your RecipeRush application will be:
- ✅ Accessible worldwide
- ✅ Automatically scaled
- ✅ HTTPS secured
- ✅ Continuously deployed
- ✅ Professionally hosted

Your e-commerce site is now ready for customers! 🚀
