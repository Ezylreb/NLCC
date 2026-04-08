-- Create avatar_customization table
CREATE TABLE IF NOT EXISTS avatar_customization (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    head_type VARCHAR(50) DEFAULT 'round',
    head_color VARCHAR(7) DEFAULT '#FFD700',
    eyes_type VARCHAR(50) DEFAULT 'round',
    mouth_type VARCHAR(50) DEFAULT 'smile',
    hair_type VARCHAR(50) DEFAULT 'short',
    hair_color VARCHAR(7) DEFAULT '#8B4513',
    body_color VARCHAR(7) DEFAULT '#FF6B6B',
    clothing_type VARCHAR(50) DEFAULT 'shirt',
    clothing_color VARCHAR(7) DEFAULT '#4CAF50',
    accessories JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_avatar_customization_student_id ON avatar_customization(student_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_avatar_customization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER avatar_customization_timestamp_trigger
BEFORE UPDATE ON avatar_customization
FOR EACH ROW
EXECUTE FUNCTION update_avatar_customization_timestamp();
