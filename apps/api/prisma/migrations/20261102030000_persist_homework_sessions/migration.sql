CREATE TABLE "HomeworkSession" (
    "id" UUID NOT NULL,
    "facilitatorToken" UUID NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'classic',
    "quizSnapshot" JSONB NOT NULL,
    "ended" BOOLEAN NOT NULL DEFAULT false,
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeworkSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomeworkParticipant" (
    "id" UUID NOT NULL,
    "homeworkSessionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "matchProgress" JSONB NOT NULL DEFAULT '{}',
    "completedItems" JSONB NOT NULL DEFAULT '[]',
    "archeryArrows" INTEGER NOT NULL DEFAULT 0,
    "archeryShots" JSONB NOT NULL DEFAULT '[]',
    "shootingScore" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "HomeworkParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomeworkSession_facilitatorToken_key" ON "HomeworkSession"("facilitatorToken");
CREATE INDEX "HomeworkSession_ended_endsAt_idx" ON "HomeworkSession"("ended", "endsAt");
CREATE INDEX "HomeworkParticipant_homeworkSessionId_joinedAt_idx" ON "HomeworkParticipant"("homeworkSessionId", "joinedAt");
ALTER TABLE "HomeworkParticipant" ADD CONSTRAINT "HomeworkParticipant_homeworkSessionId_fkey" FOREIGN KEY ("homeworkSessionId") REFERENCES "HomeworkSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
