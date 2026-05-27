const analysisService = require('../../src/services/analysisService');

describe('Analysis Service', () => {
  describe('Profile Scoring', () => {
    it('should calculate a score of 0 for an empty profile', () => {
      const score = analysisService._computeProfileScore({
        followers: 0,
        totalStars: 0,
        publicRepos: 0,
        totalForks: 0,
        accountCreatedAt: new Date().toISOString(),
        lastPushedAt: null,
      });
      
      expect(score).toBe(0);
    });

    it('should calculate a higher score for a highly active profile', () => {
      const activeScore = analysisService._computeProfileScore({
        followers: 1000,
        totalStars: 5000,
        publicRepos: 100,
        totalForks: 1000,
        accountCreatedAt: new Date('2010-01-01').toISOString(),
        lastPushedAt: new Date().toISOString(),
      });
      
      const lessActiveScore = analysisService._computeProfileScore({
        followers: 10,
        totalStars: 50,
        publicRepos: 10,
        totalForks: 5,
        accountCreatedAt: new Date('2020-01-01').toISOString(),
        lastPushedAt: new Date('2022-01-01').toISOString(),
      });

      expect(activeScore).toBeGreaterThan(lessActiveScore);
      expect(activeScore).toBeLessThanOrEqual(100); // Max score is 100
    });
  });

  describe('Language Stats', () => {
    it('should correctly count and sort repository languages', () => {
      const repos = [
        { language: 'JavaScript' },
        { language: 'JavaScript' },
        { language: 'Python' },
        { language: null }, // Should be ignored
        { language: 'Python' },
        { language: 'Python' },
        { language: 'Rust' },
      ];

      const stats = analysisService._computeLanguageStats(repos);
      
      expect(stats).toEqual({
        Python: 3,
        JavaScript: 2,
        Rust: 1,
      });
      
      const mostUsed = analysisService._getMostUsedLanguage(stats);
      expect(mostUsed).toBe('Python');
    });
  });

  describe('Activity Insights', () => {
    it('should correctly summarize contribution data', () => {
      const events = [
        { type: 'PushEvent', created_at: '2023-01-01T12:00:00Z' },
        { type: 'PushEvent', created_at: '2023-01-01T14:00:00Z' },
        { type: 'PullRequestEvent', created_at: '2023-01-02T10:00:00Z' },
        { type: 'IssuesEvent', created_at: '2023-01-03T09:00:00Z' },
      ];

      const data = analysisService._computeContributionData(events);
      
      expect(data.total_events).toBe(4);
      expect(data.push_events).toBe(2);
      expect(data.pr_events).toBe(1);
      expect(data.issue_events).toBe(1);
      expect(data.active_days).toBe(3);
      expect(data.most_active_day).toBe('2023-01-01');
      expect(data.most_active_day_count).toBe(2);
    });
  });
});
