import 'dotenv/config';
import { db } from '@/db';
import { user as authUser, roles, emailTemplates, storageSettings, branding } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { BrandingService } from '@/lib/services/branding/branding-service';

/**
 * Comprehensive database seeding script
 * Seeds all essential data: roles, admin user, email templates, storage, and branding
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');

    // 1. Create default roles
    console.log('📋 Creating default roles...');
    
    const defaultRoles = [
      {
        name: 'admin',
        description: 'Full system access',
        permissions: {
          users: { create: true, read: true, update: true, delete: true },
          roles: { create: true, read: true, update: true, delete: true },
          system: { manage: true },
          branding: { create: true, read: true, update: true, delete: true },
          email: { create: true, read: true, update: true, delete: true }
        },
        color: '#DC2626',
        is_system: true
      },
      {
        name: 'user',
        description: 'Standard user access',
        permissions: {
          users: { read: true },
          roles: { read: true }
        },
        color: '#3B82F6',
        is_system: true
      }
    ];

    // Check if roles already exist
    const existingRoles = await db.select().from(roles).limit(1);
    if (existingRoles.length === 0) {
      const insertedRoles = await db.insert(roles).values(defaultRoles).returning();
      console.log(`✅ Created ${insertedRoles.length} roles`);
    } else {
      console.log('ℹ️  Roles already exist, skipping role creation');
    }

    // 2. Create admin user
    console.log('👤 Creating admin user...');
    
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'System Administrator';

    // Check if admin user already exists in Better Auth user table
    const existingAdmin = await db.select().from(authUser).where(eq(authUser.email, adminEmail)).limit(1);

    if (existingAdmin.length === 0) {
      // Use Better Auth's server-side API for proper scrypt password hashing
      const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3100';
      const mockRequest = new Request(`${baseURL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          name: adminName
        })
      });

      const response = await auth.handler(mockRequest);

      if (response.ok) {
        // Ensure the created user is fully enabled as an admin
        await db
          .update(authUser)
          .set({
            role: 'admin',
            emailVerified: true,
            approved: true,
            banned: false,
            banReason: null,
            updatedAt: new Date(),
          })
          .where(eq(authUser.email, adminEmail));
        console.log(`✅ Created and activated admin user: ${adminEmail}`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to create admin user: ${error}`);
      }
    } else {
      // Ensure existing admin is fully enabled
      await db
        .update(authUser)
        .set({
          role: 'admin',
          emailVerified: true,
          approved: true,
          banned: false,
          banReason: null,
          updatedAt: new Date(),
        })
        .where(eq(authUser.email, adminEmail));
      console.log(`ℹ️  Admin user already exists; ensured admin role and verification: ${adminEmail}`);
    }

    // 3. Seed default storage provider
    console.log('💾 Setting up default storage provider...');
    
    const existingStorage = await db.select().from(storageSettings).limit(1);
    if (existingStorage.length === 0) {
      await db.insert(storageSettings).values({
        name: 'Local Storage',
        provider: 'local',
        description: 'Default local file storage',
        config: {
          basePath: './uploads',
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/json'
          ],
          maxFilesPerUpload: 10,
          enableThumbnails: true
        },
        isActive: true
      });
      console.log('✅ Created default local storage provider');
    } else {
      console.log('ℹ️  Storage provider already exists, skipping');
    }

    // 4. Seed default email templates
    console.log('📧 Creating default email templates...');
    
    const defaultTemplates = [
      {
        name: 'Welcome Email',
        subject: 'Welcome to {{siteName}}!',
        htmlContent: `
          <h1>Welcome to {{siteName}}!</h1>
          <p>Hello {{userName}},</p>
          <p>Thank you for joining us. We're excited to have you on board!</p>
          <p>Best regards,<br>The {{siteName}} Team</p>
        `,
        textContent: `
          Welcome to {{siteName}}!
          
          Hello {{userName}},
          
          Thank you for joining us. We're excited to have you on board!
          
          Best regards,
          The {{siteName}} Team
        `,
        type: 'welcome',
        isActive: true
      },
      {
        name: 'Password Reset',
        subject: 'Reset your {{siteName}} password',
        htmlContent: `
          <h1>Password Reset Request</h1>
          <p>Hello {{userName}},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <p><a href="{{resetLink}}">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The {{siteName}} Team</p>
        `,
        textContent: `
          Password Reset Request
          
          Hello {{userName}},
          
          You requested to reset your password. Use this link to reset it:
          {{resetLink}}
          
          If you didn't request this, please ignore this email.
          
          Best regards,
          The {{siteName}} Team
        `,
        type: 'reset_password',
        isActive: true
      }
    ];

    const existingTemplates = await db.select().from(emailTemplates).limit(1);
    if (existingTemplates.length === 0) {
      await db.insert(emailTemplates).values(defaultTemplates);
      console.log(`✅ Created ${defaultTemplates.length} email templates`);
    } else {
      console.log('ℹ️  Email templates already exist, skipping');
    }

    // 5. Seed default branding
    console.log('🎨 Creating default branding configuration...');
    
    try {
      await BrandingService.ensureDefaultBranding();
      console.log('✅ Default branding configuration ensured');
    } catch (error) {
      console.error('⚠️  Error creating default branding:', error);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('  - Default roles (admin, user)');
    console.log(`  - Admin user: ${adminEmail}`);
    console.log('  - Local storage provider');
    console.log('  - Default email templates');
    console.log('  - Default branding configuration');
    console.log('');
    console.log('🔐 Admin Credentials:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };