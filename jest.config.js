export default {
  // TypeScriptファイルをテスト対象に含める
  preset: "ts-jest/presets/default-esm",

  // ES Modulesを有効にする
  extensionsToTreatAsEsm: [".ts"],

  // テスト環境をNode.jsに設定
  testEnvironment: "node",

  // テストファイルのパターン
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.spec.ts"],

  // TypeScriptファイルの変換設定
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },

  // カバレッジ設定
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts", // メインファイルは除外（統合テストで別途テスト）
    "!**/*.d.ts",
  ],

  // カバレッジレポートの形式
  coverageReporters: ["text", "lcov", "html"],

  // カバレッジの閾値
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
