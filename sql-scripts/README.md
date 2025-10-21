# SQL Scripts - Database Utilities

This folder contains organized SQL scripts for database management, maintenance, and troubleshooting.

## 📁 Organization

### `/admin` - Admin Account Management
Scripts for managing admin user accounts and permissions.

- `DELETE_ADMIN.sql` - Remove admin account (with safeguards)
- `FIX_ADMIN_PASSWORD.sql` - Reset admin password
- `FIX_ADMIN_VIA_BETTER_AUTH.sql` - Admin fixes using Better Auth
- `SET_ADMIN_ROLE.sql` - Assign admin role to user
- `TEST_BETTER_AUTH_MANUAL.sql` - Manual Better Auth testing
- `protect-admin.sql` - Create admin protection trigger

### `/diagnostics` - Database Diagnostics & Verification
Scripts to verify database integrity and diagnose issues.

- `CHECK_MULTIPLE_ACCOUNTS.sql` - Identify duplicate accounts
- `CHECK_PASSWORD_HASH.sql` - Verify password hash status
- `DIAGNOSE_USER.sql` - Get comprehensive user diagnostics
- `VERIFY_ALL_TABLES.sql` - Verify all required tables exist
- `VERIFY_COMPLETE_SYNC.sql` - Verify complete data synchronization
- `FIX_USER_LOCATION.sql` - Fix user location data issues

### `/schema-migrations` - Schema Changes & Migrations
Scripts for database schema modifications and setup.

- `ADD_MISSING_TASK_COLUMNS.sql` - Add missing task-related columns
- `FIX_COMPLETE_SYNC.sql` - Fix and synchronize schema
- `FIX_MISSING_TABLES_ONLY.sql` - Create missing tables only
- `FULL_SCHEMA_MIGRATION.sql` - Complete schema migration
- `temp_migration.sql` - Temporary migration script
- `add-directeur-role.sql` - Add director role
- `reset-and-create-admin.sql` - Reset and setup admin
- `reset-db.sql` - Complete database reset

### `/reference` - Reference Scripts
Reference and example SQL scripts.

- `UPDATE_PROVIDER_ID.sql` - Update authentication provider IDs

## ⚠️ Important Guidelines

### Before Executing SQL Scripts

1. **BACKUP YOUR DATABASE** - Always create a backup before running any SQL script
2. **TEST IN DEVELOPMENT** - Test scripts in a development environment first
3. **READ THE SCRIPT** - Review the entire script before execution
4. **CHECK DEPENDENCIES** - Verify that all referenced tables/functions exist
5. **RUN SEQUENTIALLY** - Don't run multiple migration scripts simultaneously

### Execution Order

For full schema setup, execute in this order:
1. Schema migrations (`/schema-migrations`) - in filename order
2. Admin setup (`/admin/protect-admin.sql`)
3. Diagnostics to verify (`/diagnostics/VERIFY_ALL_TABLES.sql`)

### Using with Supabase

```bash
# Connect to Supabase PostgreSQL
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Run a script
\i sql-scripts/admin/DELETE_ADMIN.sql
```

### Using with Local PostgreSQL

```bash
# Connect to local database
psql -U postgres -d chronodil_db -h localhost

# Run a script
\i sql-scripts/admin/DELETE_ADMIN.sql
```

## 🔍 Common Tasks

### Verify Database Health
```bash
psql -f sql-scripts/diagnostics/VERIFY_ALL_TABLES.sql
psql -f sql-scripts/diagnostics/VERIFY_COMPLETE_SYNC.sql
```

### Reset Admin Account
```bash
# First diagnose
psql -f sql-scripts/diagnostics/DIAGNOSE_USER.sql

# Then fix
psql -f sql-scripts/admin/FIX_ADMIN_PASSWORD.sql
```

### Migrate Schema
```bash
# Run in order
psql -f sql-scripts/schema-migrations/FULL_SCHEMA_MIGRATION.sql
psql -f sql-scripts/admin/protect-admin.sql
```

## 📋 Quick Reference

| Script | Purpose | Risk Level | Requires Backup |
|--------|---------|------------|-----------------|
| VERIFY_ALL_TABLES.sql | Check schema integrity | 🟢 Low | No |
| DIAGNOSE_USER.sql | User diagnostics | 🟢 Low | No |
| CHECK_PASSWORD_HASH.sql | Verify passwords | 🟢 Low | No |
| ADD_MISSING_TASK_COLUMNS.sql | Add columns | 🟡 Medium | **Yes** |
| FIX_ADMIN_PASSWORD.sql | Reset password | 🟡 Medium | **Yes** |
| FULL_SCHEMA_MIGRATION.sql | Complete migration | 🔴 High | **Yes** |
| DELETE_ADMIN.sql | Remove admin | 🔴 High | **Yes** |

## 🆘 Troubleshooting

### Connection Issues
- Verify credentials in connection string
- Check database URL format
- Ensure VPN/IP whitelist if using Supabase

### Permission Errors
- Verify user has sufficient privileges
- Check role assignments
- May need to use a superuser account

### Script Execution Errors
- Check if all referenced tables exist
- Verify the script matches your database schema version
- Look for dependent scripts that need to run first

## 📞 Support

For issues with specific scripts:
1. Check the script contents for comments
2. Review related documentation in `/docs/supabase/`
3. Run diagnostic scripts to identify problems
4. Check application logs for context

---

**Last Updated:** October 21, 2025
