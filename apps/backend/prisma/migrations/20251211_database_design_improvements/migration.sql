-- DATABASE DESIGN IMPROVEMENTS MIGRATION
-- Addresses: Performance, Security, Consistency, and Audit Trail

-- ============================================================================
-- 1. ADD COMPREHENSIVE COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- User queries
CREATE INDEX idx_users_role_status_createdat ON users(role, status, "createdAt" DESC);
CREATE INDEX idx_users_email_phone ON users(email, phone);
CREATE INDEX idx_users_soft_delete ON users("deletedAt", "updatedAt" DESC);

-- Class queries
CREATE INDEX idx_classes_teacher_subject_grade ON classes("teacherId", "subjectId", "gradeId");
CREATE INDEX idx_classes_status_createdat ON classes(status, "createdAt" DESC);
CREATE INDEX idx_classes_soft_delete ON classes("deletedAt", "updatedAt" DESC);

-- Enrollment queries
CREATE INDEX idx_enrollments_student_class ON enrollments("studentId", "classId");
CREATE INDEX idx_enrollments_student_status ON enrollments("studentId", status);
CREATE INDEX idx_enrollments_soft_delete ON enrollments("deletedAt");

-- Exam queries
CREATE INDEX idx_exams_grade_subject_medium ON exams("gradeId", "subjectId", "mediumId");
CREATE INDEX idx_exams_status_window ON exams(status, "windowStart", "windowEnd");
CREATE INDEX idx_exams_soft_delete ON exams("deletedAt");

-- Exam attempts
CREATE INDEX idx_exam_attempts_student_exam_status ON exam_attempts("studentId", "examId", status);
CREATE INDEX idx_exam_attempts_submitted ON exam_attempts("submittedAt" DESC);

-- Payments
CREATE INDEX idx_payments_user_status_createdat ON payments("userId", status, "createdAt" DESC);
CREATE INDEX idx_payments_soft_delete ON payments("deletedAt");

-- Attendance
CREATE INDEX idx_attendance_user_class_date ON attendance("userId", "classId", "date");

-- Teacher availability
CREATE INDEX idx_teacher_availability_date_range ON teacher_availability("teacherId", "startDate", "endDate");

-- Class rescheduling
CREATE INDEX idx_class_rescheduling_date ON class_reschedulings("newDate", status);

-- Timetable
CREATE INDEX idx_timetable_teacher_day ON timetable("teacherId", "dayOfWeek");

-- Exam exceptions
CREATE INDEX idx_exam_exceptions_exam_student_status ON exam_exceptions("examId", "studentId", status);

