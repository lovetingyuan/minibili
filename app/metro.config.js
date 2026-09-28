const { getPostHogExpoConfig } = require("posthog-react-native/metro");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const isProduction = ["production", "prod"].includes(process.env.APP_VARIANT);
const config = isProduction ? getPostHogExpoConfig(__dirname) : getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
