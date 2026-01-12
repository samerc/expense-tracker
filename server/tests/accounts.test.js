const request = require('supertest');
const app = require('../src/app');
const {
  createTestHousehold,
  createTestUser,
  createTestAccount,
  createTestCategory,
  cleanupTestData,
  testData,
} = require('./setup');

describe('Accounts API', () => {
  let testUser;
  let testAccount;
  const testId = Date.now();

  beforeAll(async () => {
    await createTestHousehold(`Accounts Test Household ${testId}`);
    testUser = await createTestUser({
      email: `accounts-test-${testId}@example.com`,
      role: 'admin',
    });
    testAccount = await createTestAccount({
      name: 'Test Checking',
      type: 'bank',
      currency: 'USD',
      initialBalance: 5000,
    });
    // Create a system category for balance adjustments
    await createTestCategory({
      name: 'Balance Adjustment',
      type: 'system',
      icon: 'RefreshCw',
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/accounts', () => {
    it('should return all accounts for household', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accounts');
      expect(Array.isArray(res.body.accounts)).toBe(true);
      expect(res.body.accounts.length).toBeGreaterThan(0);
      expect(res.body.accounts[0]).toHaveProperty('name');
      expect(res.body.accounts[0]).toHaveProperty('type');
      expect(res.body.accounts[0]).toHaveProperty('currency');
      expect(res.body.accounts[0]).toHaveProperty('current_balance');
    });

    it('should calculate correct current balance', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${testUser.token}`);

      const account = res.body.accounts.find(a => a.id === testAccount.id);
      expect(account).toBeDefined();
      // Initial balance without any transactions
      expect(parseFloat(account.current_balance)).toBe(5000);
    });

    it('should reject request without authentication', async () => {
      const res = await request(app).get('/api/accounts');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should return specific account by id', async () => {
      const res = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', testAccount.id);
      expect(res.body).toHaveProperty('name', testAccount.name);
      expect(res.body).toHaveProperty('current_balance');
    });

    it('should return 404 for non-existent account', async () => {
      const res = await request(app)
        .get('/api/accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should not allow access to other household accounts', async () => {
      // Create another household with account
      const otherHousehold = await createTestHousehold('Other Household');
      const otherUser = await createTestUser({
        email: `other-${Date.now()}@example.com`,
        householdId: otherHousehold.id,
      });
      const otherAccount = await createTestAccount({
        name: 'Other Account',
        householdId: otherHousehold.id,
      });

      // Try to access other household's account
      const res = await request(app)
        .get(`/api/accounts/${otherAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'New Savings Account',
          type: 'bank',
          currency: 'USD',
          initialBalance: 1000,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'New Savings Account');
      expect(res.body).toHaveProperty('type', 'bank');
      expect(res.body).toHaveProperty('currency', 'USD');
      expect(parseFloat(res.body.initial_balance)).toBe(1000);
    });

    it('should create account with different currency', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Euro Account',
          type: 'bank',
          currency: 'EUR',
          initialBalance: 500,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('currency', 'EUR');
    });

    it('should create account with zero initial balance', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Empty Account',
          type: 'cash',
          currency: 'USD',
        });

      expect(res.status).toBe(201);
      expect(parseFloat(res.body.initial_balance)).toBe(0);
    });

    it('should reject account with invalid type', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Invalid Type Account',
          type: 'invalid-type',
          currency: 'USD',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject account without required fields', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Missing Fields',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should accept all valid account types', async () => {
      const validTypes = ['cash', 'bank', 'credit', 'wallet'];

      for (const type of validTypes) {
        const res = await request(app)
          .post('/api/accounts')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Account`,
            type,
            currency: 'USD',
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('type', type);
      }
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update account name', async () => {
      const res = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Updated Account Name',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Account Name');
    });

    it('should update multiple fields at once', async () => {
      const res = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Multi Update Account',
          type: 'wallet',
          currency: 'EUR',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Multi Update Account');
      expect(res.body).toHaveProperty('type', 'wallet');
      expect(res.body).toHaveProperty('currency', 'EUR');
    });

    it('should return 404 for non-existent account', async () => {
      const res = await request(app)
        .put('/api/accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Ghost Account',
        });

      expect(res.status).toBe(404);
    });

    it('should reject update with no fields', async () => {
      const res = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/accounts/:id/adjust-balance', () => {
    let balanceTestAccount;

    beforeAll(async () => {
      balanceTestAccount = await createTestAccount({
        name: 'Balance Test Account',
        initialBalance: 1000,
      });
    });

    it('should adjust balance upward', async () => {
      const res = await request(app)
        .post(`/api/accounts/${balanceTestAccount.id}/adjust-balance`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          newBalance: 1500,
          description: 'Found extra cash',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.account).toHaveProperty('newBalance', 1500);
      expect(res.body.account).toHaveProperty('adjustment', 500);
    });

    it('should adjust balance downward', async () => {
      // First get current balance
      const currentRes = await request(app)
        .get(`/api/accounts/${balanceTestAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      const currentBalance = parseFloat(currentRes.body.current_balance);

      const res = await request(app)
        .post(`/api/accounts/${balanceTestAccount.id}/adjust-balance`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          newBalance: currentBalance - 200,
          description: 'Bank fee correction',
        });

      expect(res.status).toBe(200);
      expect(res.body.account).toHaveProperty('adjustment', -200);
    });

    it('should reject adjustment to same balance', async () => {
      const currentRes = await request(app)
        .get(`/api/accounts/${balanceTestAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      const currentBalance = parseFloat(currentRes.body.current_balance);

      const res = await request(app)
        .post(`/api/accounts/${balanceTestAccount.id}/adjust-balance`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          newBalance: currentBalance,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('same');
    });

    it('should reject adjustment without newBalance', async () => {
      const res = await request(app)
        .post(`/api/accounts/${balanceTestAccount.id}/adjust-balance`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          description: 'Missing balance',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    let deleteTestAccount;

    beforeEach(async () => {
      deleteTestAccount = await createTestAccount({
        name: `Delete Test ${Date.now()}`,
      });
    });

    it('should soft delete an account', async () => {
      const res = await request(app)
        .delete(`/api/accounts/${deleteTestAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.account).toHaveProperty('id', deleteTestAccount.id);

      // Verify account is no longer returned in list
      const listRes = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${testUser.token}`);

      const deletedAccount = listRes.body.accounts.find(
        a => a.id === deleteTestAccount.id
      );
      expect(deletedAccount).toBeUndefined();
    });

    it('should return 404 for non-existent account', async () => {
      const res = await request(app)
        .delete('/api/accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 when deleting already deleted account', async () => {
      // First delete
      await request(app)
        .delete(`/api/accounts/${deleteTestAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      // Try to delete again
      const res = await request(app)
        .delete(`/api/accounts/${deleteTestAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });
  });
});
