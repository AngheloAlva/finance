-- AlterTable
ALTER TABLE "users" ADD COLUMN     "simpleMode" BOOLEAN NOT NULL DEFAULT true;

-- Existing accounts keep the full navigation they already use.
UPDATE "users" SET "simpleMode" = false;
