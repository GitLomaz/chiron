ALTER TABLE "Quiz"
    ADD COLUMN "battleshipBoardSize" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "Quiz"
    ADD CONSTRAINT "Quiz_battleshipBoardSize_valid"
    CHECK ("battleshipBoardSize" IN (6, 8, 10));
