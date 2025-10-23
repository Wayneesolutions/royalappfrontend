// src/config/api.ts
import { getApiBaseUrl, getApiTimeout, isDebugMode, logApiConfig } from './env';

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: getApiTimeout(),
  RETRY_ATTEMPTS: 3,
  DEBUG_MODE: isDebugMode(),
};

// Re-export environment functions for backward compatibility
export { getApiBaseUrl, getApiTimeout, isDebugMode, logApiConfig };
