import js from "@eslint/js"
import tseslint from "typescript-eslint"
import nextPlugin from "@next/eslint-plugin-next"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import jsxA11yPlugin from "eslint-plugin-jsx-a11y"
import unusedImportsPlugin from "eslint-plugin-unused-imports"
import prettierConfig from "eslint-config-prettier"

export default tseslint.config(
  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript ESLint recommended
  ...tseslint.configs.recommended,

  // Global ignores
  {
    ignores: [
      // Build outputs
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",

      // Dependencies
      "node_modules/**",

      // Prisma generated files
      "prisma/generated/**",
      "prisma/migrations/**",
      "**/generated/**",

      // Cache and temp files
      ".cache/**",
      ".turbo/**",
      "*.tsbuildinfo",
      ".eslintcache",

      // Public assets
      "public/**",

      // Type declaration files (often have any)
      "src/types/*.d.ts",

      // Files with syntax issues to fix later
      "src/lib/inngest/functions-chat.ts",

      // Scripts and utility files (Node.js environment)
      "scripts/**",
      "jest.config.js",
      "jest.setup.js",
    ],
  },

  // React configuration
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "@next/next": nextPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-props-no-spreading": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/no-unknown-property": ["error", { ignore: ["jsx", "global"] }], // styled-jsx

      // React Hooks - only essential rules (disable strict React Compiler rules)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Disable overly strict rules from react-hooks that cause too many false positives
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/use-memo": "off",

      // Accessibility rules (warnings only)
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",

      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-img-element": "warn", // Allow <img> with warning

      // Base ESLint rules - pragmatic settings
      "no-case-declarations": "off", // Allow declarations in switch cases
      "no-control-regex": "off", // Allow control chars in regex (security patterns)
      "no-useless-escape": "warn", // Warn instead of error
      "prefer-const": "warn", // Warn instead of error
      "no-unused-vars": "off", // Disable base rule (use @typescript-eslint version)
    },
  },

  // TypeScript configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "unused-imports": unusedImportsPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Disable base ESLint rules that conflict with TypeScript
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // Auto-remove unused imports (fixable)
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // TypeScript rules - pragmatic for production
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // JavaScript files configuration
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    plugins: {
      "unused-imports": unusedImportsPlugin,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Config files (next.config.mjs, etc.) - Node.js environment
  {
    files: ["*.config.*", "*.config.mjs", "*.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "no-undef": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Inngest functions (often have specific patterns)
  {
    files: ["src/inngest/**/*", "src/lib/inngest/**/*"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Prettier compatibility (must be last)
  prettierConfig
)
