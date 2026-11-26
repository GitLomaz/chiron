CREATE TABLE "DataSet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DataSet_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DataSetPair" (
    "id" SERIAL NOT NULL,
    "dataSetId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    CONSTRAINT "DataSetPair_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DataSetPair_dataSetId_position_idx" ON "DataSetPair"("dataSetId", "position");
ALTER TABLE "DataSetPair" ADD CONSTRAINT "DataSetPair_dataSetId_fkey" FOREIGN KEY ("dataSetId") REFERENCES "DataSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
