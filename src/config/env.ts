// src/config/env.ts

import {
  API_BASE_URL,
  API_TIMEOUT,
  APP_NAME,
  APP_VERSION,
  DEBUG_MODE,
  ENVIRONMENT,
} from '@env';

console.log('🔍 ENV Loaded:', {
  API_BASE_URL,
  ENVIRONMENT,
});

export const ENV = {
  API_BASE_URL: API_BASE_URL || 'http://192.168.1.16:5000/api/v1',
  API_TIMEOUT: API_TIMEOUT || '10000',
  APP_NAME: APP_NAME || 'Royal Software',
  APP_VERSION: APP_VERSION || '1.0.0',
  DEBUG_MODE: DEBUG_MODE || 'true',
  ENVIRONMENT: ENVIRONMENT || 'development',
};

// Helpers
export const getApiBaseUrl = (): string => ENV.API_BASE_URL;

export const getApiTimeout = (): number =>
  parseInt(ENV.API_TIMEOUT, 10);

export const isDebugMode = (): boolean =>
  ENV.DEBUG_MODE === 'true';

// Backward-compatible debug helper used by `src/config/api.ts`
// and `src/services/api.ts` during app initialization.
export const logApiConfig = () => {
  if (!isDebugMode()) return;

  console.log('API Configuration:', {
    BASE_URL: getApiBaseUrl(),
    TIMEOUT: getApiTimeout(),
    DEBUG_MODE: isDebugMode(),
    ENVIRONMENT: ENV.ENVIRONMENT,
  });
};