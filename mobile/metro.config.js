const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Moderate bundle size optimization (less aggressive to avoid build errors)
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      comments: false,
    },
    compress: {
      dead_code: true,
      drop_console: true,
      drop_debugger: true,
      passes: 2, // Reduced from 5 to 2 for stability
      unused: true,
    },
  },
};

module.exports = config;

