const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const cache = require('../../src/config/cache');

// Mock github service to avoid real API calls during testing
jest.mock('../../src/services/githubService', () => ({
  fetchUserProfile: jest.fn().mockResolvedValue({
    login: 'testuser',
    name: 'Test User',
    followers: 100,
    following: 10,
    public_repos: 5,
    created_at: '2020-01-01T00:00:00Z',
  }),
  fetchUserRepos: jest.fn().mockResolvedValue([
    { name: 'repo1', language: 'JavaScript', stargazers_count: 50 },
    { name: 'repo2', language: 'Python', stargazers_count: 10 },
  ]),
  fetchUserEvents: jest.fn().mockResolvedValue([]),
  checkRateLimit: jest.fn().mockResolvedValue({ limit: 60, remaining: 59, reset: 1234567890 }),
}));

describe('GitHub Integration Tests', () => {
  beforeAll(async () => {
    // Sync DB schema before tests
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close DB connection after tests
    await sequelize.close();
  });

  beforeEach(() => {
    cache.flushAll(); // Clear cache before each test
  });

  describe('POST /api/github/analyze/:username', () => {
    it('should fetch, analyze and store a new profile', async () => {
      const res = await request(app).post('/api/github/analyze/testuser');
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('testuser');
      expect(res.body.data.most_used_language).toBe('JavaScript');
      expect(res.body.data.total_stars).toBe(60);
      expect(res.body.data.repositories.length).toBe(2);
    });

    it('should update an existing profile and return 200', async () => {
      // Profile already exists from previous test
      const res = await request(app).post('/api/github/analyze/testuser');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should validate username parameter', async () => {
      const res = await request(app).post('/api/github/analyze/invalid_user!!!');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/github/profiles', () => {
    it('should return a list of profiles', async () => {
      const res = await request(app).get('/api/github/profiles');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/github/profile/:username', () => {
    it('should return a specific profile', async () => {
      const res = await request(app).get('/api/github/profile/testuser');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('testuser');
    });

    it('should return 404 for non-existent profile', async () => {
      const res = await request(app).get('/api/github/profile/notfounduser');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('should return health check status', async () => {
      const res = await request(app).get('/api/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.github_api.rate_limit).toBeDefined();
    });
  });
});
