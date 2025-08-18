import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { 
    ignores: ["src-tauri/target/**", "node_modules/**"],
    files: ["**/*.{js,jsx,ts,tsx}"], 
    plugins: { js }, 
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      pluginReact.configs.flat.recommended
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      "react/react-in-jsx-scope":"off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);
