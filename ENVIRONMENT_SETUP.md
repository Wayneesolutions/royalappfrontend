# Environment Variables Setup

## Overview
This document explains how to configure and use environment variables in the Royal Software mobile app.

## Environment Files

### Available Environments
- **Development** (`.env.development`) - Local development
- **Staging** (`.env.staging`) - Staging environment
- **Production** (`.env.production`) - Production environment

### Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `API_BASE_URL` | Backend API base URL | `http://localhost:5000/api/v1` |
| `API_TIMEOUT` | API request timeout in milliseconds | `10000` |
| `APP_NAME` | Application name | `Royal Software` |
| `APP_VERSION` | Application version | `1.0.0` |
| `DEBUG_MODE` | Enable debug logging | `true` |

## Setup Instructions

### 1. Install Dependencies
```bash
npm install react-native-dotenv
```

### 2. Configure Babel
The babel configuration is already set up in `babel.config.js` to support environment variables.

### 3. Set Environment
Use the provided scripts to switch between environments:

```bash
# Set to development environment
npm run env:dev

# Set to staging environment
npm run env:staging

# Set to production environment
npm run env:prod
```

### 4. Start App with Environment
```bash
# Start with development environment
npm run start:dev

# Start with staging environment
npm run start:staging

# Start with production environment
npm run start:prod
```

## Environment Files Content

### Development (.env.development)
```env
API_BASE_URL=http://localhost:5000/api/v1
API_TIMEOUT=10000
APP_NAME=Royal Software (Dev)
APP_VERSION=1.0.0
DEBUG_MODE=true
```

### Staging (.env.staging)
```env
API_BASE_URL=https://staging-api.royalsoftware.com/api/v1
API_TIMEOUT=12000
APP_NAME=Royal Software (Staging)
APP_VERSION=1.0.0
DEBUG_MODE=true
```

### Production (.env.production)
```env
API_BASE_URL=https://your-production-api.com/api/v1
API_TIMEOUT=15000
APP_NAME=Royal Software
APP_VERSION=1.0.0
DEBUG_MODE=false
```

## Usage in Code

### Import Environment Variables
```typescript
import { API_BASE_URL, API_TIMEOUT, DEBUG_MODE } from '@env';
```

### Use in API Configuration
```typescript
// src/config/api.ts
import { API_BASE_URL, API_TIMEOUT, DEBUG_MODE } from '@env';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL || 'http://localhost:5000/api/v1',
  TIMEOUT: parseInt(API_TIMEOUT || '10000', 10),
  DEBUG_MODE: DEBUG_MODE === 'true',
};
```

### TypeScript Support
Environment variables are typed in `src/types/env.d.ts`:
```typescript
declare module '@env' {
  export const API_BASE_URL: string;
  export const API_TIMEOUT: string;
  export const APP_NAME: string;
  export const APP_VERSION: string;
  export const DEBUG_MODE: string;
}
```

## Customization

### Adding New Environment Variables

1. **Add to environment files**:
   ```env
   # Add to .env.development, .env.staging, .env.production
   NEW_VARIABLE=value
   ```

2. **Update TypeScript declarations**:
   ```typescript
   // src/types/env.d.ts
   declare module '@env' {
     export const NEW_VARIABLE: string;
   }
   ```

3. **Use in code**:
   ```typescript
   import { NEW_VARIABLE } from '@env';
   ```

### Updating API URLs

1. **Development**: Update `API_BASE_URL` in `.env.development`
2. **Staging**: Update `API_BASE_URL` in `.env.staging`
3. **Production**: Update `API_BASE_URL` in `.env.production`

## Security Considerations

### Environment Files
- `.env` is gitignored (contains sensitive data)
- `.env.development`, `.env.staging`, `.env.production` are tracked in git
- Never commit sensitive data like API keys or secrets

### Production Deployment
- Use secure environment variable management in production
- Consider using Expo's environment variables for production builds
- Validate all environment variables on app startup

## Troubleshooting

### Common Issues

1. **Environment variables not loading**:
   - Restart Metro bundler: `npx expo start --clear`
   - Check babel configuration
   - Verify environment file exists

2. **TypeScript errors**:
   - Update `src/types/env.d.ts` with new variables
   - Restart TypeScript server

3. **Wrong environment loaded**:
   - Check current `.env` file content
   - Run appropriate environment script
   - Clear Metro cache

### Debug Mode
When `DEBUG_MODE=true`, the app will log:
- API configuration on startup
- Network requests and responses
- Environment variable values

## Best Practices

1. **Environment Separation**: Keep development, staging, and production configurations separate
2. **Default Values**: Always provide fallback values for environment variables
3. **Type Safety**: Use TypeScript declarations for all environment variables
4. **Documentation**: Document all environment variables and their purposes
5. **Security**: Never commit sensitive data to version control

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run env:dev` | Set environment to development |
| `npm run env:staging` | Set environment to staging |
| `npm run env:prod` | Set environment to production |
| `npm run start:dev` | Start app with development environment |
| `npm run start:staging` | Start app with staging environment |
| `npm run start:prod` | Start app with production environment |
