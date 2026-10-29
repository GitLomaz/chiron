ALTER TABLE "Quiz"
    ADD COLUMN "matchingPairCount" INTEGER NOT NULL DEFAULT 6;

ALTER TABLE "Quiz"
    ADD CONSTRAINT "Quiz_matchingPairCount_valid"
    CHECK ("matchingPairCount" IN (4, 6, 8));
