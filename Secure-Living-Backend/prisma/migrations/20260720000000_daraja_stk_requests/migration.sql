-- Tracks Safaricom Daraja STK Push (Lipa Na M-Pesa Online) requests so the async
-- callback can be correlated back to the rent invoice that triggered it.
CREATE TABLE IF NOT EXISTS "DarajaStkRequest" (
    "id" TEXT NOT NULL,
    "checkoutRequestId" TEXT NOT NULL,
    "merchantRequestId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tenantUserId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "amountKes" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultCode" INTEGER,
    "resultDesc" TEXT,
    "mpesaReceiptNumber" TEXT,
    "transactionDate" TEXT,
    "rawCallbackJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DarajaStkRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DarajaStkRequest_checkoutRequestId_key" ON "DarajaStkRequest"("checkoutRequestId");
CREATE INDEX IF NOT EXISTS "DarajaStkRequest_invoiceId_idx" ON "DarajaStkRequest"("invoiceId");
CREATE INDEX IF NOT EXISTS "DarajaStkRequest_tenantUserId_idx" ON "DarajaStkRequest"("tenantUserId");
CREATE INDEX IF NOT EXISTS "DarajaStkRequest_status_idx" ON "DarajaStkRequest"("status");
