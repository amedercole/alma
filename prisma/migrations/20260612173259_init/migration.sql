-- CreateEnum
CREATE TYPE "LeadState" AS ENUM ('PENDING', 'REACHED_OUT');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ATTORNEY', 'ADMIN');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "resumeKey" TEXT NOT NULL,
    "resumeFilename" TEXT NOT NULL,
    "resumeMimeType" TEXT NOT NULL,
    "resumeSize" INTEGER NOT NULL,
    "state" "LeadState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reachedOutAt" TIMESTAMP(3),
    "reachedOutById" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ATTORNEY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_state_idx" ON "leads"("state");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_reachedOutById_fkey" FOREIGN KEY ("reachedOutById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
