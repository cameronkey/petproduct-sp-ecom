const request = require('supertest');
const app = require('../server');

describe('RecipeRush Server', () => {
  describe('Health Check Endpoint', () => {
    test('GET /health should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'RecipeRush E-Book Delivery');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('port');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('email');
    });
  });

  describe('Root Endpoint', () => {
    test('GET / should return 200 and API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'RecipeRush API is running');
      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('checkout');
      expect(response.body.endpoints).toHaveProperty('success');
      expect(response.body.endpoints).toHaveProperty('cancel');
      expect(response.body.endpoints).toHaveProperty('webhook');
      expect(response.body.endpoints).toHaveProperty('download');
    });
  });

  describe('Public Configuration Endpoint', () => {
    test('GET /api/config should return 500 when Stripe key is not configured', async () => {
      const response = await request(app)
        .get('/api/config')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Configuration incomplete');
      expect(response.body).toHaveProperty('message', 'Stripe publishable key not configured');
    });

    test('GET /api/config should return 500 when EmailJS key is not configured', async () => {
      // Mock Stripe key to test EmailJS validation
      const originalStripeKey = process.env.STRIPE_PUBLISHABLE_KEY;
      process.env.STRIPE_PUBLISHABLE_KEY = 'test_stripe_key';

      const response = await request(app)
        .get('/api/config')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Configuration incomplete');
      expect(response.body).toHaveProperty('message', 'EmailJS public key not configured');

      // Restore original environment
      if (originalStripeKey) {
        process.env.STRIPE_PUBLISHABLE_KEY = originalStripeKey;
      } else {
        delete process.env.STRIPE_PUBLISHABLE_KEY;
      }
    });
  });
});
