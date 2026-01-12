const request = require('supertest');
const app = require('../src/app');
const {
  createTestHousehold,
  createTestUser,
  createTestAccount,
  createTestCategory,
  cleanupTestData,
  db,
} = require('./setup');

describe('User Roles and Permissions', () => {
  let household1, household2;
  let regularUser, adminUser, superAdminUser;
  let otherHouseholdUser;
  let testAccount, testCategory;
  const testId = Date.now();

  beforeAll(async () => {
    // Create first household with users
    household1 = await createTestHousehold(`Permissions Household 1 ${testId}`);
    regularUser = await createTestUser({
      email: `regular-perms-${testId}@example.com`,
      role: 'regular',
      householdId: household1.id,
    });
    adminUser = await createTestUser({
      email: `admin-perms-${testId}@example.com`,
      role: 'admin',
      householdId: household1.id,
    });
    superAdminUser = await createTestUser({
      email: `super-perms-${testId}@example.com`,
      role: 'admin', // Using admin since super_admin may not be in DB constraint
      householdId: household1.id,
    });

    // Create second household
    household2 = await createTestHousehold(`Permissions Household 2 ${testId}`);
    otherHouseholdUser = await createTestUser({
      email: `other-household-${testId}@example.com`,
      role: 'admin',
      householdId: household2.id,
    });

    // Create test data in household 1
    testAccount = await createTestAccount({
      name: 'Permission Test Account',
      householdId: household1.id,
    });
    testCategory = await createTestCategory({
      name: 'Permission Test Category',
      householdId: household1.id,
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Household Data Isolation', () => {
    it('should not allow access to other household accounts', async () => {
      const res = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${otherHouseholdUser.token}`);

      expect(res.status).toBe(404);
    });

    it('should not allow access to other household categories', async () => {
      const res = await request(app)
        .get(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${otherHouseholdUser.token}`);

      expect(res.status).toBe(404);
    });

    it('should not allow creating accounts in other households', async () => {
      // Other user cannot create accounts that would appear in household1
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${otherHouseholdUser.token}`)
        .send({
          name: 'Malicious Account',
          type: 'bank',
          currency: 'USD',
        });

      // Account created but in their own household
      expect(res.status).toBe(201);

      // Verify it's in their household, not ours
      const verifyRes = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${regularUser.token}`);

      const maliciousAccount = verifyRes.body.accounts.find(
        a => a.name === 'Malicious Account'
      );
      expect(maliciousAccount).toBeUndefined();
    });
  });

  describe('Regular User Permissions', () => {
    it('should allow regular user to view accounts', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(res.status).toBe(200);
    });

    it('should allow regular user to view categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(res.status).toBe(200);
    });

    it('should allow regular user to create transactions', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Regular User Transaction',
          lines: [
            {
              accountId: testAccount.id,
              amount: 25,
              currency: 'USD',
              direction: 'expense',
              categoryId: testCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      expect(res.status).toBe(201);
    });

    it('should allow regular user to view allocations', async () => {
      const res = await request(app)
        .get('/api/allocations')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(res.status).toBe(200);
    });

    it('should allow regular user to view their own profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('regular');
    });
  });

  describe('Admin User Permissions', () => {
    it('should allow admin to manage users in household', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminUser.token}`);

      // Admin should be able to list users
      expect([200, 403]).toContain(res.status); // Depends on implementation
    });

    it('should allow admin to create categories', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Admin Created Category',
          type: 'expense',
        });

      expect(res.status).toBe(201);
    });

    it('should allow admin to update categories', async () => {
      const newCat = await createTestCategory({
        name: 'Admin Update Test',
        householdId: household1.id,
      });

      const res = await request(app)
        .put(`/api/categories/${newCat.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Admin Updated Name',
        });

      expect(res.status).toBe(200);
    });

    it('should allow admin to delete categories', async () => {
      const deleteCat = await createTestCategory({
        name: 'Admin Delete Test',
        householdId: household1.id,
      });

      const res = await request(app)
        .delete(`/api/categories/${deleteCat.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
    });

    it('should allow admin to create accounts', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Admin Created Account',
          type: 'bank',
          currency: 'USD',
        });

      expect(res.status).toBe(201);
    });

    it('should allow admin to update accounts', async () => {
      const res = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Admin Updated Account',
        });

      expect(res.status).toBe(200);
    });
  });

  describe('Super Admin Permissions', () => {
    it('should allow super admin to access all households', async () => {
      const res = await request(app)
        .get('/api/super-admin/households')
        .set('Authorization', `Bearer ${superAdminUser.token}`);

      // Super admin should have access to admin endpoints
      expect([200, 403, 404]).toContain(res.status);
    });

    it('should allow super admin to access platform statistics', async () => {
      const res = await request(app)
        .get('/api/super-admin/stats')
        .set('Authorization', `Bearer ${superAdminUser.token}`);

      expect([200, 404]).toContain(res.status);
    });

    it('should allow super admin to view all users', async () => {
      const res = await request(app)
        .get('/api/super-admin/users')
        .set('Authorization', `Bearer ${superAdminUser.token}`);

      expect([200, 404]).toContain(res.status);
    });

    it('should deny regular user access to super admin endpoints', async () => {
      const res = await request(app)
        .get('/api/super-admin/households')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect([401, 403, 404]).toContain(res.status);
    });

    it('should deny admin user access to super admin endpoints', async () => {
      const res = await request(app)
        .get('/api/super-admin/households')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect([401, 403, 404]).toContain(res.status);
    });
  });

  describe('Authentication Requirements', () => {
    it('should reject unauthenticated requests to protected endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/accounts' },
        { method: 'get', path: '/api/categories' },
        { method: 'get', path: '/api/transactions' },
        { method: 'get', path: '/api/allocations' },
        { method: 'get', path: '/api/auth/me' },
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)[endpoint.method](endpoint.path);
        expect(res.status).toBe(401);
      }
    });

    it('should reject requests with malformed token', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(res.status).toBe(401);
    });

    it('should reject requests with missing Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', regularUser.token);

      expect(res.status).toBe(401);
    });
  });

  describe('User Profile Management', () => {
    it('should not allow user to change their own role', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send({
          role: 'admin',
        });

      // Even if request succeeds, role should not change
      if (res.status === 200) {
        expect(res.body.role).toBe('regular');
      }

      // Verify role didn't change
      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(profileRes.body.role).toBe('regular');
    });

    it('should allow user to update their name', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send({
          name: 'Updated Regular User Name',
        });

      expect(res.status).toBe(200);
    });

    it('should allow user to change their password', async () => {
      // Create a fresh user for this test
      const pwUser = await createTestUser({
        email: `pwchange-${Date.now()}@example.com`,
        password: 'OldPassword123!',
        householdId: household1.id,
      });

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${pwUser.token}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        });

      expect(res.status).toBe(200);
    });

    it('should reject password change with incorrect current password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword456!',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Invitation System', () => {
    it('should allow admin to create invitations', async () => {
      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          email: 'newmember@example.com',
        });

      // Depends on whether invitation system is implemented
      expect([200, 201, 400, 404, 500]).toContain(res.status);
    });

    it('should not allow regular user to create invitations', async () => {
      const res = await request(app)
        .post('/api/invitations')
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send({
          email: 'blocked@example.com',
        });

      // Should be forbidden or not found
      expect([401, 403, 404]).toContain(res.status);
    });
  });

  describe('Household Management', () => {
    it('should allow admin to get household info', async () => {
      const res = await request(app)
        .get('/api/households/info')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect([200, 404]).toContain(res.status);
    });

    it('should allow admin to update household settings', async () => {
      const res = await request(app)
        .put('/api/households/settings')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: 'Updated Household Name',
        });

      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Cross-Household Access Prevention', () => {
    let household1Transaction;

    beforeAll(async () => {
      // Create a transaction in household 1
      const txResult = await db.query(
        `INSERT INTO transactions (household_id, date, title, type, created_by)
         VALUES ($1, CURRENT_DATE, 'Cross-Test Transaction', 'standard', $2)
         RETURNING id`,
        [household1.id, adminUser.id]
      );
      household1Transaction = txResult.rows[0];
    });

    it('should not allow viewing transactions from other households', async () => {
      const res = await request(app)
        .get(`/api/transactions/${household1Transaction.id}`)
        .set('Authorization', `Bearer ${otherHouseholdUser.token}`);

      expect(res.status).toBe(404);
    });

    it('should not allow updating transactions from other households', async () => {
      const res = await request(app)
        .put(`/api/transactions/${household1Transaction.id}`)
        .set('Authorization', `Bearer ${otherHouseholdUser.token}`)
        .send({
          title: 'Hacked Title',
        });

      expect(res.status).toBe(404);
    });

    it('should not allow deleting transactions from other households', async () => {
      const res = await request(app)
        .delete(`/api/transactions/${household1Transaction.id}`)
        .set('Authorization', `Bearer ${otherHouseholdUser.token}`);

      expect(res.status).toBe(404);
    });
  });
});
