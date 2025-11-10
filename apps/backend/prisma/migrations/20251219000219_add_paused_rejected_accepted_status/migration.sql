/*
  Warnings:

  - You are about to drop the `exam_exceptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grade_books` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_promotions` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransferRequestStatus" ADD VALUE 'PAUSED';
ALTER TYPE "TransferRequestStatus" ADD VALUE 'ACCEPTED';
ALTER TYPE "TransferRequestStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "exam_exceptions" DROP CONSTRAINT "exam_exceptions_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "exam_exceptions" DROP CONSTRAINT "exam_exceptions_examId_fkey";

-- DropForeignKey
ALTER TABLE "exam_exceptions" DROP CONSTRAINT "exam_exceptions_rejectedBy_fkey";

-- DropForeignKey
ALTER TABLE "exam_exceptions" DROP CONSTRAINT "exam_exceptions_requestedBy_fkey";

-- DropForeignKey
ALTER TABLE "exam_exceptions" DROP CONSTRAINT "exam_exceptions_studentId_fkey";

-- DropForeignKey
ALTER TABLE "grade_books" DROP CONSTRAINT "grade_books_classId_fkey";

-- DropForeignKey
ALTER TABLE "grade_books" DROP CONSTRAINT "grade_books_deletedBy_fkey";

-- DropForeignKey
ALTER TABLE "grade_books" DROP CONSTRAINT "grade_books_examId_fkey";

-- DropForeignKey
ALTER TABLE "grade_books" DROP CONSTRAINT "grade_books_gradedBy_fkey";

-- DropForeignKey
ALTER TABLE "grade_books" DROP CONSTRAINT "grade_books_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_promotions" DROP CONSTRAINT "student_promotions_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "student_promotions" DROP CONSTRAINT "student_promotions_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "student_promotions" DROP CONSTRAINT "student_promotions_fromGradeId_fkey";

-- DropForeignKey
ALTER TABLE "student_promotions" DROP CONSTRAINT "student_promotions_rejectedBy_fkey";

-- DropForeignKey
ALTER TABLE "student_promotions" DROP CONSTRAINT "student_promotions_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_promotions" DROP CONSTRAINT "student_promotions_toGradeId_fkey";

-- DropTable
DROP TABLE "exam_exceptions";

-- DropTable
DROP TABLE "grade_books";

-- DropTable
DROP TABLE "student_promotions";

-- DropEnum
DROP TYPE "ExceptionStatus";

-- DropEnum
DROP TYPE "ExceptionType";

-- DropEnum
DROP TYPE "PromotionStatus";

-- DropEnum
DROP TYPE "PromotionType";
