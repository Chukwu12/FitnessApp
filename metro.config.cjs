const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// ✅ Prefer react-native + require builds first (helps avoid ESM-only bundles on web)
config.resolver.unstable_conditionNames = ["react-native", "require", "browser"];

// ❌ REMOVE this (it breaks @sanity/client/csm and other subpath exports)
// config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./src/global.css" });
