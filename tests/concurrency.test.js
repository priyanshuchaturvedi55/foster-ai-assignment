const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Lead = require('../src/models/lead.model');

describe('High-Concurrency Race Condition Test for Lead Claiming', () => {
  let counselor1;
  let counselor2;
  let counselor3;
  let token1;
  let token2;
  let token3;

  beforeEach(async () => {
    await User.deleteMany({});
    await Lead.deleteMany({});

    counselor1 = await User.create({
      name: 'Counselor Alpha',
      email: 'alpha@foster.ai',
      password: 'Password123!'
    });
    token1 = counselor1.generateAuthToken();

    counselor2 = await User.create({
      name: 'Counselor Beta',
      email: 'beta@foster.ai',
      password: 'Password123!'
    });
    token2 = counselor2.generateAuthToken();

    counselor3 = await User.create({
      name: 'Counselor Gamma',
      email: 'gamma@foster.ai',
      password: 'Password123!'
    });
    token3 = counselor3.generateAuthToken();
  });

  it('should handle simultaneous claims atomically: EXACTLY ONE succeeds (200), others fail with 409 Conflict', async () => {
    // Create one single hot unclaimed lead
    const hotLead = await Lead.create({
      name: 'High Priority Prospect',
      email: 'hot.lead@example.com',
      phone: '+919999988888',
      courseInterest: 'Artificial Intelligence & Machine Learning',
      isClaimed: false
    });

    // Fire 3 simultaneous claim requests for the EXACT SAME lead in parallel
    const [res1, res2, res3] = await Promise.all([
      request(app)
        .patch(`/api/v1/leads/${hotLead._id}/claim`)
        .set('Authorization', `Bearer ${token1}`),
      request(app)
        .patch(`/api/v1/leads/${hotLead._id}/claim`)
        .set('Authorization', `Bearer ${token2}`),
      request(app)
        .patch(`/api/v1/leads/${hotLead._id}/claim`)
        .set('Authorization', `Bearer ${token3}`)
    ]);

    const statuses = [res1.status, res2.status, res3.status];

    // Assert that exactly ONE counselor got 200 OK
    const successCount = statuses.filter((status) => status === 200).length;
    expect(successCount).toBe(1);

    // Assert that the other two counselors got 409 Conflict
    const conflictCount = statuses.filter((status) => status === 409).length;
    expect(conflictCount).toBe(2);

    // Verify in database that lead has isClaimed=true and exactly one owner
    const finalLead = await Lead.findById(hotLead._id);
    expect(finalLead.isClaimed).toBe(true);
    expect(finalLead.status).toBe('CLAIMED');
    expect(finalLead.claimedBy).toBeDefined();

    const winnerId = finalLead.claimedBy.toString();
    const validCounselorIds = [
      counselor1._id.toString(),
      counselor2._id.toString(),
      counselor3._id.toString()
    ];
    expect(validCounselorIds).toContain(winnerId);
  });
});

