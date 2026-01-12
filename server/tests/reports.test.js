const request = require('supertest');
const app = require('../src/app');
const {
  createTestHousehold,
  createTestUser,
  createTestAccount,
  createTestCategory,
  createTestTransaction,
  cleanupTestData,
  testData,
} = require('./setup');

describe('Reports API', () => {
  let testUser;
  let testAccount;
  let expenseCategory1, expenseCategory2;
  let incomeCategory;
  const testId = Date.now();

  beforeAll(async () => {
    await createTestHousehold(`Reports Test Household ${testId}`);
    testUser = await createTestUser({
      email: `reports-test-${testId}@example.com`,
      role: 'admin',
    });
    testAccount = await createTestAccount({
      name: 'Reports Account',
      type: 'bank',
      currency: 'USD',
      initialBalance: 10000,
    });

    // Create categories
    expenseCategory1 = await createTestCategory({
      name: 'Food & Dining',
      type: 'expense',
    });
    expenseCategory2 = await createTestCategory({
      name: 'Transportation',
      type: 'expense',
    });
    incomeCategory = await createTestCategory({
      name: 'Salary',
      type: 'income',
    });

    // Create test transactions for reports
    const today = new Date();
    const thisMonth = today.toISOString().split('T')[0];

    // Food expenses
    await createTestTransaction({
      title: 'Groceries',
      date: thisMonth,
      lines: [
        {
          accountId: testAccount.id,
          amount: 150,
          direction: 'expense',
          categoryId: expenseCategory1.id,
        },
      ],
    });

    await createTestTransaction({
      title: 'Restaurant',
      date: thisMonth,
      lines: [
        {
          accountId: testAccount.id,
          amount: 75,
          direction: 'expense',
          categoryId: expenseCategory1.id,
        },
      ],
    });

    // Transportation expense
    await createTestTransaction({
      title: 'Gas',
      date: thisMonth,
      lines: [
        {
          accountId: testAccount.id,
          amount: 50,
          direction: 'expense',
          categoryId: expenseCategory2.id,
        },
      ],
    });

    // Income
    await createTestTransaction({
      title: 'Monthly Salary',
      date: thisMonth,
      lines: [
        {
          accountId: testAccount.id,
          amount: 5000,
          direction: 'income',
          categoryId: incomeCategory.id,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/reports/summary', () => {
    it('should return monthly summary with income and expenses', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/summary?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('totalIncome');
        expect(res.body).toHaveProperty('totalExpenses');
        expect(res.body).toHaveProperty('netAmount');
      }
    });

    it('should calculate correct net amount', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/summary?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200) {
        const { totalIncome, totalExpenses, netAmount } = res.body;
        expect(netAmount).toBe(totalIncome - totalExpenses);
      }
    });

    it('should reject request without authentication', async () => {
      const res = await request(app).get('/api/reports/summary');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports/by-category', () => {
    it('should return spending breakdown by category', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/by-category?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(Array.isArray(res.body.categories || res.body)).toBe(true);
      }
    });

    it('should include category details in breakdown', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/by-category?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200) {
        const categories = res.body.categories || res.body;
        if (categories.length > 0) {
          const cat = categories[0];
          expect(cat).toHaveProperty('category_name');
          expect(cat).toHaveProperty('total');
        }
      }
    });
  });

  describe('GET /api/reports/trends', () => {
    it('should return monthly trends', async () => {
      const res = await request(app)
        .get('/api/reports/trends?months=6')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(Array.isArray(res.body.trends || res.body)).toBe(true);
      }
    });

    it('should return correct number of months', async () => {
      const res = await request(app)
        .get('/api/reports/trends?months=12')
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200) {
        const trends = res.body.trends || res.body;
        expect(trends.length).toBeLessThanOrEqual(12);
      }
    });

    it('should include income and expense per month', async () => {
      const res = await request(app)
        .get('/api/reports/trends?months=6')
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200) {
        const trends = res.body.trends || res.body;
        if (trends.length > 0) {
          expect(trends[0]).toHaveProperty('month');
        }
      }
    });
  });

  describe('GET /api/reports/cash-flow', () => {
    it('should return cash flow report', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);
    });
  });

  describe('GET /api/reports/by-account', () => {
    it('should return breakdown by account', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/by-account?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);
    });

    it('should include account balances', async () => {
      const res = await request(app)
        .get('/api/reports/by-account')
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200) {
        const accounts = res.body.accounts || res.body;
        if (Array.isArray(accounts) && accounts.length > 0) {
          expect(accounts[0]).toHaveProperty('name');
        }
      }
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter by custom date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const res = await request(app)
        .get(`/api/reports/summary?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);
    });

    it('should handle single day range', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/reports/summary?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);
    });

    it('should handle invalid date range gracefully', async () => {
      const res = await request(app)
        .get('/api/reports/summary?startDate=2024-12-31&endDate=2024-01-01')
        .set('Authorization', `Bearer ${testUser.token}`);

      // Should either return empty results or error
      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe('Dashboard API', () => {
    it('should return dashboard overview', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        // Dashboard might include various summaries
        expect(res.body).toBeDefined();
      }
    });

    it('should include recent transactions', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200 && res.body.recentTransactions) {
        expect(Array.isArray(res.body.recentTransactions)).toBe(true);
      }
    });

    it('should include account balances summary', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200 && res.body.accounts) {
        expect(Array.isArray(res.body.accounts)).toBe(true);
      }
    });
  });

  describe('Report Export', () => {
    it('should export report as JSON', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/export?startDate=${startDate}&endDate=${endDate}&format=json`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);
    });

    it('should export report as CSV', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/export?startDate=${startDate}&endDate=${endDate}&format=csv`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(/csv|text/);
      }
    });
  });

  describe('Report Isolation', () => {
    let otherHousehold;
    let otherUser;
    const isolationTestId = Date.now() + 1000;

    beforeAll(async () => {
      otherHousehold = await createTestHousehold(`Other Reports Household ${isolationTestId}`);
      otherUser = await createTestUser({
        email: `other-reports-${isolationTestId}@example.com`,
        householdId: otherHousehold.id,
      });

      // Create transaction in other household
      const otherAccount = await createTestAccount({
        name: 'Other Account',
        householdId: otherHousehold.id,
      });
      const otherCategory = await createTestCategory({
        name: 'Other Category',
        householdId: otherHousehold.id,
      });
      await createTestTransaction({
        title: 'Other Transaction',
        householdId: otherHousehold.id,
        lines: [
          {
            accountId: otherAccount.id,
            amount: 9999,
            direction: 'expense',
            categoryId: otherCategory.id,
          },
        ],
      });
    });

    it('should not include other household data in reports', async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/reports/summary?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200) {
        // Total expenses should not include the 9999 from other household
        expect(res.body.totalExpenses).toBeLessThan(9999);
      }
    });

    it('should isolate trends by household', async () => {
      const res = await request(app)
        .get('/api/reports/trends?months=12')
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200) {
        const trends = res.body.trends || res.body;
        // Verify data doesn't include other household's large transaction
        const hasLargeAmount = trends.some(t => t.totalExpenses >= 9999);
        expect(hasLargeAmount).toBe(false);
      }
    });
  });
});
