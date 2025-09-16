import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { transactions, transactionMessages } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { z } from 'zod';

const createMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  messageType: z.enum(['general', 'location', 'schedule', 'feedback']).default('general'),
  isSystemMessage: z.boolean().default(false)
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
      return json({
        success: false,
        error: 'Transaction not found or access denied'
      }, { status: 404 });
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
    
    return json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching transaction messages:', error);
    return json({
      success: false,
      error: 'Failed to fetch messages'
    }, { status: 500 });
  }
}

export async function POST({ params, request }: APIEvent) {
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
      return json({
        success: false,
        error: 'Transaction not found or access denied'
      }, { status: 404 });
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
    
    return json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error creating transaction message:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to create message'
    }, { status: 500 });
  }
}

// Expose ServerRoute for TanStack Start to register this API route
export const ServerRoute = createServerFileRoute('/api/transactions/$id/messages').methods({
  GET,
  POST,
});