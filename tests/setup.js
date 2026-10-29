const mongoose = require('mongoose');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/foster_crm_test?directConnection=true';

beforeAll(async () => {
  console.log('[Test Setup] beforeAll starting...');
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    console.log('[Test Setup] Connecting to MongoDB...');
    await mongoose.connect(TEST_MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[Test Setup] Connected to MongoDB!');
  }
});

afterAll(async () => {
  console.log('[Test Setup] afterAll starting...');
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {
      console.warn('[Test Setup] dropDatabase warning:', e.message);
    }
    await mongoose.connection.close();
    console.log('[Test Setup] Closed MongoDB connection.');
  }
});