-- ============================================================================
-- 2. ADD AUDIT TRIGGER FUNCTION FOR AUTOMATIC AUDIT LOGGING
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields JSONB;
BEGIN
  -- Build JSON of changed fields
  IF TG_OP = 'INSERT' THEN
    v_changed_fields = to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_changed_fields = jsonb_object_agg(key, NEW.* -> key)
      FROM jsonb_object_keys(to_jsonb(NEW)) AS key
      WHERE NEW.* -> key IS DISTINCT FROM OLD.* -> key;
  ELSIF TG_OP = 'DELETE' THEN
    v_changed_fields = to_jsonb(OLD);
  END IF;

  INSERT INTO audit_logs (
    "userId",
    resource,
    action,
    "resourceId",
    "changedFields",
    "ipAddress",
    metadata,
    "createdAt"
  ) VALUES (
    COALESCE(current_setting('app.user_id', true)::text, NULL),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE((NEW.id)::text, (OLD.id)::text),
    v_changed_fields,
    COALESCE(current_setting('app.ip_address', true), '0.0.0.0'),
    jsonb_build_object(
      'timestamp', now(),
      'table', TG_TABLE_NAME,
      'operation', TG_OP
    ),
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. ADD SOFT DELETE TRACKING COLUMN & FUNCTION
-- ============================================================================

-- Add soft delete tracking to tables that need it (already have deletedAt)
CREATE OR REPLACE FUNCTION soft_delete_updated_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    NEW."updatedAt" = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for soft delete update
CREATE TRIGGER trigger_soft_delete_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION soft_delete_updated_at();

CREATE TRIGGER trigger_soft_delete_updated_at_classes
BEFORE UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION soft_delete_updated_at();

CREATE TRIGGER trigger_soft_delete_updated_at_enrollments
BEFORE UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION soft_delete_updated_at();

CREATE TRIGGER trigger_soft_delete_updated_at_exams
BEFORE UPDATE ON exams
FOR EACH ROW
EXECUTE FUNCTION soft_delete_updated_at();

CREATE TRIGGER trigger_soft_delete_updated_at_payments
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION soft_delete_updated_at();

-- ============================================================================
-- 4. ADD DATA CONSISTENCY CONSTRAINTS & CHECKS
-- ============================================================================

-- Ensure exam window dates are valid
ALTER TABLE exams
ADD CONSTRAINT check_exam_window_dates
CHECK ("windowStart" IS NULL OR "windowEnd" IS NULL OR "windowStart" < "windowEnd");

-- Ensure exam dates are logical
ALTER TABLE exams
ADD CONSTRAINT check_exam_dates
CHECK ("startTime" < "endTime");

-- Ensure enrollment progress is within valid range
ALTER TABLE enrollments
ADD CONSTRAINT check_enrollment_progress
CHECK (progress >= 0 AND progress <= 100);

-- Ensure exam attempt score is within maxScore
ALTER TABLE exam_attempts
ADD CONSTRAINT check_attempt_score
CHECK ("totalScore" IS NULL OR "totalScore" >= 0 AND "totalScore" <= "maxScore");

-- Ensure payment amounts are positive
ALTER TABLE payments
ADD CONSTRAINT check_payment_amount
CHECK (amount > 0);

-- Ensure teacher availability dates are valid
ALTER TABLE teacher_availability
ADD CONSTRAINT check_availability_dates
CHECK ("startDate" < "endDate");

-- Ensure class rescheduling dates are valid
ALTER TABLE class_reschedulings
ADD CONSTRAINT check_reschedule_dates
CHECK ("originalDate" IS NOT NULL AND "newDate" IS NOT NULL);

-- ============================================================================
-- 5. ADD INDEXES FOR SOFT DELETE QUERIES (WHERE deletedAt IS NULL)
-- ============================================================================

-- Critical for improving performance of "non-deleted" queries
CREATE INDEX idx_users_not_deleted ON users("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_classes_not_deleted ON classes("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_enrollments_not_deleted ON enrollments("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_exams_not_deleted ON exams("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_payments_not_deleted ON payments("deletedAt") WHERE "deletedAt" IS NULL;

-- ============================================================================
-- 6. ADD PARTIAL INDEXES FOR ACTIVE RECORDS
-- ============================================================================

CREATE INDEX idx_users_active ON users(id) WHERE status = 'ACTIVE' AND "deletedAt" IS NULL;
CREATE INDEX idx_classes_active ON classes(id) WHERE status = 'ACTIVE' AND "deletedAt" IS NULL;
CREATE INDEX idx_exams_active ON exams(id) WHERE status != 'DRAFT' AND "deletedAt" IS NULL;
CREATE INDEX idx_enrollments_active ON enrollments(id) WHERE status IN ('ACTIVE', 'APPROVED') AND "deletedAt" IS NULL;

-- ============================================================================
-- 7. ADD HASH INDEXES FOR UNIQUE LOOKUPS (if using PostgreSQL 13+)
-- ============================================================================

CREATE INDEX idx_users_email_hash ON users USING HASH (email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone_hash ON users USING HASH (phone);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens USING HASH (token);

-- ============================================================================
-- 8. ADD FOREIGN KEY CONSTRAINTS WITH CASCADE RULES
-- ============================================================================

-- Ensure cascading deletes are explicit and documented
ALTER TABLE auth_sessions
DROP CONSTRAINT IF EXISTS auth_sessions_userId_fkey,
ADD CONSTRAINT auth_sessions_userId_fkey
FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens
DROP CONSTRAINT IF EXISTS refresh_tokens_userId_fkey,
ADD CONSTRAINT refresh_tokens_userId_fkey
FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens
DROP CONSTRAINT IF EXISTS refresh_tokens_sessionId_fkey,
ADD CONSTRAINT refresh_tokens_sessionId_fkey
FOREIGN KEY ("sessionId") REFERENCES auth_sessions(id) ON DELETE CASCADE;

-- ============================================================================
-- 9. ADD QUERY STATISTICS TRACKING (Optional - for performance monitoring)
-- ============================================================================

-- Enable pg_stat_statements extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================================
-- 10. ADD BATCH OPERATION HELPERS
-- ============================================================================

-- Function to soft delete multiple records at once
CREATE OR REPLACE FUNCTION soft_delete_batch(
  p_table_name TEXT,
  p_ids TEXT[],
  p_deleted_by_user_id TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  EXECUTE format(
    'UPDATE %I SET "deletedAt" = NOW(), "deletedBy" = %L WHERE id = ANY(%L) AND "deletedAt" IS NULL',
    p_table_name,
    p_deleted_by_user_id,
    p_ids
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to restore multiple soft-deleted records
CREATE OR REPLACE FUNCTION restore_deleted_batch(
  p_table_name TEXT,
  p_ids TEXT[]
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  EXECUTE format(
    'UPDATE %I SET "deletedAt" = NULL, "deletedBy" = NULL WHERE id = ANY(%L)',
    p_table_name,
    p_ids
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. ADD MATERIALIZED VIEW FOR COMMON AGGREGATIONS
-- ============================================================================

-- Class attendance summary view (helps avoid N+1 queries)
CREATE MATERIALIZED VIEW class_attendance_summary AS
SELECT
  "classId",
  COUNT(DISTINCT "userId") as total_students,
  COUNT(CASE WHEN present = true THEN 1 END) as total_present,
  ROUND(100.0 * COUNT(CASE WHEN present = true THEN 1 END) / COUNT(*), 2) as attendance_percentage,
  MAX(date) as last_attendance_date,
  COUNT(*) as total_records
FROM attendance
GROUP BY "classId";

CREATE INDEX idx_class_attendance_summary_classid ON class_attendance_summary("classId");

-- Student progress summary view
CREATE MATERIALIZED VIEW student_progress_summary AS
SELECT
  "studentId",
  "examId",
  COUNT(*) as total_attempts,
  AVG("totalScore") as avg_exam_score,
  MAX("totalScore") as highest_score,
  MIN("totalScore") as lowest_score,
  ROUND(100.0 * SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) / COUNT(*), 2) as pass_percentage
FROM exam_attempts
WHERE status = 'SUBMITTED'
GROUP BY "studentId", "examId";

CREATE INDEX idx_student_progress_summary_studentid ON student_progress_summary("studentId");

-- ============================================================================
-- 12. DATA QUALITY CHECKS
-- ============================================================================

-- Log any orphaned records (soft deleted parents with active children)
CREATE OR REPLACE FUNCTION log_orphaned_records() RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    resource,
    action,
    metadata,
    "createdAt"
  )
  SELECT
    'orphaned_records',
    'CONSISTENCY_CHECK',
    jsonb_build_object(
      'warning', 'Potential orphaned records detected',
      'check_timestamp', now()
    ),
    now()
  WHERE EXISTS (
    SELECT 1 FROM enrollments e
    JOIN classes c ON e."classId" = c.id
    WHERE c."deletedAt" IS NOT NULL AND e."deletedAt" IS NULL
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. PERFORMANCE STATISTICS & MAINTENANCE
-- ============================================================================

-- Note: VACUUM ANALYZE should be run manually after migration
-- Run: VACUUM ANALYZE; (outside of transaction)

-- Grant proper permissions (adjust as needed)
GRANT EXECUTE ON FUNCTION soft_delete_batch(TEXT, TEXT[], TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION restore_deleted_batch(TEXT, TEXT[]) TO postgres;
GRANT EXECUTE ON FUNCTION log_orphaned_records() TO postgres;

-- ============================================================================
-- Migration Status: Complete
-- ============================================================================
-- This migration:
-- ✓ Added 20+ composite and partial indexes for query optimization
-- ✓ Added audit trigger function for automatic change tracking
-- ✓ Added soft delete tracking triggers
-- ✓ Added data consistency constraints
-- ✓ Added batch operation helpers
-- ✓ Created materialized views for common aggregations
-- ✓ Added data quality checks
-- ✓ Improved foreign key constraints
-- ============================================================================
