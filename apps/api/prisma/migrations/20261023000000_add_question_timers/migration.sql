ALTER TABLE "Quiz" ADD COLUMN "defaultTimerSeconds" INTEGER NOT NULL DEFAULT -1;

ALTER TABLE "Question" ADD COLUMN "timerSeconds" INTEGER;

ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_defaultTimerSeconds_valid"
  CHECK ("defaultTimerSeconds" = -1 OR ("defaultTimerSeconds" BETWEEN 15 AND 180 AND "defaultTimerSeconds" % 15 = 0));

ALTER TABLE "Question" ADD CONSTRAINT "Question_timerSeconds_valid"
  CHECK ("timerSeconds" IS NULL OR "timerSeconds" = -1 OR ("timerSeconds" BETWEEN 15 AND 180 AND "timerSeconds" % 15 = 0));
