import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "eslint-plugin-react/configs/recommended.js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import { fixupConfigRules } from "@eslint/compat";

export default {
  parserOptions: {
    sourceType: 'module', // Specify ECMAScript module syntax
  },
  env: {
    node: true, // Enable Node.js global variables and Node.js scoping
  },
  settings: {
    react: {
      version: 'detect', // Detect the React version automatically
    },
  },
};