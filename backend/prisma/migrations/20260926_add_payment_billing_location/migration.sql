ALTER TABLE "ListingPaymentSubmission"
  ADD COLUMN "customerState" TEXT,
  ADD COLUMN "customerCity" TEXT;

ALTER TABLE "CustomerPrimeSubscription"
  ADD COLUMN "customerState" TEXT,
  ADD COLUMN "customerCity" TEXT;
