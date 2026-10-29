const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');

describe('Auth Endpoints Integration Tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new counselor and return a valid JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Neha Verma',
          email: 'neha.verma@foster.ai',
          password: 'Password123!',
          role: 'counselor'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('neha.verma@foster.ai');
      expect(res.body.data.user.password).toBeUndefined(); // Ensure password is never leaked
    });

    it('should reject registration if email is already in use (HTTP 409)', async () => {
      await User.create({
        name: 'Existing Counselor',
        email: 'duplicate@foster.ai',
        password: 'Password123!'
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another Counselor',
          email: 'duplicate@foster.ai',
          password: 'Password123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should return 400 Bad Request on invalid email or short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test',
          email: 'invalid-email-format',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login Test',
        email: 'login@foster.ai',
        password: 'Password123!'
      });
    });

    it('should log in with valid credentials and return JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@foster.ai',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login@foster.ai');
    });

    it('should reject login with wrong password (HTTP 401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@foster.ai',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should fetch profile when valid Bearer token is provided', async () => {
      const user = await User.create({
        name: 'Profile User',
        email: 'profile@foster.ai',
        password: 'Password123!'
      });

      const token = user.generateAuthToken();

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('profile@foster.ai');
    });

    it('should return 401 Unauthorized if token is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
