-- Tenant preferences (one per tenant)
CREATE TABLE IF NOT EXISTS tenant_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  budget_min INT,
  budget_max INT,
  occupancy VARCHAR(50),
  location VARCHAR(255),
  possession VARCHAR(50),
  gender_preference VARCHAR(50),
  property_type VARCHAR(50),
  furnishing_type VARCHAR(50),
  smoking_preference VARCHAR(50),
  drinking_preference VARCHAR(50),
  food_type VARCHAR(50),
  priority_weights JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_preferences_user_id ON tenant_preferences (user_id);
