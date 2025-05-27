const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add any custom configuration here
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ttf', 'otf'];

// Add extraNodeModules to help resolve nanoid
config.resolver.extraNodeModules = {
  'nanoid': path.resolve(__dirname, 'node_modules/nanoid'),
  'nanoid/non-secure': path.resolve(__dirname, 'node_modules/nanoid/non-secure'),
  '@react-navigation/native': require.resolve('@react-navigation/native'),
  '@react-navigation/core': require.resolve('@react-navigation/core'),
};

// Add transformer configuration for handling assets
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// Add resolver configuration for handling assets
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = config; 