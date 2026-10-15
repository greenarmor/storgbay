-- `AuditLog` was declared in schema.prisma but no migration ever created it. Environments
-- built purely from `prisma migrate deploy` (i.e. production) therefore had no audit table:
-- every audit write was silently swallowed, /api/admin/gdpr and /api/cron/retention returned
-- 500, and `pnpm db:reset-password --list` could not read login-failure reasons.
--
-- Local databases had the table from an out-of-band create/prisma db push, so comparing the
-- database against schema.prisma showed no drift and the gap stayed hidden.
--
-- IF NOT EXISTS keeps this safe to apply where the table already exists.
CREATE TABLE IF NOT EXISTS `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `resource` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
