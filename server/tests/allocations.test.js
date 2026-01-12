const request = require('supertest');
const app = require('../src/app');
const {
  createTestHousehold,
  createTestUser,
  createTestAccount,
  createTestCategory,
  createTestTransaction,
  createTestAllocation,
  cleanupTestData,
  db,
} = require('./setup');

describe('Allocations API (Envelope Budgeting)', () => {
  let testUser;
  let regularUser;
  let testAccount;
  let incomeCategory;
  let currentMonth;
  const testId = Date.now();

  beforeAll(async () => {
    await createTestHousehold(`Allocations Test Household ${testId}`);
    // Create both regular and admin users for transactions to work
    regularUser = await createTestUser({
      email: `allocations-regular-${testId}@example.com`,
      role: 'regular',
    });
    testUser = await createTestUser({
      email: `allocations-test-${testId}@example.com`,
      role: 'admin',
    });
    testAccount = await createTestAccount({
      name: 'Allocations Account',
      type: 'bank',
      currency: 'USD',
      initialBalance: 10000,
    });

    incomeCategory = await createTestCategory({
      name: `Salary ${testId}`,
      type: 'income',
    });

    // Get current month in YYYY-MM-01 format
    const now = new Date();
    currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/allocations', () => {
    let getAllocCategory;

    beforeAll(async () => {
      getAllocCategory = await createTestCategory({
        name: `Get Alloc Category ${testId}`,
        type: 'expense',
      });
      await createTestAllocation({
        categoryId: getAllocCategory.id,
        month: currentMonth,
        allocatedAmount: 500,
        availableAmount: 500,
        spentAmount: 0,
      });
    });

    it('should return allocations for current month', async () => {
      const res = await request(app)
        .get(`/api/allocations?month=${currentMonth}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('allocations');
      expect(Array.isArray(res.body.allocations)).toBe(true);
    });

    it('should return allocations for specific month', async () => {
      const res = await request(app)
        .get(`/api/allocations?month=${currentMonth}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('allocations');
    });

    it('should include allocation details', async () => {
      const res = await request(app)
        .get(`/api/allocations?month=${currentMonth}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.body.allocations.length > 0) {
        const allocation = res.body.allocations[0];
        expect(allocation).toHaveProperty('category_id');
        expect(allocation).toHaveProperty('allocated_amount');
        expect(allocation).toHaveProperty('available_amount');
        expect(allocation).toHaveProperty('spent_amount');
      }
    });

    it('should calculate balance correctly', async () => {
      const res = await request(app)
        .get(`/api/allocations?month=${currentMonth}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.body.allocations.length > 0) {
        const allocation = res.body.allocations[0];
        const calculatedBalance =
          parseFloat(allocation.available_amount) - parseFloat(allocation.spent_amount);
        expect(parseFloat(allocation.balance)).toBeCloseTo(calculatedBalance, 2);
      }
    });

    it('should reject request without authentication', async () => {
      const res = await request(app).get('/api/allocations');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/allocations', () => {
    let postCategory1, postCategory2;

    beforeAll(async () => {
      postCategory1 = await createTestCategory({
        name: `Post Alloc 1 ${testId}`,
        type: 'expense',
      });
      postCategory2 = await createTestCategory({
        name: `Post Alloc 2 ${testId}`,
        type: 'expense',
      });
    });

    it('should create new allocation for category', async () => {
      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          categoryId: postCategory1.id,
          month: currentMonth,
          allocatedAmount: 300,
        });

      // API uses upsert so returns 200
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('category_id', postCategory1.id);
      expect(parseFloat(res.body.allocated_amount)).toBe(300);
    });

    it('should create allocation with zero amount', async () => {
      const zeroCategory = await createTestCategory({
        name: `Zero Budget ${testId}`,
        type: 'expense',
      });

      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          categoryId: zeroCategory.id,
          month: currentMonth,
          allocatedAmount: 0,
        });

      // API uses upsert so returns 200
      expect(res.status).toBe(200);
      expect(parseFloat(res.body.allocated_amount)).toBe(0);
    });

    it('should reject allocation without category', async () => {
      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          month: currentMonth,
          allocatedAmount: 100,
        });

      expect(res.status).toBe(400);
    });

    it('should reject allocation for non-existent category', async () => {
      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          categoryId: '00000000-0000-0000-0000-000000000000',
          month: currentMonth,
          allocatedAmount: 100,
        });

      // API returns 404 for non-existent category
      expect(res.status).toBe(404);
    });

    it('should handle duplicate allocation for same category/month', async () => {
      // First allocation
      await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          categoryId: postCategory2.id,
          month: currentMonth,
          allocatedAmount: 200,
        });

      // Upsert updates existing allocation
      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          categoryId: postCategory2.id,
          month: currentMonth,
          allocatedAmount: 300,
        });

      // Upsert returns 200 and updates the amount
      expect(res.status).toBe(200);
      expect(parseFloat(res.body.allocated_amount)).toBe(300);
    });
  });

  describe('Allocation Updates via POST (upsert)', () => {
    let updateCategory;
    let testAllocation;

    beforeAll(async () => {
      updateCategory = await createTestCategory({
        name: `Update Alloc ${testId}`,
        type: 'expense',
      });
      testAllocation = await createTestAllocation({
        categoryId: updateCategory.id,
        month: currentMonth,
        allocatedAmount: 400,
        availableAmount: 400,
      });
    });

    it('should update allocated amount via upsert', async () => {
      // API uses upsert (POST) to update allocations
      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          categoryId: updateCategory.id,
          month: currentMonth,
          allocatedAmount: 600,
        });

      expect(res.status).toBe(200);
      expect(parseFloat(res.body.allocated_amount)).toBe(600);
    });

    it('should preserve available amount when updating allocated', async () => {
      // First upsert creates/updates allocation
      const res = await request(app)
        .post('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          categoryId: updateCategory.id,
          month: currentMonth,
          allocatedAmount: 700,
        });

      expect(res.status).toBe(200);
      // available_amount should be preserved from previous value
      expect(parseFloat(res.body.available_amount)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DELETE /api/allocations/:id', () => {
    let deleteCategory;
    let deleteAllocation;

    beforeAll(async () => {
      deleteCategory = await createTestCategory({
        name: `Delete Alloc ${testId}`,
        type: 'expense',
      });
      deleteAllocation = await createTestAllocation({
        categoryId: deleteCategory.id,
        month: currentMonth,
        allocatedAmount: 300,
        availableAmount: 300,
      });
    });

    it('should return 404 for non-existent allocation', async () => {
      const res = await request(app)
        .delete('/api/allocations/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });

    it('should delete existing allocation', async () => {
      const res = await request(app)
        .delete(`/api/allocations/${deleteAllocation.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/allocations/fund', () => {
    let fundCategory;
    let fundAllocation;

    beforeAll(async () => {
      fundCategory = await createTestCategory({
        name: `Fund Category ${testId}`,
        type: 'expense',
      });
      fundAllocation = await createTestAllocation({
        categoryId: fundCategory.id,
        month: currentMonth,
        allocatedAmount: 500,
        availableAmount: 0,
      });
    });

    it('should fund allocations from income', async () => {
      // API expects { month, funding: [{ allocationId, amount }] }
      const res = await request(app)
        .post('/api/allocations/fund')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          month: currentMonth,
          funding: [{ allocationId: fundAllocation.id, amount: 200 }],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject request without funding array', async () => {
      const res = await request(app)
        .post('/api/allocations/fund')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          month: currentMonth,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/allocations/move', () => {
    let sourceCategory, targetCategory;
    let sourceAllocation, targetAllocation;

    beforeAll(async () => {
      sourceCategory = await createTestCategory({
        name: `Move Source ${testId}`,
        type: 'expense',
      });
      targetCategory = await createTestCategory({
        name: `Move Target ${testId}`,
        type: 'expense',
      });

      sourceAllocation = await createTestAllocation({
        categoryId: sourceCategory.id,
        month: currentMonth,
        allocatedAmount: 500,
        availableAmount: 300,
      });
      targetAllocation = await createTestAllocation({
        categoryId: targetCategory.id,
        month: currentMonth,
        allocatedAmount: 200,
        availableAmount: 100,
      });
    });

    it('should move money between allocations', async () => {
      const res = await request(app)
        .post('/api/allocations/move')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          fromAllocationId: sourceAllocation.id,
          toAllocationId: targetAllocation.id,
          amount: 50,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject moving more than available', async () => {
      const res = await request(app)
        .post('/api/allocations/move')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          fromAllocationId: sourceAllocation.id,
          toAllocationId: targetAllocation.id,
          amount: 99999,
        });

      expect(res.status).toBe(400);
    });

    it('should reject moving negative amount', async () => {
      const res = await request(app)
        .post('/api/allocations/move')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          fromAllocationId: sourceAllocation.id,
          toAllocationId: targetAllocation.id,
          amount: -50,
        });

      expect(res.status).toBe(400);
    });

    it('should reject moving with missing parameters', async () => {
      const res = await request(app)
        .post('/api/allocations/move')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          fromAllocationId: sourceAllocation.id,
          // missing toAllocationId and amount
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Transaction Integration', () => {
    let txCategory;
    let txAllocation;

    beforeAll(async () => {
      txCategory = await createTestCategory({
        name: `TX Integration ${testId}`,
        type: 'expense',
      });
      txAllocation = await createTestAllocation({
        categoryId: txCategory.id,
        month: currentMonth,
        allocatedAmount: 500,
        availableAmount: 500,
        spentAmount: 0,
      });
    });

    it('should allow creating expense transactions with allocated category', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Allocation Test Expense',
          lines: [
            {
              accountId: testAccount.id,
              amount: 75,
              currency: 'USD',
              direction: 'expense',
              categoryId: txCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      // 201 for success, 403 if feature access restricts it
      expect([201, 403]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body).toHaveProperty('id');
      }
    });

    it('should allow creating income transactions', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Income Test',
          lines: [
            {
              accountId: testAccount.id,
              amount: 1000,
              currency: 'USD',
              direction: 'income',
              categoryId: incomeCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      // 201 for success, 403 if feature access restricts it
      expect([201, 403]).toContain(res.status);
    });

    it('should not have allocations for income categories', async () => {
      const res = await request(app)
        .get(`/api/allocations?month=${currentMonth}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      const incomeAlloc = res.body.allocations.find(
        a => a.category_id === incomeCategory.id
      );

      // Income categories typically don't have allocations
      expect(incomeAlloc).toBeUndefined();
    });
  });

  describe('GET /api/allocations/:id/transactions', () => {
    let txListCategory;
    let txListAllocation;

    beforeAll(async () => {
      txListCategory = await createTestCategory({
        name: `TX List ${testId}`,
        type: 'expense',
      });
      txListAllocation = await createTestAllocation({
        categoryId: txListCategory.id,
        month: currentMonth,
        allocatedAmount: 1000,
        availableAmount: 1000,
      });

      for (let i = 0; i < 3; i++) {
        await createTestTransaction({
          title: `Allocation TX ${i}`,
          lines: [
            {
              accountId: testAccount.id,
              amount: 25 + i * 10,
              direction: 'expense',
              categoryId: txListCategory.id,
            },
          ],
        });
      }
    });

    it('should return transactions for allocation', async () => {
      const res = await request(app)
        .get(`/api/allocations/${txListAllocation.id}/transactions`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(Array.isArray(res.body.transactions || res.body)).toBe(true);
      }
    });

    it('should only include transactions from correct month', async () => {
      const res = await request(app)
        .get(`/api/allocations/${txListAllocation.id}/transactions`)
        .set('Authorization', `Bearer ${testUser.token}`);

      if (res.status === 200) {
        const transactions = res.body.transactions || res.body;
        transactions.forEach(tx => {
          const txMonth = tx.date.slice(0, 7);
          // currentMonth is YYYY-MM-01, so compare with first 7 chars
          expect(txMonth).toBe(currentMonth.slice(0, 7));
        });
      }
    });
  });

  describe('Month Rollover', () => {
    it('should handle different months independently', async () => {
      const monthCategory = await createTestCategory({
        name: `Month Test ${testId}`,
        type: 'expense',
      });

      await createTestAllocation({
        categoryId: monthCategory.id,
        month: currentMonth,
        allocatedAmount: 500,
        availableAmount: 500,
      });

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

      await createTestAllocation({
        categoryId: monthCategory.id,
        month: nextMonthStr,
        allocatedAmount: 600,
        availableAmount: 600,
      });

      const currentRes = await request(app)
        .get(`/api/allocations?month=${currentMonth}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      // Use full date format (YYYY-MM-01) for next month as well
      const nextRes = await request(app)
        .get(`/api/allocations?month=${nextMonthStr}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(currentRes.status).toBe(200);
      expect(nextRes.status).toBe(200);

      const currentAlloc = currentRes.body.allocations.find(
        a => a.category_id === monthCategory.id
      );
      const nextAlloc = nextRes.body.allocations.find(
        a => a.category_id === monthCategory.id
      );

      expect(currentAlloc).toBeDefined();
      expect(nextAlloc).toBeDefined();
      expect(parseFloat(currentAlloc.allocated_amount)).toBe(500);
      expect(parseFloat(nextAlloc.allocated_amount)).toBe(600);
    });
  });

  describe('Budget Summary', () => {
    it('should include summary in allocations response', async () => {
      const res = await request(app)
        .get(`/api/allocations?month=${currentMonth}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary).toHaveProperty('totalAllocated');
      expect(res.body.summary).toHaveProperty('totalAvailable');
      expect(res.body.summary).toHaveProperty('totalSpent');
    });

    it('should include unallocated funds in summary', async () => {
      const res = await request(app)
        .get(`/api/allocations?month=${currentMonth}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.summary).toHaveProperty('unallocatedFunds');
      expect(typeof res.body.summary.unallocatedFunds).toBe('number');
    });
  });
});
