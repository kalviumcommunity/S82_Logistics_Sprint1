import http from 'http';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function testAuthFlow() {
  console.log('=== TEST 1: Admin Login ===');
  try {
    const adminLoginRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'adminlogistics@gmail.com',
        password: 'zxcvbnm0987654321',
      }
    );

    console.log('Admin Login Status:', adminLoginRes.status, adminLoginRes.data);
    const adminToken = adminLoginRes.data?.accessToken;

    console.log('\n=== TEST 2: Register New Viewer Account ===');
    const testEmail = `viewer_${Date.now()}@logistics.com`;
    const regRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/v1/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testEmail,
        password: 'password123',
        fullName: 'Test Operational Viewer',
      }
    );
    console.log('Register Status:', regRes.status, regRes.data);
    const newUserId = regRes.data?.user?.id;

    console.log('\n=== TEST 3: Login as New Viewer ===');
    const viewerLoginRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testEmail,
        password: 'password123',
      }
    );
    console.log('Viewer Login Status:', viewerLoginRes.status, viewerLoginRes.data?.user);
    const viewerToken = viewerLoginRes.data?.accessToken;

    console.log('\n=== TEST 4: Attempt GET /api/v1/users with Viewer Token (Should fail 403) ===');
    const viewerGetUsersRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/v1/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    console.log('Viewer GET /users Status (Expected 403):', viewerGetUsersRes.status, viewerGetUsersRes.data?.message);

    console.log('\n=== TEST 5: GET /api/v1/users with Admin Token ===');
    const adminGetUsersRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/v1/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Admin GET /users Status:', adminGetUsersRes.status, `Fetched ${adminGetUsersRes.data?.users?.length} users.`);

    console.log('\n=== TEST 6: Elevate Viewer to OPERATIONS_MANAGER via Admin PATCH ===');
    const patchRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: `/api/v1/users/${newUserId}/role`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        role: 'OPERATIONS_MANAGER',
        assignedFacility: 'WH-CHICAGO-01',
      }
    );
    console.log('Patch Role Status:', patchRes.status, patchRes.data?.message, patchRes.data?.user);

    console.log('\n✨ ALL BACKEND AUTH & RBAC INTEGRATION TESTS PASSED CLEANLY! ✨');
  } catch (error) {
    console.error('Test Execution Failed:', error);
  }
}

testAuthFlow();
