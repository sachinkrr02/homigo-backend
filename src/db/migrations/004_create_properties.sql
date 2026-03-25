-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  locality VARCHAR(255) NOT NULL,
  tower_building VARCHAR(255),
  furnishing_type VARCHAR(100) NOT NULL,
  parking_available BOOLEAN DEFAULT FALSE,
  total_area DECIMAL(10,2),
  rented_area DECIMAL(10,2),
  rent INT NOT NULL,
  deposit INT NOT NULL,
  brokerage INT,
  monthly_charges INT,
  distance_metro VARCHAR(100),
  distance_bus VARCHAR(100),
  distance_gym VARCHAR(100),
  distance_airport VARCHAR(100),
  nearby_hospitals JSONB DEFAULT '[]',
  nearby_malls JSONB DEFAULT '[]',
  nearby_grocery JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  pet_policy VARCHAR(255),
  water_supply VARCHAR(255),
  restrictions TEXT,
  property_type VARCHAR(50) NOT NULL,
  occupancy VARCHAR(50),
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_host_id ON properties (host_id);
CREATE INDEX IF NOT EXISTS idx_properties_locality_rent ON properties (locality, rent);
