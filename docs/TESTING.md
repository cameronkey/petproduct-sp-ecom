# Testing and Development Guide

This document explains how to use the testing, linting, and formatting tools set up for the RecipeRush project.

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## Available Scripts

### Testing
- `npm test` - Run all tests with coverage
- `npm run test:watch` - Run tests in watch mode (great for development)
- `npm run test:coverage` - Run tests and generate coverage report
- `npm run test:ci` - Run tests optimized for CI environments

### Code Quality
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Automatically fix linting issues where possible
- `npm run format` - Format code using Prettier
- `npm run format:check` - Check if code is properly formatted

### Pre-commit Hooks
- `npm run pretest` - Runs before tests (currently runs linting)
- `npm run precommit` - Runs before commits (linting + tests)

## Test Structure

```
tests/
├── setup.js           # Global test setup and utilities
├── server.test.js     # Basic server functionality tests
└── integration.test.js # Integration tests for endpoints
```

## Writing Tests

### Test Utilities

The test setup provides several utility functions:

```javascript
// Create mock request objects
const mockReq = global.testUtils.createMockRequest({
  body: { data: 'test' },
  params: { id: '123' }
});

// Create mock response objects
const mockRes = global.testUtils.createMockResponse();

// Create mock next function
const mockNext = global.testUtils.createMockNext();
```

### Example Test

```javascript
describe('User Endpoint', () => {
  test('should create user successfully', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(userData.name);
  });
});
```

## Linting Rules

The ESLint configuration includes:

- **Node.js best practices** - Uses `eslint-plugin-node`
- **Security rules** - Prevents dangerous code patterns
- **Code quality** - Enforces consistent coding standards
- **Test-specific rules** - Relaxed rules for test files

## Code Formatting

Prettier is configured with sensible defaults:

- Single quotes for strings
- 2-space indentation
- 80 character line width
- Trailing commas where appropriate
- Consistent semicolon usage

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Runs tests** on multiple Node.js versions (18.x, 20.x)
2. **Checks code quality** with linting and formatting
3. **Generates coverage reports** and uploads to Codecov
4. **Performs security audits** to check for vulnerabilities

## Environment Configuration

Create a `env.test` file for test-specific environment variables:

```bash
NODE_ENV=test
PORT=3001
STRIPE_SECRET_KEY=sk_test_...
EMAIL_USER=test@example.com
```

## Coverage Requirements

Tests must maintain at least 70% coverage for:
- Branches
- Functions  
- Lines
- Statements

## Troubleshooting

### Common Issues

1. **Tests failing due to environment variables**
   - Ensure `env.test` file exists and has required variables
   - Check that `NODE_ENV=test` is set

2. **Linting errors**
   - Run `npm run lint:fix` to auto-fix issues
   - Check `.eslintrc.js` for rule configurations

3. **Formatting issues**
   - Run `npm run format` to auto-format code
   - Check `.prettierrc` for formatting rules

### Getting Help

- Check the test output for detailed error messages
- Review the ESLint and Jest configuration files
- Ensure all dependencies are properly installed
