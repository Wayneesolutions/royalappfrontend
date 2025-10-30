// src/config/env.ts
// Custom environment configuration to avoid @env module resolution issues

// Import environment variables from .env file
import {
  API_BASE_URL,
  API_TIMEOUT,
  APP_NAME,
  APP_VERSION,
  DEBUG_MODE,
  ENVIRONMENT,
} from '@env';

// Environment configuration with values from .env file
export const ENV = {
  API_BASE_URL: API_BASE_URL ,
  API_TIMEOUT: API_TIMEOUT || '10000',
  APP_NAME: APP_NAME || 'Royal Software',
  APP_VERSION: APP_VERSION || '1.0.0',
  DEBUG_MODE: DEBUG_MODE || 'true',
  ENVIRONMENT: ENVIRONMENT || 'development',
};

// Environment is now read from .env file via @env imports above
// No need for hardcoded environment configurations

// Helper functions
export const getApiBaseUrl = (): string => {
  return ENV.API_BASE_URL;
};

export const getApiTimeout = (): number => {
  return parseInt(ENV.API_TIMEOUT, 10);
};

export const isDebugMode = (): boolean => {
  return ENV.DEBUG_MODE === 'true';
};

export const logApiConfig = () => {
  if (isDebugMode()) {
    console.log('API Configuration:', {
      BASE_URL: getApiBaseUrl(),
      TIMEOUT: getApiTimeout(),
      DEBUG_MODE: isDebugMode(),
    });
  }
};
