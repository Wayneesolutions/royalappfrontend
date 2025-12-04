module.exports = function (api) {
  // Disable cache to force reload of .env file
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
          verbose: true, // Enable verbose to see what's being loaded
        },
      ],
    ],
  };
};