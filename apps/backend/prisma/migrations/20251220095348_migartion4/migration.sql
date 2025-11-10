/*
  Warnings:

  - You are about to drop the column `questionSource` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the `exam_question_mappings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_tag_relations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "auth_sessions" DROP CONSTRAINT "auth_sessions_userid_fkey";

-- DropForeignKey
ALTER TABLE "exam_question_mappings" DROP CONSTRAINT "exam_question_mappings_examId_fkey";

-- DropForeignKey
ALTER TABLE "exam_question_mappings" DROP CONSTRAINT "exam_question_mappings_questionId_fkey";

-- DropForeignKey
ALTER TABLE "question_categories" DROP CONSTRAINT "question_categories_parentCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "question_categories" DROP CONSTRAINT "question_categories_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "question_tag_relations" DROP CONSTRAINT "question_tag_relations_questionId_fkey";

-- DropForeignKey
ALTER TABLE "question_tag_relations" DROP CONSTRAINT "question_tag_relations_tagId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_createdById_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_deletedBy_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_sessionid_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userid_fkey";

-- DropIndex
DROP INDEX "idx_attendance_user_class_date";

-- DropIndex
DROP INDEX "idx_class_rescheduling_date";

-- DropIndex
DROP INDEX "idx_classes_soft_delete";

-- DropIndex
DROP INDEX "idx_classes_status_createdat";

-- DropIndex
DROP INDEX "idx_classes_teacher_subject_grade";

-- DropIndex
DROP INDEX "idx_enrollments_student_class";

-- DropIndex
DROP INDEX "idx_enrollments_student_status";

-- DropIndex
DROP INDEX "idx_exam_attempts_student_exam_status";

-- DropIndex
DROP INDEX "idx_exam_attempts_submitted";

-- DropIndex
DROP INDEX "idx_exams_grade_subject_medium";

-- DropIndex
DROP INDEX "idx_exams_status_window";

-- DropIndex
DROP INDEX "idx_payments_user_status_createdat";

-- DropIndex
DROP INDEX "idx_refresh_tokens_hash";

-- DropIndex
DROP INDEX "idx_users_email_phone";

-- DropIndex
DROP INDEX "idx_users_phone_hash";

-- DropIndex
DROP INDEX "idx_users_role_status_createdat";

-- DropIndex
DROP INDEX "idx_users_soft_delete";

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "questionSource";

-- DropTable
DROP TABLE "exam_question_mappings";

-- DropTable
DROP TABLE "question_categories";

-- DropTable
DROP TABLE "question_tag_relations";

-- DropTable
DROP TABLE "question_tags";

-- DropTable
DROP TABLE "questions";

-- DropEnum
DROP TYPE "ExamQuestionSource";
