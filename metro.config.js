const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);

// No special aliases required; using custom env loader in src/config/env.ts

module.exports = withNativeWind(config, { input: './global.css' })