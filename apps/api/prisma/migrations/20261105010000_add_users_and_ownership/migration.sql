CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "googleSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "canViewAllQuizzes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
ALTER TABLE "Quiz" ADD COLUMN "ownerId" UUID;
ALTER TABLE "HomeworkSession" ADD COLUMN "ownerId" UUID;
ALTER TABLE "CommonQuestion" ADD COLUMN "ownerId" UUID;
ALTER TABLE "AnswerPool" ADD COLUMN "ownerId" UUID;
ALTER TABLE "DataSet" ADD COLUMN "ownerId" UUID;
DROP INDEX "AnswerPool_name_key";
CREATE INDEX "Quiz_ownerId_createdAt_idx" ON "Quiz"("ownerId", "createdAt");
CREATE INDEX "HomeworkSession_ownerId_createdAt_idx" ON "HomeworkSession"("ownerId", "createdAt");
CREATE INDEX "CommonQuestion_ownerId_idx" ON "CommonQuestion"("ownerId");
CREATE INDEX "AnswerPool_ownerId_idx" ON "AnswerPool"("ownerId");
CREATE INDEX "DataSet_ownerId_updatedAt_idx" ON "DataSet"("ownerId", "updatedAt");
CREATE UNIQUE INDEX "AnswerPool_ownerId_name_key" ON "AnswerPool"("ownerId", "name");
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HomeworkSession" ADD CONSTRAINT "HomeworkSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommonQuestion" ADD CONSTRAINT "CommonQuestion_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnswerPool" ADD CONSTRAINT "AnswerPool_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DataSet" ADD CONSTRAINT "DataSet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
