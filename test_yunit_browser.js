// Quick test - paste this in browser console while on the app
async function testYunitAPI() {
  const bahagiId = 15;
  console.log('🧪 Testing Yunit API for bahagi:', bahagiId);
  
  try {
    const response = await fetch(`/api/rest/yunits?bahagiId=${bahagiId}`);
    const data = await response.json();
    
    console.log('📡 Response:', data);
    console.log('✅ Success:', data.success);
    console.log('📊 Data count:', data.data?.length);
    
    if (data.data && data.data.length > 0) {
      console.log('📝 First yunit:', data.data[0]);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testYunitAPI();
