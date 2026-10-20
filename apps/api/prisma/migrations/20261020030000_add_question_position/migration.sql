ALTER TABLE "Question"
    ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

WITH ordered_questions AS (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "quizId" ORDER BY "createdAt", "id") - 1 AS "position"
    FROM "Question"
)
UPDATE "Question"
SET "position" = ordered_questions."position"
FROM ordered_questions
WHERE "Question"."id" = ordered_questions."id";

ALTER TABLE "Question"
    ALTER COLUMN "position" DROP DEFAULT;

CREATE INDEX "Question_quizId_position_idx" ON "Question"("quizId", "position");
