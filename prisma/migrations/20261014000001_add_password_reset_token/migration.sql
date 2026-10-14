-- AlterTable
ALTER TABLE `User` ADD COLUMN `passwordResetTokenHash` VARCHAR(191) NULL,
                   ADD COLUMN `passwordResetExpiresAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_passwordResetTokenHash_key` ON `User`(`passwordResetTokenHash`);
