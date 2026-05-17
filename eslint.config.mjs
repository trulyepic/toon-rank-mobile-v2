import expoConfig from "eslint-config-expo/flat.js";

export default [
  ...expoConfig,
  {
    ignores: [
      "android/**",
      "ios/**",
      ".expo/**",
      "dist/**",
      "coverage/**",
      "node_modules/**",
    ],
  },
];
