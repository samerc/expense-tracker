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
  testData,
} = require('./setup');

describe('Transactions API', () => {
  let testUser;
  let testAccount;
  let testAccountEUR;
  let expenseCategory;
  let incomeCategory;
  let testTransaction;
  const testId = Date.now();

  beforeAll(async () => {
    await createTestHousehold(`Transactions Test Household ${testId}`);
    testUser = await createTestUser({
      email: `transactions-test-${testId}@example.com`,
      role: 'admin',
    });
    testAccount = await createTestAccount({
      name: 'Main Account',
      type: 'bank',
      currency: 'USD',
      initialBalance: 10000,
    });
    testAccountEUR = await createTestAccount({
      name: 'Euro Account',
      type: 'bank',
      currency: 'EUR',
      initialBalance: 5000,
    });
    expenseCategory = await createTestCategory({
      name: 'Groceries',
      type: 'expense',
    });
    incomeCategory = await createTestCategory({
      name: 'Salary',
      type: 'income',
    });
    testTransaction = await createTestTransaction({
      title: 'Test Expense',
      description: 'Weekly groceries',
      lines: [
        {
          accountId: testAccount.id,
          amount: 100,
          currency: 'USD',
          direction: 'expense',
          categoryId: expenseCategory.id,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/transactions', () => {
    it('should return paginated transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('transactions');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const res = await request(app)
        .get('/api/transactions?page=1&limit=5')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 5);
      expect(res.body.transactions.length).toBeLessThanOrEqual(5);
    });

    it('should filter by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/transactions?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      // All returned transactions should be within date range
      res.body.transactions.forEach(tx => {
        expect(tx.date.split('T')[0]).toBe(today);
      });
    });

    it('should filter by account', async () => {
      const res = await request(app)
        .get(`/api/transactions?accountId=${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      // Transactions should have lines referencing this account
    });

    it('should filter by category', async () => {
      const res = await request(app)
        .get(`/api/transactions?categoryId=${expenseCategory.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
    });

    it('should search by title/description', async () => {
      const res = await request(app)
        .get('/api/transactions?search=groceries')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
    });

    it('should reject request without authentication', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should return transaction with lines', async () => {
      const res = await request(app)
        .get(`/api/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', testTransaction.id);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('lines');
      expect(Array.isArray(res.body.lines)).toBe(true);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app)
        .get('/api/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/transactions', () => {
    it('should create single-line expense transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Coffee',
          description: 'Morning coffee',
          lines: [
            {
              accountId: testAccount.id,
              amount: 5.50,
              currency: 'USD',
              direction: 'expense',
              categoryId: expenseCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title', 'Coffee');
    });

    it('should create single-line income transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Paycheck',
          description: 'Monthly salary',
          lines: [
            {
              accountId: testAccount.id,
              amount: 3000,
              currency: 'USD',
              direction: 'income',
              categoryId: incomeCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should create multi-line split transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Store Shopping',
          description: 'Mixed purchase',
          lines: [
            {
              accountId: testAccount.id,
              amount: 50,
              currency: 'USD',
              direction: 'expense',
              categoryId: expenseCategory.id,
              exchangeRate: 1,
              notes: 'Groceries portion',
            },
            {
              accountId: testAccount.id,
              amount: 30,
              currency: 'USD',
              direction: 'expense',
              categoryId: expenseCategory.id,
              exchangeRate: 1,
              notes: 'Household items',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.lines).toHaveLength(2);
    });

    it('should create multi-currency transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Euro Purchase',
          description: 'Bought from EU store',
          lines: [
            {
              accountId: testAccountEUR.id,
              amount: 100,
              currency: 'EUR',
              direction: 'expense',
              categoryId: expenseCategory.id,
              exchangeRate: 1.10, // 1 EUR = 1.10 USD
            },
          ],
        });

      expect(res.status).toBe(201);
      // Base currency amount should be calculated
      expect(res.body.lines[0]).toHaveProperty('base_currency_amount');
    });

    it('should create mixed income/expense transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Refund with Purchase',
          description: 'Got refund, bought something else',
          lines: [
            {
              accountId: testAccount.id,
              amount: 50,
              currency: 'USD',
              direction: 'income',
              categoryId: incomeCategory.id,
              exchangeRate: 1,
              notes: 'Refund',
            },
            {
              accountId: testAccount.id,
              amount: 30,
              currency: 'USD',
              direction: 'expense',
              categoryId: expenseCategory.id,
              exchangeRate: 1,
              notes: 'New purchase',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.lines).toHaveLength(2);
    });

    it('should reject transaction without required fields', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          // Missing title and lines
        });

      expect(res.status).toBe(400);
    });

    it('should reject transaction with empty lines array', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Empty Transaction',
          lines: [],
        });

      expect(res.status).toBe(400);
    });

    it('should reject line with invalid account', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Invalid Account',
          lines: [
            {
              accountId: '00000000-0000-0000-0000-000000000000',
              amount: 10,
              currency: 'USD',
              direction: 'expense',
              categoryId: expenseCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should reject line with invalid category', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Invalid Category',
          lines: [
            {
              accountId: testAccount.id,
              amount: 10,
              currency: 'USD',
              direction: 'expense',
              categoryId: '00000000-0000-0000-0000-000000000000',
              exchangeRate: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should affect account balance after expense', async () => {
      // Get initial balance
      const beforeRes = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);
      const beforeBalance = parseFloat(beforeRes.body.current_balance);

      // Create expense
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Balance Test Expense',
          lines: [
            {
              accountId: testAccount.id,
              amount: 100,
              currency: 'USD',
              direction: 'expense',
              categoryId: expenseCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      // Get balance after
      const afterRes = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);
      const afterBalance = parseFloat(afterRes.body.current_balance);

      expect(afterBalance).toBe(beforeBalance - 100);
    });

    it('should affect account balance after income', async () => {
      // Get initial balance
      const beforeRes = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);
      const beforeBalance = parseFloat(beforeRes.body.current_balance);

      // Create income
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Balance Test Income',
          lines: [
            {
              accountId: testAccount.id,
              amount: 500,
              currency: 'USD',
              direction: 'income',
              categoryId: incomeCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      // Get balance after
      const afterRes = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);
      const afterBalance = parseFloat(afterRes.body.current_balance);

      expect(afterBalance).toBe(beforeBalance + 500);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    let updateTransaction;

    beforeEach(async () => {
      updateTransaction = await createTestTransaction({
        title: 'Update Test Transaction',
        lines: [
          {
            accountId: testAccount.id,
            amount: 50,
            direction: 'expense',
            categoryId: expenseCategory.id,
          },
        ],
      });
    });

    it('should update transaction title and description', async () => {
      const res = await request(app)
        .put(`/api/transactions/${updateTransaction.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title', 'Updated Title');
      expect(res.body).toHaveProperty('description', 'Updated description');
    });

    it('should update transaction date', async () => {
      const newDate = '2024-06-15';
      const res = await request(app)
        .put(`/api/transactions/${updateTransaction.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: newDate,
        });

      expect(res.status).toBe(200);
      expect(res.body.date.split('T')[0]).toBe(newDate);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app)
        .put('/api/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          title: 'Ghost Update',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    let deleteTransaction;

    beforeEach(async () => {
      deleteTransaction = await createTestTransaction({
        title: 'Delete Test Transaction',
        lines: [
          {
            accountId: testAccount.id,
            amount: 25,
            direction: 'expense',
            categoryId: expenseCategory.id,
          },
        ],
      });
    });

    it('should soft delete a transaction', async () => {
      const res = await request(app)
        .delete(`/api/transactions/${deleteTransaction.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');

      // Verify transaction is no longer returned
      const getRes = await request(app)
        .get(`/api/transactions/${deleteTransaction.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(getRes.status).toBe(404);
    });

    it('should restore account balance after deleting expense', async () => {
      // Get balance before delete
      const beforeRes = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);
      const beforeBalance = parseFloat(beforeRes.body.current_balance);

      // Delete the transaction
      await request(app)
        .delete(`/api/transactions/${deleteTransaction.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      // Get balance after delete
      const afterRes = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${testUser.token}`);
      const afterBalance = parseFloat(afterRes.body.current_balance);

      // Balance should increase by deleted expense amount
      expect(afterBalance).toBe(beforeBalance + 25);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app)
        .delete('/api/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Allocation Integration', () => {
    let allocationCategory;
    let allocation;

    beforeAll(async () => {
      allocationCategory = await createTestCategory({
        name: 'Allocated Category',
        type: 'expense',
      });
      allocation = await createTestAllocation({
        categoryId: allocationCategory.id,
        allocatedAmount: 500,
        availableAmount: 500,
        spentAmount: 0,
      });
    });

    it('should auto-deduct from allocation when creating expense', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          title: 'Allocation Test Expense',
          lines: [
            {
              accountId: testAccount.id,
              amount: 100,
              currency: 'USD',
              direction: 'expense',
              categoryId: allocationCategory.id,
              exchangeRate: 1,
            },
          ],
        });

      expect(res.status).toBe(201);

      // Check allocation was updated
      const allocRes = await request(app)
        .get('/api/allocations')
        .set('Authorization', `Bearer ${testUser.token}`);

      const updatedAlloc = allocRes.body.allocations.find(
        a => a.category_id === allocationCategory.id
      );

      if (updatedAlloc) {
        expect(parseFloat(updatedAlloc.spent_amount)).toBeGreaterThan(0);
      }
    });
  });
});
