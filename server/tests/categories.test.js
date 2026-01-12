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

describe('Categories API', () => {
  let testUser;
  let regularUser;
  let testCategory;
  let incomeCategory;
  let testAccount;
  const testId = Date.now();

  beforeAll(async () => {
    await createTestHousehold(`Categories Test Household ${testId}`);
    testUser = await createTestUser({
      email: `categories-admin-${testId}@example.com`,
      role: 'admin',
    });
    regularUser = await createTestUser({
      email: `categories-regular-${testId}@example.com`,
      role: 'regular',
    });
    testAccount = await createTestAccount();
    testCategory = await createTestCategory({
      name: 'Test Expense Category',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#EF4444',
    });
    incomeCategory = await createTestCategory({
      name: 'Test Income Category',
      type: 'income',
      icon: 'DollarSign',
      color: '#22C55E',
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/categories', () => {
    it('should return all categories grouped by type', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(res.body).toHaveProperty('grouped');
      expect(res.body.grouped).toHaveProperty('expense');
      expect(res.body.grouped).toHaveProperty('income');
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it('should include category details', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`);

      const category = res.body.categories.find(c => c.id === testCategory.id);
      expect(category).toBeDefined();
      expect(category).toHaveProperty('name', testCategory.name);
      expect(category).toHaveProperty('type', 'expense');
      expect(category).toHaveProperty('icon', 'ShoppingCart');
      expect(category).toHaveProperty('color', '#EF4444');
      expect(category).toHaveProperty('is_active', true);
    });

    it('should identify system vs custom categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`);

      // Custom categories should have is_system = false
      const customCat = res.body.categories.find(c => c.id === testCategory.id);
      expect(customCat).toHaveProperty('is_system', false);
    });

    it('should return count of categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.body).toHaveProperty('count');
      expect(res.body.count).toBe(res.body.categories.length);
    });

    it('should reject request without authentication', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return specific category by id', async () => {
      const res = await request(app)
        .get(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', testCategory.id);
      expect(res.body).toHaveProperty('name', testCategory.name);
      expect(res.body).toHaveProperty('type', 'expense');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .get('/api/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/categories', () => {
    it('should create expense category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'New Expense Category',
          type: 'expense',
          icon: 'Coffee',
          color: '#8B5CF6',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'New Expense Category');
      expect(res.body).toHaveProperty('type', 'expense');
      expect(res.body).toHaveProperty('icon', 'Coffee');
      expect(res.body).toHaveProperty('color', '#8B5CF6');
    });

    it('should create income category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'New Income Category',
          type: 'income',
          icon: 'Briefcase',
          color: '#10B981',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('type', 'income');
    });

    it('should create category without optional fields', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Minimal Category',
          type: 'expense',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.icon).toBeNull();
      expect(res.body.color).toBeNull();
    });

    it('should reject category without name', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          type: 'expense',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject category without type', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'No Type Category',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject invalid category type', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Invalid Type',
          type: 'invalid',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should not allow creating system categories', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Fake System Category',
          type: 'system',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/categories/:id', () => {
    let updateCategory;

    beforeEach(async () => {
      updateCategory = await createTestCategory({
        name: 'Update Test Category',
        type: 'expense',
        icon: 'Tag',
        color: '#F59E0B',
      });
    });

    it('should update category name', async () => {
      const res = await request(app)
        .put(`/api/categories/${updateCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Updated Category Name',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Category Name');
    });

    it('should update category icon', async () => {
      const res = await request(app)
        .put(`/api/categories/${updateCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          icon: 'Star',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('icon', 'Star');
    });

    it('should update category color', async () => {
      const res = await request(app)
        .put(`/api/categories/${updateCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          color: '#EC4899',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('color', '#EC4899');
    });

    it('should update multiple fields', async () => {
      const res = await request(app)
        .put(`/api/categories/${updateCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Multi Update',
          icon: 'Heart',
          color: '#DC2626',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Multi Update');
      expect(res.body).toHaveProperty('icon', 'Heart');
      expect(res.body).toHaveProperty('color', '#DC2626');
    });

    it('should deactivate category', async () => {
      const res = await request(app)
        .put(`/api/categories/${updateCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('is_active', false);
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .put('/api/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Ghost Category',
        });

      expect(res.status).toBe(404);
    });

    it('should reject update with no fields', async () => {
      const res = await request(app)
        .put(`/api/categories/${updateCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    let deleteCategory;

    beforeEach(async () => {
      deleteCategory = await createTestCategory({
        name: `Delete Test ${Date.now()}`,
        type: 'expense',
      });
    });

    it('should soft delete a category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${deleteCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.category).toHaveProperty('id', deleteCategory.id);

      // Verify category is no longer in active list
      const listRes = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${testUser.token}`);

      const deletedCat = listRes.body.categories.find(
        c => c.id === deleteCategory.id
      );
      expect(deletedCat).toBeUndefined();
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .delete('/api/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/categories/:id/spending-history', () => {
    let spendingCategory;

    beforeAll(async () => {
      spendingCategory = await createTestCategory({
        name: 'Spending History Category',
        type: 'expense',
      });
      // Create some transactions for this category
      for (let i = 0; i < 3; i++) {
        await createTestTransaction({
          title: `History Test ${i}`,
          lines: [
            {
              accountId: testAccount.id,
              amount: 50 + i * 10,
              direction: 'expense',
              categoryId: spendingCategory.id,
            },
          ],
        });
      }
    });

    it('should return spending history for expense category', async () => {
      const res = await request(app)
        .get(`/api/categories/${spendingCategory.id}/spending-history`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('category');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('stats');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return income history for income category', async () => {
      const incCat = await createTestCategory({
        name: 'Income History Category',
        type: 'income',
      });

      await createTestTransaction({
        title: 'Income Test',
        lines: [
          {
            accountId: testAccount.id,
            amount: 1000,
            direction: 'income',
            categoryId: incCat.id,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/categories/${incCat.id}/spending-history`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.category.type).toBe('income');
    });

    it('should support different month ranges', async () => {
      const res6 = await request(app)
        .get(`/api/categories/${spendingCategory.id}/spending-history?months=6`)
        .set('Authorization', `Bearer ${testUser.token}`);

      const res12 = await request(app)
        .get(`/api/categories/${spendingCategory.id}/spending-history?months=12`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res6.status).toBe(200);
      expect(res12.status).toBe(200);
      expect(res6.body.data.length).toBe(6);
      expect(res12.body.data.length).toBe(12);
    });

    it('should calculate correct statistics', async () => {
      const res = await request(app)
        .get(`/api/categories/${spendingCategory.id}/spending-history`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.body.stats).toHaveProperty('total');
      expect(res.body.stats).toHaveProperty('average');
      expect(res.body.stats).toHaveProperty('max');
      expect(res.body.stats).toHaveProperty('min');
      expect(res.body.stats).toHaveProperty('monthsWithSpending');

      // Total should be sum of transactions
      expect(res.body.stats.total).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .get('/api/categories/00000000-0000-0000-0000-000000000000/spending-history')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });

    it('should fill missing months with zeros', async () => {
      const res = await request(app)
        .get(`/api/categories/${spendingCategory.id}/spending-history?months=12`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.body.data.length).toBe(12);
      // Each month should have the expected structure
      res.body.data.forEach(month => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('monthLabel');
        expect(month).toHaveProperty('total');
        expect(month).toHaveProperty('transactionCount');
      });
    });
  });
});
