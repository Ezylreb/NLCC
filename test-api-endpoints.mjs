#!/usr/bin/env node

// Simple API endpoint tester
const BASE_URL = "http://localhost:3000";
const STUDENT_ID = "test-student-123";

async function testEndpoint(method, path) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "x-student-id": STUDENT_ID,
        "Content-Type": "application/json",
      },
    });

    const statusOk = response.status === 200 || response.status === 201;
    const data = await response.json();

    console.log(`\n✓ ${method} ${path}`);
    console.log(`  Status: ${response.status} ${statusOk ? "✅" : "❌"}`);
    console.log(
      `  Response: ${JSON.stringify(data).substring(0, 100)}${
        JSON.stringify(data).length > 100 ? "..." : ""
      }`
    );

    return statusOk;
  } catch (error) {
    console.log(
      `\n❌ ${method} ${path} - Error: ${error.message}`
    );
    return false;
  }
}

async function runTests() {
  console.log("🧪 Testing Student API Endpoints");
  console.log("================================\n");

  const tests = [
    ["GET", "/api/student/leaderboard?timeframe=week"],
    ["GET", "/api/student/missions"],
    ["GET", "/api/student/shop-items"],
    ["GET", "/api/student/stats"],
    ["GET", "/api/student/teacher-info?studentId=" + STUDENT_ID],
    ["GET", "/api/student/enrolled-classes?studentId=" + STUDENT_ID],
  ];

  let passed = 0;
  let failed = 0;

  for (const [method, path] of tests) {
    const result = await testEndpoint(method, path);
    if (result) passed++;
    else failed++;
  }

  console.log(`\n\n📊 Test Results: ${passed} passed, ${failed} failed`);

  // Test POST endpoint
  console.log("\n--- Testing POST Endpoints ---");
  try {
    const purchaseResponse = await fetch(
      `${BASE_URL}/api/student/shop-items/purchase`,
      {
        method: "POST",
        headers: {
          "x-student-id": STUDENT_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: "avatar-001",
          quantity: 1,
        }),
      }
    );

    const purchaseOk = purchaseResponse.status === 200;
    const purchaseData = await purchaseResponse.json();

    console.log(`\n✓ POST /api/student/shop-items/purchase`);
    console.log(`  Status: ${purchaseResponse.status} ${purchaseOk ? "✅" : "❌"}`);
    console.log(
      `  Response: ${JSON.stringify(purchaseData).substring(0, 100)}${
        JSON.stringify(purchaseData).length > 100 ? "..." : ""
      }`
    );

    if (purchaseOk) passed++;
    else failed++;
  } catch (error) {
    console.log(`\n❌ POST /api/student/shop-items/purchase - Error: ${error.message}`);
    failed++;
  }

  console.log(`\n\n📊 Final Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// Wait a moment for server to be ready
setTimeout(runTests, 3000);
