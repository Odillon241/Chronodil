# Chronodil App - Documentation Index

This index provides a complete overview of the organized documentation structure for the Chronodil App project.

## 📁 Directory Structure

### `/docs` - Main Documentation Folder

#### `/docs/supabase/` - Supabase Configuration & Migration
Database setup, configuration, and migration documentation from Neon to Supabase.

**Files:**
- `BETTER_AUTH_VS_SUPABASE_AUTH.md` - Comparison of Better Auth vs Supabase Auth
- `CHANGELOG_SUPABASE_MIGRATION.md` - Migration changelog
- `CONFIGURATION_FINALE_COMPLETE.md` - Complete Supabase configuration guide
- `FIX_ENV_CONNECTION.md` - Environment connection troubleshooting
- `MIGRATION_NEON_SUPABASE.md` - Detailed migration from Neon to Supabase
- `SUPABASE_CONFIGURATION.md` - Supabase setup guide
- `SUPABASE_CONNECTION_SETUP.md` - Connection setup instructions
- `SUPABASE_CREDENTIALS.md` - Credentials management
- `SUPABASE_DONE.md` - Migration completion status
- `SUPABASE_FINAL_SETUP.md` - Final setup checklist
- `SUPABASE_QUICKSTART.md` - Quick start guide
- `SUPABASE_SETUP_COMPLETE.md` - Setup completion verification
- `SYNC_ALL_SCHEMA_TO_SUPABASE.md` - Schema synchronization guide

#### `/docs/deployment/` - Deployment & Release Documentation
Deployment procedures for Vercel and other platforms.

**Files:**
- `DEPLOIEMENT_VERCEL.md` - Vercel deployment guide
- Additional deployment documentation

#### `/docs/setup/` - Setup & Getting Started
Initial setup and quick start guides.

**Files:**
- `SETUP_COMPLET_FINAL.md` - Complete setup guide

#### `/docs/features/` - Feature Documentation
Feature implementations and guides.

**Files:**
- `FIX_ADMIN_PASSWORD_GUIDE.md` - Admin password management guide
- `I18N_README.md` - Internationalization (i18n) documentation
- Plus existing feature docs from `/docs`

#### `/docs/reference/` - Reference Materials
Project specifications, requirements, and reference documents.

**Files:**
- `Cahier_des_Charges_Chronodil.pdf` - Project specifications (Cahier des charges)
- `palette de couleurs.txt` - Color palette reference

#### `/docs/config/` - Configuration Files
Configuration variables and environment setup.

**Files:**
- `VARIABLES_VERCEL.txt` - Vercel environment variables

#### `/docs/archived/` - Archived Documentation
Completed or outdated implementation notes and reference documents.

#### Other Docs Folders
- `/docs/chat/` - Chat system documentation
- `/docs/i18n/` - Internationalization guides
- `/docs/responsive/` - Responsive design documentation
- `/docs/themes/` - Theme and styling documentation
- `/docs/admin/` - Admin features and security
- `/docs/organizational/` - Organizational structure docs

---

### `/scripts` - Application Scripts

#### `/scripts/setup/` - Setup & Initialization Scripts
Database and application initialization scripts.

**Files:**
- `setup-admin.ts` - Admin account setup
- `setup-hierarchy.ts` - Organizational hierarchy setup
- `create-admin-direct.ts` - Direct admin creation
- `reset-and-create-admin.ts` - Reset and recreate admin
- `apply-admin-protection.ts` - Apply admin protection triggers
- `apply-directeur-role-migration.ts` - Director role migration

#### `/scripts/utilities/` - Utility & Helper Scripts
Common utility scripts for user management, data manipulation, etc.

**Files:**
- User creation scripts: `create-employee.ts`, `create-manager-account.ts`, etc.
- User role management: `update-user-role.ts`, `assign-manager-to-admin.ts`, etc.
- Data checking scripts: `list-users.ts`, `check-projects.ts`, etc.
- Password utilities: `set-admin-password.ts`, `generate-bcrypt-hash.ts`
- Cleanup: `cleanup-failed-migration.ts`, `clean-blob-urls.ts`

#### `/scripts/testing/` - Testing Scripts
Test and validation scripts for features and functionality.

**Files:**
- `test-auth.ts` - Authentication testing
- `test-chat-system.ts` - Chat system testing
- `test-chat-actions.ts` - Chat action testing
- `test-validation.ts` - Validation testing
- `test-accent-colors.ts` - Accent color testing
- `test-accent-color-visual.html` - Visual accent color test
- `test-general-settings.ts` - General settings testing
- `test-prisma-connection.ts` - Database connection testing

#### `/scripts/deployment/` - Deployment & DevOps Scripts
Deployment automation and configuration scripts.

**Files:**
- `deploy-final.ps1` - Final deployment script (PowerShell)
- `diagnose-supabase.ps1` - Supabase diagnostics (PowerShell)
- `setup-supabase-vercel.ps1` - Supabase Vercel setup (PowerShell)
- `setup-supabase-vercel.sh` - Supabase Vercel setup (Bash)
- `setup-vercel-env.ps1` - Vercel environment setup (PowerShell)
- `setup-vercel-env.sh` - Vercel environment setup (Bash)

#### `/scripts/deprecated/` - Deprecated Scripts
Legacy and outdated scripts (for reference only).

**Files:**
- Old JavaScript implementations
- Legacy test and setup scripts
- Note: Use TypeScript versions instead when available

---

