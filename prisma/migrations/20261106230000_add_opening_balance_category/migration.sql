-- Opening balance: a system TRANSFER category that counts toward the
-- accumulated balance but never as monthly income.
INSERT INTO "categories" ("id", "name", "icon", "color", "scope", "transactionType", "isRecurring", "isAvoidable", "parentId", "updatedAt")
SELECT 'sys_cat_opening-balance', 'Opening Balance', 'wallet', '#64748b', 'SYSTEM', 'TRANSFER', false, false,
       CASE WHEN EXISTS (SELECT 1 FROM "categories" WHERE "id" = 'sys_cat_transfer') THEN 'sys_cat_transfer' END,
       CURRENT_TIMESTAMP
ON CONFLICT ("id") DO NOTHING;
