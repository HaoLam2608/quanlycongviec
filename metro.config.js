const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add custom resolver to ignore styles files from routing
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Ignore styles.ts files from being treated as routes
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configure watchman ignore patterns
config.watchFolders = [__dirname];

module.exports = config;