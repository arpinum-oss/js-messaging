module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: { "@typescript-eslint/no-explicit-any": "off" },
  overrides: [
    {
      files: ["*.js"],
      env: {
        node: true,
      },
      rules: { "@typescript-eslint/no-var-requires": "off" },
    },
  ],
};
