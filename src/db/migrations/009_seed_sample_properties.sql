-- Seed host user for sample properties (idempotent)
INSERT INTO users (id, name, role, email)
VALUES ('a0000000-0000-4000-8000-000000000001', 'Homigo Demo Host', 'host', 'seed-host@homigo.local')
ON CONFLICT (id) DO NOTHING;

-- Sample properties (mirror mock_data_service.dart); idempotent
INSERT INTO properties (
  id, host_id, locality, tower_building, furnishing_type, parking_available,
  total_area, rented_area, rent, deposit, monthly_charges, distance_metro,
  amenities, property_type, occupancy, is_premium
) VALUES
  (
    'b0000001-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Bandra West',
    'Sea Breeze Tower',
    'Fully Furnished',
    TRUE,
    950,
    950,
    35000,
    100000,
    2000,
    '0.5 km',
    '["WiFi","AC","TV","Fridge","Washing Machine"]'::jsonb,
    'Flat',
    'Single',
    TRUE
  ),
  (
    'b0000002-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'Andheri West',
    'Tower A',
    'Fully Furnished',
    TRUE,
    1200,
    400,
    18000,
    36000,
    2000,
    '0.5 km',
    '["WiFi","AC","TV","Fridge","Washing Machine"]'::jsonb,
    'Flat',
    'Single',
    FALSE
  ),
  (
    'b0000003-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'Andheri West',
    NULL,
    'Semi-Furnished',
    FALSE,
    NULL,
    NULL,
    12000,
    24000,
    NULL,
    NULL,
    '["WiFi","Food"]'::jsonb,
    'PG',
    'Double',
    FALSE
  ),
  (
    'b0000004-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000001',
    'Andheri West',
    NULL,
    'Fully Furnished',
    TRUE,
    NULL,
    NULL,
    25000,
    50000,
    NULL,
    NULL,
    '["WiFi","AC","Gym","Parking"]'::jsonb,
    'Flat',
    'Single',
    FALSE
  ),
  (
    'b0000005-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000001',
    'Andheri West',
    NULL,
    'Fully Furnished',
    TRUE,
    NULL,
    NULL,
    22000,
    44000,
    NULL,
    NULL,
    '["WiFi","AC","Parking"]'::jsonb,
    'Flat',
    'Double',
    FALSE
  )
ON CONFLICT (id) DO NOTHING;
