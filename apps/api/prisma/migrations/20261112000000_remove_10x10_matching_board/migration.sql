-- The 10×10 matching board does not fit comfortably on typical student displays.
-- Keep existing quizzes on the largest remaining preset (8×8).
UPDATE "Quiz"
SET "matchingPairCount" = 32
WHERE "matchingPairCount" = 50;
