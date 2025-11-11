# Database Backup Guide

## Quick Backup

Your Supabase project is already backed up in several ways:

### 1. **Schema Migrations** (Already in your repo)
- Location: `supabase/migrations/`
- Contains: All table structures, functions, triggers, policies
- This is your complete schema backup

### 2. **Edge Functions** (Already in your repo)
- Location: `supabase/functions/`
- Contains: All serverless functions

### 3. **Export Data** (Run script to create)

To export all your data:

```bash
# Install dependencies if needed
npm install

# Run the export script
npx tsx scripts/export-database-backup.ts
```

This will create a backup in `backups/backup-[timestamp]/` with:
- `data-backup.json` - All your table data
- `metadata.json` - Backup information

## What Gets Backed Up

### Schema (Already saved in migrations):
- Tables and columns
- Indexes
- Functions
- Triggers
- RLS policies
- Constraints

### Data (Run export script):
- All rows from all tables
- JSON format for easy import

### Not Automatically Backed Up:
- Storage bucket files (avatars, data)
- Secrets/environment variables
- Auth users (these are in Supabase's auth schema)

## Restore Process

If you need to restore:

1. **Schema**: Migrations are automatically applied when you deploy
2. **Data**: Use the JSON backup file to re-import via SQL or Supabase client
3. **Functions**: Already in your repo, auto-deployed

## Manual SQL Backup (Alternative)

You can also use `pg_dump` if you have direct database access:

```bash
pg_dump -h [your-db-host] -U postgres -F c -b -v -f backup.dump [database-name]
```

## Automated Backups

Supabase provides:
- Daily automatic backups (retained for 7 days on free tier)
- Point-in-time recovery (Pro plan and above)

## Storage Backup

To backup storage buckets, you'd need to download files via the Supabase Storage API.

## Need Help?

The backup script exports all your data. Combined with your existing migrations and functions in the repo, you have a complete backup of your project structure and data.
