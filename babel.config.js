module.exports = function (api) {
  // Troubleshooting note:
  // `module:react-native-dotenv` inlines values at Babel transform-time.
  // To avoid any chance of stale production values being inlined, disable Babel caching.
  api.cache(false);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: true,
          verbose: false, // Disable verbose logging to reduce console spam
        },
      ],
    ],
  };
};