/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `device_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `grade_books` table. All the data in the column will be lost.
  - You are about to drop the column `walletTransactionId_fk` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the `grade_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_config` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ScheduledNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "grade_assignments" DROP CONSTRAINT "grade_assignments_teacherProfileId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_walletTransactionId_fk_fkey";

-- DropIndex
DROP INDEX "payments_walletTransactionId_fk_idx";

-- AlterTable
ALTER TABLE "device_tokens" DROP COLUMN "sortOrder";

-- AlterTable
ALTER TABLE "grade_books" DROP COLUMN "grade",
ADD COLUMN     "letterGrade" TEXT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "walletTransactionId_fk";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpExpires" TIMESTAMP(3),
ADD COLUMN     "username" TEXT;

-- DropTable
DROP TABLE "grade_assignments";

-- DropTable
DROP TABLE "system_config";

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" TEXT,
    "triggerType" TEXT NOT NULL,
    "referenceId" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" "ScheduledNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_notifications_status_scheduledFor_idx" ON "scheduled_notifications"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "scheduled_notifications_userId_idx" ON "scheduled_notifications"("userId");

-- CreateIndex
CREATE INDEX "scheduled_notifications_referenceId_idx" ON "scheduled_notifications"("referenceId");

-- CreateIndex
CREATE INDEX "scheduled_notifications_triggerType_idx" ON "scheduled_notifications"("triggerType");

-- CreateIndex
CREATE INDEX "payments_walletTransactionId_idx" ON "payments"("walletTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
