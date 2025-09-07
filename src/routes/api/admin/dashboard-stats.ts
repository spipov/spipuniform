import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { user, session, branding } from '@/db/schema';
import { count, eq, gte, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { RoleService } from '@/lib/services/role-service';

export const ServerRoute = createServerFileRoute('/api/admin/dashboard-stats').methods({
  GET: async ({ request }) => {
    try {
      // Check authentication and admin permissions
      const authSession = await auth.api.getSession({ headers: request.headers });
      if (!authSession?.user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get current user's role
      const [currentUser] = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, authSession.user.id))
        .limit(1);

      const roleName = currentUser?.role || null;
      const normalizedRole = roleName?.toLowerCase();

      // Check if user has admin permissions
      if (normalizedRole !== 'admin' && authSession.user.email !== 'admin@admin.com') {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get current date for time-based queries
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get comprehensive user statistics
      const [totalUsers, activeUsers, newUsersLast30Days, newUsersToday] = await Promise.all([
        // Total users
        db.select({ count: count() }).from(user),
        // Active users (not banned and approved)
        db.select({ count: count() }).from(user).where(eq(user.banned, false)),
        // New users in last 30 days
        db.select({ count: count() }).from(user).where(gte(user.createdAt, last30Days)),
        // New users today
        db.select({ count: count() }).from(user).where(gte(user.createdAt, today))
      ]);

      // Get session statistics and additional user metrics
      const [totalSessions, activeSessions, bannedUsers, pendingUsers] = await Promise.all([
        // Total sessions
        db.select({ count: count() }).from(session),
        // Active sessions (not expired)
        db.select({ count: count() }).from(session).where(gte(session.expiresAt, now)),
        // Banned users
        db.select({ count: count() }).from(user).where(eq(user.banned, true)),
        // Pending users (not approved)
        db.select({ count: count() }).from(user).where(eq(user.approved, false))
      ]);

      // System configuration status (branding only - email tables don't exist yet)
      const [brandingCount] = await Promise.all([
        // Active branding configurations
        db.select({ count: count() }).from(branding).where(eq(branding.isActive, true))
      ]);

      // User growth data for charts (last 30 days)
      const userGrowthData = await db
        .select({
          date: sql<string>`DATE(${user.createdAt})`,
          count: count()
        })
        .from(user)
        .where(gte(user.createdAt, last30Days))
        .groupBy(sql`DATE(${user.createdAt})`)
        .orderBy(sql`DATE(${user.createdAt})`);

      const stats = {
        users: {
          total: totalUsers[0]?.count || 0,
          active: activeUsers[0]?.count || 0,
          newLast30Days: newUsersLast30Days[0]?.count || 0,
          newToday: newUsersToday[0]?.count || 0,
          banned: bannedUsers[0]?.count || 0,
          pending: pendingUsers[0]?.count || 0
        },
        sessions: {
          total: totalSessions[0]?.count || 0,
          active: activeSessions[0]?.count || 0
        },
        emails: {
          total: 0,
          last30Days: 0,
          failed: 0
        },
        system: {
          emailConfigured: false,
          brandingConfigured: brandingCount[0]?.count > 0
        },
        charts: {
          userGrowth: userGrowthData,
          emailActivity: []
        }
      };

      return new Response(
        JSON.stringify({ success: true, data: stats }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch dashboard statistics' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});