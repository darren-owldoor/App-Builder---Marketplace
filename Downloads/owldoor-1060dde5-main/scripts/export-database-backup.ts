import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TABLES = [
  'profiles',
  'user_roles',
  'clients',
  'pros',
  'leads',
  'matches',
  'bids',
  'market_coverage',
  'conversations',
  'campaign_templates',
  'campaign_assignments',
  'campaign_responses',
  'support_tickets',
  'pricing_packages',
  'credit_transactions',
  'payment_activity_log',
  'blog_posts',
  'custom_fields',
  'custom_field_values',
];

async function exportTable(tableName: string) {
  console.log(`Exporting ${tableName}...`);
  
  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error(`Error exporting ${tableName}:`, error);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allData = allData.concat(data);
    page++;
    
    if (data.length < pageSize) break;
  }
  
  console.log(`  ✓ Exported ${allData.length} rows from ${tableName}`);
  return allData;
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  console.log(`Creating backup in: ${backupDir}\n`);
  
  const backup: Record<string, any[]> = {};
  
  // Export all tables
  for (const table of TABLES) {
    try {
      backup[table] = await exportTable(table);
    } catch (error) {
      console.error(`Failed to export ${table}:`, error);
      backup[table] = [];
    }
  }
  
  // Save as JSON
  const jsonPath = path.join(backupDir, 'data-backup.json');
  fs.writeFileSync(jsonPath, JSON.stringify(backup, null, 2));
  console.log(`\n✓ Data backup saved to: ${jsonPath}`);
  
  // Save metadata
  const metadata = {
    timestamp,
    supabase_url: SUPABASE_URL,
    tables: Object.keys(backup).map(table => ({
      name: table,
      row_count: backup[table].length
    })),
    total_rows: Object.values(backup).reduce((sum, rows) => sum + rows.length, 0)
  };
  
  const metadataPath = path.join(backupDir, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`✓ Metadata saved to: ${metadataPath}`);
  
  console.log(`\n✅ Backup complete!`);
  console.log(`   Total tables: ${TABLES.length}`);
  console.log(`   Total rows: ${metadata.total_rows}`);
  console.log(`\nBackup location: ${backupDir}`);
}

main().catch(console.error);
