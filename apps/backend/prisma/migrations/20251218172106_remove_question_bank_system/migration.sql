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

-- CreateTable
CREATE TABLE "temp_signups" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT,
    "otpExpires" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temp_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "temp_signups_phone_key" ON "temp_signups"("phone");
