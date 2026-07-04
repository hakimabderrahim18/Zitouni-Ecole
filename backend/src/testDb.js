const mongoose = require('mongoose');
const User = require('./models/user.model');
const Teacher = require('./models/teacher.model');
const Student = require('./models/student.model');
const Parent = require('./models/parent.model');
const Class = require('./models/class.model');
const Group = require('./models/group.model');
const Announcement = require('./models/announcement.model');
const Payment = require('./models/payment.model');
require('dotenv').config();

const runDbTests = async () => {
  try {
    console.log('Connecting to database for diagnostics...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school');
    console.log('Connected! Starting queries...\n');

    // 1. Query: Fetch all students with their class, group and parent details
    console.log('Query 1: Fetching students with full academic population...');
    const students = await Student.find()
      .populate('user', 'firstName lastName email')
      .populate('class', 'name')
      .populate('group', 'name')
      .populate({ path: 'parent', populate: { path: 'user', select: 'firstName lastName' } })
      .limit(2);

    students.forEach((s, i) => {
      console.log(`  [Student #${i+1}]: ${s.user?.firstName} ${s.user?.lastName}`);
      console.log(`    Classe: ${s.class?.name} | Section: ${s.group?.name}`);
      console.log(`    Parent: ${s.parent?.user?.firstName} ${s.parent?.user?.lastName}`);
      console.log(`    Reg. Number: ${s.registrationNumber}`);
    });
    console.log('--------------------------------------------------\n');

    // 2. Query: Find parents and count children
    console.log('Query 2: Auditing Parents and children mappings...');
    const parentList = await Parent.find()
      .populate('user', 'firstName lastName')
      .populate({ path: 'children', populate: { path: 'user', select: 'firstName lastName' } })
      .limit(3);

    parentList.forEach((p, i) => {
      console.log(`  [Parent #${i+1}]: ${p.user?.firstName} ${p.user?.lastName} (Job: ${p.profession})`);
      console.log(`    Children Count: ${p.children.length}`);
      p.children.forEach(c => {
        console.log(`      - Child: ${c.user?.firstName} ${c.user?.lastName}`);
      });
    });
    console.log('--------------------------------------------------\n');

    // 3. Query: Feed/Announcements details (likes & comments count)
    console.log('Query 3: Fetching news feed posts with likes & nested comments count...');
    const feeds = await Announcement.find()
      .populate('publisher', 'firstName lastName role')
      .sort({ createdAt: -1 });

    feeds.forEach((post, i) => {
      console.log(`  [Post #${i+1}]: "${post.title}"`);
      console.log(`    Publisher: ${post.publisher?.firstName} ${post.publisher?.lastName} (${post.publisher?.role})`);
      console.log(`    Likes Count: ${post.likes.length}`);
      console.log(`    Comments Count: ${post.comments.length}`);
      post.comments.forEach((comment, cidx) => {
        console.log(`      Comment [${cidx+1}] by ${comment.userName}: "${comment.content}"`);
      });
    });
    console.log('--------------------------------------------------\n');

    // 4. Query: Payments status count
    console.log('Query 4: Summarizing system financial balances...');
    const totalPayments = await Payment.countDocuments();
    const paidPayments = await Payment.countDocuments({ status: 'Paid' });
    const pendingPayments = await Payment.countDocuments({ status: 'Pending' });

    console.log(`  Total Invoices Generated: ${totalPayments}`);
    console.log(`  Paid Invoices Count: ${paidPayments}`);
    console.log(`  Pending Invoices Count: ${pendingPayments}`);
    console.log('--------------------------------------------------\n');

    console.log('Database diagnostic tests completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Database query test error:', error);
    process.exit(1);
  }
};

runDbTests();