### `/sql-scripts` - SQL Scripts & Database Utilities

#### `/sql-scripts/admin/` - Admin Account Management
Scripts for admin user creation and management.

**Files:**
- `DELETE_ADMIN.sql` - Delete admin account (with protection)
- `FIX_ADMIN_PASSWORD.sql` - Reset admin password
- `FIX_ADMIN_VIA_BETTER_AUTH.sql` - Admin fixes via Better Auth
- `SET_ADMIN_ROLE.sql` - Set admin role
- `TEST_BETTER_AUTH_MANUAL.sql` - Manual Better Auth testing
- `protect-admin.sql` - Admin protection trigger setup

#### `/sql-scripts/diagnostics/` - Diagnostic & Verification Scripts
Scripts for database diagnostics and verification.

**Files:**
- `CHECK_MULTIPLE_ACCOUNTS.sql` - Check for multiple accounts
- `CHECK_PASSWORD_HASH.sql` - Verify password hashes
- `DIAGNOSE_USER.sql` - User account diagnostics
- `VERIFY_ALL_TABLES.sql` - Verify all database tables
- `VERIFY_COMPLETE_SYNC.sql` - Verify complete data synchronization
- `FIX_USER_LOCATION.sql` - Fix user location data

#### `/sql-scripts/schema-migrations/` - Schema Migrations & Setup
Database schema migrations and initial setup scripts.

**Files:**
- `ADD_MISSING_TASK_COLUMNS.sql` - Add task columns
- `FIX_COMPLETE_SYNC.sql` - Complete synchronization fix
- `FIX_MISSING_TABLES_ONLY.sql` - Fix missing tables
- `FULL_SCHEMA_MIGRATION.sql` - Complete schema migration
- `temp_migration.sql` - Temporary migration script
- `add-directeur-role.sql` - Add director role
- `reset-and-create-admin.sql` - Reset and setup admin
- `reset-db.sql` - Database reset

#### `/sql-scripts/reference/` - Reference Scripts
Reference and example SQL scripts.

**Files:**
- `UPDATE_PROVIDER_ID.sql` - Update provider IDs

#### `/sql-scripts/archived/` - Archived SQL Scripts
Old or completed migration scripts.

---

## 🔍 Quick Navigation

### By Use Case

**Setting Up the Project:**
1. Read: `/docs/supabase/SUPABASE_QUICKSTART.md`
2. Read: `/docs/setup/SETUP_COMPLET_FINAL.md`
3. Run: `/scripts/setup/setup-admin.ts`

**Deploying to Vercel:**
1. Read: `/docs/deployment/DEPLOIEMENT_VERCEL.md`
2. Configure: `/docs/config/VARIABLES_VERCEL.txt`
3. Run: `/scripts/deployment/deploy-final.ps1`

**Managing Users & Roles:**
1. Scripts: `/scripts/utilities/` (see available scripts)
2. Documentation: `/docs/features/`

**Testing:**
1. Explore: `/scripts/testing/`
2. Run relevant test script

**Database Maintenance:**
1. Diagnostics: `/sql-scripts/diagnostics/`
2. Migrations: `/sql-scripts/schema-migrations/`

### By File Type

**Documentation (Markdown):**
- Main docs: `/docs/`
- Supabase: `/docs/supabase/`
- Deployment: `/docs/deployment/`
- Features: `/docs/features/`
- Reference: `/docs/reference/`

**TypeScript Scripts:**
- Setup: `/scripts/setup/`
- Utilities: `/scripts/utilities/`
- Testing: `/scripts/testing/`

**SQL Scripts:**
- Admin: `/sql-scripts/admin/`
- Diagnostics: `/sql-scripts/diagnostics/`
- Migrations: `/sql-scripts/schema-migrations/`

**Configuration:**
- `/docs/config/`

---

## 📋 File Organization Summary

| Category | Location | Type | Purpose |
|----------|----------|------|---------|
| **Supabase Docs** | `/docs/supabase/` | MD | Database configuration & migration |
| **Deployment Docs** | `/docs/deployment/` | MD | Release & deployment guides |
| **Setup Guides** | `/docs/setup/` | MD | Initial project setup |
| **Feature Docs** | `/docs/features/` | MD | Feature implementation guides |
| **Reference** | `/docs/reference/` | PDF, TXT | Project specs & resources |
| **Configuration** | `/docs/config/` | TXT | Environment & config variables |
| **Setup Scripts** | `/scripts/setup/` | TS | Project initialization |
| **Utilities** | `/scripts/utilities/` | TS | Helper & utility scripts |
| **Tests** | `/scripts/testing/` | TS, HTML | Test scripts |
| **Deployment** | `/scripts/deployment/` | PS1, SH | DevOps automation |
| **Admin SQL** | `/sql-scripts/admin/` | SQL | Admin management |
| **Diagnostics** | `/sql-scripts/diagnostics/` | SQL | Database verification |
| **Migrations** | `/sql-scripts/schema-migrations/` | SQL | Schema changes |

---

## 📌 Important Notes

1. **Deprecated Scripts**: Old JavaScript files are moved to `/scripts/deprecated/`. Prefer TypeScript versions when available.
2. **SQL Scripts**: Always review SQL scripts before executing in production.
3. **Environment Configuration**: Update `/docs/config/VARIABLES_VERCEL.txt` before deployment.
4. **Database Backups**: Always backup your database before running migration scripts.

---

**Last Updated:** October 21, 2025
**Project:** Chronodil App
