-- ============================================
-- SEED DEFAULT PLANS
-- ============================================

-- Insert base plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, sort_order) VALUES
    ('free', 'Free', 'Try out the app with limited features', 0, 1),
    ('basic', 'Basic', 'Full mobile app experience with unlimited transactions', 2.99, 2),
    ('pro', 'Pro', 'Everything + web access and advanced features', 4.99, 3)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    sort_order = EXCLUDED.sort_order;

-- Get plan IDs for feature insertion
DO $$
DECLARE
    free_id UUID;
    basic_id UUID;
    pro_id UUID;
BEGIN
    SELECT id INTO free_id FROM subscription_plans WHERE name = 'free';
    SELECT id INTO basic_id FROM subscription_plans WHERE name = 'basic';
    SELECT id INTO pro_id FROM subscription_plans WHERE name = 'pro';

    -- Delete existing features (for clean re-seeding)
    DELETE FROM plan_features WHERE plan_id IN (free_id, basic_id, pro_id);

    -- ========================================
    -- FREE PLAN FEATURES
    -- ========================================
    INSERT INTO plan_features (plan_id, feature_key, feature_value) VALUES
        -- Limits
        (free_id, 'transaction_limit_monthly', '200'),
        (free_id, 'max_users', '1'),
        (free_id, 'max_accounts', '3'),
        
        -- Core features
        (free_id, 'mobile_app', 'true'),
        (free_id, 'offline_mode', 'true'),
        (free_id, 'cloud_sync', 'true'),
        (free_id, 'encrypted_storage', 'true'),
        (free_id, 'cloud_backup', 'true'),
        
        -- Transaction features
        (free_id, 'manual_transactions', 'true'),
        (free_id, 'split_transactions', 'true'),
        (free_id, 'multi_currency', 'true'),
        (free_id, 'transaction_notes', 'true'),
        (free_id, 'transaction_attachments', 'false'),
        
        -- Categories & budgets
        (free_id, 'custom_categories', 'true'),
        (free_id, 'budgets', 'true'),
        (free_id, 'allocations', 'true'),
        (free_id, 'create_categories', 'false'),
        
        -- Reporting (basic only)
        (free_id, 'basic_reports', 'true'),
        (free_id, 'advanced_reports', 'false'),
        (free_id, 'export_csv', 'false'),
        (free_id, 'export_pdf', 'false'),
        (free_id, 'custom_date_ranges', 'false'),
        (free_id, 'comparative_analysis', 'false'),
        
        -- Advanced features (all disabled)
        (free_id, 'web_access', 'false'),
        (free_id, 'bulk_import', 'false'),
        (free_id, 'bulk_edit', 'false'),
        (free_id, 'auto_categorization', 'false'),
        (free_id, 'receipt_scanning', 'false'),
        (free_id, 'reconciliation_mode', 'false'),
        (free_id, 'scheduled_reports', 'false'),
        (free_id, 'api_access', 'false'),
        (free_id, 'recurring_transactions', 'false'),
        
        -- Support
        (free_id, 'support_level', '"community"');

    -- ========================================
    -- BASIC PLAN FEATURES
    -- ========================================
    INSERT INTO plan_features (plan_id, feature_key, feature_value) VALUES
        -- Limits (unlimited)
        (basic_id, 'transaction_limit_monthly', 'null'),
        (basic_id, 'max_users', '3'),
        (basic_id, 'max_accounts', 'null'),
        
        -- Core features
        (basic_id, 'mobile_app', 'true'),
        (basic_id, 'offline_mode', 'true'),
        (basic_id, 'cloud_sync', 'true'),
        (basic_id, 'encrypted_storage', 'true'),
        (basic_id, 'cloud_backup', 'true'),
        
        -- Transaction features (all)
        (basic_id, 'manual_transactions', 'true'),
        (basic_id, 'split_transactions', 'true'),
        (basic_id, 'multi_currency', 'true'),
        (basic_id, 'transaction_notes', 'true'),
        (basic_id, 'transaction_attachments', 'true'),
        
        -- Categories & budgets
        (basic_id, 'custom_categories', 'true'),
        (basic_id, 'budgets', 'true'),
        (basic_id, 'allocations', 'true'),
        (basic_id, 'create_categories', 'false'),
        
        -- Reporting (mobile only, but advanced)
        (basic_id, 'basic_reports', 'true'),
        (basic_id, 'advanced_reports', 'true'),
        (basic_id, 'export_csv', 'true'),
        (basic_id, 'export_pdf', 'true'),
        (basic_id, 'custom_date_ranges', 'true'),
        (basic_id, 'comparative_analysis', 'true'),
        
        -- Mobile-advanced features
        (basic_id, 'receipt_scanning', 'true'),
        (basic_id, 'recurring_transactions', 'true'),
        (basic_id, 'auto_categorization', 'true'),
        
        -- Web features (NO)
        (basic_id, 'web_access', 'false'),
        (basic_id, 'bulk_import', 'false'),
        (basic_id, 'bulk_edit', 'false'),
        (basic_id, 'reconciliation_mode', 'false'),
        (basic_id, 'scheduled_reports', 'false'),
        (basic_id, 'api_access', 'false'),
        
        -- Support
        (basic_id, 'support_level', '"email"');

    -- ========================================
    -- PRO PLAN FEATURES (EVERYTHING)
    -- ========================================
    INSERT INTO plan_features (plan_id, feature_key, feature_value) VALUES
        -- Limits (unlimited)
        (pro_id, 'transaction_limit_monthly', 'null'),
        (pro_id, 'max_users', '5'),
        (pro_id, 'max_accounts', 'null'),
        
        -- Core features
        (pro_id, 'mobile_app', 'true'),
        (pro_id, 'offline_mode', 'true'),
        (pro_id, 'cloud_sync', 'true'),
        (pro_id, 'encrypted_storage', 'true'),
        (pro_id, 'cloud_backup', 'true'),
        
        -- Transaction features (all)
        (pro_id, 'manual_transactions', 'true'),
        (pro_id, 'split_transactions', 'true'),
        (pro_id, 'multi_currency', 'true'),
        (pro_id, 'transaction_notes', 'true'),
        (pro_id, 'transaction_attachments', 'true'),
        
        -- Categories & budgets
        (pro_id, 'custom_categories', 'true'),
        (pro_id, 'budgets', 'true'),
        (pro_id, 'allocations', 'true'),
        (pro_id, 'create_categories', 'true'),
        
        -- Reporting (all)
        (pro_id, 'basic_reports', 'true'),
        (pro_id, 'advanced_reports', 'true'),
        (pro_id, 'export_csv', 'true'),
        (pro_id, 'export_pdf', 'true'),
        (pro_id, 'export_excel', 'true'),
        (pro_id, 'custom_date_ranges', 'true'),
        (pro_id, 'comparative_analysis', 'true'),
        
        -- Advanced features (ALL)
        (pro_id, 'web_access', 'true'),
        (pro_id, 'bulk_import', 'true'),
        (pro_id, 'bulk_edit', 'true'),
        (pro_id, 'auto_categorization', 'true'),
        (pro_id, 'receipt_scanning', 'true'),
        (pro_id, 'reconciliation_mode', 'true'),
        (pro_id, 'scheduled_reports', 'true'),
        (pro_id, 'api_access', 'true'),
        (pro_id, 'recurring_transactions', 'true'),
        (pro_id, 'smart_insights', 'true'),
        (pro_id, 'goals_tracking', 'true'),
        
        -- Support
        (pro_id, 'support_level', '"priority"');
        
    RAISE NOTICE 'Default plans seeded successfully';
END $$;
