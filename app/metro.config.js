const { getPostHogExpoConfig } = require("posthog-react-native/metro");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const isProduction = ["production", "prod"].includes(process.env.APP_VARIANT);
const config = isProduction ? getPostHogExpoConfig(__dirname) : getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // SWR 的 ESM/CJS 入口各自持有缓存，统一入口才能共享 SWRConfig 和分页缓存。
  if (moduleName === "swr" || moduleName.startsWith("swr/")) {
    return { type: "sourceFile", filePath: require.resolve(moduleName) };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
