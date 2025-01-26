const request = require('supertest');
const app = require('../server');
const db = require('../config/database');

describe('Competition Endpoints', () => {
  let authToken;
  let competitionId;

  beforeAll(async () => {
    // Login as admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    authToken = loginRes.body.token;
  });

  it('should create a new competition', async () => {
    const res = await request(app)
      .post('/api/admin/competitions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Competition',
        category: 'Regional',
        rules: 'Test rules',
        track_details: 'Test track details',
        manual_url: 'https://example.com/manual'
      });
    expect(res.statusCode).toBe(201);
    competitionId = res.body.id;
  });

  it('should list all competitions', async () => {
    const res = await request(app)
      .get('/api/competitions');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});