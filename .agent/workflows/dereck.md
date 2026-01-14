---
description: Configuration workspace Google Antigravity pour les projets ODILLON - Optimisé pour Next.js, TypeScript et Prisma
---

{
  "$schema": "https://antigravity.google/schemas/workspace.json",
  "version": "2.0.0",
  "name": "ODILLON-Workspace",
  "description": "Configuration workspace Google Antigravity pour les projets ODILLON - Optimisé pour Next.js, TypeScript et Prisma",
  
  "agent": {
    "model": "gemini-2.5-pro",
    "temperature": 0.7,
    "maxTokens": 32000,
    "deepThink": true,
    "autonomyLevel": "semi-autonomous",
    "terminalAutoExecution": "prompt-always",
    "browserAutomation": true
  },

  "folders": [
    {
      "path": "./",
      "name": "Root"
    },
    {
      "path": "./src",
      "name": "Source"
    },
    {
      "path": "./prisma",
      "name": "Database"
    }
  ],

  "memory": {
    "enabled": true,
    "recursiveSummarization": true,
    "contextWindow": 128000,
    "persistAcrossSessions": true,
    "knowledgeBase": ".context/"
  },

  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"],
      "enabled": true
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      },
      "enabled": true
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${env:DATABASE_URL}"
      },
      "enabled": true
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "enabled": true
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "enabled": true
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "enabled": true
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${env:BRAVE_API_KEY}"
      },
      "enabled": false
    }
  },

  "workflows": {
    "nextjs-component": {
      "description": "Créer un composant Next.js avec TypeScript et Tailwind",
      "trigger": "/component",
      "steps": [
        "Analyser le contexte et les props nécessaires",
        "Créer le fichier .tsx avec typage strict",
        "Ajouter les styles Tailwind CSS",
        "Créer les tests unitaires avec Vitest",
        "Mettre à jour les exports si barrel file présent"
      ]
    },
    "prisma-model": {
      "description": "Créer ou modifier un modèle Prisma",
      "trigger": "/prisma-model",
      "steps": [
        "Analyser le schéma existant",
        "Créer/modifier le modèle avec relations",
        "Générer la migration",
        "Mettre à jour le client Prisma",
        "Créer les types TypeScript correspondants"
      ]
    },
    "api-route": {
      "description": "Créer une API Route Next.js App Router",
      "trigger": "/api",
      "steps": [
        "Créer le fichier route.ts",
        "Implémenter les handlers GET/POST/PUT/DELETE",
        "Ajouter la validation Zod",
        "Gérer les erreurs avec try/catch",
        "Documenter avec JSDoc"
      ]
    },
    "docker": {
      "description": "Dockeriser l'application",
      "trigger": "/docker",
      "steps": [
        "Analyser les dépendances",
        "Créer Dockerfile multi-stage optimisé",
        "Créer .dockerignore",
        "Créer docker-compose.yml si BDD détectée",
        "Tester le build"
      ]
    },
    "test-suite": {
      "description": "Générer une suite de tests",
      "trigger": "/tests",
      "steps": [
        "Analyser le code à tester",
        "Créer tests unitaires (Vitest)",
        "Créer tests d'intégration si API",
        "Créer tests E2E si UI (Playwright)",
        "Générer rapport de couverture"
      ]
    }
  },

  "rules": {
    "coding": {
      "language": "TypeScript",
      "strictMode": true,
      "noAny": true,
      "preferConst": true,
      "useArrowFunctions": true,
      "importOrder": ["react", "next", "@/", "./"],
      "maxFileLines": 300,
      "maxFunctionLines": 50
    },
    "naming": {
      "components": "PascalCase",
      "functions": "camelCase",
      "constants": "SCREAMING_SNAKE_CASE",
      "files": {
        "components": "PascalCase.tsx",
        "hooks": "use*.ts",
        "utils": "camelCase.ts",
        "types": "*.types.ts"
      }
    },
    "architecture": {
      "pattern": "feature-based",
      "structure": {
        "components": "Composants UI réutilisables",
        "features": "Fonctionnalités métier",
        "hooks": "Custom hooks React",
        "lib": "Utilitaires et configurations",
        "services": "Appels API et logique externe",
        "types": "Définitions TypeScript"
      }
    },
    "security": {
      "noHardcodedSecrets": true,
      "useEnvVariables": true,
      "sanitizeInputs": true,
      "validateWithZod": true,
      "useCSRFProtection": true,
      "implementRateLimiting": true
    },
    "performance": {
      "useMemo": "expensive-calculations",
      "useCallback": "callbacks-passed-to-children",
      "lazyLoading": true,
      "imageOptimization": true,
      "codeSpitting": true
    },
    "errorHandling": {
      "useErrorBoundaries": true,
      "logErrors": true,
      "gracefulDegradation": true,
      "userFriendlyMessages": true
    }
  },

  "settings": {
    "editor": {
      "formatOnSave": true,
      "defaultFormatter": "esbenp.prettier-vscode",
      "tabSize": 2,
      "insertSpaces": true,
      "trimTrailingWhitespace": true,
      "insertFinalNewline": true
    },
    "typescript": {
      "tsdk": "node_modules/typescript/lib",
      "enablePromptOnConfigChange": true,
      "preferences": {
        "importModuleSpecifier": "non-relative",
        "quoteStyle": "single"
      }
    },
    "eslint": {
      "enable": true,
      "workingDirectories": [{ "mode": "auto" }],
      "validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"]
    },
    "tailwindCSS": {
      "includeLanguages": {
        "typescript": "javascript",
        "typescriptreact": "javascript"
      },
      "experimental": {
        "classRegex": ["clsx\\(([^)]*)\\)", "cn\\(([^)]*)\\)"]
      }
    },
    "prisma": {
      "formatOnSave": true
    }
  },

  "extensions": {
    "recommended": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "bradlc.vscode-tailwindcss",
      "Prisma.prisma",
      "formulahendry.auto-rename-tag",
      "christian-kohler.path-intellisense",
      "mikestead.dotenv",
      "usernamehw.errorlens",
      "eamodio.gitlens",
      "yoavbls.pretty-ts-errors"
    ]
  },

  "tasks": {
    "dev": {
      "command": "npm run dev",
      "description": "Démarrer le serveur de développement",
      "problemMatcher": "$tsc-watch"
    },
    "build": {
      "command": "npm run build",
      "description": "Build de production",
      "problemMatcher": "$tsc"
    },
    "lint": {
      "command": "npm run lint",
      "description": "Vérifier le code avec ESLint"
    },
    "test": {
      "command": "npm run test",
      "description": "Lancer les tests"
    },
    "prisma:generate": {
      "command": "npx prisma generate",
      "description": "Générer le client Prisma"
    },
    "prisma:migrate": {
      "command": "npx prisma migrate dev",
      "description": "Créer une migration"
    },
    "prisma:studio": {
      "command": "npx prisma studio",
      "description": "Ouvrir Prisma Studio"
    },
    "type-check": {
      "command": "npx tsc --noEmit",
      "description": "Vérifier les types TypeScript"
    }
  },

  "launch": {
    "configurations": [
      {
        "name": "Next.js: Debug Server",
        "type": "node",
        "request": "launch",
        "runtimeExecutable": "npm",
        "runtimeArgs": ["run", "dev"],
        "skipFiles": ["<node_internals>/**"],
        "console": "integratedTerminal"
      },
      {
        "name": "Next.js: Debug Full Stack",
        "type": "node",
        "request": "launch",
        "runtimeExecutable": "npm",
        "runtimeArgs": ["run", "dev"],
        "serverReadyAction": {
          "pattern": "- Local:.+(https?://.+)",
          "uriFormat": "%s",
          "action": "debugWithChrome"
        }
      }
    ],
    "compounds": [
      {
        "name": "Full Stack Debug",
        "configurations": ["Next.js: Debug Server"]
      }
    ]
  },

  "env": {
    "required": [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL"
    ],
    "optional": [
      "GITHUB_TOKEN",
      "BRAVE_API_KEY",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD"
    ],
    "template": {
      "DATABASE_URL": "postgresql://user:password@localhost:5432/dbname",
      "NEXTAUTH_SECRET": "your-secret-key-here",
      "NEXTAUTH_URL": "http://localhost:3000"
    }
  },

  "gitHooks": {
    "preCommit": [
      "npm run lint",
      "npm run type-check"
    ],
    "commitMsg": "conventional-commits"
  },

  "documentation": {
    "autoGenerate": true,
    "format": "JSDoc",
    "includeExamples": true,
    "outputDir": "./docs"
  },

  "ai": {
    "codeReview": {
      "enabled": true,
      "checkSecurity": true,
      "checkPerformance": true,
      "checkAccessibility": true,
      "suggestRefactoring": true
    },
    "autoComplete": {
      "enabled": true,
      "contextAware": true,
      "includeImports": true
    },
    "explanation": {
      "detailLevel": "intermediate",
      "includeExamples": true,
      "language": "fr"
    }
  },

  "metadata": {
    "author": "Déreck - ODILLON Ingénierie d'Entreprises",
    "created": "2026-01-09",
    "lastModified": "2026-01-09",
    "tags": ["nextjs", "typescript", "prisma", "tailwindcss", "chronodil"]
  }
}
