-- AlterTable
ALTER TABLE "investment_snapshots" ADD COLUMN     "exchangeRate" INTEGER;

-- AlterTable
ALTER TABLE "investments" ADD COLUMN     "currentExchangeRate" INTEGER,
ADD COLUMN     "purchaseExchangeRate" INTEGER,
ADD COLUMN     "totalFees" INTEGER;
