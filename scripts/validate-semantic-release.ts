#!/usr/bin/env tsx
/**
 * Script de validation du setup semantic-release
 * Vérifie que tous les fichiers et configurations sont en place
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const projectRoot = path.resolve(__dirname, '..')

interface ValidationResult {
  name: string
  status: 'OK' | 'MISSING' | 'ERROR'
  message: string
}

const results: ValidationResult[] = []

// Helper functions
function checkFileExists(filePath: string, description: string): void {
  const fullPath = path.join(projectRoot, filePath)
  if (fs.existsSync(fullPath)) {
    results.push({
      name: description,
      status: 'OK',
      message: `File exists: ${filePath}`,
    })
  } else {
    results.push({
      name: description,
      status: 'MISSING',
      message: `File not found: ${filePath}`,
    })
  }
}

function checkPackageInstalled(packageName: string): void {
  try {
    const output = execSync(`pnpm ls ${packageName}`, {
      cwd: projectRoot,
      encoding: 'utf8',
    })
    if (output.includes(packageName)) {
      results.push({
        name: `Package: ${packageName}`,
        status: 'OK',
        message: 'Package installed',
      })
    } else {
      results.push({
        name: `Package: ${packageName}`,
        status: 'MISSING',
        message: 'Package not found in dependencies',
      })
    }
  } catch (error) {
    results.push({
      name: `Package: ${packageName}`,
      status: 'ERROR',
      message: 'Error checking package',
    })
  }
}

function checkHuskyHook(hookName: string): void {
  const hookPath = path.join(projectRoot, '.husky', hookName)
  if (fs.existsSync(hookPath)) {
    const content = fs.readFileSync(hookPath, 'utf8')
    if (content.includes('pnpm')) {
      results.push({
        name: `Husky Hook: ${hookName}`,
        status: 'OK',
        message: 'Hook configured correctly',
      })
    } else {
      results.push({
        name: `Husky Hook: ${hookName}`,
        status: 'ERROR',
        message: 'Hook exists but configuration looks incorrect',
      })
    }
  } else {
    results.push({
      name: `Husky Hook: ${hookName}`,
      status: 'MISSING',
      message: `Hook not found: .husky/${hookName}`,
    })
  }
}

function testCommitlint(): void {
  try {
    const testMessage = 'feat(test): test message'
    const output = execSync(`echo "${testMessage}" | pnpm commitlint`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    results.push({
      name: 'Commitlint Test',
      status: 'OK',
      message: 'commitlint validation working',
    })
  } catch (error: any) {
    if (error.toString().includes('No commits found')) {
      results.push({
        name: 'Commitlint Test',
        status: 'OK',
        message: 'commitlint installed and working',
      })
    } else {
      results.push({
        name: 'Commitlint Test',
        status: 'ERROR',
        message: 'Error testing commitlint',
      })
    }
  }
}

function validateConfigFile(filePath: string, description: string, requiredKeys: string[]): void {
  const fullPath = path.join(projectRoot, filePath)

  if (!fs.existsSync(fullPath)) {
    results.push({
      name: `${description} - File`,
      status: 'MISSING',
      message: `File not found: ${filePath}`,
    })
    return
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8')
    const isValid = requiredKeys.every((key) => content.includes(key))

    if (isValid) {
      results.push({
        name: `${description} - Content`,
        status: 'OK',
        message: 'Configuration looks valid',
      })
    } else {
      results.push({
        name: `${description} - Content`,
        status: 'ERROR',
        message: `Missing required keys: ${requiredKeys.join(', ')}`,
      })
    }
  } catch (error) {
    results.push({
      name: `${description} - Content`,
      status: 'ERROR',
      message: 'Error reading configuration file',
    })
  }
}

function getGitConfig(key: string): string | null {
  try {
    const output = execSync(`git config ${key}`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim()
    return output
  } catch {
    return null
  }
}

// Run validations
console.log('\\n🔍 Validating Semantic Release Setup...\n')

// 1. Check files exist
console.log('📁 Checking Configuration Files...')
checkFileExists('.releaserc.json', 'Release Configuration')
checkFileExists('commitlint.config.cjs', 'Commitlint Configuration')
checkFileExists('.gitmessage', 'Git Message Template')
checkFileExists('.github/workflows/release.yml', 'Release Workflow')
checkFileExists('.github/CODEOWNERS', 'Code Owners')
checkFileExists('.husky/commit-msg', 'Commitlint Hook')
checkFileExists('.husky/pre-commit', 'Pre-commit Hook')

// 2. Check packages installed
console.log('\\n📦 Checking Dependencies...')
checkPackageInstalled('semantic-release')
checkPackageInstalled('@semantic-release/changelog')
checkPackageInstalled('@semantic-release/git')
checkPackageInstalled('@semantic-release/github')
checkPackageInstalled('commitlint')
checkPackageInstalled('husky')

// 3. Validate configurations
console.log('\\n⚙️ Validating Configuration Content...')
validateConfigFile('.releaserc.json', '.releaserc.json', [
  '"branches"',
  '"plugins"',
  '@semantic-release/changelog',
  '@semantic-release/git',
])

validateConfigFile('commitlint.config.cjs', 'commitlint.config', [
  'extends',
  'type-enum',
  'feat',
  'fix',
])

// 4. Check husky hooks
console.log('\\n🪝 Checking Husky Hooks...')
checkHuskyHook('commit-msg')
checkHuskyHook('pre-commit')

// 5. Test commitlint
console.log('\\n🧪 Testing Commitlint...')
testCommitlint()

// 6. Check git config
console.log('\\n⚙️ Checking Git Configuration...')
const messageTemplate = getGitConfig('commit.template')
if (messageTemplate === '.gitmessage') {
  results.push({
    name: 'Git Message Template',
    status: 'OK',
    message: 'Template configured correctly',
  })
} else if (messageTemplate === null) {
  results.push({
    name: 'Git Message Template',
    status: 'MISSING',
    message: 'Template not configured. Run: git config commit.template .gitmessage',
  })
} else {
  results.push({
    name: 'Git Message Template',
    status: 'ERROR',
    message: `Unexpected template: ${messageTemplate}`,
  })
}

// 7. Check scripts in package.json
console.log('\\n📝 Checking Package Scripts...')
try {
  const packageJsonPath = path.join(projectRoot, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  if (packageJson.scripts?.release === 'semantic-release') {
    results.push({
      name: 'Release Script',
      status: 'OK',
      message: 'Script configured in package.json',
    })
  } else {
    results.push({
      name: 'Release Script',
      status: 'MISSING',
      message: 'Release script not found in package.json',
    })
  }
} catch (error) {
  results.push({
    name: 'Release Script',
    status: 'ERROR',
    message: 'Error reading package.json',
  })
}

// Print results
console.log('\\n' + '='.repeat(60))
console.log('📊 VALIDATION RESULTS')
console.log('='.repeat(60) + '\\n')

const okCount = results.filter((r) => r.status === 'OK').length
const missingCount = results.filter((r) => r.status === 'MISSING').length
const errorCount = results.filter((r) => r.status === 'ERROR').length

results.forEach((result) => {
  const icon = {
    OK: '✅',
    MISSING: '⚠️',
    ERROR: '❌',
  }[result.status]

  console.log(`${icon} ${result.name}`)
  console.log(`   ${result.message}\\n`)
})

console.log('='.repeat(60))
console.log(`Summary: ${okCount} OK, ${missingCount} Missing, ${errorCount} Errors`)
console.log('='.repeat(60) + '\\n')

// Exit code
if (errorCount > 0) {
  console.log('❌ Validation FAILED - Please fix errors above\\n')
  process.exit(1)
} else if (missingCount > 0) {
  console.log('⚠️  Validation PARTIAL - Some items need attention\\n')
  process.exit(0)
} else {
  console.log('✅ All validations PASSED - Setup is complete!\\n')
  process.exit(0)
}
