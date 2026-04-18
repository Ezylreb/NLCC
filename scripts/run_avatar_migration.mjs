import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Updating avatar_customization schema...');
    
    const sql = fs.readFileSync(join(__dirname, 'update-avatar-schema.sql'), 'utf8');
    await pool.query(sql);
    
    console.log('✅ Avatar schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating avatar schema:', error);
    process.exit(1);
  }
}

runMigration();
