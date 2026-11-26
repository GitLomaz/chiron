ALTER TABLE "Question"
    ADD COLUMN "itemType" TEXT NOT NULL DEFAULT 'question',
    ADD COLUMN "gameType" TEXT;

ALTER TABLE "Question"
    ADD CONSTRAINT "Question_itemType_valid" CHECK ("itemType" IN ('question', 'game'));

ALTER TABLE "Question"
    ADD CONSTRAINT "Question_gameType_valid" CHECK ("gameType" IS NULL OR "gameType" IN ('coin_catch'));
