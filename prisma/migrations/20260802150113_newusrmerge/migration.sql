/*
  Warnings:

  - You are about to alter the column `phone` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - The `gender` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PoojaMode" AS ENUM ('VIDEO_CALL', 'AT_HOME');

-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('SLOT_8_12', 'SLOT_12_15', 'SLOT_15_19', 'SLOT_19_22');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('PHONE', 'GOOGLE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- DropForeignKey
ALTER TABLE "OTPVerification" DROP CONSTRAINT "OTPVerification_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "freeCallMinutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "freeCallPopupShown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "houseNo" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "isProfileCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "pinCode" VARCHAR(6),
ADD COLUMN     "provider" "AuthProvider" NOT NULL DEFAULT 'PHONE',
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(10),
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender";

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poojaId" INTEGER NOT NULL,
    "poojaTitle" TEXT NOT NULL,
    "poojaMode" "PoojaMode" NOT NULL,
    "poojaImage" TEXT,
    "duration" TEXT,
    "amount" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "discount" INTEGER,
    "customerName" TEXT NOT NULL,
    "customerPhone" VARCHAR(10) NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "houseNo" TEXT,
    "address" TEXT,
    "landmark" TEXT,
    "pinCode" VARCHAR(6),
    "scheduledDate" TEXT NOT NULL,
    "timeSlot" "TimeSlot" NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "specialRequests" TEXT,
    "panditNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingId_key" ON "Booking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_razorpayOrderId_key" ON "Booking"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_razorpayPaymentId_key" ON "Booking"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_bookingId_idx" ON "Booking"("bookingId");

-- CreateIndex
CREATE INDEX "Booking_scheduledDate_idx" ON "Booking"("scheduledDate");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "OTPVerification" ADD CONSTRAINT "OTPVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
