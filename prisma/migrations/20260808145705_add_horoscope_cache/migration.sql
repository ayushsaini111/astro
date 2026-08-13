-- CreateTable
CREATE TABLE "DailyHoroscope" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CALCULATED',
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyHoroscope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoroscopeSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "apiKey" TEXT,
    "sourceType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetched" TIMESTAMP(3),
    "reliability" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoroscopeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanetaryTransit" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "planetName" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sign" TEXT NOT NULL,
    "degree" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "isRetrograde" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanetaryTransit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHoroscope" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthTime" TEXT,
    "birthPlace" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sunSign" TEXT NOT NULL,
    "moonSign" TEXT,
    "ascendant" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHoroscope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoroscopeCache" (
    "id" TEXT NOT NULL,
    "rashi" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoroscopeCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoroscopeGenerationLog" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "totalRashis" INTEGER NOT NULL,
    "apiCalls" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoroscopeGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyHoroscope_date_key" ON "DailyHoroscope"("date");

-- CreateIndex
CREATE INDEX "DailyHoroscope_date_idx" ON "DailyHoroscope"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HoroscopeSource_name_key" ON "HoroscopeSource"("name");

-- CreateIndex
CREATE INDEX "PlanetaryTransit_date_planetName_idx" ON "PlanetaryTransit"("date", "planetName");

-- CreateIndex
CREATE UNIQUE INDEX "PlanetaryTransit_date_planetName_key" ON "PlanetaryTransit"("date", "planetName");

-- CreateIndex
CREATE UNIQUE INDEX "UserHoroscope_userId_key" ON "UserHoroscope"("userId");

-- CreateIndex
CREATE INDEX "HoroscopeCache_period_dateKey_idx" ON "HoroscopeCache"("period", "dateKey");

-- CreateIndex
CREATE INDEX "HoroscopeCache_expiresAt_idx" ON "HoroscopeCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "HoroscopeCache_rashi_period_dateKey_key" ON "HoroscopeCache"("rashi", "period", "dateKey");

-- CreateIndex
CREATE INDEX "HoroscopeGenerationLog_period_completedAt_idx" ON "HoroscopeGenerationLog"("period", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HoroscopeGenerationLog_period_dateKey_key" ON "HoroscopeGenerationLog"("period", "dateKey");

-- AddForeignKey
ALTER TABLE "UserHoroscope" ADD CONSTRAINT "UserHoroscope_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
