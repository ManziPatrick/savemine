const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aggressive bundle size optimization
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
      properties: {
        regex: /^_/
      }
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
      comments: false, // Remove all comments
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: true, // Enable top-level minification
    compress: {
      // Ultra-aggressive compression
      dead_code: true,
      drop_console: true,
      drop_debugger: true,
      passes: 5, // More passes for better compression
      unsafe: false,
      unsafe_comps: false,
      unsafe_math: false,
      unsafe_methods: false,
      pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove these functions
      unused: true,
    },
  },
};

// Optimize resolver - exclude unused file types
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts],
  assetExts: config.resolver.assetExts.filter(
    ext => !['svg', 'md', 'txt'].includes(ext)
  ),
};

// Optimize serializer
config.serializer = {
  ...config.serializer,
  customSerializer: undefined, // Use default serializer
};

module.exports = config;

