-- Enable UUID generation for the quiz public identifier.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "Quiz"
    ADD COLUMN "guid" UUID NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "endedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Quiz_guid_key" ON "Quiz"("guid");

-- CreateTable
CREATE TABLE "AnswerPool" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerPoolAnswer" (
    "id" SERIAL NOT NULL,
    "answerPoolId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerPoolAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonQuestion" (
    "id" SERIAL NOT NULL,
    "answerPoolId" INTEGER,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommonQuestion_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "answerPoolId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "AnswerPool_name_key" ON "AnswerPool"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerPoolAnswer_answerPoolId_value_key" ON "AnswerPoolAnswer"("answerPoolId", "value");

-- CreateIndex
CREATE INDEX "Question_answerPoolId_idx" ON "Question"("answerPoolId");

-- CreateIndex
CREATE INDEX "CommonQuestion_answerPoolId_idx" ON "CommonQuestion"("answerPoolId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_answerPoolId_fkey" FOREIGN KEY ("answerPoolId") REFERENCES "AnswerPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommonQuestion" ADD CONSTRAINT "CommonQuestion_answerPoolId_fkey" FOREIGN KEY ("answerPoolId") REFERENCES "AnswerPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerPoolAnswer" ADD CONSTRAINT "AnswerPoolAnswer_answerPoolId_fkey" FOREIGN KEY ("answerPoolId") REFERENCES "AnswerPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
