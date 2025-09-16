import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { transactions, transactionMessages } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { z } from 'zod';

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

export async function GET({ params, request }: APIEvent) {
  try {
    const userId = request.headers.get('x-user-id');
    const transactionId = params.id;
    
    if (!userId) {
      return json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    if (!transactionId) {
      return json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 });
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
      return json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    // Get transaction messages
    const messages = await db
      .select()
      .from(transactionMessages)
      .where(eq(transactionMessages.transactionId, transactionId))
      .orderBy(asc(transactionMessages.createdAt));
    
    return json({
      success: true,
      transaction,
      messages
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return json({
      success: false,
      error: 'Failed to fetch transaction'
    }, { status: 500 });
  }
}

export async function PUT({ params, request }: APIEvent) {
  try {
    const userId = request.headers.get('x-user-id');
    const transactionId = params.id;
    
    if (!userId) {
      return json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    if (!transactionId) {
      return json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 });
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
      return json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to update transaction'
    }, { status: 500 });
  }
}

// TEST COMMENT TO SEE IF CHANGES ARE PICKED UP
// Expose ServerRoute for TanStack Start to register this API route
export const ServerRoute = createServerFileRoute('/api/transactions/$id').methods({
  GET,
  PUT,
});