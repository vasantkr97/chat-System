/*
  Warnings:

  - Changed the type of `status` on the `Conversation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ROLE" AS ENUM ('agent', 'candidate', 'supervisor', 'admin');

-- CreateEnum
CREATE TYPE "STATUS" AS ENUM ('open', 'assigned', 'closed');

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_agentId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "agentId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "STATUS" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "ROLE" NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
