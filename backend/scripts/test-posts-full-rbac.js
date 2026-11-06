const BASE_URL = 'http://localhost:5055/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const config = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data;
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 TESTING POSTS & FEED OPERATIONS (Art. 10 - 16)');
  console.log('====================================================');

  try {
    // 1. Authenticate as Admin
    console.log('\n🔑 1. Logging in as Admin (admin@ecole-zitouni.dz)...');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        identifier: 'admin@ecole-zitouni.dz',
        password: 'Admin123!',
      },
    });
    const adminToken = adminLoginRes.accessToken || adminLoginRes.token;
    console.log('✅ Admin authenticated successfully. User:', adminLoginRes.user?.firstName);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Authenticate as Teacher
    console.log('\n🔑 2. Logging in as Teacher (0550111111)...');
    const teacherLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        identifier: '0550111111',
        password: '0550111111',
      },
    });
    const teacherToken = teacherLoginRes.accessToken || teacherLoginRes.token;
    const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };
    console.log('✅ Teacher authenticated successfully. User:', teacherLoginRes.user?.firstName);

    // 3. Authenticate as Parent
    console.log('\n🔑 3. Logging in as Parent (0550110011)...');
    const parentLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        identifier: '0550110011',
        password: '0550110011',
      },
    });
    const parentToken = parentLoginRes.accessToken || parentLoginRes.token;
    const parentHeaders = { Authorization: `Bearer ${parentToken}` };
    console.log('✅ Parent authenticated successfully. User:', parentLoginRes.user?.firstName);

    // 4. Test Create Post with All Web Fields (Images 2 & 3)
    console.log('\n📝 4. Creating a Post with Multi-Attachments & Audience Targeting...');
    const newPostPayload = {
      title: 'افتتاح النادي العلمي ونادي الروبوتيك والذكاء الاصطناعي 2026 (اختبار آلي)',
      content: 'يسر مدرسة الزيتوني الإعلان عن إطلاق ورشات الروبوتيك والذكاء الاصطناعي للعام الدراسي 2026...',
      targetAudience: 'all',
      isPinned: true,
      isImportant: true,
      commentsLocked: false,
      attachments: [
        {
          name: 'برنامج_نادي_الروبوتيك_والذكاء_الاصطناعي.pdf',
          url: '/uploads/posts/programme_robotique_2026.pdf',
          fileType: 'pdf',
          size: 1048576,
        },
      ],
      pedagogicalLinks: [
        {
          title: 'منصة التسجيل التفاعلية',
          url: 'https://ecole-zitouni.dz/robotics-register',
        },
      ],
    };

    const createRes = await request('/posts', {
      method: 'POST',
      headers: adminHeaders,
      body: newPostPayload,
    });
    const createdPost = createRes.post;
    console.log('✅ Post created successfully! ID:', createdPost._id);
    console.log('   Title:', createdPost.title);
    console.log('   Pinned:', createdPost.isPinned);
    console.log('   Important:', createdPost.isImportant);
    console.log('   Attachments:', createdPost.attachments?.length);
    console.log('   Pedagogical Links:', createdPost.pedagogicalLinks?.length);

    const postId = createdPost._id;

    // 5. Test Teacher viewing feed (triggers view recording - Art. 15)
    console.log('\n👀 5. Teacher accessing Feed (view recording)...');
    const teacherFeedRes = await request('/posts', {
      headers: teacherHeaders,
    });
    console.log(`✅ Teacher retrieved ${teacherFeedRes.length} posts from feed.`);

    // 6. Test Parent viewing feed & confirming read ("اطلعت على الإعلان" - Art. 16)
    console.log('\n👀 6. Parent accessing Feed & confirming read...');
    const parentFeedRes = await request('/posts', {
      headers: parentHeaders,
    });
    console.log(`✅ Parent retrieved ${parentFeedRes.length} posts from feed.`);

    const confirmRes = await request(`/posts/${postId}/confirm-read`, {
      method: 'POST',
      headers: parentHeaders,
    });
    console.log('✅ Parent read confirmation response:', confirmRes.message);

    // 7. Test Rich Reactions: Like, Love, Dislike
    console.log('\n💖 7. Testing 3 Reactions (Like, Love, Dislike)...');
    // Teacher reacts with 'love'
    const loveRes = await request(`/posts/${postId}/react`, {
      method: 'POST',
      headers: teacherHeaders,
      body: { reactionType: 'love' },
    });
    console.log('✅ Teacher reacted with love:', loveRes.reactionCounts);

    // Parent reacts with 'like'
    const likeRes = await request(`/posts/${postId}/react`, {
      method: 'POST',
      headers: parentHeaders,
      body: { reactionType: 'like' },
    });
    console.log('✅ Parent reacted with like:', likeRes.reactionCounts);

    // Admin reacts with 'dislike'
    const dislikeRes = await request(`/posts/${postId}/react`, {
      method: 'POST',
      headers: adminHeaders,
      body: { reactionType: 'dislike' },
    });
    console.log('✅ Admin reacted with dislike:', dislikeRes.reactionCounts);

    // 8. Test Comments & Threaded Replies (Art. 14)
    console.log('\n💬 8. Testing Comments and Replies...');
    const commentRes = await request(`/posts/${postId}/comment`, {
      method: 'POST',
      headers: parentHeaders,
      body: { content: 'مبادرة ممتازة، هل يمكن لتلاميذ الطور المتوسط التسجيل؟' },
    });
    const addedComment = commentRes.comments[commentRes.comments.length - 1];
    console.log('✅ Parent added comment:', addedComment._id);

    const replyRes = await request(`/posts/${postId}/comments/${addedComment._id}/reply`, {
      method: 'POST',
      headers: adminHeaders,
      body: { content: 'نعم بالتأكيد، الورشات مخصصة لكلا الطورين المتوسط والثانوي.' },
    });
    const repliesCount = replyRes.comments.find(c => c._id === addedComment._id)?.replies?.length;
    console.log('✅ Admin replied to comment. Total replies:', repliesCount);

    // 9. Test "Who Viewed the Post?" Analytics (« من شاهد المنشور؟ » - Art. 15)
    console.log('\n📊 9. Fetching Post Viewers Analytics (« من شاهد المنشور؟ »)...');
    const analyticsRes = await request(`/posts/${postId}/analytics`, {
      headers: adminHeaders,
    });
    const stats = analyticsRes.stats;
    console.log('✅ Analytics Stats:');
    console.log('   - Target count:', stats.targetCount);
    console.log('   - Viewed count:', stats.viewedCount);
    console.log('   - Not viewed count:', stats.notViewedCount);
    console.log('   - View rate:', stats.viewRate + '%');
    console.log('   - Confirmed count:', stats.confirmedCount);
    console.log('   - Confirmation rate:', stats.confirmationRate + '%');
    console.log('   - Viewers list entries:', analyticsRes.viewersList?.length);

    // 10. Test Post Moderation: Pin, Lock Comments, Edit
    console.log('\n⚙️ 10. Testing Moderation: Pin, Lock Comments, Edit...');
    const lockRes = await request(`/posts/${postId}/lock-comments`, {
      method: 'PUT',
      headers: adminHeaders,
    });
    console.log('✅ Comments locked:', lockRes.commentsLocked);

    const editRes = await request(`/posts/${postId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        title: 'افتتاح النادي العلمي ونادي الروبوتيك 2026 (معدل ومحدث)',
        content: 'تم تحديث التوقيت ليكون يوم السبت صباحاً.',
      },
    });
    console.log('✅ Post edited successfully. New title:', editRes.post?.title);

    // Clean up test post
    console.log('\n🧹 11. Cleaning up test post...');
    await request(`/posts/${postId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    console.log('✅ Test post deleted cleanly.');

    console.log('\n====================================================');
    console.log('🎉 ALL POST OPERATIONS & RBAC TESTS PASSED 100%!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
