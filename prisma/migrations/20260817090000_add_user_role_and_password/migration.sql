-- Migration: add_user_role_and_password
-- Applied: 2026-08-17
--
-- Powers email/password sign-up and role-based access to the admin dashboard:
--   1. Creates the `Role` enum (USER | ADMIN).
--   2. Adds `User.role` (defaults to USER).
--   3. Adds `User.password` (bcrypt hash, nullable so OAuth users still work).

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT,
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
