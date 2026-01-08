/*
  Warnings:

  - You are about to drop the column `userId` on the `Conversation` table. All the data in the column will be lost.
  - The `status` column on the `Conversation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "userId",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ROLE";

-- DropEnum
DROP TYPE "STATUS";

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
