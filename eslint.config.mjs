import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "dist/**", "e-goto-scaffold/**"]),
  // app.js is the intentional CommonJS Coolify/Node entrypoint.
  { files: ["app.js"], rules: { "@typescript-eslint/no-require-imports": "off" } },
]);

export default eslintConfig;
