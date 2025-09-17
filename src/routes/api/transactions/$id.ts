import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { transactions, transactionMessages } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const updateTransactionSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  buyerUserId: z.string().optional(),
  price: z.number().positive().optional(),
  exchangeMethod: z.enum(['pickup', 'delivery', 'postal']).optional(),
  meetingLocation: z.string().optional(),
  scheduledDate: z.string().optional(),
  actualDate: z.string().optional(),
  buyerNotes: z.string().optional(),
  sellerNotes: z.string().optional(),
  buyerRating: z.number().min(1).max(5).optional(),
  sellerRating: z.number().min(1).max(5).optional(),
  buyerFeedback: z.string().optional(),
  sellerFeedback: z.string().optional()
});

export const ServerRoute = createServerFileRoute('/api/transactions/$id').methods({
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

      // Get transaction (ensuring user has access to it)
      const [transaction] = await db
        .select()
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
          error: 'Transaction not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get transaction messages
      const messages = await db
        .select()
        .from(transactionMessages)
        .where(eq(transactionMessages.transactionId, transactionId))
        .orderBy(asc(transactionMessages.createdAt));
      
      return new Response(JSON.stringify({
        success: true,
        transaction,
        messages
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch transaction'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  PUT: async ({ params, request }) => {
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
      const validatedData = updateTransactionSchema.parse(body);
      
      // Update transaction (ensuring user has access to it)
      const [updatedTransaction] = await db
        .update(transactions)
        .set({
          ...validatedData,
          updatedAt: new Date().toISOString(),
          // Set completion date if status is being set to completed
          ...(validatedData.status === 'completed' && { completedAt: new Date().toISOString() })
        })
        .where(and(
          eq(transactions.id, transactionId),
          or(
            eq(transactions.buyerUserId, userId),
            eq(transactions.sellerUserId, userId)
          )
        ))
        .returning();
      
      if (!updatedTransaction) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Transaction not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        transaction: updatedTransaction
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
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
        error: 'Failed to update transaction'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
