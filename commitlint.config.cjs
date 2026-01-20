/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",      // Nouvelle fonctionnalité
        "fix",       // Correction de bug
        "perf",      // Amélioration de performance
        "docs",      // Documentation
        "style",     // Formatage (pas de changement de code)
        "refactor",  // Refactoring de code
        "test",      // Ajout/modification de tests
        "build",     // Changements du système de build
        "ci",        // Changements CI/CD
        "chore",     // Maintenance
        "revert",    // Revert d'un commit
      ],
    ],
    "type-case": [2, "always", "lowercase"],
    "type-empty": [2, "never"],
    "scope-empty": [0],
    "scope-case": [2, "always", "lowercase"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "subject-case": [2, "always", "lowercase"],
    "body-leading-blank": [2, "always"],
    "body-max-line-length": [0],
    "footer-leading-blank": [2, "always"],
    "footer-max-line-length": [0],
  },
};
