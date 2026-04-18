// Test the admin classes API to see what it returns

const baseUrl = 'http://localhost:3000';

async function testClassesAPI() {
    try {
        console.log('=== Testing GET /api/admin/classes (all classes) ===');
        const response = await fetch(`${baseUrl}/api/admin/classes`);
        const data = await response.json();
        
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data?.classes) {
            console.log('\n=== Classes returned ===');
            data.data.classes.forEach((cls, idx) => {
                console.log(`\nClass ${idx + 1}:`);
                console.log('  ID:', cls.id);
                console.log('  Name:', cls.name);
                console.log('  Teacher ID:', cls.teacher_id);
                console.log('  Teacher Name:', cls.teacherName);
                console.log('  Display Name:', cls.displayName);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testClassesAPI();
