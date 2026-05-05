const { getDefaultConfig } = require("expo/metro-config");
const fs = require("node:fs");
const path = require("node:path");
const { withUniwindConfig } = require("uniwind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const config = getDefaultConfig(projectRoot);

function getClosestPackageFromFs(absoluteModulePath) {
  const isDirectory =
    fs.existsSync(absoluteModulePath) &&
    fs.statSync(absoluteModulePath).isDirectory();
  let current = isDirectory
    ? absoluteModulePath
    : path.dirname(absoluteModulePath);

  while (
    current === workspaceRoot ||
    current.startsWith(`${workspaceRoot}${path.sep}`)
  ) {
    const packageJsonPath = path.join(current, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      return {
        packageJson: JSON.parse(fs.readFileSync(packageJsonPath, "utf8")),
        packageRelativePath: path.relative(current, absoluteModulePath),
        rootPath: current,
      };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return null;
}

// EAS installs npm workspace dependencies at the repository root while the Expo
// project root is app/. Keep hoisted packages resolvable from Metro.
config.watchFolders = Array.from(
  new Set([projectRoot, workspaceRoot, ...(config.watchFolders ?? [])]),
);
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
    ...(config.resolver.nodeModulesPaths ?? []),
  ]),
);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const safeContext = {
    ...context,
    getPackageForModule(absoluteModulePath) {
      try {
        return context.getPackageForModule(absoluteModulePath);
      } catch (error) {
        if (String(error).includes("Unexpectedly escaped traversal")) {
          return getClosestPackageFromFs(absoluteModulePath);
        }
        throw error;
      }
    },
  };

  return context.resolveRequest(safeContext, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
