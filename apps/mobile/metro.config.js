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
config.resolver.disableHierarchicalLookup = false;

// 4. Use metro-cache to speed up builds
config.cacheStores = [
    new FileStore({
        root: path.join(projectRoot, 'node_modules/.cache/metro'),
    }),
];

module.exports = config;
