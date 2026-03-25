-- Visit requests: tenant requests a property visit; host sees requests for their properties
CREATE TABLE IF NOT EXISTS visit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time VARCHAR(20) NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_requests_host_id ON visit_requests (host_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_tenant_id ON visit_requests (tenant_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_property_id ON visit_requests (property_id);
