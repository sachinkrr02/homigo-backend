-- Property images (sort_order: 1=Room, 2=Kitchen, 3=WC, 4=Hall, 5=Balcony, 6=Exterior)
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  url_or_path VARCHAR(512) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images (property_id);
