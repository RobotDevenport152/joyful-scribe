import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

// Same debt-visibility pattern as the any-related downgrades below: adopt the
// recommended ruleset without failing CI on pre-existing violations we
// haven't audited yet. Preserves each rule's own option array (e.g.
// alt-text's element list), just forces the severity itself to "warn".
function asWarnings(rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([name, config]) => {
      if (config === "off" || config === 0) return [name, config];
      return [name, Array.isArray(config) ? ["warn", ...config.slice(1)] : "warn"];
    }),
  );
}

export default tseslint.config(
  { ignores: ["dist", "tailwind.config.ts", "postcss.config.js"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...asWarnings(jsxA11y.flatConfigs.recommended.rules),
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // tsconfig strict mode is on (see CLAUDE.md §15), but explicit `: any`
      // is still legal TS and still exists at ~100 call sites — downgrade to
      // warnings so CI passes while that debt is visible, not silent.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
    },
  },
);
