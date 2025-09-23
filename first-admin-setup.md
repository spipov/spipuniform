# First Admin Setup Guide - Universal Solution

This guide solves the common authentication setup problem across all JavaScript frameworks (Next.js, TanStack, Vite, etc.) where you need to create the first admin user without hardcoded credentials.

## 🎯 **The Problem**
- Can't hardcode admin credentials in code
- Need dynamic URLs (no production URLs in development)
- First user should automatically become admin
- Subsequent users should be regular users
- SMTP configuration should come from environment

## 🔧 **Universal Solution Architecture**

### 1. **Environment Variable Strategy**
```env
# Base URLs (adapt to your framework)
NEXT_PUBLIC_BASE_URL=http://localhost:3310          # Next.js
VITE_BASE_URL=http://localhost:3310                 # Vite/TanStack
REACT_APP_BASE_URL=http://localhost:3310            # Create React App

# Auth URLs
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3310   # Next.js
VITE_BETTER_AUTH_URL=http://localhost:3310          # Vite
REACT_APP_BETTER_AUTH_URL=http://localhost:3310     # CRA

# Server-side auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3310

# SMTP Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_SECURE=false
SMTP_FROM_NAME=Your App Name
SMTP_FROM_EMAIL=noreply@yourapp.com
SMTP_REPLY_TO=support@yourapp.com
```

### 2. **Dynamic URL Utility** (Universal)
Create `src/lib/utils/url.ts`:
```typescript
export function getBaseUrl(): string {
  // 1. Check for explicit environment variable
  const envVar = process.env.NEXT_PUBLIC_BASE_URL || 
                 process.env.VITE_BASE_URL || 
                 process.env.REACT_APP_BASE_URL;
  if (envVar) return envVar;

  // 2. In browser, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 3. Server-side fallbacks
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NETLIFY_URL) return process.env.NETLIFY_URL;
  
  // 4. Development fallback
  return 'http://localhost:3310'; // Adjust port as needed
}

export function getAuthBaseUrl(): string {
  const authVar = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 
                  process.env.VITE_BETTER_AUTH_URL || 
                  process.env.REACT_APP_BETTER_AUTH_URL;
  return authVar || getBaseUrl();
}
```

### 3. **First Admin Detection API**
Create `/api/auth/admin-exists` endpoint:
```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const adminUsers = await db.select()
      .from(user)
      .where(eq(user.role, "admin"))
      .limit(1);
    
    return Response.json({ 
      success: true, 
      exists: adminUsers.length > 0 
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: "Failed to check admin status" 
    }, { status: 500 });
  }
}
```

### 4. **First Admin Promotion API**
Create `/api/auth/upgrade-first-admin` endpoint:
```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    // Safety check: ensure no admin exists
    const existingAdmins = await db.select()
      .from(user)
      .where(eq(user.role, "admin"))
      .limit(1);
    
    if (existingAdmins.length > 0) {
      return Response.json({ 
        success: false, 
        error: "Admin already exists" 
      }, { status: 400 });
    }
    
    // Promote user to admin
    const [updatedUser] = await db.update(user)
      .set({ 
        role: "admin", 
        approved: true, 
        emailVerified: true 
      })
      .where(eq(user.id, userId))
      .returning();
    
    return Response.json({ 
      success: true, 
      data: updatedUser 
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: "Failed to upgrade user" 
    }, { status: 500 });
  }
}
```

### 5. **Frontend Registration Form Logic**
```typescript
"use client"; // or equivalent for your framework

import { useState, useEffect } from "react";
import { getBaseUrl } from "@/lib/utils/url";

export function RegisterForm() {
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  
  useEffect(() => {
    // Check if admin exists
    fetch(`${getBaseUrl()}/api/auth/admin-exists`)
      .then(res => res.json())
      .then(data => setIsFirstAdmin(!data.exists))
      .catch(() => setIsFirstAdmin(false));
  }, []);
  
  const handleSubmit = async (formData) => {
    try {
      // Sign up user
      const signupResult = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      
      // If first admin, promote immediately
      if (isFirstAdmin && signupResult.data?.user?.id) {
        await fetch(`${getBaseUrl()}/api/auth/upgrade-first-admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: signupResult.data.user.id }),
        });
        toast.success('Welcome! You are the first admin.');
      }
      
      // Redirect or handle success
    } catch (error) {
      toast.error('Signup failed');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {isFirstAdmin && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
          <p className="text-green-800 text-sm">
            🎉 You'll be the first admin of this application!
          </p>
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

## 🚀 **Implementation Steps**

### Step 1: Environment Setup
1. **Check for `.env.local` files** - they override `.env` in Next.js!
2. **Set all URLs to localhost** for development
3. **Add SMTP settings** if email functionality needed
4. **Restart dev server** after changing `NEXT_PUBLIC_*` variables

### Step 2: Create Utilities
1. **Create `src/lib/utils/url.ts`** with dynamic URL functions
2. **Update auth client** to use `getAuthBaseUrl()`
3. **Replace all hardcoded URLs** with utility functions

### Step 3: Database Setup
1. **Create clean seed script** that handles:
   - User roles (admin/user)
   - SMTP settings from environment
   - Auth settings
2. **Add database reset scripts**:
   ```json
   {
     "db:reset": "db:push && db:seed:clean",
     "db:fresh": "db:reset && db:clear-users"
   }
   ```

### Step 4: API Endpoints
1. **Create admin detection endpoint** (`/api/auth/admin-exists`)
2. **Create admin promotion endpoint** (`/api/auth/upgrade-first-admin`)
3. **Test endpoints** with curl

### Step 5: Frontend Integration
1. **Update registration form** with first-admin detection
2. **Add visual feedback** for first admin signup
3. **Handle automatic promotion** after successful signup

## 🧪 **Testing the Setup**

```bash
# 1. Fresh database
pnpm db:fresh

# 2. Check no admin exists
curl http://localhost:3310/api/auth/admin-exists
# Should return: {"success":true,"exists":false}

# 3. Sign up first user (via form or API)
curl -X POST http://localhost:3310/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!","name":"Admin"}'

# 4. Promote to admin (if auto-promotion doesn't work)
curl -X POST http://localhost:3310/api/auth/upgrade-first-admin \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID_FROM_SIGNUP"}'

# 5. Verify admin exists
curl http://localhost:3310/api/auth/admin-exists
# Should return: {"success":true,"exists":true}
```

## 🔧 **Framework-Specific Notes**

### Next.js
- Use `NEXT_PUBLIC_*` for client-side variables
- Environment files: `.env.local` > `.env`
- Restart dev server after env changes

### TanStack/Vite
- Use `VITE_*` for client-side variables
- Access via `import.meta.env.VITE_*`
- Hot reload picks up env changes

### Create React App
- Use `REACT_APP_*` for client-side variables
- Access via `process.env.REACT_APP_*`
- Restart required for env changes

## ✅ **Benefits of This Approach**
- ✅ **No hardcoded credentials**
- ✅ **Dynamic URLs** work in any environment
- ✅ **First admin detection** prevents multiple admins
- ✅ **Environment-driven** SMTP configuration
- ✅ **Framework agnostic** - works with any JS framework
- ✅ **Production ready** - handles Vercel, Netlify, etc.
- ✅ **Developer friendly** - clear visual feedback

This solution eliminates the common auth setup headaches across all your applications! 🎉
