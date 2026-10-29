const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Lead = require('../src/models/lead.model');

describe('Leads API Endpoints Integration Tests', () => {
  let counselor1;
  let counselor2;
  let token1;
  let token2;

  beforeEach(async () => {
    await User.deleteMany({});
    await Lead.deleteMany({});

    counselor1 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@foster.ai',
      password: 'Password123!'
    });
    token1 = counselor1.generateAuthToken();

    counselor2 = await User.create({
      name: 'Vikram Aditya',
      email: 'vikram@foster.ai',
      password: 'Password123!'
    });
    token2 = counselor2.generateAuthToken();
  });

  describe('POST /api/v1/leads/public-enquiry', () => {
    it('should allow anyone to submit enquiry without authentication (Zero-auth)', async () => {
      const res = await request(app)
        .post('/api/v1/leads/public-enquiry')
        .send({
          name: 'Karan Mehra',
          email: 'karan@example.com',
          phone: '+919876543210',
          courseInterest: 'Full Stack Web Development',
          message: 'Interested in evening batches.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isClaimed).toBe(false);
      expect(res.body.data.claimedBy).toBeNull();
      expect(res.body.data.status).toBe('UNCLAIMED');

      // Verify in database
      const savedLead = await Lead.findById(res.body.data._id);
      expect(savedLead).not.toBeNull();
      expect(savedLead.name).toBe('Karan Mehra');
    });

    it('should validate required fields and return 400 Bad Request on missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/leads/public-enquiry')
        .send({
          name: 'Incomplete Enquiry'
          // missing email, phone, courseInterest
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/leads/unclaimed', () => {
    beforeEach(async () => {
      // Create 2 unclaimed leads and 1 claimed lead
      await Lead.create([
        {
          name: 'Lead One',
          email: 'lead1@example.com',
          phone: '9876543211',
          courseInterest: 'AI/ML',
          isClaimed: false
        },
        {
          name: 'Lead Two',
          email: 'lead2@example.com',
          phone: '9876543212',
          courseInterest: 'Web Dev',
          isClaimed: false
        },
        {
          name: 'Lead Three',
          email: 'lead3@example.com',
          phone: '9876543213',
          courseInterest: 'Cloud',
          isClaimed: true,
          claimedBy: counselor1._id
        }
      ]);
    });

    it('should reject request without authentication (HTTP 401)', async () => {
      const res = await request(app).get('/api/v1/leads/unclaimed');
      expect(res.status).toBe(401);
    });

    it('should fetch only unclaimed leads when authenticated as a counselor', async () => {
      const res = await request(app)
        .get('/api/v1/leads/unclaimed')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((lead) => lead.isClaimed === false)).toBe(true);
      expect(res.body.meta.totalLeads).toBe(2);
    });

    it('should filter unclaimed leads by courseInterest query parameter', async () => {
      const res = await request(app)
        .get('/api/v1/leads/unclaimed?courseInterest=AI')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Lead One');
    });
  });

  describe('PATCH /api/v1/leads/:id/claim', () => {
    let targetLead;

    beforeEach(async () => {
      targetLead = await Lead.create({
        name: 'Prospective Student',
        email: 'student@example.com',
        phone: '9876543210',
        courseInterest: 'Data Science',
        isClaimed: false
      });
    });

    it('should successfully claim an unclaimed lead and assign to logged-in counselor', async () => {
      const res = await request(app)
        .patch(`/api/v1/leads/${targetLead._id}/claim`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isClaimed).toBe(true);
      expect(res.body.data.status).toBe('CLAIMED');
      expect(res.body.data.claimedBy._id.toString()).toBe(counselor1._id.toString());

      // Ensure it is removed from unclaimed public list
      const unclaimedRes = await request(app)
        .get('/api/v1/leads/unclaimed')
        .set('Authorization', `Bearer ${token1}`);

      expect(unclaimedRes.body.data.length).toBe(0);
    });

    it('should return 409 Conflict if lead is already claimed by another counselor', async () => {
      // First counselor claims it
      await request(app)
        .patch(`/api/v1/leads/${targetLead._id}/claim`)
        .set('Authorization', `Bearer ${token1}`);

      // Second counselor attempts to claim the same lead
      const res = await request(app)
        .patch(`/api/v1/leads/${targetLead._id}/claim`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already been claimed');
    });

    it('should return 404 Not Found if claiming non-existent lead ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/v1/leads/${nonExistentId}/claim`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/leads/claimed', () => {
    it('should fetch ONLY leads claimed by the logged-in counselor', async () => {
      // Create 1 lead claimed by counselor 1, and 1 lead claimed by counselor 2
      await Lead.create([
        {
          name: 'Priya Lead',
          email: 'plead@example.com',
          phone: '1111111111',
          courseInterest: 'AI',
          isClaimed: true,
          claimedBy: counselor1._id,
          claimedAt: new Date()
        },
        {
          name: 'Vikram Lead',
          email: 'vlead@example.com',
          phone: '2222222222',
          courseInterest: 'DevOps',
          isClaimed: true,
          claimedBy: counselor2._id,
          claimedAt: new Date()
        }
      ]);

      // Priya fetches her claimed leads
      const res1 = await request(app)
        .get('/api/v1/leads/claimed')
        .set('Authorization', `Bearer ${token1}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(1);
      expect(res1.body.data[0].name).toBe('Priya Lead');

      // Vikram fetches his claimed leads
      const res2 = await request(app)
        .get('/api/v1/leads/claimed')
        .set('Authorization', `Bearer ${token2}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(1);
      expect(res2.body.data[0].name).toBe('Vikram Lead');
    });
  });
});
