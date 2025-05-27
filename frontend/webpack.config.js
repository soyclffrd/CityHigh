const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons']
    }
  }, argv);

  // Add proxy configuration
  config.devServer = {
    ...config.devServer,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  };

  // Add custom rules for handling font files
  config.module.rules.push({
    test: /\.(ttf|otf)$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',
        },
      },
    ],
  });

  // Add resolve aliases
  config.resolve.alias = {
    ...config.resolve.alias,
    '@expo/vector-icons': path.resolve(__dirname, 'node_modules/@expo/vector-icons'),
  };

  return config;
}; 