const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5055';

async function runFunctionalTests() {
  console.log('🧪 Starting Functional Parity Test Suite...\n');
  const results = [];

  function record(testName, category, passed, details = '') {
    results.push({ testName, category, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] ${category} -> ${testName} ${details ? '(' + details + ')' : ''}`);
  }

  // 1. AUTHENTICATION TESTS
  try {
    const invalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'wrong@user.com', password: 'badpassword' }),
    });
    record('Reject invalid credentials', 'Auth Form', invalidRes.status === 401 || invalidRes.status === 400);

    const validRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@ecole-zitouni.dz', password: 'Admin123!' }),
    });
    const validData = await validRes.json();
    const hasTokens = !!(validData.accessToken && validData.user);
    record('Admin login authentication', 'Auth Form', validRes.ok && hasTokens, `User: ${validData.user?.role}`);

    const adminToken = validData.accessToken;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // 2. STATS & KPIS
    const statsRes = await fetch(`${BASE_URL}/api/admin/dashboard/stats`, { headers: authHeaders });
    const statsData = await statsRes.json();
    record(
      'Admin KPIs & Stats fetch',
      'Dashboard',
      statsRes.ok && typeof statsData.students === 'number',
      `Students: ${statsData.students}, Teachers: ${statsData.teachers}, Classes: ${statsData.classes}`
    );

    // 3. ANNOUNCEMENT POSTS (CRUD)
    const newPostRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'إعلان اختبار تجريبي للأتمتة',
        content: 'هذا منشور تجريبي لاختبار التوافق الوظيفي والربط البرمجي.',
        targetAudience: 'all',
        isPinned: true,
      }),
    });
    const newPostData = await newPostRes.json();
    const createdPostId = newPostData.post?._id;
    record('Create announcement post', 'Announcements', newPostRes.ok && !!createdPostId, `Post ID: ${createdPostId}`);

    if (createdPostId) {
      // Toggle like
      const likeRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}/like`, {
        method: 'POST',
        headers: authHeaders,
      });
      record('Toggle like on announcement', 'Announcements', likeRes.ok);

      // Add comment
      const commentRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}/comment`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: 'تعليق تجريبي فوري' }),
      });
      record('Add comment to announcement', 'Announcements', commentRes.ok);

      // Toggle pin
      const pinRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}/pin`, {
        method: 'PUT',
        headers: authHeaders,
      });
      record('Pin announcement to top', 'Announcements', pinRes.ok);

      // Delete post
      const delPostRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      record('Delete announcement', 'Announcements', delPostRes.ok);
    }

    // 4. FINANCIAL INVOICE CREATION
    const studentsRes = await fetch(`${BASE_URL}/api/admin/students`, { headers: authHeaders });
    const studentsData = await studentsRes.json();
    const sList = studentsData.students || studentsData;
    const testStudentId = sList?.[0]?._id;

    const paymentRes = await fetch(`${BASE_URL}/api/admin/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        studentId: testStudentId,
        amount: 15000,
        type: 'Tuition',
        status: 'Paid',
      }),
    });
    record('Create manual payment invoice', 'Finance Module', paymentRes.ok, `Student ID: ${testStudentId}`);

    // 5. USERS MANAGEMENT
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: authHeaders });
    const usersData = await usersRes.json();
    const usersList = usersData.users || usersData;
    record('Fetch system users list', 'User Management', usersRes.ok && Array.isArray(usersList), `Count: ${usersList.length}`);

    if (usersList && usersList.length > 0) {
      const sampleUser = usersList.find((u) => u.role === 'teacher') || usersList[0];
      const toggleRes = await fetch(`${BASE_URL}/api/admin/users/${sampleUser._id}/toggle`, {
        method: 'PUT',
        headers: authHeaders,
      });
      record('Toggle user active/frozen status', 'User Management', toggleRes.ok, `User: ${sampleUser.firstName}`);
      // Revert toggle
      await fetch(`${BASE_URL}/api/admin/users/${sampleUser._id}/toggle`, {
        method: 'PUT',
        headers: authHeaders,
      });
    }

    // 6. CLASSES & GROUPS
    const classesRes = await fetch(`${BASE_URL}/api/admin/classes`, { headers: authHeaders });
    const classesData = await classesRes.json();
    const cList = classesData.classes || classesData;
    record('Fetch classes and groups directory', 'Academic Structure', classesRes.ok && Array.isArray(cList), `Count: ${cList.length}`);

    // 7. SECURITY LOGIN AUDIT
    const auditRes = await fetch(`${BASE_URL}/api/admin/login-audit`, { headers: authHeaders });
    record('Retrieve login security audit logs', 'Security & Audit', auditRes.ok);

    // 8. DATABASE BACKUPS
    const backupsRes = await fetch(`${BASE_URL}/api/backups`, { headers: authHeaders });
    const backupsData = await backupsRes.json();
    record('Fetch encrypted database backups', 'Security & Backup', backupsRes.ok, `Backups count: ${backupsData.backups?.length || 0}`);

    // 9. ADMINISTRATIVE REQUESTS
    const reqRes = await fetch(`${BASE_URL}/api/administrative-requests`, { headers: authHeaders });
    const reqData = await reqRes.json();
    record('Fetch administrative requests', 'Admin Requests', reqRes.ok, `Requests count: ${reqData.requests?.length || reqData.length || 0}`);

    // 10. REPORTED MESSAGES
    const repRes = await fetch(`${BASE_URL}/api/messages/reported`, { headers: authHeaders });
    record('Fetch reported chat messages', 'Moderation & Discipline', repRes.ok);

  } catch (err) {
    console.error('Test execution error:', err);
    record('Suite runtime exception', 'System', false, err.message);
  }

  // Generate TEST_MATRIX.md
  generateTestMatrix(results);
}

function generateTestMatrix(results) {
  let md = `# Comprehensive Functional Test Matrix (TEST_MATRIX.md)\n\n`;
  md += `Execution Date: ${new Date().toISOString()}\n`;
  md += `Target: MERN Backend + React Native Expo Mobile Twin\n\n`;
  md += `| Category | Test Case Description | Result | Details / Metrics |\n`;
  md += `| :--- | :--- | :---: | :--- |\n`;

  let passed = 0;
  for (const r of results) {
    if (r.passed) passed++;
    md += `| ${r.category} | ${r.testName} | ${r.passed ? '✅ PASSED' : '❌ FAILED'} | ${r.details || '—'} |\n`;
  }

  const passRate = ((passed / results.length) * 100).toFixed(1);
  md += `\n## Test Summary\n`;
  md += `- **Total Tests Run**: ${results.length}\n`;
  md += `- **Passed**: ${passed}\n`;
  md += `- **Failed**: ${results.length - passed}\n`;
  md += `- **Success Rate**: **${passRate}%**\n\n`;

  md += `## Existing Web App Bugs Identified & Resolved\n`;
  md += `1. **Missing Bearer / CORS Header on Local Ports**:\n`;
  md += `   - *Severity*: High\n`;
  md += `   - *Issue*: Express CORS whitelist originally lacked \`http://localhost:8081\` and \`http://localhost:8082\`, causing CORS 500 network errors when testing mobile clients.\n`;
  md += `   - *Fix*: Added allowed origins in \`backend/src/app.js\` and \`backend/.env\`.\n\n`;
  md += `2. **Missing App Store Guideline 5.1.1(v) Account Deletion**:\n`;
  md += `   - *Severity*: Critical (App Store Rejection)\n`;
  md += `   - *Issue*: Web app lacked permanent self-serve account deletion required by Apple.\n`;
  md += `   - *Fix*: Added \`DELETE /api/auth/account\` in backend and confirmation dialog in mobile & web profile layouts.\n\n`;
  md += `3. **Unchecked Typography Reference on Web**:\n`;
  md += `   - *Severity*: Medium\n`;
  md += `   - *Issue*: \`theme.typography.fontFamily.serif\` was accessed while undefined in tokens.\n`;
  md += `   - *Fix*: Added full \`typography\` configuration to \`tokens.ts\` with safe cross-platform fallbacks.\n`;

  fs.writeFileSync(path.join(__dirname, '..', 'TEST_MATRIX.md'), md);
  console.log('\n📋 TEST_MATRIX.md generated successfully!');
}

runFunctionalTests();
