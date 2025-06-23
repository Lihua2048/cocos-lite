module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom-global",
  testEnvironmentOptions: {
    url: "http://localhost",
    resources: "usable"
  },
  roots: ["<rootDir>/test"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.js$": "babel-jest"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!react-native|@react-native|@testing-library/react-native).+\\.(js|jsx|ts|tsx)$"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node","android.js", "ios.js", "native.js"],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/test/__mocks__/fileMock.js",
    "\\.(css|less|scss)$": "identity-obj-proxy",
    "^react-native$": "react-native-web",
    "^.+\\.(android|ios)\\.js$": "$1.js",
    "^react-dom/client$": "<rootDir>/node_modules/react-dom/client.js",
    "^react-dom$": "<rootDir>/node_modules/react-dom/index.js"
  },
  setupFilesAfterEnv: [
    "@testing-library/jest-native/extend-expect",
    "<rootDir>/test/setup.ts",
    "<rootDir>/test/platform-mock.ts"
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  globals: {
    __DEV__: true,
    webgl:{
        createContext: () =>({})
    }
  }
};
