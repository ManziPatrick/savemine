const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize bundle size
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
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    compress: {
      // Aggressive compression
      dead_code: true,
      drop_console: true, // Remove console.logs in production
      drop_debugger: true,
      passes: 3,
      unsafe: false,
      unsafe_comps: false,
      unsafe_math: false,
      unsafe_methods: false,
    },
  },
};

// Optimize resolver
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts],
  assetExts: config.resolver.assetExts.filter(
    ext => !['svg'].includes(ext)
  ),
};

module.exports = config;

