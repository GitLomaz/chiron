ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_snakesLaddersTrackLength_valid";

UPDATE "Quiz"
SET "snakesLaddersTrackLength" = CASE "snakesLaddersTrackLength"
  WHEN 20 THEN 30
  WHEN 40 THEN 50
  ELSE "snakesLaddersTrackLength"
END
WHERE "snakesLaddersTrackLength" IN (20, 40);

ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_snakesLaddersTrackLength_valid"
  CHECK ("snakesLaddersTrackLength" IN (30, 50, 80, 100));
