-- Create class_enrollments table to manage student enrollment in classes
CREATE TABLE IF NOT EXISTS class_enrollments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrolled_by_teacher_id UUID NOT NULL REFERENCES users(id),
    UNIQUE(class_id, student_id),
    CONSTRAINT check_class_teacher FOREIGN KEY (class_id) REFERENCES classes(teacher_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_teacher_id ON class_enrollments(enrolled_by_teacher_id);

-- Add a check to ensure teacher_id in classes table is valid
-- This ensures data integrity
ALTER TABLE class_enrollments
ADD CONSTRAINT check_teacher_owns_class 
CHECK (enrolled_by_teacher_id = (SELECT teacher_id FROM classes WHERE id = class_id));

-- Populate class_enrollments with existing class-student relationships
-- This assumes there's a way to determine existing enrollments
-- If you have a different way students are linked to classes, adjust this query
-- For now, we'll leave it empty and teachers will add students manually

COMMENT ON TABLE class_enrollments IS 'Tracks which students are enrolled in which classes, ensuring students only see their teachers'' content';
COMMENT ON COLUMN class_enrollments.enrolled_by_teacher_id IS 'Teacher who enrolled the student, must match the class teacher_id';
