# Test Endpoints Security Implementation

## Overview
This document describes the security measures implemented to protect test endpoints in production environments.

## Changes Made

### 1. Environment-Based Access Control
All test endpoints now check the environment before allowing access:
- **Production Mode**: Test endpoints return 404 "Endpoint not found" by default
- **Development Mode**: Test endpoints function normally
- **Override**: Set `ENABLE_TEST_ENDPOINTS=true` to enable test endpoints in production

### 2. Protected Endpoints
The following test endpoints are now secured:

#### `/test-email`
- **Purpose**: Tests email configuration and sends test emails
- **Security**: Disabled in production unless explicitly enabled
- **Response**: 404 JSON response when disabled

#### `/test-webhook`
- **Purpose**: Simulates Stripe webhook for testing e-book delivery
- **Security**: Disabled in production unless explicitly enabled
- **Response**: 404 JSON response when disabled

#### `/test-download/:token`
- **Purpose**: Debugs download token functionality
- **Security**: Disabled in production unless explicitly enabled
- **Response**: 404 JSON response when disabled

### 3. Environment Variables

#### Required
- `NODE_ENV`: Set to `'production'` to enable production mode

#### Optional
- `ENABLE_TEST_ENDPOINTS`: Set to a specific truthy value to enable test endpoints in production
  - **Accepted values**: `'true'`, `'1'`, `'yes'`, `'on'`, `'enabled'` (case-insensitive)
  - **Note**: The parser converts the value to lowercase and only accepts these exact whitelist values

### 4. Implementation Details

#### Security Check Pattern
```javascript
// Production security check
const enableTestEndpoints = ['true', '1', 'yes', 'on', 'enabled'].includes(
  String(process.env.ENABLE_TEST_ENDPOINTS || '').toLowerCase()
);
if (process.env.NODE_ENV === 'production' && !enableTestEndpoints) {
    console.log('🚫 Test endpoint disabled in production');
    return res
      .set('Cache-Control', 'no-store, no-cache, must-revalidate')
      .status(404)
      .json({ error: 'Not found' }); // keep body generic to avoid disclosing endpoint existence
}
```

#### Logging
- Disabled endpoints log: `🚫 Test [endpoint] endpoint disabled in production`
- Maintains existing logging for enabled endpoints

#### Environment Variable Parsing Semantics
The `ENABLE_TEST_ENDPOINTS` environment variable is parsed using a case-insensitive comparison against a predefined list of truthy values. This provides flexibility while maintaining security by requiring explicit configuration.

**Truthy values that enable test endpoints:**
- `'true'`, `'1'`, `'yes'`, `'on'`, `'enabled'`
- Only these exact values are accepted (case-insensitive)

**Falsy values that disable test endpoints:**
- `undefined` (variable not set)
- `''` (empty string)
- `'false'`, `'0'`, `'no'`, `'off'`, `'disabled'`
- Any other value not in the accepted truthy list

### 5. Configuration Examples

#### Production (Test Endpoints Disabled)
```bash
NODE_ENV=production
# Do not set ENABLE_TEST_ENDPOINTS (omit entirely) to keep test endpoints disabled
```

#### Production (Test Endpoints Enabled - Use with Caution)
```bash
NODE_ENV=production
ENABLE_TEST_ENDPOINTS=true
# Alternative acceptable values:
# ENABLE_TEST_ENDPOINTS=1
# ENABLE_TEST_ENDPOINTS=yes
# ENABLE_TEST_ENDPOINTS=on
# ENABLE_TEST_ENDPOINTS=enabled
```

#### Development
```bash
NODE_ENV=development
# ENABLE_TEST_ENDPOINTS not required
```

### 6. Security Benefits

1. **Default Deny**: Test endpoints are disabled by default in production
2. **Explicit Override**: Requires deliberate action to enable test endpoints
3. **Environment Isolation**: Development and production environments are properly separated
4. **Audit Trail**: All access attempts are logged
5. **Consistent Response**: Disabled endpoints return consistent 404 responses

### 7. Deployment Considerations

#### Render.com
- Set `NODE_ENV=production` in environment variables
- Set `ENABLE_TEST_ENDPOINTS=false` (or omit) for production security
- Only set `ENABLE_TEST_ENDPOINTS=true` temporarily for debugging
- **Note**: The parser accepts various truthy values like `'1'`, `'yes'`, `'on'`, `'enabled'` in addition to `'true'`

#### Local Development
- Test endpoints work normally in development mode
- No additional configuration required

### 8. Monitoring and Logging

#### Production Logs
- Disabled endpoint access attempts are logged
- Enabled endpoint usage is logged normally
- Security events are clearly marked with 🚫 emoji

#### Development Logs
- All test endpoint activity is logged normally
- No security restrictions applied

## Best Practices

1. **Never enable test endpoints in production** unless absolutely necessary
2. **Use temporary access** for debugging, then disable immediately
3. **Monitor logs** for any unauthorized access attempts
4. **Regular security reviews** of environment variable configurations
5. **Document any temporary access** granted for debugging purposes

## Rollback

To disable test endpoints after temporary access:
1. Set `ENABLE_TEST_ENDPOINTS=false` or remove the variable
2. Restart the application
3. Verify endpoints return 404 responses

## Support

For questions about test endpoint security or temporary access requests, refer to the development team lead.
