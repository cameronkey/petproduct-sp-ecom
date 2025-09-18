require('dotenv').config();

// Security Note: Test endpoints (/test-email, /test-webhook, /test-download/:token) 
// are automatically disabled in production unless ENABLE_TEST_ENDPOINTS is set to a truthy value.
// Set NODE_ENV=production and optionally ENABLE_TEST_ENDPOINTS=true to control access.

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Initialize Sentry if DSN is provided
let Sentry;
if (process.env.SENTRY_DSN) {
    try {
        Sentry = require('@sentry/node');
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development'
        });
        console.log('✅ Sentry initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Sentry:', error.message);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Production security middleware
if (process.env.NODE_ENV === 'production') {
    // Rate limiting for production - configurable via environment variables
    const rateLimitWindowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15;
    const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX) || 100;

    const limiter = rateLimit({
        windowMs: rateLimitWindowMinutes * 60 * 1000, // Convert minutes to milliseconds
        max: rateLimitMax, // limit each IP to max requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    });
    // CORS must come BEFORE rate limiting to allow cross-origin requests
    app.use(cors({
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://pawsitivepeace.co.uk', 'https://www.pawsitivepeace.co.uk']
            : true,
        credentials: true
    }));
    
    // Explicit CORS headers to ensure proper response
    app.use((req, res, next) => {
        const allowedOrigins = ['https://pawsitivepeace.co.uk', 'https://www.pawsitivepeace.co.uk'];
        const origin = req.headers.origin;
        
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });
    app.use(express.json({ limit: '10mb' }));

    app.use(limiter);

    // Security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
    });
    
    // Serve static files before API routes to prevent interference
    app.use(express.static(path.join(__dirname, '../frontend')));
} else {
    // Development mode - also serve static files
    app.use(express.static(path.join(__dirname, '../frontend')));
    app.use(express.json({ limit: '10mb' }));
}

// CSRF token rate limiter - prevents token spamming
const csrfLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 10, // limit each IP to 10 requests per minute
    message: {
        error: 'Too many CSRF token requests from this IP. Please wait before requesting another token.',
        retryAfter: 60
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many CSRF token requests from this IP. Please wait before requesting another token.',
            retryAfter: 60
        });
    }
});


// CSRF token store (in production, use a database or session store)
const csrfTokens = new Map();

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test email configuration on startup (only in development, not in tests)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    // Make email verification non-blocking to prevent startup failures
    setTimeout(() => {
        transporter.verify(function(error, success) {
            if (error) {
                console.warn('⚠️ Email configuration warning:', error.message);
                console.warn('   This may be due to network issues or missing email credentials.');
                console.warn('   Email functionality will be limited until this is resolved.');
            } else {
                console.log('✅ Email configuration verified successfully');
            }
        });
    }, 1000); // Delay verification to not block server startup
}


// Generate CSRF token
function generateCSRFToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + (15 * 60 * 1000); // 15 minutes expiry

    csrfTokens.set(token, {
        expiry: expiry,
        used: false
    });

    return token;
}

// Validate CSRF token
function validateCSRFToken(token) {
    const tokenData = csrfTokens.get(token);

    if (!tokenData) {
        return false;
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiry) {
        csrfTokens.delete(token);
        return false;
    }

    // Check if token has already been used
    if (tokenData.used) {
        csrfTokens.delete(token);
        return false;
    }

    // Mark token as used and remove it
    csrfTokens.delete(token);
    return true;
}

// Clean up expired CSRF tokens periodically
function cleanupExpiredCSRFTokens() {
    const now = Date.now();
    for (const [token, tokenData] of csrfTokens.entries()) {
        if (now > tokenData.expiry) {
            csrfTokens.delete(token);
        }
    }
}

// Run cleanup every 5 minutes (not in test mode)
let cleanupInterval;
if (process.env.NODE_ENV !== 'test') {
    cleanupInterval = setInterval(cleanupExpiredCSRFTokens, 5 * 60 * 1000);
}

