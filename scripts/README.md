# Scripts - Utility & Automation Scripts

This folder contains organized scripts for application setup, testing, deployment, and maintenance.

## 📁 Organization

### `/setup` - Setup & Initialization Scripts
Scripts for initializing the application and database.

**Use Cases:**
- Initial project setup
- Admin account creation
- Role and hierarchy configuration

**Key Scripts:**
- `setup-admin.ts` - Setup admin account
- `setup-hierarchy.ts` - Configure organizational hierarchy
- `create-admin-direct.ts` - Create admin directly in database
- `reset-and-create-admin.ts` - Reset and recreate admin account
- `apply-admin-protection.ts` - Apply admin protection to database
- `apply-directeur-role-migration.ts` - Migrate director roles

**Usage:**
```bash
# Setup admin
pnpm tsx scripts/setup/setup-admin.ts

# Setup organizational hierarchy
pnpm tsx scripts/setup/setup-hierarchy.ts
```

### `/utilities` - Helper & Utility Scripts
General-purpose utility scripts for common operations.

**Categories:**

#### User Management
- `create-employee.ts` - Create employee account
- `create-employee-account.ts` - Create employee with details
- `create-manager-account.ts` - Create manager account
- `create-test-manager.ts` - Create test manager
- `create-test-users.ts` - Create test users for development
- `create-test-projects.ts` - Create test projects
- `update-user-role.ts` - Change user role
- `assign-manager-to-admin.ts` - Assign manager role to admin
- `assign-manager-to-dereck.ts` - Specific user assignment
- `make-dereck-manager.ts` - Make specific user a manager
- `assign-user-to-projects.ts` - Assign users to projects
- `set-project-creators.ts` - Set project creators

#### User Information
- `list-users.ts` - List all users
- `list-all-accounts.ts` - List all accounts with details
- `check-projects.ts` - Check project information
- `check-accounts.ts` - Check account information
- `check-current-user-role.ts` - Check current user role
- `check-current-users.ts` - Check all users
- `check-user-manager.ts` - Check user manager assignments
- `migrate-users.ts` - Migrate user data

#### Password & Security
- `set-admin-password.ts` - Set admin password
- `generate-bcrypt-hash.ts` - Generate bcrypt password hash
- `fix-admin-password.ts` - Fix admin password issues
- `delete-admin-direct.ts` - Delete admin account

#### Maintenance
- `cleanup-failed-migration.ts` - Cleanup from failed migrations
- `clean-blob-urls.ts` - Clean up blob URLs

**Usage:**
```bash
# Create a test user
pnpm tsx scripts/utilities/create-test-users.ts

# List all users
pnpm tsx scripts/utilities/list-users.ts

# Set admin password
pnpm tsx scripts/utilities/set-admin-password.ts
```

### `/testing` - Testing & Validation Scripts
Scripts for testing application features and functionality.

**Test Types:**

#### Authentication & Security
- `test-auth.ts` - Test authentication system
- `test-prisma-connection.ts` - Test database connection

#### Chat System
- `test-chat-system.ts` - Test chat functionality
- `test-chat-actions.ts` - Test chat actions

#### Features & Configuration
- `test-accent-colors.ts` - Test accent color system
- `test-accent-color-visual.html` - Visual accent color test
- `test-general-settings.ts` - Test general settings
- `test-validation.ts` - Test validation system

**Usage:**
```bash
# Test authentication
pnpm tsx scripts/testing/test-auth.ts

# Test chat system
pnpm tsx scripts/testing/test-chat-system.ts

# Test accent colors (TypeScript)
pnpm tsx scripts/testing/test-accent-colors.ts

# Test accent colors (HTML - open in browser)
open scripts/testing/test-accent-color-visual.html
```

### `/deployment` - Deployment & DevOps Scripts
Scripts for deployment automation and environment setup.

**Deployment Platforms:**
- Vercel
- Supabase

**Scripts:**

#### PowerShell Scripts (Windows)
- `deploy-final.ps1` - Final deployment automation
- `diagnose-supabase.ps1` - Supabase diagnostic and setup
- `setup-supabase-vercel.ps1` - Setup Supabase + Vercel integration
- `setup-vercel-env.ps1` - Setup Vercel environment variables

