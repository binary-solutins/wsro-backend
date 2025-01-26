const request = require('supertest');
const app = require('../server');
const db = require('../config/database');

describe('Payment Endpoints', () => {
  let authToken;
  let registrationId;

  beforeAll(async () => {
    // Login as customer
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'customer123'
      });
    authToken = loginRes.body.token;
  });

  it('should create a payment session', async () => {
    const res = await request(app)
      .post('/api/payments/create-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        registration_id: registrationId,
        amount: 100
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('sessionId');
    expect(res.body).toHaveProperty('url');
  });

  it('should get payment status', async () => {
    const res = await request(app)
      .get(`/api/payments/status/${registrationId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
  });
});