import 'dotenv/config';
import { db } from '@/db';
import { schools } from '@/db/schema';
import { sql, inArray } from 'drizzle-orm';

async function main() {
  console.log('Analyzing schools for deactivation of unused CSV imports...');

  // Count totals (for visibility only)
  const [{ total } = { total: 0 }] = await db.execute<{ total: number }>(
    sql`SELECT COUNT(*)::int AS total FROM schools;`
  );
  const [{ totalActive } = { totalActive: 0 }] = await db.execute<{ totalActive: number }>(
    sql`SELECT COUNT(*)::int AS "totalActive" FROM schools WHERE is_active = true;`
  );
  const [{ totalCsv } = { totalCsv: 0 }] = await db.execute<{ totalCsv: number }>(
    sql`SELECT COUNT(*)::int AS "totalCsv" FROM schools WHERE csv_source_row IS NOT NULL;`
  );

  console.log({ total, totalActive, totalCsv });

  // Find candidate CSV schools to deactivate (no owners, no listings, no school stock, no requests)
  const candidates = await db.execute<{ id: string; name: string }>(sql`
    SELECT s.id, s.name
    FROM schools s
    WHERE s.csv_source_row IS NOT NULL
      AND s.is_active = true
      AND NOT EXISTS (SELECT 1 FROM school_owners so WHERE so.school_id = s.id AND coalesce(so.is_active, true) = true)
      AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.school_id = s.id)
      AND NOT EXISTS (SELECT 1 FROM school_stock ss WHERE ss.school_id = s.id)
      AND NOT EXISTS (SELECT 1 FROM requests r WHERE r.school_id = s.id)
  `);

  console.log(`Found ${candidates.length} CSV schools to deactivate.`);
  if (candidates.length === 0) {
    console.log('Nothing to do.');
    process.exit(0);
  }

  // Deactivate using Drizzle's inArray to avoid array-casting issues
  const ids = candidates.map((c) => c.id);
  await db
    .update(schools)
    .set({ isActive: false })
    .where(inArray(schools.id, ids));

  console.log(`Deactivated ${candidates.length} CSV schools.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

