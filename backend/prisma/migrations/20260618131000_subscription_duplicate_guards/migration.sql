WITH ranked_open_requests AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "memberId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC
    ) AS rank
  FROM "SubscriptionRequest"
  WHERE "status" IN (
    'DRAFT',
    'WAITING_DOCUMENTS',
    'UNDER_REVIEW',
    'PAYMENT_PENDING',
    'CONFIRMED',
    'BLOCKED'
  )
)
UPDATE "SubscriptionRequest"
SET "status" = 'CANCELLED'
WHERE id IN (
  SELECT id
  FROM ranked_open_requests
  WHERE rank > 1
);

WITH ranked_active_subscriptions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "householdMemberId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC
    ) AS rank
  FROM "Subscription"
  WHERE "status" = 'ACTIVE'
)
UPDATE "Subscription"
SET "status" = 'EXPIRED'
WHERE id IN (
  SELECT id
  FROM ranked_active_subscriptions
  WHERE rank > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_one_active_per_member_idx"
  ON "Subscription"("householdMemberId")
  WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionRequest_one_open_per_member_idx"
  ON "SubscriptionRequest"("memberId")
  WHERE "status" IN (
    'DRAFT',
    'WAITING_DOCUMENTS',
    'UNDER_REVIEW',
    'PAYMENT_PENDING',
    'CONFIRMED',
    'BLOCKED'
  );