#### Bash Scripts (Linux/macOS)
- `setup-supabase-vercel.sh` - Setup Supabase + Vercel integration
- `setup-vercel-env.sh` - Setup Vercel environment variables

**Usage:**

```bash
# PowerShell (Windows)
.\scripts\deployment\setup-vercel-env.ps1
.\scripts\deployment\deploy-final.ps1

# Bash (Linux/macOS)
bash scripts/deployment/setup-supabase-vercel.sh
bash scripts/deployment/setup-vercel-env.sh

# Diagnose Supabase
.\scripts\deployment\diagnose-supabase.ps1
```

### `/deprecated` - Deprecated Scripts
Legacy and outdated scripts (for reference only).

**Contents:**
- Old JavaScript implementations
- Legacy test scripts
- Replaced functionality

⚠️ **Note:** These are provided for reference. Use TypeScript versions or newer implementations when available.

**Deprecated Files:**
- `*.js` files (use `.ts` versions instead)
- Legacy test implementations
- Old setup procedures

## 🚀 Quick Start Guide

### Setting Up the Project

1. **Initialize Database:**
   ```bash
   pnpm tsx scripts/setup/setup-admin.ts
   pnpm tsx scripts/setup/setup-hierarchy.ts
   ```

2. **Verify Setup:**
   ```bash
   pnpm tsx scripts/utilities/list-users.ts
   pnpm tsx scripts/testing/test-prisma-connection.ts
   ```

3. **Create Test Data:**
   ```bash
   pnpm tsx scripts/utilities/create-test-users.ts
   pnpm tsx scripts/utilities/create-test-projects.ts
   ```

### Testing Features

```bash
# Test authentication
pnpm tsx scripts/testing/test-auth.ts

# Test chat system
pnpm tsx scripts/testing/test-chat-system.ts

# Test accent colors
pnpm tsx scripts/testing/test-accent-colors.ts
```

### Deployment

```bash
# Setup environment
.\scripts\deployment\setup-vercel-env.ps1

# Deploy
.\scripts\deployment\deploy-final.ps1
```

## 📋 Script Execution Order

### For New Environment Setup
1. `setup-admin.ts` - Create admin account first
2. `setup-hierarchy.ts` - Setup organizational roles
3. `create-test-users.ts` - Create test data
4. `test-auth.ts` - Verify everything works

### For Deployment
1. `setup-vercel-env.ps1` - Configure environment
2. `setup-supabase-vercel.ps1` - Link Supabase
3. `deploy-final.ps1` - Deploy application

### For Maintenance
1. `test-prisma-connection.ts` - Verify DB connection
2. Utility scripts as needed
3. Test scripts to verify changes

## 🔧 Running Scripts

### TypeScript Scripts
```bash
# Run a single script
pnpm tsx scripts/setup/setup-admin.ts

# Run with arguments (if supported)
pnpm tsx scripts/utilities/create-test-users.ts --count 5
```

### PowerShell Scripts
```powershell
# Run script
.\scripts\deployment\setup-vercel-env.ps1

# Run with parameters
.\scripts\deployment\deploy-final.ps1 -Environment production
```

### Bash Scripts
```bash
# Run script
bash scripts/deployment/setup-supabase-vercel.sh

# Run with parameters
bash scripts/deployment/setup-vercel-env.sh --environment production
```

## 🆘 Troubleshooting

### "Command not found" Error
- Ensure Node.js and pnpm are installed
- Verify script path is correct
- Check file permissions

### Database Connection Errors
- Run: `pnpm tsx scripts/testing/test-prisma-connection.ts`
- Check `.env` file for correct connection string
- Verify database is running and accessible

### Setup Script Failures
- Run diagnostics: `pnpm tsx scripts/utilities/list-users.ts`
- Check application logs
- Review script error messages

### Deployment Issues
- Run: `.\scripts\deployment\diagnose-supabase.ps1`
- Check Vercel dashboard for errors
- Verify environment variables are set

## 📞 Support

For script-related issues:
1. Check script comments and documentation
2. Review related docs in `/docs/`
3. Run diagnostic scripts (e.g., `test-prisma-connection.ts`)
4. Check application logs

---

**Last Updated:** October 21, 2025
