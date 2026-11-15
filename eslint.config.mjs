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
    files: ["deploy/**/*.cjs"],
    // Mongo's provisioning script runs in mongosh, which exposes CommonJS require.
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([".next/**", ".local/**", "out/**", "next-env.d.ts", "design-system/**"]),
]);
