ALTER TABLE "Question"
    DROP CONSTRAINT "Question_gameType_valid";

ALTER TABLE "Question"
    ADD CONSTRAINT "Question_gameType_valid"
    CHECK ("gameType" IS NULL OR "gameType" IN ('coin_catch', 'match_pairs'));
