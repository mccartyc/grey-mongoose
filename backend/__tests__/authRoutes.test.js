const request = require('supertest');
const app = require('../server'); // Ensure your Express app is exported in server.js
const mongoose = require('mongoose');
const User = require('../models/Users');
const bcrypt = require('bcrypt');

jest.setTimeout(30000); // Set timeout to 30 seconds

// Mock environment variables
process.env.JWT_SECRET = 'test_secret';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
process.env.ACCESS_TOKEN_EXPIRATION = '15m';
process.env.REFRESH_TOKEN_EXPIRATION = '1d';

// Clear the database before each test
beforeEach(async () => {
  await User.deleteMany({});
});

// Disconnect the database after tests
afterAll(async () => {
  await mongoose.connection.close();
  jest.clearAllTimers();
});

// Test suite for authentication routes
describe('Auth Routes', () => {
  const sampleUser = {
    username: 'testuser',
    password: 'password123',
    tenantId: new mongoose.Types.ObjectId(),
  };

  let refreshToken;

  test('POST /register - should register a new user', async () => {
    const response = await request(app).post('/api/auth/register').send(sampleUser);

    expect(response.status).toBe(200); // Adjust to 201 if your API returns 201
    refreshToken = response.body.refreshToken; // Save for reuse
    expect(response.body.token).toBeDefined();

    const userInDb = await User.findOne({ username: sampleUser.username });
    expect(userInDb).not.toBeNull(); // Ensure user is created in DB
  });

  test('POST /login - should login an existing user', async () => {
    const user = new User({
      username: sampleUser.username,
      password: await bcrypt.hash(sampleUser.password, 10),
      tenantId: sampleUser.tenantId,
    });
    await user.save();

    const response = await request(app).post('/api/auth/login').send({
      username: sampleUser.username,
      password: sampleUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    refreshToken = response.body.refreshToken;
  });

  test('POST /refresh-token - should generate a new access token', async () => {
    expect(refreshToken).toBeDefined();

    const response = await request(app).post('/api/auth/refresh-token').send({
      refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
  });

  test('POST /logout - should logout and invalidate the refresh token', async () => {
    const response = await request(app).post('/api/auth/logout').send({
      refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Logged out successfully');
  });

  test('POST /login - should fail with incorrect password', async () => {
    const response = await request(app).post('/api/auth/login').send({
      username: sampleUser.username,
      password: 'wrongpassword',
    });

    expect(response.status).toBe(400);
    expect(response.body.msg).toBe('Invalid credentials');
  });

  test('POST /refresh-token - should fail with an invalid refresh token', async () => {
    const response = await request(app).post('/api/auth/refresh-token').send({
      refreshToken: 'invalid_token',
    });

    expect(response.status).toBe(403);
    expect(response.body.msg).toBe('Invalid refresh token');
  });
});
