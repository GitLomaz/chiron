ALTER TABLE "Question"
    DROP CONSTRAINT "Question_itemType_valid";

ALTER TABLE "Question"
    ADD CONSTRAINT "Question_itemType_valid"
    CHECK ("itemType" IN ('question', 'game', 'text'));
