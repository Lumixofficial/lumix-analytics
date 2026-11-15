import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["app/icon.tsx"],
    // ImageResponse renders an image, not a browser DOM with next/image support.
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    files: ["tests/**/*.cjs", "deploy/**/*.cjs"],
    // Node's built-in test runner loads TypeScript through the local CJS hook.
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([".next/**", ".local/**", "out/**", "next-env.d.ts", "design-system/**"]),
]);
