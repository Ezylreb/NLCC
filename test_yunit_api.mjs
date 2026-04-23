// Test the API endpoint directly
async function testAPI() {
  try {
    const bahagiId = 15; // Pagkilala sa Sarili
    
    console.log(`Testing API: GET /api/rest/yunits?bahagiId=${bahagiId}`);
    
    const response = await fetch(`http://localhost:3000/api/rest/yunits?bahagiId=${bahagiId}`);
    const data = await response.json();
    
    console.log('\n📡 API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`\n✅ API returned ${data.data.length} yunits`);
      data.data.forEach((yunit, i) => {
        console.log(`\n${i + 1}. ${yunit.title}`);
        console.log(`   ID: ${yunit.id}`);
        console.log(`   Bahagi ID: ${yunit.bahagi_id}`);
      });
    } else {
      console.log('\n❌ API returned no data or error');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
