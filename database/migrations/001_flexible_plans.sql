-- ============================================
-- PART 1: DROP OLD STRUCTURES
-- ============================================

DROP TABLE IF EXISTS user_feature_overrides CASCADE;
DROP TABLE IF EXISTS plan_features CASCADE;
DROP TABLE IF EXISTS custom_plan_assignments CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS household_encryption CASCADE;
DROP TABLE IF EXISTS backup_configurations CASCADE;

-- ============================================
-- PART 2: SUBSCRIPTION PLANS
-- ============================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_custom ON subscription_plans(is_custom);

-- ============================================
-- PART 3: PLAN FEATURES
-- ============================================

CREATE TABLE plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(plan_id, feature_key)
);

CREATE INDEX idx_plan_features_plan ON plan_features(plan_id);
CREATE INDEX idx_plan_features_key ON plan_features(feature_key);

-- ============================================
-- PART 4: USER FEATURE OVERRIDES
-- ============================================

CREATE TABLE user_feature_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value JSONB NOT NULL,
    granted_by UUID REFERENCES users(id),
    reason TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, feature_key)
);

CREATE INDEX idx_user_overrides_user ON user_feature_overrides(user_id);
CREATE INDEX idx_user_overrides_expires ON user_feature_overrides(expires_at);

-- ============================================
-- PART 5: HOUSEHOLD ENCRYPTION
-- ============================================

CREATE TABLE household_encryption (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    encryption_enabled BOOLEAN DEFAULT TRUE,
    key_derivation_method VARCHAR(50) DEFAULT 'pbkdf2',
    key_hint TEXT,
    encrypted_key_backup TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(household_id)
);

CREATE INDEX idx_household_encryption_household ON household_encryption(household_id);

-- ============================================
-- PART 6: BACKUP CONFIGURATIONS
-- ============================================

CREATE TABLE backup_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    backup_provider VARCHAR(50) NOT NULL,
    backup_frequency VARCHAR(50) DEFAULT 'daily',
    last_backup_at TIMESTAMP,
    last_backup_status VARCHAR(50),
    backup_file_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backup_household ON backup_configurations(household_id);
CREATE INDEX idx_backup_status ON backup_configurations(last_backup_status);

-- ============================================
-- PART 7: ADD ENCRYPTION FLAGS TO HOUSEHOLDS
-- ============================================

ALTER TABLE households
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS data_encrypted_at_rest BOOLEAN DEFAULT TRUE;

-- ============================================
-- PART 8: TRIGGERS
-- ============================================

CREATE TRIGGER update_subscription_plans_modified_at 
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_household_encryption_modified_at 
    BEFORE UPDATE ON household_encryption
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_backup_configurations_modified_at 
    BEFORE UPDATE ON backup_configurations
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_at();
