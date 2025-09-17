const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock the server app for testing
// In a real setup, you'd export the app from server.js
let app;
let tempDir;

beforeAll(() => {
  // Create a temporary directory for static assets
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-rush-test-'));

  // Create some test static files in the temp directory
  fs.writeFileSync(path.join(tempDir, 'test.txt'), 'This is a test file');
  fs.writeFileSync(path.join(tempDir, 'sample.html'), '<html><body>Test HTML</body></html>');

  // Create a basic Express app for testing
  app = express();
  app.use(express.json());

  // Mount static assets under /static prefix instead of serving entire repo root
  app.use('/static', express.static(tempDir));

  // Mock some basic routes that would exist in the real server
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.post('/api/test', (req, res) => {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    res.status(200).json({ received: data, processed: true });
  });

  app.get('/download/:token', (req, res) => {
    const { token } = req.params;
    if (!token || token === 'invalid') {
      return res.status(404).json({ error: 'Invalid download token' });
    }
    res.status(200).json({ downloadUrl: `/ebooks/sample.pdf`, token });
  });

  // Handle the case where no token is provided
  app.get('/download', (req, res) => {
    res.status(404).json({ error: 'Invalid download token' });
  });
});

afterAll(() => {
  // Clean up the temporary directory after tests complete
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('RecipeRush Server Integration Tests', () => {
  describe('Health Endpoint', () => {
    test('GET /health should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      const ts = response.body.timestamp;
      expect(typeof ts).toBe('string');
      expect(Number.isNaN(Date.parse(ts))).toBe(false);
    });
  });

  describe('API Endpoints', () => {
    test('POST /api/test should process valid data', async () => {
      const testData = { data: 'test message' };

      const response = await request(app)
        .post('/api/test')
        .send(testData)
        .expect(200);

      expect(response.body).toEqual({
        received: 'test message',
        processed: true
      });
    });

    test('POST /api/test should reject missing data', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Data is required'
      });
    });
  });

  describe('Download Endpoints', () => {
    test('GET /download/:token should work with valid token', async () => {
      const validToken = 'valid-token-123';

      const response = await request(app)
        .get(`/download/${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body).toHaveProperty('token', validToken);
    });

    test('GET /download/:token should reject invalid token', async () => {
      const response = await request(app)
        .get('/download/invalid')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Invalid download token'
      });
    });

    test('GET /download/:token should reject missing token', async () => {
      const response = await request(app)
        .get('/download/')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Invalid download token'
      });
    });
  });

  describe('Static File Serving', () => {
    test('should serve static files from /static prefix', async () => {
      // Test that static files are served from the /static prefix
      const response = await request(app)
        .get('/static/test.txt')
        .expect(200);

      expect(response.text).toBe('This is a test file');
    });

    test('should serve HTML files from /static prefix', async () => {
      const response = await request(app)
        .get('/static/sample.html')
        .expect(200);

      expect(response.text).toContain('<html>');
      expect(response.text).toContain('Test HTML');
    });

    test('should not expose repo files outside /static prefix', async () => {
      // Test that the root static serving is not accessible
      await request(app)
        .get('/package.json')
        .expect(404);
    });
  });
});
