import dotenv from 'dotenv';
dotenv.config();
import { query } from './lib/db.ts';

try {
  const result = await query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'yunits' 
    ORDER BY ordinal_position
  `);
  
  console.log('YUNITS TABLE SCHEMA:');
  result.rows.forEach(row => {
    console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
  });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
