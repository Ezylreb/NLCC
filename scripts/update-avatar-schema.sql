-- Update avatar_customization table to store JSON data for each avatar part
-- This allows us to store complete part information (id, name, type, src)

-- Drop existing columns that don't match our structure
ALTER TABLE avatar_customization
DROP COLUMN IF EXISTS head_type,
DROP COLUMN IF EXISTS head_color,
DROP COLUMN IF EXISTS eyes_type,
DROP COLUMN IF EXISTS mouth_type,
DROP COLUMN IF EXISTS hair_type,
DROP COLUMN IF EXISTS hair_color,
DROP COLUMN IF EXISTS body_color,
DROP COLUMN IF EXISTS clothing_type,
DROP COLUMN IF EXISTS clothing_color;

-- Add new columns to store avatar parts as JSONB
ALTER TABLE avatar_customization
ADD COLUMN IF NOT EXISTS katawan JSONB DEFAULT '{"id":"1","name":"Default Boy","type":"katawan","src":"/Character/Avatar/katawan/b1.png"}',
ADD COLUMN IF NOT EXISTS hair JSONB DEFAULT '{"id":"1","name":"Hair 1","type":"hair","src":"/Character/Avatar/hair/bH1.png"}',
ADD COLUMN IF NOT EXISTS eyes JSONB DEFAULT '{"id":"1","name":"Eyes Default","type":"eyes","src":"/Character/Avatar/eyes/eBBck1.png"}',
ADD COLUMN IF NOT EXISTS mouth JSONB DEFAULT '{"id":"1","name":"Mouth Default","type":"mouth","src":"/Character/Avatar/mouth/m1.png"}',
ADD COLUMN IF NOT EXISTS damit JSONB DEFAULT '{"id":"1","name":"Default Outfit","type":"damit","src":"/Character/Avatar/damit/d1.png"}',
ADD COLUMN IF NOT EXISTS pants JSONB DEFAULT '{"id":"1","name":"Default Pants","type":"pants","src":"/Character/Avatar/pants/p1.png"}',
ADD COLUMN IF NOT EXISTS shoes JSONB DEFAULT '{"id":"1","name":"Default Shoes","type":"shoes","src":"/Character/Avatar/shoes/sB1.png"}',
ADD COLUMN IF NOT EXISTS accessory JSONB DEFAULT '{"id":"0","name":"None","type":"accessory","src":"/Character/Avatar/accesories/eg1.png"}';

-- Rename accessories to match component (if it exists)
ALTER TABLE avatar_customization
DROP COLUMN IF EXISTS accessories;

-- Add comments for documentation
COMMENT ON COLUMN avatar_customization.katawan IS 'Body/character base as JSON (id, name, type, src)';
COMMENT ON COLUMN avatar_customization.hair IS 'Hair style as JSON (id, name, type, src)';
COMMENT ON COLUMN avatar_customization.eyes IS 'Eyes style as JSON (id, name, type, src)';
COMMENT ON COLUMN avatar_customization.mouth IS 'Mouth style as JSON (id, name, type, src)';
COMMENT ON COLUMN avatar_customization.damit IS 'Outfit/clothing as JSON (id, name, type, src)';
COMMENT ON COLUMN avatar_customization.pants IS 'Pants style as JSON (id, name, type, src)';
COMMENT ON COLUMN avatar_customization.shoes IS 'Shoes style as JSON (id, name, type, src)';
COMMENT ON COLUMN avatar_customization.accessory IS 'Accessory/hat as JSON (id, name, type, src)';