// Send order confirmation email
async function sendOrderConfirmationEmail(customerEmail, customerName, orderId) {
    console.log('📧 Preparing order confirmation email...');
    console.log('   From:', process.env.EMAIL_USER);
    console.log('   To:', customerEmail);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: 'Your Pawsitive Peace Order is Ready! 🐾',
        html: `
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F0;">
                <div style="background: linear-gradient(135deg, #7FB069 0%, #6B9A4F 100%); color: #FAF7F0; padding: 2rem; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="margin: 0; font-size: 2rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 700;"><i class="fas fa-check-circle" style="margin-right: 10px;"></i>Thank You for Your Purchase!</h1>
                    <p style="margin: 1rem 0 0 0; font-size: 1.1rem; font-weight: 500;">Your order is being processed and will be shipped soon</p>
                </div>
                
                <div style="padding: 2rem; background: #FAF7F0; border-radius: 0 0 16px 16px;">
                    <h2 style="color: #4A4A4A; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;">Hello ${customerName}!</h2>
                    
                    <p style="color: #4A4A4A; line-height: 1.6; margin-bottom: 1.5rem; font-weight: 400;">
                        Thank you for purchasing <strong>The Pupsicle</strong> from Pawsitive Peace! 
                        Your order is being processed and will be shipped to you soon.
                    </p>
                    
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E1EFD9; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(127, 176, 105, 0.1);">
                        <h3 style="color: #4A4A4A; margin-top: 0; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-paw" style="margin-right: 8px; color: #7FB069;"></i>What You'll Get:</h3>
                        <ul style="color: #4A4A4A; line-height: 1.6; font-weight: 400;">
                            <li>High-Quality Dog Toy - The Pupsicle</li>
                            <li>Dishwasher Safe Design</li>
                            <li>Non-Toxic Materials</li>
                            <li>Freezer Safe for Extended Play</li>
                            <li>Durable Construction</li>
                        </ul>
                    </div>
                    
                    <div style="background: #F0F7ED; border: 1px solid #7FB069; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0;">
                        <h3 style="color: #4A4A4A; margin-top: 0; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-box" style="margin-right: 8px; color: #7FB069;"></i>Shipping & Delivery Information</h3>
                        <div style="color: #4A4A4A; font-size: 0.9rem; line-height: 1.6; font-weight: 400;">
                            <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-clock" style="margin-right: 6px; color: #7FB069;"></i>Processing Time:</strong> 1-2 business days</p>
                            <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-truck" style="margin-right: 6px; color: #7FB069;"></i>Shipping Method:</strong> Tracked delivery via Royal Mail</p>
                            <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-envelope" style="margin-right: 6px; color: #7FB069;"></i>Tracking Updates:</strong> We'll email you when your order ships with tracking details</p>
                            <p style="margin: 0;"><strong><i class="fas fa-calendar" style="margin-right: 6px; color: #7FB069;"></i>Expected Delivery:</strong> 3-5 business days after shipping</p>
                        </div>
                    </div>
                    
                    <div style="background: white; border: 1px solid #E1EFD9; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(127, 176, 105, 0.1);">
                        <h3 style="color: #4A4A4A; margin-top: 0; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-list" style="margin-right: 8px; color: #7FB069;"></i>What Happens Next?</h3>
                        <div style="color: #4A4A4A; font-size: 0.9rem; line-height: 1.6; font-weight: 400;">
                            <p style="margin: 0 0 0.8rem 0;">1. <strong>Order Processing:</strong> We'll prepare your Pupsicle for shipping</p>
                            <p style="margin: 0 0 0.8rem 0;">2. <strong>Shipping Notification:</strong> You'll receive an email with tracking details</p>
                            <p style="margin: 0 0 0.8rem 0;">3. <strong>Delivery:</strong> Your order will arrive at your doorstep</p>
                            <p style="margin: 0;">4. <strong>Enjoy:</strong> Watch your dog love their new Pupsicle!</p>
                        </div>
                    </div>
                    
                    <p style="color: #6B6B6B; font-size: 0.9rem; margin-top: 2rem; font-weight: 400;">
                        <strong>Order ID:</strong> ${orderId}<br>
                        <strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}<br>
                        <strong>Status:</strong> Processing
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E1EFD9; margin: 2rem 0;">
                    
                    <p style="color: #6B6B6B; font-size: 0.9rem; text-align: center; font-weight: 400;">
                        If you have any questions, please contact us at 
                        <a href="mailto:hello@pawsitivepeace.co.uk" style="color: #7FB069; text-decoration: none; font-weight: 500;">hello@pawsitivepeace.co.uk</a>
                    </p>
                </div>
            </div>
        `
    };

    try {
        console.log('📤 Attempting to send email via transporter...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', result.messageId);
        console.log('   Response:', result.response);
        console.log(`📧 E-book delivery email sent to ${customerEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending e-book email:');
        console.error('   Error type:', error.constructor.name);
        console.error('   Error message:', error.message);
        console.error('   Error code:', error.code);
        console.error('   Error response:', error.response);
        console.error('   Full error:', error);
        return false;
    }
}

// CSRF token endpoint
app.get('/csrf-token', csrfLimiter, (req, res) => {
    const token = generateCSRFToken();
    res.json({ token });
});

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    try {
        console.log('Creating checkout session...');
        console.log('Request body:', req.body);

        // Validate CSRF token
        const csrfToken = req.headers['x-csrf-token'];
        if (!csrfToken || !validateCSRFToken(csrfToken)) {
            console.error('Invalid or missing CSRF token');
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }

        const { items, customerEmail, customerName, total } = req.body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.error('Invalid items:', items);
            return res.status(400).json({ error: 'Invalid items data' });
        }

        if (!customerEmail || !customerName) {
            console.error('Missing customer info:', { customerEmail, customerName });
            return res.status(400).json({ error: 'Missing customer information' });
        }

        // Check if Stripe is properly configured
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('Stripe secret key not found in environment');
            return res.status(500).json({ error: 'Stripe configuration error' });
        }

        console.log('Stripe key found:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => ({
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: item.name,
                        description: 'The Pupsicle - Dog Toy',
                        images: [item.image],
                    },
                    unit_amount: Math.round(item.price * 100), // Convert to pence
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
            customer_email: customerEmail,
            metadata: {
                customerName: customerName,
                customerEmail: customerEmail,
            },
        });

        console.log('Checkout session created successfully:', session.id);
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        console.error('Error details:', {
            message: error.message,
            type: error.type,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to create checkout session',
            details: error.message 
        });
    }
});

// Stripe webhook endpoint
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('🔄 Processing checkout.session.completed webhook...');

        // Extract customer information
        const customerEmail = session.customer_details.email;
        const customerName = session.customer_details.name;
        const orderId = session.id;

        console.log('📧 Customer details:', { customerEmail, customerName, orderId });

        // Send order confirmation email
        console.log('📤 Attempting to send order confirmation email...');
        const emailSent = await sendOrderConfirmationEmail(customerEmail, customerName, orderId);

        if (emailSent) {
            console.log(`✅ Order ${orderId} completed successfully. Confirmation email sent to ${customerEmail}`);
        } else {
            console.error(`❌ Failed to send confirmation email for order ${orderId}`);
        }
    }

    res.json({ received: true });
});

// Success page route
app.get('/success', (req, res) => {
    const sessionId = req.query.session_id;
    console.log(`Payment successful! Session ID: ${sessionId}`);

    // Serve the success page
    res.sendFile(path.join(__dirname, '../frontend/pages/success.html'));
});

// Cancel page route
app.get('/cancel', (req, res) => {
    console.log('Payment cancelled by user');

    // Serve the cancel page
    res.sendFile(path.join(__dirname, '../frontend/pages/cancel.html'));
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Pawsitive Peace Product Delivery',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        uptime: process.uptime(),
        email: {
            configured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS,
            user: process.env.EMAIL_USER ? 'Set' : 'Missing',
            pass: process.env.EMAIL_PASS ? 'Set' : 'Missing'
        }
    });
});

// Public configuration endpoint for frontend
// SECURITY: Only serves public, non-sensitive configuration
// Never exposes secret keys client-side
app.get('/api/config', (req, res) => {
    // Only return public, non-sensitive configuration
    const config = {
        stripe: {
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        },
        emailjs: {
            publicKey: process.env.EMAILJS_PUBLIC_KEY
        },
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    };

    // Validate that required config is present in production
    if (process.env.NODE_ENV === 'production') {
        if (!config.stripe.publishableKey) {
            console.error('❌ STRIPE_PUBLISHABLE_KEY not configured');
            return res.status(500).json({
                error: 'Configuration incomplete',
                message: 'Stripe publishable key not configured'
            });
        }

        if (!config.emailjs.publicKey) {
            console.error('❌ EMAILJS_PUBLIC_KEY not configured');
            return res.status(500).json({
                error: 'Configuration incomplete',
                message: 'EmailJS public key not configured'
            });
        }
    } else {
        // In development, warn about missing config but don't fail
        if (!config.stripe.publishableKey) {
            console.warn('⚠️ STRIPE_PUBLISHABLE_KEY not configured (development mode)');
            // Provide a placeholder to prevent frontend errors
            config.stripe.publishableKey = 'pk_test_placeholder_for_development';
        }
        if (!config.emailjs.publicKey) {
            console.warn('⚠️ EMAILJS_PUBLIC_KEY not configured (development mode)');
            // Provide a placeholder to prevent frontend errors
            config.emailjs.publicKey = 'placeholder_for_development';
        }
    }

    console.log('✅ Public configuration served successfully');
    res.json(config);
});

// Test email endpoint (disabled in production by default)
app.get('/test-email', async (req, res) => {
    // Production security check
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
        console.log('🚫 Test email endpoint disabled in production');
        return res.status(404).json({ 
            error: 'Endpoint not found',
            message: 'Test endpoints are disabled in production'
        });
    }

    try {
        const testEmail = process.env.EMAIL_USER;
        if (!testEmail) {
            return res.status(400).json({ error: 'Email not configured' });
        }

        console.log('🧪 Testing email configuration...');
        console.log('   Email user:', process.env.EMAIL_USER);
        console.log('   Email pass length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'Not set');

        // First, verify the transporter
        console.log('🔍 Verifying transporter configuration...');
        const verifyResult = await new Promise((resolve, reject) => {
            transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Transporter verification failed:', error);
                    reject(error);
                } else {
                    console.log('✅ Transporter verification successful');
                    resolve(success);
                }
            });
        });

        console.log('📧 Transporter verified, sending test email...');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: testEmail,
            subject: '🧪 Pawsitive Peace Email Test - Simple',
            text: `Email Test Successful!\n\nIf you received this email, your Gmail configuration is working correctly.\n\nTime: ${new Date().toISOString()}\n\nThis is a simple text email to test basic functionality.`,
            html: `
                <h2>Email Test Successful!</h2>
                <p>If you received this email, your Gmail configuration is working correctly.</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                <p>This is a simple HTML email to test basic functionality.</p>
            `
        };

        console.log('📤 Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Test email sent successfully');
        console.log('   Message ID:', result.messageId);
        console.log('   Response:', result.response);

        res.json({ 
            success: true, 
            message: 'Test email sent successfully',
            to: testEmail,
            messageId: result.messageId,
            response: result.response
        });

    } catch (error) {
        console.error('❌ Test email failed:', error);
        res.status(500).json({ 
            error: 'Test email failed', 
            details: error.message,
            code: error.code
        });
    }
});

// Test webhook simulation endpoint (disabled in production by default)
app.get('/test-webhook', async (req, res) => {
    // Production security check
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
        console.log('🚫 Test webhook endpoint disabled in production');
        return res.status(404).json({ 
            error: 'Endpoint not found',
            message: 'Test endpoints are disabled in production'
        });
    }

    try {
        console.log('🧪 Testing webhook simulation...');

        // Simulate a successful checkout session
        const mockSession = {
            customer_details: {
                email: process.env.EMAIL_USER,
                name: 'Test User'
            },
            id: 'cs_test_' + Date.now()
        };

        console.log('📧 Customer details:', { 
            customerEmail: mockSession.customer_details.email, 
            customerName: mockSession.customer_details.name, 
            orderId: mockSession.id 
        });

        // Send order confirmation email
        console.log('📤 Attempting to send order confirmation email...');
        const emailSent = await sendOrderConfirmationEmail(
            mockSession.customer_details.email, 
            mockSession.customer_details.name, 
            mockSession.id
        );

        if (emailSent) {
            console.log(`✅ Test webhook processed successfully. Confirmation email sent to ${mockSession.customer_details.email}`);
            res.json({ 
                success: true, 
                message: 'Test webhook processed successfully',
                orderId: mockSession.id,
                emailSent: true
            });
        } else {
            console.error(`❌ Failed to send confirmation email for test order ${mockSession.id}`);
            res.status(500).json({ 
                error: 'Failed to send confirmation email',
                orderId: mockSession.id
            });
        }

    } catch (error) {
        console.error('❌ Test webhook failed:', error);
        res.status(500).json({ 
            error: 'Test webhook failed', 
            details: error.message
        });
    }
});


// Root endpoint - serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/admin.html'));
});

// Send tracking email function
async function sendTrackingEmail(customerEmail, customerName, orderId, trackingNumber, carrier, estimatedDelivery) {
    console.log('📦 Preparing tracking email...');
    console.log('   To:', customerEmail);
    console.log('   Order:', orderId);
    console.log('   Tracking:', trackingNumber);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: 'Your Pawsitive Peace Order is On The Way! 🚚',
        html: `
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F0;">
                <div style="background: linear-gradient(135deg, #7FB069 0%, #6B9A4F 100%); color: #FAF7F0; padding: 2rem; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="margin: 0; font-size: 2rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 700;"><i class="fas fa-truck" style="margin-right: 10px;"></i>Your Order is On The Way!</h1>
                    <p style="margin: 1rem 0 0 0; font-size: 1.1rem; font-weight: 500;">Track your Pupsicle delivery</p>
                </div>
                
                <div style="padding: 2rem; background: #FAF7F0; border-radius: 0 0 16px 16px;">
                    <h2 style="color: #4A4A4A; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;">Hello ${customerName}!</h2>
                    
                    <p style="color: #4A4A4A; line-height: 1.6; margin-bottom: 1.5rem; font-weight: 400;">
                        Great news! Your <strong>The Pupsicle</strong> has been shipped and is on its way to you.
                    </p>
                    
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E1EFD9; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(127, 176, 105, 0.1);">
                        <h3 style="color: #4A4A4A; margin-top: 0; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-shipping-fast" style="margin-right: 8px; color: #7FB069;"></i>Shipping Details</h3>
                        <div style="color: #4A4A4A; font-size: 0.9rem; line-height: 1.6; font-weight: 400;">
                            <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-barcode" style="margin-right: 6px; color: #7FB069;"></i>Tracking Number:</strong> ${trackingNumber}</p>
                            <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-truck" style="margin-right: 6px; color: #7FB069;"></i>Carrier:</strong> ${carrier}</p>
                            <p style="margin: 0;"><strong><i class="fas fa-calendar" style="margin-right: 6px; color: #7FB069;"></i>Estimated Delivery:</strong> ${estimatedDelivery}</p>
                        </div>
                    </div>
                    
                    <div style="background: #F0F7ED; border: 1px solid #7FB069; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0;">
                        <h3 style="color: #4A4A4A; margin-top: 0; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-info-circle" style="margin-right: 8px; color: #7FB069;"></i>What's Next?</h3>
                        <div style="color: #4A4A4A; font-size: 0.9rem; line-height: 1.6; font-weight: 400;">
                            <p style="margin: 0 0 0.8rem 0;">• Use the tracking number above to monitor your package</p>
                            <p style="margin: 0 0 0.8rem 0;">• You'll receive delivery notifications from ${carrier}</p>
                            <p style="margin: 0;">• Your Pupsicle will arrive ready for your dog to enjoy!</p>
                        </div>
                    </div>
                    
                    <p style="color: #6B6B6B; font-size: 0.9rem; margin-top: 2rem; font-weight: 400;">
                        <strong>Order ID:</strong> ${orderId}<br>
                        <strong>Shipped Date:</strong> ${new Date().toLocaleDateString()}<br>
                        <strong>Status:</strong> Shipped
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E1EFD9; margin: 2rem 0;">
                    
                    <p style="color: #6B6B6B; font-size: 0.9rem; text-align: center; font-weight: 400;">
                        Questions about your order? Contact us at 
                        <a href="mailto:hello@pawsitivepeace.co.uk" style="color: #7FB069; text-decoration: none; font-weight: 500;">hello@pawsitivepeace.co.uk</a>
                    </p>
                </div>
            </div>
        `
    };

    try {
        console.log('📤 Attempting to send tracking email...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Tracking email sent successfully!');
        console.log('   Message ID:', result.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending tracking email:');
        console.error('   Error type:', error.constructor.name);
        console.error('   Error message:', error.message);
        return false;
    }
}

// Admin endpoint for sending tracking emails
app.post('/admin/send-tracking-email', async (req, res) => {
    try {
        const { orderId, trackingNumber, carrier, estimatedDelivery, customerEmail, customerName } = req.body;

        // Validate required fields
        if (!orderId || !trackingNumber || !carrier) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['orderId', 'trackingNumber', 'carrier']
            });
        }

        // If customer details not provided, try to get from Stripe (optional)
        let finalCustomerEmail = customerEmail;
        let finalCustomerName = customerName;

        if (!finalCustomerEmail || !finalCustomerName) {
            try {
                const session = await stripe.checkout.sessions.retrieve(orderId);
                finalCustomerEmail = session.customer_details.email;
                finalCustomerName = session.customer_details.name;
                console.log('📧 Retrieved customer details from Stripe');
            } catch (stripeError) {
                console.warn('⚠️ Could not retrieve customer details from Stripe:', stripeError.message);
                if (!finalCustomerEmail || !finalCustomerName) {
                    return res.status(400).json({ 
                        error: 'Customer details required when Stripe lookup fails',
                        required: ['customerEmail', 'customerName']
                    });
                }
            }
        }

        // Set default estimated delivery if not provided
        const finalEstimatedDelivery = estimatedDelivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString();

        console.log('📦 Admin sending tracking email...');
        console.log('   Order ID:', orderId);
        console.log('   Tracking:', trackingNumber);
        console.log('   Carrier:', carrier);
        console.log('   Customer:', finalCustomerEmail);

        const emailSent = await sendTrackingEmail(
            finalCustomerEmail, 
            finalCustomerName, 
            orderId, 
            trackingNumber, 
            carrier, 
            finalEstimatedDelivery
        );

        if (emailSent) {
    res.json({
                success: true, 
                message: 'Tracking email sent successfully',
                orderId: orderId,
                trackingNumber: trackingNumber,
                customerEmail: finalCustomerEmail
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to send tracking email',
                orderId: orderId
            });
        }

    } catch (error) {
        console.error('❌ Admin tracking email error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Preview tracking email template
app.get('/preview-tracking-email', (req, res) => {
    const customerName = 'John Doe';
    const orderId = 'cs_test_abc123456789';
    const trackingNumber = 'RM123456789GB';
    const carrier = 'Royal Mail';
    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    const emailHTML = `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F0;">
            <div style="background: linear-gradient(135deg, #7FB069 0%, #6B9A4F 100%); color: #FAF7F0; padding: 2rem; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="margin: 0; font-size: 2rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 700;"><i class="fas fa-truck" style="margin-right: 10px;"></i>Your Order is On The Way!</h1>
                <p style="margin: 1rem 0 0 0; font-size: 1.1rem; font-weight: 500;">Track your Pupsicle delivery</p>
            </div>
            
            <div style="padding: 2rem; background: #FAF7F0; border-radius: 0 0 16px 16px;">
                <h2 style="color: #4A4A4A; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;">Hello ${customerName}!</h2>
                
                <p style="color: #4A4A4A; line-height: 1.6; margin-bottom: 1.5rem; font-weight: 400;">
                    Great news! Your <strong>The Pupsicle</strong> has been shipped and is on its way to you.
                </p>
                
                <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E1EFD9; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(127, 176, 105, 0.1);">
                    <h3 style="color: #4A4A4A; margin-top: 0; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-shipping-fast" style="margin-right: 8px; color: #7FB069;"></i>Shipping Details</h3>
                    <div style="color: #4A4A4A; font-size: 0.9rem; line-height: 1.6; font-weight: 400;">
                        <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-barcode" style="margin-right: 6px; color: #7FB069;"></i>Tracking Number:</strong> ${trackingNumber}</p>
                        <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-truck" style="margin-right: 6px; color: #7FB069;"></i>Carrier:</strong> ${carrier}</p>
                        <p style="margin: 0;"><strong><i class="fas fa-calendar" style="margin-right: 6px; color: #7FB069;"></i>Estimated Delivery:</strong> ${estimatedDelivery}</p>
                    </div>
                </div>
                
                <div style="background: #F0F7ED; border: 1px solid #7FB069; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0;">
                    <h3 style="color: #4A4A4A; margin-top: 0; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-info-circle" style="margin-right: 8px; color: #7FB069;"></i>What's Next?</h3>
                    <div style="color: #4A4A4A; font-size: 0.9rem; line-height: 1.6; font-weight: 400;">
                        <p style="margin: 0 0 0.8rem 0;">• Use the tracking number above to monitor your package</p>
                        <p style="margin: 0 0 0.8rem 0;">• You'll receive delivery notifications from ${carrier}</p>
                        <p style="margin: 0;">• Your Pupsicle will arrive ready for your dog to enjoy!</p>
                    </div>
                </div>
                
                <p style="color: #6B6B6B; font-size: 0.9rem; margin-top: 2rem; font-weight: 400;">
                    <strong>Order ID:</strong> ${orderId}<br>
                    <strong>Shipped Date:</strong> ${new Date().toLocaleDateString()}<br>
                    <strong>Status:</strong> Shipped
                </p>
                
                <hr style="border: none; border-top: 1px solid #E1EFD9; margin: 2rem 0;">
                
                <p style="color: #6B6B6B; font-size: 0.9rem; text-align: center; font-weight: 400;">
                    Questions about your order? Contact us at 
                    <a href="mailto:hello@pawsitivepeace.co.uk" style="color: #7FB069; text-decoration: none; font-weight: 500;">hello@pawsitivepeace.co.uk</a>
                </p>
            </div>
        </div>
    `;
    
    res.send(emailHTML);
});

// Email template preview endpoint
app.get('/preview-email', (req, res) => {
    const customerName = 'John Doe';
    const orderId = 'PP-' + Date.now();
    
    const emailHTML = `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F0;">
            <div style="background: linear-gradient(135deg, #7FB069 0%, #6B9A4F 100%); color: #FAF7F0; padding: 2rem; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="margin: 0; font-size: 2rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 700;"><i class="fas fa-check-circle" style="margin-right: 10px;"></i>Thank You for Your Purchase!</h1>
                <p style="margin: 1rem 0 0 0; font-size: 1.1rem; font-weight: 500;">Your order is being processed and will be shipped soon</p>
            </div>
            
            <div style="padding: 2rem; background: #FAF7F0; border-radius: 0 0 16px 16px;">
                <h2 style="color: #4A4A4A; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;">Hello ${customerName}!</h2>
                
                <p style="color: #4A4A4A; line-height: 1.6; margin-bottom: 1.5rem; font-weight: 400;">
                    Thank you for purchasing <strong>The Pupsicle</strong> from Pawsitive Peace! 
                    Your order is being processed and will be shipped to you soon.
                </p>
                
                <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E1EFD9; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(127, 176, 105, 0.1);">
                    <h3 style="color: #4A4A4A; margin-top: 0; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-paw" style="margin-right: 8px; color: #7FB069;"></i>What You'll Get:</h3>
                    <ul style="color: #4A4A4A; line-height: 1.6; font-weight: 400;">
                        <li>High-Quality Dog Toy - The Pupsicle</li>
                        <li>Dishwasher Safe Design</li>
                        <li>Non-Toxic Materials</li>
                        <li>Freezer Safe for Extended Play</li>
                        <li>Durable Construction</li>
                    </ul>
                </div>
                
                <div style="background: #F0F7ED; border: 1px solid #7FB069; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0;">
                    <h3 style="color: #4A4A4A; margin-top: 0; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-box" style="margin-right: 8px; color: #7FB069;"></i>Shipping & Delivery Information</h3>
                    <div style="color: #4A4A4A; font-size: 0.9rem; line-height: 1.6; font-weight: 400;">
                        <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-clock" style="margin-right: 6px; color: #7FB069;"></i>Processing Time:</strong> 1-2 business days</p>
                        <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-truck" style="margin-right: 6px; color: #7FB069;"></i>Shipping Method:</strong> Tracked delivery via Royal Mail</p>
                        <p style="margin: 0 0 0.8rem 0;"><strong><i class="fas fa-envelope" style="margin-right: 6px; color: #7FB069;"></i>Tracking Updates:</strong> We'll email you when your order ships with tracking details</p>
                        <p style="margin: 0;"><strong><i class="fas fa-calendar" style="margin-right: 6px; color: #7FB069;"></i>Expected Delivery:</strong> 3-5 business days after shipping</p>
                    </div>
                </div>
                
                <div style="background: white; border: 1px solid #E1EFD9; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(127, 176, 105, 0.1);">
                    <h3 style="color: #4A4A4A; margin-top: 0; margin-bottom: 1rem; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;"><i class="fas fa-list" style="margin-right: 8px; color: #7FB069;"></i>What Happens Next?</h3>
                    <div style="color: #4A4A4A; font-size: 0.9rem; line-height: 1.6; font-weight: 400;">
                        <p style="margin: 0 0 0.8rem 0;">1. <strong>Order Processing:</strong> We'll prepare your Pupsicle for shipping</p>
                        <p style="margin: 0 0 0.8rem 0;">2. <strong>Shipping Notification:</strong> You'll receive an email with tracking details</p>
                        <p style="margin: 0 0 0.8rem 0;">3. <strong>Delivery:</strong> Your order will arrive at your doorstep</p>
                        <p style="margin: 0;">4. <strong>Enjoy:</strong> Watch your dog love their new Pupsicle!</p>
                    </div>
                </div>
                
                <p style="color: #6B6B6B; font-size: 0.9rem; margin-top: 2rem; font-weight: 400;">
                    <strong>Order ID:</strong> ${orderId}<br>
                    <strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}<br>
                    <strong>Status:</strong> Processing
                </p>
                
                <hr style="border: none; border-top: 1px solid #E1EFD9; margin: 2rem 0;">
                
                <p style="color: #6B6B6B; font-size: 0.9rem; text-align: center; font-weight: 400;">
                    If you have any questions, please contact us at 
                    <a href="mailto:hello@pawsitivepeace.co.uk" style="color: #7FB069; text-decoration: none; font-weight: 500;">hello@pawsitivepeace.co.uk</a>
                </p>
            </div>
        </div>
    `;
    
    res.send(emailHTML);
});

// Clean URL routes for main pages
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/contact.html'));
});

// Legal pages routes
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/privacy-policy.html'));
});

app.get('/terms-of-service', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/terms-of-service.html'));
});

app.get('/refund-policy', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/refund-policy.html'));
});

// 301 redirects from legacy .html paths to clean URLs
const legacyRedirects = {
    '/index.html': '/',
    '/contact.html': '/contact'
};

app.get(Object.keys(legacyRedirects), (req, res) => {
    const target = legacyRedirects[req.path];
    if (target) {
        return res.redirect(301, target);
    }
    res.status(404).end();
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        message: 'Pawsitive Peace API is running',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            checkout: '/create-checkout-session',
            success: '/success',
            cancel: '/cancel',
            webhook: '/webhook/stripe'
        }
    });
});



// Start server only if not in test mode
let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, '0.0.0.0', () => {
        if (process.env.NODE_ENV === 'production') {
            console.log(`🚀 Pawsitive Peace production server running on port ${PORT}`);
            console.log(`📦 Product fulfillment system ready`);
            console.log(`💳 Stripe webhooks enabled`);
            console.log(`📧 Email delivery configured`);
            console.log(`🔒 Production security enabled`);
            console.log(`🌐 Base URL: ${process.env.BASE_URL}`);
        } else {
            console.log(`🚀 Pawsitive Peace server running on port ${PORT}`);
            console.log(`📦 Product fulfillment system ready`);
            console.log(`💳 Stripe webhooks enabled`);
            console.log(`📧 Email delivery configured`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Server URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);

            // Verify environment variables
            console.log(`🔑 Stripe Key: ${process.env.STRIPE_SECRET_KEY ? '✅ Loaded' : '❌ Missing'}`);
            console.log(`🌐 Base URL: ${process.env.BASE_URL || 'Not set'}`);
            console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Missing'}`);
        }
    });
}

