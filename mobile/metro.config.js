const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Share the pure place-classification logic with the web app (src/lib/city-places.ts).
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../src/lib")];

module.exports = config;
