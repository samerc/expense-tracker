-- Expense categories
INSERT INTO categories (household_id, name, type, icon, color) VALUES
    (demo_household_id, 'Groceries', 'expense', 'ShoppingCart', '#10B981'),
    (demo_household_id, 'Dining Out', 'expense', 'UtensilsCrossed', '#F59E0B'),
    (demo_household_id, 'Transportation', 'expense', 'Car', '#3B82F6'),
    (demo_household_id, 'Entertainment', 'expense', 'Film', '#8B5CF6'),
    (demo_household_id, 'Utilities', 'expense', 'Lightbulb', '#EF4444'),
    (demo_household_id, 'Insurance', 'expense', 'Shield', '#6366F1'),
    (demo_household_id, 'Healthcare', 'expense', 'Hospital', '#EC4899'),
    (demo_household_id, 'Shopping', 'expense', 'ShoppingBag', '#14B8A6'),
    (demo_household_id, 'Education', 'expense', 'BookOpen', '#F97316'),
    (demo_household_id, 'Housing', 'expense', 'Home', '#06B6D4');

-- Income categories
INSERT INTO categories (household_id, name, type, icon, color) VALUES
    (demo_household_id, 'Salary', 'income', 'DollarSign', '#10B981'),
    (demo_household_id, 'Freelance', 'income', 'Briefcase', '#3B82F6'),
    (demo_household_id, 'Investment', 'income', 'TrendingUp', '#8B5CF6'),
    (demo_household_id, 'Gift', 'income', 'Gift', '#F59E0B');