// Graceful shutdown function
function gracefulShutdown(signal) {
    console.log(`\n🔄 ${signal} received, starting graceful shutdown...`);

    // Only close server if it exists (not in test mode)
    if (server) {
        server.close((err) => {
            if (err) {
                console.error('❌ Error during server shutdown:', err);
                process.exit(1);
            }

            console.log('✅ Server closed successfully');

            // Close other resources
            try {
                // Clear cleanup interval
                if (cleanupInterval) {
                    clearInterval(cleanupInterval);
                    console.log('✅ Cleanup interval cleared');
                }

                // Close email transporter
                if (transporter) {
                    transporter.close();
                    console.log('✅ Email transporter closed');
                }

                // Close Stripe connections (if any)
                // Note: Stripe client doesn't have explicit close method, but we can clean up any pending requests

                // Flush Sentry events if available
                if (Sentry) {
                    Sentry.flush(2000)
                        .then(() => {
                            console.log('✅ Sentry events flushed');
                            console.log('✅ Graceful shutdown completed');
                            process.exit(0);
                        })
                        .catch((flushError) => {
                            console.error('❌ Failed to flush Sentry events:', flushError);
                            console.log('✅ Graceful shutdown completed (Sentry flush failed)');
                            process.exit(0);
                        });
                } else {
                    console.log('✅ Graceful shutdown completed');
                    process.exit(0);
                }
            } catch (error) {
                console.error('❌ Error during resource cleanup:', error);
                process.exit(1);
            }
        });
    }

    // Force exit after timeout if shutdown hangs
    setTimeout(() => {
        console.error('⏰ Shutdown timeout reached, forcing exit');
        process.exit(1);
    }, 10000); // 10 second timeout
}
if (process.env.NODE_ENV === 'production') {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        // Send alert to monitoring service
        if (Sentry) {
            Sentry.captureException(error);
            // Flush Sentry events before exiting
            Sentry.flush(2000)
                .then(() => {
                    console.log('Sentry events flushed successfully');
                    process.exit(1);
                })
                .catch((flushError) => {
                    console.error('Failed to flush Sentry events:', flushError);
                    process.exit(1);
                });
        } else {
            // Allow time for logs to flush if Sentry not available
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Send alert to monitoring service
        if (Sentry) {
            Sentry.captureException(reason);
            // Flush Sentry events before exiting
            Sentry.flush(2000)
                .then(() => {
                    console.log('Sentry events flushed successfully');
                    process.exit(1);
                })
                .catch((flushError) => {
                    console.error('Failed to flush Sentry events:', flushError);
                    process.exit(1);
                });
        } else {
            process.exit(1);
        }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
} else {
    // Handle graceful shutdown in non-production environments
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
