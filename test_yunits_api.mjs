// Test script to call the yunits API directly
async function testYunitsAPI() {
  try {
    const bahagiId = 15; // Pagkilala sa Sarili
    
    console.log(`🔍 Fetching yunits for bahagi ID: ${bahagiId}`);
    console.log(`📡 URL: http://localhost:3000/api/rest/yunits?bahagiId=${bahagiId}\n`);
    
    const response = await fetch(`http://localhost:3000/api/rest/yunits?bahagiId=${bahagiId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`\n✅ Found ${data.data.length} yunits`);
      data.data.forEach((yunit, i) => {
        console.log(`\n${i + 1}. ${yunit.title}`);
        console.log(`   ID: ${yunit.id}`);
        console.log(`   Subtitle: ${yunit.subtitle || 'N/A'}`);
      });
    } else {
      console.log('\n❌ No yunits found or error occurred');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testYunitsAPI();
