ALTER TABLE "Quiz"
    ADD COLUMN "creditEveryCorrectAnswers" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Quiz"
    ADD CONSTRAINT "Quiz_creditEveryCorrectAnswers_valid"
    CHECK ("creditEveryCorrectAnswers" IN (1, 2, 3, 4, 5));
