Route file "import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
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
}" does not export any route piece. This is likely a mistake.
Route file "import { json } from '@tanstack/start';
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
}" does not export any route piece. This is likely a mistake.
Route file "import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
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
}" does not export any route piece. This is likely a mistake.
Route file "import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateConditionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export async function GET({ params }: APIEvent) {
  try {
    const id = params.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

    const [condition] = await db
      .select()
      .from(conditions)
      .where(eq(conditions.id, id))
      .limit(1);
    
    if (!condition) {
      return json({
        success: false,
        error: 'Condition not found'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      condition
    });
  } catch (error) {
    console.error('Error fetching condition:', error);
    return json({
      success: false,
      error: 'Failed to fetch condition'
    }, { status: 500 });
  }
}

export async function PUT({ request, params }: APIEvent) {
  try {
    const id = params.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateConditionSchema.parse(body);
    
    // Check if name already exists for other conditions
    if (validatedData.name) {
      const existingCondition = await db
        .select()
        .from(conditions)
        .where(eq(conditions.name, validatedData.name))
        .limit(1);
      
      if (existingCondition.length > 0 && existingCondition[0].id !== id) {
        return json({
          success: false,
          error: 'A condition with this name already exists'
        }, { status: 400 });
      }
    }
    
    const [updatedCondition] = await db
      .update(conditions)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(conditions.id, id))
      .returning();
    
    if (!updatedCondition) {
      return json({
        success: false,
        error: 'Condition not found'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      condition: updatedCondition
    });
  } catch (error) {
    console.error('Error updating condition:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to update condition'
    }, { status: 500 });
  }
}

export async function DELETE({ params }: APIEvent) {
  try {
    const id = params.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

    // Check if condition is being used in listings
    // Note: We'll need to import listings table if we want to check usage
    // For now, we'll allow deletion and rely on database constraints
    
    const [deletedCondition] = await db
      .delete(conditions)
      .where(eq(conditions.id, id))
      .returning();
    
    if (!deletedCondition) {
      return json({
        success: false,
        error: 'Condition not found'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      message: 'Condition deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting condition:', error);
    // Check if it's a foreign key constraint error
    if (error.code === '23503') {
      return json({
        success: false,
        error: 'Cannot delete condition as it is being used by existing listings'
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to delete condition'
    }, { status: 500 });
  }
}" does not export any route piece. This is likely a mistake.
Route file "import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const reorderSchema = z.object({
  conditionOrders: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().int().min(0)
  }))
});

export async function POST({ request }: APIEvent) {
  try {
    const body = await request.json();
    const { conditionOrders } = reorderSchema.parse(body);
    
    // Update each condition's order
    const promises = conditionOrders.map(({ id, order }) => 
      db
        .update(conditions)
        .set({ 
          order,
          updatedAt: new Date().toISOString()
        })
        .where(eq(conditions.id, id))
        .returning()
    );
    
    const updatedConditions = await Promise.all(promises);
    
    return json({
      success: true,
      message: 'Conditions reordered successfully',
      conditions: updatedConditions.map(result => result[0]).filter(Boolean)
    });
  } catch (error) {
    console.error('Error reordering conditions:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to reorder conditions'
    }, { status: 500 });
  }
}" does not export any route piece. This is likely a mistake.
Route file "import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const createConditionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

const updateConditionSchema = createConditionSchema.partial();

export async function GET({ request }: APIEvent) {
  try {
    const conditionsData = await db
      .select()
      .from(conditions)
      .orderBy(asc(conditions.order), asc(conditions.name));
    
    return json({
      success: true,
      conditions: conditionsData
    });
  } catch (error) {
    console.error('Error fetching conditions:', error);
    return json({
      success: false,
      error: 'Failed to fetch conditions'
    }, { status: 500 });
  }
}

export async function POST({ request }: APIEvent) {
  try {
    const body = await request.json();
    const validatedData = createConditionSchema.parse(body);
    
    // Check if name already exists
    const existingCondition = await db
      .select()
      .from(conditions)
      .where(eq(conditions.name, validatedData.name))
      .limit(1);
    
    if (existingCondition.length > 0) {
      return json({
        success: false,
        error: 'A condition with this name already exists'
      }, { status: 400 });
    }
    
    const [newCondition] = await db
      .insert(conditions)
      .values({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .returning();
    
    return json({
      success: true,
      condition: newCondition
    });
  } catch (error) {
    console.error('Error creating condition:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to create condition'
    }, { status: 500 });
  }
}

export async function PUT({ request, params }: APIEvent) {
  try {
    const id = params?.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateConditionSchema.parse(body);
    
    // Check if name already exists for other conditions
    if (validatedData.name) {
      const existingCondition = await db
        .select()
        .from(conditions)
        .where(eq(conditions.name, validatedData.name))
        .limit(1);
      
      if (existingCondition.length > 0 && existingCondition[0].id !== id) {
        return json({
          success: false,
          error: 'A condition with this name already exists'
        }, { status: 400 });
      }
    }
    
    const [updatedCondition] = await db
      .update(conditions)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(conditions.id, id))
      .returning();
    
    if (!updatedCondition) {
      return json({
        success: false,
        error: 'Condition not found'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      condition: updatedCondition
    });
  } catch (error) {
    console.error('Error updating condition:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to update condition'
    }, { status: 500 });
  }
}

export async function DELETE({ request, params }: APIEvent) {
  try {
    const id = params?.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

    const [deletedCondition] = await db
      .delete(conditions)
      .where(eq(conditions.id, id))
      .returning();
    
    if (!deletedCondition) {
      return json({
        success: false,
        error: 'Condition not found'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      message: 'Condition deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting condition:', error);
    return json({
      success: false,
      error: 'Failed to delete condition'
    }, { status: 500 });
  }
}" does not export any route piece. This is likely a mistake.
Generated route tree in 484ms