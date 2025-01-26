const request = require('supertest');
const app = require('../server');
const db = require('../config/database');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Clear test data
    await db.query('DELETE FROM Users WHERE email = ?', ['test@example.com']);
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
  });

  it('should login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});