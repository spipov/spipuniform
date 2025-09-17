import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { transactions, transactionMessages } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const createMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  messageType: z.enum(['general', 'location', 'schedule', 'feedback']).default('general'),
  isSystemMessage: z.boolean().default(false)
});

export const ServerRoute = createServerFileRoute('/api/transactions/$id/messages').methods({
  GET: async ({ params, request }) => {
    try {
      // Validate session using Better Auth
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const userId = session.user.id;
      const transactionId = params.id;
      
      if (!transactionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Transaction ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // First verify user has access to this transaction
      const [transaction] = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(and(
          eq(transactions.id, transactionId),
          or(
            eq(transactions.buyerUserId, userId),
            eq(transactions.sellerUserId, userId)
          )
        ))
        .limit(1);
      
      if (!transaction) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Transaction not found or access denied'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get messages for this transaction
      const messages = await db
        .select()
        .from(transactionMessages)
        .where(eq(transactionMessages.transactionId, transactionId))
        .orderBy(asc(transactionMessages.createdAt));
      
      // Mark messages as read by this user (update readAt if not already set)
      await db
        .update(transactionMessages)
        .set({ readAt: new Date().toISOString() })
        .where(and(
          eq(transactionMessages.transactionId, transactionId),
          eq(transactionMessages.readAt, null)
        ));
      
      return new Response(JSON.stringify({
        success: true,
        messages
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching transaction messages:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch messages'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  POST: async ({ params, request }) => {
    try {
      // Validate session using Better Auth
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const userId = session.user.id;
      const transactionId = params.id;
      
      if (!transactionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Transaction ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const validatedData = createMessageSchema.parse(body);
      
      // First verify user has access to this transaction
      const [transaction] = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(and(
          eq(transactions.id, transactionId),
          or(
            eq(transactions.buyerUserId, userId),
            eq(transactions.sellerUserId, userId)
          )
        ))
        .limit(1);
      
      if (!transaction) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Transaction not found or access denied'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Create the message
      const [newMessage] = await db
        .insert(transactionMessages)
        .values({
          transactionId,
          senderUserId: userId,
          ...validatedData
        })
        .returning();
      
      // Update transaction's updatedAt timestamp to reflect activity
      await db
        .update(transactions)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(transactions.id, transactionId));
      
      return new Response(JSON.stringify({
        success: true,
        message: newMessage
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating transaction message:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid data',
          details: error.errors
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create message'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
