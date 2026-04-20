module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleDirectories: ["node_modules", "<rootDir>/node_modules", "<rootDir>/../../node_modules"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@packages/types$": "<rootDir>/../../packages/types/src/database.ts",
    "^react-native$": "<rootDir>/node_modules/react-native",
  },
};

