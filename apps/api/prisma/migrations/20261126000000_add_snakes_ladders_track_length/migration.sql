ALTER TABLE "Quiz"
  ADD COLUMN "snakesLaddersTrackLength" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "Quiz"
  ADD CONSTRAINT "Quiz_snakesLaddersTrackLength_valid"
  CHECK ("snakesLaddersTrackLength" IN (20, 30, 40, 50));
