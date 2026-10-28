const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'development';
const envFile = path.resolve(__dirname, `../.env.${env}`);
const targetFile = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envFile)) {
  console.error(`Environment file not found: .env.${env}`);
  process.exit(1);
}

fs.copyFileSync(envFile, targetFile);
console.log(`Environment set to: ${env} (.env.${env} → .env)`);
