UPDATE "Quiz"
SET "creditEveryCorrectAnswers" = 3
WHERE "creditEveryCorrectAnswers" > 3;

ALTER TABLE "Quiz"
    DROP CONSTRAINT "Quiz_creditEveryCorrectAnswers_valid";

ALTER TABLE "Quiz"
    ADD CONSTRAINT "Quiz_creditEveryCorrectAnswers_valid"
    CHECK ("creditEveryCorrectAnswers" IN (1, 2, 3));
