/*
  Warnings:

  - You are about to drop the column `deviceSessionId` on the `auth_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `schedule` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `classes` table. All the data in the column will be lost.
  - The `options` column on the `exam_questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `matchingPairs` column on the `exam_questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `optionImages` column on the `exam_questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parts` column on the `exam_questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `subQuestions` column on the `exam_questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `deletedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `deletedBy` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `walletTransactionId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `otp` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpires` on the `users` table. All the data in the column will be lost.
  - The `metadata` column on the `wallet_transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `device_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_question_options` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,fingerprint]` on the table `auth_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fingerprint` to the `auth_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "device_sessions" DROP CONSTRAINT "device_sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "exam_question_options" DROP CONSTRAINT "exam_question_options_questionId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_bankSlipVerifiedBy_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_deletedBy_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_walletTransactionId_fkey";

-- DropIndex
DROP INDEX "auth_sessions_deviceSessionId_idx";

-- DropIndex
DROP INDEX "auth_sessions_deviceSessionId_key";

-- DropIndex
DROP INDEX "payments_deletedAt_idx";

-- DropIndex
DROP INDEX "payments_status_createdAt_deletedAt_idx";

-- DropIndex
DROP INDEX "payments_userId_status_createdAt_deletedAt_idx";

-- DropIndex
DROP INDEX "payments_walletTransactionId_idx";

-- AlterTable: Add fingerprint column with default temporarily
ALTER TABLE "auth_sessions"
ADD COLUMN     "browser" TEXT,
ADD COLUMN     "browserVersion" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "fingerprint" TEXT DEFAULT 'legacy-' || gen_random_uuid()::text,
ADD COLUMN     "isTrusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "osVersion" TEXT;

-- Make fingerprint NOT NULL
ALTER TABLE "auth_sessions" ALTER COLUMN "fingerprint" SET NOT NULL;

-- Now drop the default
ALTER TABLE "auth_sessions" ALTER COLUMN "fingerprint" DROP DEFAULT;

-- Drop the deviceSessionId column
ALTER TABLE "auth_sessions" DROP COLUMN "deviceSessionId";

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "endDate",
DROP COLUMN "isRecurring",
DROP COLUMN "recurrence",
DROP COLUMN "schedule",
DROP COLUMN "startDate";

-- AlterTable
ALTER TABLE "exam_questions" DROP COLUMN "options",
ADD COLUMN     "options" JSON,
DROP COLUMN "matchingPairs",
ADD COLUMN     "matchingPairs" JSON,
DROP COLUMN "optionImages",
ADD COLUMN     "optionImages" JSON,
DROP COLUMN "parts",
ADD COLUMN     "parts" JSON,
DROP COLUMN "subQuestions",
ADD COLUMN     "subQuestions" JSON;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "deletedAt",
DROP COLUMN "deletedBy",
DROP COLUMN "walletTransactionId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isVerified",
DROP COLUMN "otp",
DROP COLUMN "otpExpires";

-- AlterTable
ALTER TABLE "wallet_transactions" DROP COLUMN "metadata",
ADD COLUMN     "metadata" JSON;

-- DropTable
DROP TABLE "device_sessions";

-- DropTable
DROP TABLE "exam_question_options";

-- CreateIndex
CREATE INDEX "auth_sessions_fingerprint_idx" ON "auth_sessions"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_userId_fingerprint_key" ON "auth_sessions"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "payments_userId_status_createdAt_idx" ON "payments"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "wallet_transactions_referenceType_reference_idx" ON "wallet_transactions"("referenceType", "reference");
