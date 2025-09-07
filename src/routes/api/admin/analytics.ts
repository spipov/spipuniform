import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { users, sessions, emailLogs } from '@/db/schema';
import { eq, gte, lte, count, desc, sql } from 'drizzle-orm';
import { RoleService } from '@/lib/services/role-service';

export const ServerRoute = createServerFileRoute('/api/admin/analytics').methods({
  GET: async ({ request }) => {
      try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        
        // Get session from request headers or cookies
        const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                            request.headers.get('cookie')?.split(';')
                              .find(c => c.trim().startsWith('session='))
                              ?.split('=')[1];

        if (!sessionToken) {
          return Response.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Verify session and get user
        const sessionData = await db.query.sessions.findFirst({
          where: eq(sessions.sessionToken, sessionToken),
          with: { user: true }
        });

        if (!sessionData || !sessionData.user) {
          return Response.json(
            { success: false, error: 'Invalid session' },
            { status: 401 }
          );
        }

        // Check if user has admin permissions
        const hasPermission = await RoleService.hasPermission(
          sessionData.user.id,
          'admin:dashboard:view'
        );

        if (!hasPermission) {
          return Response.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        // Get query parameters
        const timeRange = searchParams.get('timeRange') || '30d'; // 7d, 30d, 90d, 1y
        const metric = searchParams.get('metric') || 'users'; // users, sessions, emails, activity
        
        // Calculate date range
        const now = new Date();
        let startDate: Date;
        
        switch (timeRange) {
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default: // 30d
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        let analyticsData: any = {};

        switch (metric) {
          case 'users': {
            // User registration trends
            const userTrends = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: count()
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

            // User status breakdown
            const userStatusBreakdown = await db
      .select({
        status: users.emailVerified,
        count: count()
      })
      .from(users)
      .groupBy(users.emailVerified);

            // Top user activity (mock data - replace with actual activity tracking)
            const topUsers = await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                createdAt: users.createdAt,
        lastLogin: sql<Date>`(
          SELECT MAX(${sessions.createdAt}) 
          FROM ${sessions} 
          WHERE ${sessions.userId} = ${users.id}
        )`
      })
      .from(users)
      .orderBy(desc(sql`(
        SELECT MAX(${sessions.createdAt}) 
        FROM ${sessions} 
        WHERE ${sessions.userId} = ${users.id}
      )`))
              .limit(10);

            analyticsData = {
              trends: userTrends,
              statusBreakdown: userStatusBreakdown.map(item => ({
                status: item.status ? 'Verified' : 'Unverified',
                count: item.count
              })),
              topUsers: topUsers.map(user => ({
                ...user,
                email: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email for privacy
              }))
            };
            break;
          }

          case 'sessions': {
            // Session creation trends
            const sessionTrends = await db
      .select({
        date: sql<string>`DATE(${sessions.createdAt})`,
        count: count()
      })
      .from(sessions)
      .where(gte(sessions.createdAt, startDate))
      .groupBy(sql`DATE(${sessions.createdAt})`)
      .orderBy(sql`DATE(${sessions.createdAt})`);

            // Active vs expired sessions
            const sessionStatus = await db
              .select({
                status: sql<string>`CASE 
                  WHEN ${sessions.expires} > NOW() THEN 'Active'
                  ELSE 'Expired'
                END`,
                count: count()
              })
              .from(sessions)
              .groupBy(sql`CASE 
                WHEN ${sessions.expires} > NOW() THEN 'Active'
                ELSE 'Expired'
              END`);

            analyticsData = {
              trends: sessionTrends,
              statusBreakdown: sessionStatus
            };
            break;
          }

          case 'emails': {
            // Email sending trends (if email logs exist)
            try {
              const emailTrends = await db
        .select({
          date: sql<string>`DATE(${emailLogs.createdAt})`,
          sent: count(),
          failed: sql<number>`SUM(CASE WHEN ${emailLogs.status} = 'failed' THEN 1 ELSE 0 END)`
        })
        .from(emailLogs)
        .where(gte(emailLogs.createdAt, startDate))
        .groupBy(sql`DATE(${emailLogs.createdAt})`)
        .orderBy(sql`DATE(${emailLogs.createdAt})`);

              // Email type breakdown
              const emailTypes = await db
                .select({
                  type: emailLogs.type,
                  count: count()
                })
                .from(emailLogs)
                .where(gte(emailLogs.createdAt, startDate))
                .groupBy(emailLogs.type);

              analyticsData = {
                trends: emailTrends,
                typeBreakdown: emailTypes
              };
            } catch (error) {
              // Email logs table might not exist
              analyticsData = {
                trends: [],
                typeBreakdown: [],
                note: 'Email logging not configured'
              };
            }
            break;
          }

          case 'activity': {
            // General platform activity metrics
            const dailyActivity = await db
      .select({
        date: sql<string>`DATE(${sessions.createdAt})`,
        newSessions: count(),
        uniqueUsers: sql<number>`COUNT(DISTINCT ${sessions.userId})`
      })
      .from(sessions)
      .where(gte(sessions.createdAt, startDate))
      .groupBy(sql`DATE(${sessions.createdAt})`)
      .orderBy(sql`DATE(${sessions.createdAt})`);

            // Peak usage hours (based on session creation)
            const hourlyActivity = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${sessions.createdAt})`,
        count: count()
      })
      .from(sessions)
      .where(gte(sessions.createdAt, startDate))
      .groupBy(sql`EXTRACT(HOUR FROM ${sessions.createdAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${sessions.createdAt})`);

            analyticsData = {
              dailyActivity,
              hourlyActivity
            };
            break;
          }

          default:
            return Response.json(
              { success: false, error: 'Invalid metric type' },
              { status: 400 }
            );
        }

        return Response.json({
          success: true,
          data: {
            metric,
            timeRange,
            period: {
              start: startDate.toISOString(),
              end: now.toISOString()
            },
            analytics: analyticsData
          }
        });

      } catch (error) {
        console.error('Analytics API error:', error);
        return Response.json(
          { 
            success: false, 
            error: 'Failed to fetch analytics data',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
});