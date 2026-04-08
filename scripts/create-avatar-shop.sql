-- Create avatar_owned_items table
CREATE TABLE IF NOT EXISTS avatar_owned_items (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, item_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_avatar_owned_items_student_id ON avatar_owned_items(student_id);
CREATE INDEX IF NOT EXISTS idx_avatar_owned_items_item_id ON avatar_owned_items(item_id);

-- Add transaction type if not exists
ALTER TABLE reward_transactions 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'lesson_completion';

-- Update existing avatar_customization constraints if needed
ALTER TABLE avatar_customization
ADD CONSTRAINT unique_student_avatar UNIQUE (student_id) ON CONFLICT DO NOTHING;
