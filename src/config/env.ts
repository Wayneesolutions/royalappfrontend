// src/config/env.ts
// Custom environment configuration to avoid @env module resolution issues

// Environment configuration with fallback values
export const ENV = {
  API_BASE_URL: 'http://localhost:5000/api/v1',
  API_TIMEOUT: '10000',
  APP_NAME: 'Royal Software',
  APP_VERSION: '1.0.0',
  DEBUG_MODE: 'true',
};

// Environment-specific configurations
// Dynamically resolve host for web to avoid localhost/IPv6 issues
const resolveDevBaseUrl = (): string => {
  try {
    // window is available on web; fallback to localhost in native
    const host = typeof window !== 'undefined' && window.location && window.location.hostname
      ? window.location.hostname
      : 'localhost';
    const protocol = typeof window !== 'undefined' && window.location && window.location.protocol
      ? window.location.protocol.replace(':', '')
      : 'http';
    // Force http for local dev API unless you run https on backend
    const devProtocol = 'http';
    return `${devProtocol}://${host}:5000/api/v1`;
  } catch (e) {
    return 'http://localhost:5000/api/v1';
  }
};

const ENVIRONMENTS = {
  development: {
    API_BASE_URL: resolveDevBaseUrl(),
    API_TIMEOUT: '10000',
    APP_NAME: 'Royal Software (Dev)',
    APP_VERSION: '1.0.0',
    DEBUG_MODE: 'true',
  },
  staging: {
    API_BASE_URL: 'https://staging-api.royalsoftware.com/api/v1',
    API_TIMEOUT: '12000',
    APP_NAME: 'Royal Software (Staging)',
    APP_VERSION: '1.0.0',
    DEBUG_MODE: 'true',
  },
  production: {
    API_BASE_URL: 'https://your-production-api.com/api/v1',
    API_TIMEOUT: '15000',
    APP_NAME: 'Royal Software',
    APP_VERSION: '1.0.0',
    DEBUG_MODE: 'false',
  },
};

// Function to get current environment (you can modify this logic)
let currentEnvironment: keyof typeof ENVIRONMENTS = 'development';

const getCurrentEnvironment = (): keyof typeof ENVIRONMENTS => {
  return currentEnvironment;
};

// Function to set environment (can be called from scripts or app)
export const setEnvironment = (env: keyof typeof ENVIRONMENTS) => {
  if (env in ENVIRONMENTS) {
    currentEnvironment = env;
    const envConfig = ENVIRONMENTS[env];
    Object.assign(ENV, envConfig);
    console.log(`Environment switched to: ${env}`);
    console.log('Current configuration:', ENV);
  } else {
    console.error(`Invalid environment: ${env}`);
  }
};

// Get environment-specific configuration
const currentEnv = getCurrentEnvironment();
const envConfig = ENVIRONMENTS[currentEnv];

// Update ENV with current environment values
Object.assign(ENV, envConfig);

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
