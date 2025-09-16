import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { db } from '@/db';
import { transactions, user } from '@/db/schema';
import { eq, or, desc, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const createTransactionSchema = z.object({
  type: z.enum(['purchase', 'sale', 'exchange']),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  buyerUserId: z.string().optional(),
  listingId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  itemDescription: z.string().min(1, 'Item description is required'),
  conditionAtSale: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().default('EUR'),
  exchangeMethod: z.enum(['pickup', 'delivery', 'postal']).optional(),
  meetingLocation: z.string().optional(),
  scheduledDate: z.string().optional(), // ISO date string
  buyerNotes: z.string().optional(),
  sellerNotes: z.string().optional()
});

const updateTransactionSchema = createTransactionSchema.partial().extend({
  actualDate: z.string().optional(), // ISO date string
  buyerRating: z.number().min(1).max(5).optional(),
  sellerRating: z.number().min(1).max(5).optional(),
  buyerFeedback: z.string().optional(),
  sellerFeedback: z.string().optional(),
  completedAt: z.string().optional()
});

export async function GET({ request }: APIEvent) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'buyer', 'seller', or 'all'
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query conditions
    let conditions = [];
    
    if (type === 'buyer') {
      conditions.push(eq(transactions.buyerUserId, userId));
    } else if (type === 'seller') {
      conditions.push(eq(transactions.sellerUserId, userId));
    } else {
      // Default: get all transactions where user is either buyer or seller
      conditions.push(or(
        eq(transactions.buyerUserId, userId),
        eq(transactions.sellerUserId, userId)
      ));
    }
    
    if (status) {
      conditions.push(eq(transactions.status, status));
    }

    // Execute query
    const userTransactions = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        status: transactions.status,
        buyerUserId: transactions.buyerUserId,
        sellerUserId: transactions.sellerUserId,
        listingId: transactions.listingId,
        requestId: transactions.requestId,
        itemDescription: transactions.itemDescription,
        conditionAtSale: transactions.conditionAtSale,
        price: transactions.price,
        currency: transactions.currency,
        exchangeMethod: transactions.exchangeMethod,
        meetingLocation: transactions.meetingLocation,
        scheduledDate: transactions.scheduledDate,
        actualDate: transactions.actualDate,
        buyerNotes: transactions.buyerNotes,
        sellerNotes: transactions.sellerNotes,
        buyerRating: transactions.buyerRating,
        sellerRating: transactions.sellerRating,
        buyerFeedback: transactions.buyerFeedback,
        sellerFeedback: transactions.sellerFeedback,
        completedAt: transactions.completedAt,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt
      })
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
    
    return json({
      success: true,
      transactions: userTransactions,
      pagination: {
        limit,
        offset,
        total: userTransactions.length // Note: This would need a separate count query for true pagination
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return json({
      success: false,
      error: 'Failed to fetch transactions'
    }, { status: 500 });
  }
}

export async function POST({ request }: APIEvent) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);
    
    // Create the transaction (seller is always the current user for POST)
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...validatedData,
        sellerUserId: userId
      })
      .returning();
    
    return json({
      success: true,
      transaction: newTransaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to create transaction'
    }, { status: 500 });
  }
}