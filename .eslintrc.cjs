module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    soruceType: "module",
  },
  ignorePatterns: [
    "node_modules/*",
    "!.prettierrc.js",
    "rollup.config.js",
    "**/dist/**",
  ],
  plugins: ["prettier", "@typescript-eslint"],
  extends: ["eslint:recommended"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      settings: { react: { version: "detect" } },
      env: {
        browser: true,
        node: true,
        es6: true,
      },
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
      ],
      parserOptions: {
        project: ["./tsconfig.json"], // Specify it only for TypeScript files
      },
      rules: {
        "@typescript-eslint/no-unused-vars": ["error"],
        "@typescript-eslint/explicit-function-return-type": [
          "warn",
          {
            allowExpressions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: true,
          },
        ],
        "prettier/prettier": ["warn", {}, { usePrettierrc: true }],
      },
    },
  ],
  rules: {
    "object-curly-spacing": ["warn", "always"],
    "no-unused-vars": [
      "warn",
      {
        vars: "all",
        args: "none",
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        vars: "all",
        args: "none",
      },
    ],

    "max-len": [
      "warn",
      {
        code: 80,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
      },
    ],
    "no-plusplus": [
      "error",
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    "import/prefer-default-export": "off",
  },
};
