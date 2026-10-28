ALTER TABLE "Quiz"
    DROP CONSTRAINT "Quiz_matchingPairCount_valid";

ALTER TABLE "Quiz"
    ADD CONSTRAINT "Quiz_matchingPairCount_valid"
    CHECK ("matchingPairCount" IN (2, 4, 6, 8, 18, 32, 50));
