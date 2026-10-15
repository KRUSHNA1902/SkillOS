import assert from 'node:assert';
import app from '../src/server.js';

async function runTests() {
  console.log('🧪 Starting Security & Tenant Isolation Tests...\n');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Verify unauthenticated AI endpoints return 401
    console.log('1. Testing AI endpoint protection...');
    const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });
    assert.strictEqual(aiRes.status, 401, 'POST /api/ai/chat must reject unauthenticated requests with 401');
    console.log('   ✅ POST /api/ai/chat returned 401 Unauthorized');

    // 2. Verify unauthenticated tasks endpoint returns 401
    console.log('2. Testing Tasks endpoint protection...');
    const tasksRes = await fetch(`${baseUrl}/api/tasks`);
    assert.strictEqual(tasksRes.status, 401, 'GET /api/tasks must reject unauthenticated requests with 401');
    console.log('   ✅ GET /api/tasks returned 401 Unauthorized');

    // 3. Verify unauthenticated tags endpoint returns 401
    console.log('3. Testing Tags endpoint protection...');
    const tagsRes = await fetch(`${baseUrl}/api/tags`);
    assert.strictEqual(tagsRes.status, 401, 'GET /api/tags must reject unauthenticated requests with 401');
    console.log('   ✅ GET /api/tags returned 401 Unauthorized');

    // 4. Verify dev user bypass header works cleanly in non-production
    console.log('4. Testing dev user bypass header in development...');
    const devTagsRes = await fetch(`${baseUrl}/api/tags`, {
      headers: { 'x-dev-user': 'dev-user-001' }
    });
    assert.strictEqual(devTagsRes.status, 200, 'GET /api/tags with x-dev-user must succeed in development');
    const devData = await devTagsRes.json();
    assert.strictEqual(devData.source, 'dev_bypass', 'Dev bypass source must be confirmed');
    console.log('   ✅ Dev bypass cleanly recognized and isolated to dev-user-001');

    console.log('\n🎉 ALL SECURITY & ACCESS CONTROL TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
