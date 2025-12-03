// src/config/env.ts
// Custom environment configuration to avoid @env module resolution issues
// Version: 2024-12-19 - Updated to use 192.168.1.11

// Import environment variables from .env file
import {
  API_BASE_URL,
  API_TIMEOUT,
  APP_NAME,
  APP_VERSION,
  DEBUG_MODE,
  ENVIRONMENT,
} from '@env';

// Debug logging for environment variables
console.log('🔍 Environment variables loaded:', {
  API_BASE_URL,
  API_TIMEOUT,
  APP_NAME,
  ENVIRONMENT,
});
console.log('🌐 Final API_BASE_URL:', API_BASE_URL || 'http://192.168.1.11:5000/api/v1');

// Environment configuration with values from .env file
export const ENV = {
  API_BASE_URL: API_BASE_URL || 'http://192.168.1.11:5000/api/v1',
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
  const url = ENV.API_BASE_URL;
  console.log('🔗 getApiBaseUrl() called, returning:', url);
  return url;
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
