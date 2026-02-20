const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');


const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve queries from the project root
config.resolver.disableHierarchicalLookup = true;

// 4. Force resolution of critical dependencies to the local copy
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react': path.resolve(projectRoot, 'node_modules/react'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    '@expo/metro-runtime': path.resolve(projectRoot, 'node_modules/@expo/metro-runtime'), // Ensure this is also local if possible, or fallback
    // If expo is hoisted, we might need to point it here if possible, but usually blocking root react is key.
};

// 5. Exclude root react/react-native from being seen by Metro
// 5. Exclude root react/react-native from being seen by Metro
// Manual exclusion list implementation to avoid import issues
function exclusionList(additionalExclusions) {
    return new RegExp(
        "(" +
        (additionalExclusions).map(regexp => regexp.source).join("|") +
        ")"
    );
}

config.resolver.blacklistRE = exclusionList([
    new RegExp(`${path.resolve(workspaceRoot, 'node_modules/react')}/.*`),
    new RegExp(`${path.resolve(workspaceRoot, 'node_modules/react-native')}/.*`),
]);

// 6. Use metro-cache to speed up builds
config.cacheStores = [
    new FileStore({
        root: path.join(projectRoot, 'node_modules/.cache/metro'),
    }),
];

module.exports = config;
