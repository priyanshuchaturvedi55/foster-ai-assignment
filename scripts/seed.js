const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/user.model');
const Lead = require('../src/models/lead.model');

const seedData = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${env.MONGO_URI}...`);
    await mongoose.connect(env.MONGO_URI);
    console.log('[Seed] Connected successfully.');

    // Clear existing collections
    console.log('[Seed] Clearing existing Users and Leads collections...');
    await User.deleteMany({});
    await Lead.deleteMany({});

    // Create Counselors
    console.log('[Seed] Creating demo counselor accounts...');
    const counselor1 = await User.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@foster.ai',
      password: 'Password123!',
      role: 'counselor'
    });

    const counselor2 = await User.create({
      name: 'Vikram Aditya',
      email: 'vikram.aditya@foster.ai',
      password: 'Password123!',
      role: 'counselor'
    });

    console.log(`[Seed] Created counselors: ${counselor1.email}, ${counselor2.email}`);

    // Create Unclaimed Public Enquiries
    console.log('[Seed] Creating sample unclaimed public enquiries...');
    const unclaimedLeads = [
      {
        name: 'Aarav Patel',
        email: 'aarav.patel@gmail.com',
        phone: '+919876500001',
        courseInterest: 'Full Stack Web Development',
        message: 'Looking for a 6-month weekend bootcamp with placement assistance.',
        source: 'online_form',
        isClaimed: false,
        claimedBy: null,
        claimedAt: null,
        status: 'UNCLAIMED'
      },
      {
        name: 'Ananya Gupta',
        email: 'ananya.gupta@yahoo.com',
        phone: '+919876500002',
        courseInterest: 'AI & Machine Learning Specialization',
        message: 'Has 2 years python experience, wants advanced GenAI & LLM curriculum.',
        source: 'online_form',
        isClaimed: false,
        claimedBy: null,
        claimedAt: null,
        status: 'UNCLAIMED'
      },
      {
        name: 'Rohan Mehra',
        email: 'rohan.mehra@gmail.com',
        phone: '+919876500003',
        courseInterest: 'Cloud & DevOps Engineering',
        message: 'Inquiring about AWS / Kubernetes certification track.',
        source: 'counselor_link',
        isClaimed: false,
        claimedBy: null,
        claimedAt: null,
        status: 'UNCLAIMED'
      },
      {
        name: 'Ishita Kapoor',
        email: 'ishita.kapoor@gmail.com',
        phone: '+919876500004',
        courseInterest: 'Data Science & Business Analytics',
        message: 'Wants to transition from financial analyst to data scientist.',
        source: 'online_form',
        isClaimed: false,
        claimedBy: null,
        claimedAt: null,
        status: 'UNCLAIMED'
      },
      {
        name: 'Kabir Singhania',
        email: 'kabir.s@gmail.com',
        phone: '+919876500005',
        courseInterest: 'Full Stack Web Development',
        message: 'Final year CSE undergraduate looking for internships.',
        source: 'referral',
        isClaimed: false,
        claimedBy: null,
        claimedAt: null,
        status: 'UNCLAIMED'
      }
    ];

    await Lead.insertMany(unclaimedLeads);

    // Create Claimed Leads (for Priya Sharma)
    console.log('[Seed] Creating sample pre-claimed leads for Priya Sharma...');
    const claimedLeads = [
      {
        name: 'Sameer Joshi',
        email: 'sameer.j@outlook.com',
        phone: '+919876500006',
        courseInterest: 'Cyber Security Essentials',
        message: 'Connected yesterday, shared curriculum via WhatsApp.',
        source: 'counselor_link',
        isClaimed: true,
        claimedBy: counselor1._id,
        claimedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        status: 'CLAIMED'
      },
      {
        name: 'Deepika Nair',
        email: 'deepika.nair@gmail.com',
        phone: '+919876500007',
        courseInterest: 'UI/UX Product Design',
        message: 'Interested in evening batches starting next month.',
        source: 'online_form',
        isClaimed: true,
        claimedBy: counselor1._id,
        claimedAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
        status: 'CONTACTED'
      }
    ];

    await Lead.insertMany(claimedLeads);

    console.log('\n======================================================');
    console.log('✅ Demo Seed Data Loaded Successfully!');
    console.log('======================================================');
    console.log('Demo Counselors:');
    console.log('  1) priya.sharma@foster.ai   / Password: Password123!');
    console.log('  2) vikram.aditya@foster.ai  / Password: Password123!');
    console.log('Sample Leads:');
    console.log(`  - 5 Unclaimed Public Enquiries`);
    console.log(`  - 2 Claimed Enquiries assigned to Priya Sharma`);
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedData();

