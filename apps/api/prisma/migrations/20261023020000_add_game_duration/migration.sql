ALTER TABLE "Question"
    ADD COLUMN "gameDurationSeconds" INTEGER;

ALTER TABLE "Question"
    ADD CONSTRAINT "Question_gameDurationSeconds_valid"
    CHECK ("gameDurationSeconds" IS NULL OR "gameDurationSeconds" BETWEEN 5 AND 180);

UPDATE "Question"
SET "gameDurationSeconds" = 20
WHERE "itemType" = 'game' AND "gameDurationSeconds" IS NULL;
