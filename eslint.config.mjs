import { defineConfig } from "eslint/config"
import globals from "globals"
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import { FlatCompat } from "@eslint/eslintrc"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"] },
  { files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  tseslint.configs.recommended,
  ...compat.config({
    extends: ["next/core-web-vitals"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
      "use-import-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
])
