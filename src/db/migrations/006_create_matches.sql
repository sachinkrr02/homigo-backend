-- Matches (tenant swipe + optional host swipe; compatibility score)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  tenant_swiped_right BOOLEAN NOT NULL,
  host_swiped_right BOOLEAN DEFAULT FALSE,
  compatibility_score INT DEFAULT 0,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_tenant_id ON matches (tenant_id);
CREATE INDEX IF NOT EXISTS idx_matches_host_id ON matches (host_id);
