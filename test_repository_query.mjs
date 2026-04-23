import { config } from 'dotenv';
config({ path: '.env.local' });

// Import the repository
import { repositories } from './lib/database/repository.js';

async function testRepositoryQuery() {
  try {
    console.log('🧪 Testing repository.lesson.findAll() directly\n');
    
    const bahagiId = '15'; // String, as it comes from URL
    console.log('Input bahagiId:', bahagiId, 'type:', typeof bahagiId);
    
    const result = await repositories.lesson.findAll({
      where: { bahagi_id: bahagiId },
      orderBy: 'lesson_order ASC, created_at ASC',
    });
    
    console.log('\n📊 Result:');
    console.log('Count:', result.length);
    
    if (result.length > 0) {
      console.log('\n✅ Found lessons:');
      result.forEach((lesson, i) => {
        console.log(`${i + 1}. ${lesson.title}`);
        console.log(`   ID: ${lesson.id}, bahagi_id: ${lesson.bahagi_id}`);
      });
    } else {
      console.log('\n❌ No lessons found');
    }
    
    // Also try with integer
    console.log('\n\n🔄 Trying with integer bahagiId:');
    const result2 = await repositories.lesson.findAll({
      where: { bahagi_id: 15 },
      orderBy: 'lesson_order ASC, created_at ASC',
    });
    console.log('Count:', result2.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRepositoryQuery();
