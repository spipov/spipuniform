-- Make schools inactive by default going forward
ALTER TABLE "schools" ALTER COLUMN "is_active" SET DEFAULT false;

-- Optional safety cleanup: deactivate purely imported CSV schools that have no activity
-- This preserves any schools that have been explicitly used or activated.
-- If you prefer to skip this, comment it out before running migrations.
UPDATE "schools" s
SET "is_active" = false
WHERE s."csv_source_row" IS NOT NULL
  AND (
    SELECT COUNT(*) FROM "school_owners" so
    WHERE so."school_id" = s."id" AND coalesce(so."is_active", true) = true
  ) = 0
  AND (
    SELECT COUNT(*) FROM "listings" l
    WHERE l."school_id" = s."id"
  ) = 0
  AND (
    SELECT COUNT(*) FROM "school_stock" ss
    WHERE ss."school_id" = s."id"
  ) = 0
  AND (
    SELECT COUNT(*) FROM "requests" r
    WHERE r."school_id" = s."id"
  ) = 0;
