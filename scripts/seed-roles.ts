import 'dotenv/config';
import { db } from '@/db';
import { roles } from '@/db/schema';

async function main() {
  const defaults = [
    { name: 'admin', description: 'Administrator', isSystem: true, color: '#EF4444', permissions: { manageUsers: true, manageRoles: true, assignRoles: true, viewDashboard: true, viewUserManagement: true } },
    { name: 'moderator', description: 'Moderator', isSystem: true, color: '#F59E0B', permissions: { viewDashboard: true, viewUserManagement: true } },
    { name: 'user', description: 'Standard User', isSystem: true, color: '#6B7280', permissions: { } },
    { name: 'family', description: 'Parent', isSystem: false, color: '#3B82F6', permissions: { } },
    { name: 'shop', description: 'Shop Owner', isSystem: false, color: '#10B981', permissions: { } },
    { name: 'school_rep', description: 'School Representative', isSystem: false, color: '#6366F1', permissions: { } },
  ];

  let inserted = 0;
  for (const r of defaults) {
    try {
      await db.insert(roles).values({
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        color: r.color,
        permissions: r.permissions as any,
      }).onConflictDoNothing();
      inserted++;
    } catch (e) {
      // ignore conflicts
    }
  }
  const rows = await db.select().from(roles);
  console.log(`Seeded roles. Current roles: ${rows.map(r => r.name).join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

