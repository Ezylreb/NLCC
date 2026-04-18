import { query } from './lib/db.ts';

async function checkSchema() {
    console.log('=== Checking class_enrollments table schema ===');
    const schema = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'class_enrollments'
        ORDER BY ordinal_position
    `);
    
    console.log('Columns:', JSON.stringify(schema.rows, null, 2));
    
    console.log('\n=== Sample data ===');
    const sample = await query('SELECT * FROM class_enrollments LIMIT 3');
    console.log(JSON.stringify(sample.rows, null, 2));
}

checkSchema().catch(console.error).finally(() => process.exit());
