module.exports = function (api) {
  // Enable cache but invalidate when .env file changes
  api.cache(() => {
    // Invalidate cache when .env file changes
    // This allows caching for performance while still reloading when env changes
    return process.env.NODE_ENV;
  });

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