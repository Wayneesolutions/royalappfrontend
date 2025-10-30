// scripts/set-env.js
const fs = require('fs');
const path = require('path');

const environments = {
  development: '.env.development',
  staging: '.env.staging',
  production: '.env.production',
};

// Environment configurations (matching the TypeScript config)
const envConfigs = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api/v1',
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

function setEnvironment(env) {
  if (!environments[env]) {
    console.error(`❌ Invalid environment: ${env}`);
    console.log('Available environments:', Object.keys(environments).join(', '));
    process.exit(1);
  }

  const envFile = environments[env];
  const envPath = path.join(__dirname, '..', envFile);

  // Create env file if it doesn't exist
  if (!fs.existsSync(envPath)) {
    console.log(`📝 Creating ${envFile} file...`);
    const envConfig = envConfigs[env];
    let content = '';
    for (const [key, value] of Object.entries(envConfig)) {
      content += `${key}=${value}\n`;
    }
    content += `ENVIRONMENT=${env}\n`;
    fs.writeFileSync(envPath, content);
    console.log(`✅ Created ${envFile}`);
  }

  const targetPath = path.join(__dirname, '..', '.env');

  try {
    // Copy the environment file
    fs.copyFileSync(envPath, targetPath);
    
    console.log(`✅ Environment set to: ${env}`);
    console.log(`📁 Copied ${envFile} to .env`);
    
    // Display current configuration
    const envContent = fs.readFileSync(targetPath, 'utf8');
    console.log('\n📋 Current configuration:');
    console.log(envContent);
  } catch (error) {
    console.error(`❌ Error setting environment: ${error.message}`);
    process.exit(1);
  }
}

// TypeScript config is now managed via environment variables
// No need to manually update env.ts

// Get environment from command line argument
const env = process.argv[2];

if (!env) {
  console.log('🔧 Environment Switcher');
  console.log('Usage: node scripts/set-env.js <environment>');
  console.log('\nAvailable environments:');
  Object.keys(environments).forEach(key => {
    console.log(`  - ${key}`);
  });
  process.exit(1);
}

setEnvironment(env);
