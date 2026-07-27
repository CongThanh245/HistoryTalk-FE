import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["warn", {
        selector: "JSXAttribute[name.name='style']",
        message: "Use Tailwind utility classes instead of inline styles. For dynamic values, use CSS custom properties with Tailwind arbitrary values.",
      }],
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@phosphor-icons/react",
          message: "Use lucide-react icons instead.",
        }],
      }],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
