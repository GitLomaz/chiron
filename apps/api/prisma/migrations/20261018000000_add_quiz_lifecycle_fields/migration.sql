-- Enable UUID generation for the quiz public identifier.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "Quiz"
    ADD COLUMN "guid" UUID NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "endedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Quiz_guid_key" ON "Quiz"("guid");
