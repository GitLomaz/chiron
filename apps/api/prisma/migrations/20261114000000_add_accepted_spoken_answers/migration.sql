ALTER TABLE "Question" ADD COLUMN "acceptedAnswers" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "CommonQuestion" ADD COLUMN "acceptedAnswers" JSONB NOT NULL DEFAULT '[]';
