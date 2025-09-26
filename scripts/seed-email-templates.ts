import { config } from 'dotenv';
config();

import { db } from '@/db';
import { emailTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function seedEmailTemplates() {
  console.log('Seeding email templates...');

  const templates = [
    {
      name: 'Uniform Availability Notification',
      type: 'notification' as const,
      subject: 'Uniform Item Now Available - {{item_name}}',
      htmlContent: `
        <div style="max-width: 640px; margin: 0 auto; font-family: system-ui, sans-serif; background:#ffffff;">
          <div style="margin-bottom:16px;">
            <h1 style="text-align: center; color: #111827; font-size: 24px; line-height: 30px;">Great News! Uniform Item Available</h1>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: left; color: #374151; font-size: 14px; line-height: 20px;">Hi {{user_name}},<br><br>We're excited to let you know that the uniform item you requested is now available!<br><br><strong>Item Details:</strong><br>- {{item_name}}<br>- Size: {{item_size}}<br>- Condition: {{item_condition}}<br>- Price: {{item_price}}<br><br>This item matches your request from {{request_date}}. Don't miss out - items like this are often claimed quickly!</div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: center;"><a href="{{item_url}}" style="background-color: {{primaryColor}}; color: #ffffff; border-radius: 6px; padding: 12px 24px; text-decoration: none; display: inline-block;">View Item & Claim</a></div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: center; color: #6B7280; font-size: 12px; line-height: 16px;">You're receiving this because you requested this item on {{siteName}}. If you no longer want these notifications, you can update your preferences in your account settings.<br><br>{{siteName}} - {{siteUrl}}</div>
          </div>
        </div>
      `,
      jsonContent: {
        "root": {
          "type": "Container",
          "data": {
            "style": {
              "backgroundColor": "#ffffff",
              "padding": { "top": 24, "bottom": 24, "left": 24, "right": 24 },
              "sectionGap": 16
            },
            "props": { "childrenIds": ["heading1", "text1", "button1", "footer1"] }
          }
        },
        "heading1": {
          "type": "Heading",
          "data": {
            "style": { "textAlign": "center", "color": "#111827", "fontSize": 24, "lineHeight": 30 },
            "props": { "text": "Great News! Uniform Item Available", "level": "h1" }
          }
        },
        "text1": {
          "type": "Text",
          "data": {
            "style": { "textAlign": "left", "color": "#374151", "fontSize": 14, "lineHeight": 20 },
            "props": {
              "text": "Hi {{user_name}},\n\nWe're excited to let you know that the uniform item you requested is now available!\n\n**Item Details:**\n- {{item_name}}\n- Size: {{item_size}}\n- Condition: {{item_condition}}\n- Price: {{item_price}}\n\nThis item matches your request from {{request_date}}. Don't miss out - items like this are often claimed quickly!"
            }
          }
        },
        "button1": {
          "type": "Button",
          "data": {
            "style": {
              "textAlign": "center",
              "backgroundColor": "{{primaryColor}}",
              "color": "#ffffff",
              "borderRadius": 6,
              "paddingX": 24,
              "paddingY": 12
            },
            "props": { "text": "View Item & Claim", "url": "{{item_url}}" }
          }
        },
        "footer1": {
          "type": "Text",
          "data": {
            "style": { "textAlign": "center", "color": "#6B7280", "fontSize": 12, "lineHeight": 16 },
            "props": { "text": "You're receiving this because you requested this item on {{siteName}}. If you no longer want these notifications, you can update your preferences in your account settings.\n\n{{siteName}} - {{siteUrl}}" }
          }
        }
      },
      variables: {
        user_name: { description: "Recipient's full name", example: "John Smith", required: true },
        item_name: { description: "Name of the uniform item", example: "School Blazer", required: true },
        item_size: { description: "Size of the item", example: "Age 12", required: true },
        item_condition: { description: "Condition of the item", example: "Excellent", required: true },
        item_price: { description: "Price of the item", example: "€25.00", required: true },
        request_date: { description: "Date the request was made", example: "2024-01-15", required: true },
        item_url: { description: "URL to view the item", example: "https://example.com/listings/123", required: true },
        primaryColor: { description: "Primary brand color", example: "#3b82f6", required: false },
        siteName: { description: "Site name", example: "SpipUniform", required: false },
        siteUrl: { description: "Site URL", example: "https://spipuniform.com", required: false }
      },
      isActive: true,
      isDefault: true
    },
    {
      name: 'Request Confirmation',
      type: 'notification' as const,
      subject: 'Request Submitted - {{item_name}}',
      htmlContent: `
        <div style="max-width: 640px; margin: 0 auto; font-family: system-ui, sans-serif; background:#ffffff;">
          <div style="margin-bottom:16px;">
            <h1 style="text-align: center; color: #111827; font-size: 24px; line-height: 30px;">Request Submitted Successfully</h1>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: left; color: #374151; font-size: 14px; line-height: 20px;">Hi {{user_name}},<br><br>Thank you for submitting your uniform request! We'll notify you as soon as matching items become available.<br><br><strong>Request Details:</strong><br>- {{item_name}}<br>- Size: {{item_size}}<br>- Preferred Condition: {{preferred_condition}}<br>- School: {{school_name}}<br><br>We'll search our marketplace and contact you when we find matches. This usually takes 1-3 business days.</div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: center;"><a href="{{requests_url}}" style="background-color: {{primaryColor}}; color: #ffffff; border-radius: 6px; padding: 12px 24px; text-decoration: none; display: inline-block;">View My Requests</a></div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: center; color: #6B7280; font-size: 12px; line-height: 16px;">Questions? Contact our support team at {{supportEmail}}<br><br>{{siteName}} - {{siteUrl}}</div>
          </div>
        </div>
      `,
      jsonContent: {
        "root": {
          "type": "Container",
          "data": {
            "style": {
              "backgroundColor": "#ffffff",
              "padding": { "top": 24, "bottom": 24, "left": 24, "right": 24 },
              "sectionGap": 16
            },
            "props": { "childrenIds": ["heading2", "text2", "button2", "footer2"] }
          }
        },
        "heading2": {
          "type": "Heading",
          "data": {
            "style": { "textAlign": "center", "color": "#111827", "fontSize": 24, "lineHeight": 30 },
            "props": { "text": "Request Submitted Successfully", "level": "h1" }
          }
        },
        "text2": {
          "type": "Text",
          "data": {
            "style": { "textAlign": "left", "color": "#374151", "fontSize": 14, "lineHeight": 20 },
            "props": {
              "text": "Hi {{user_name}},\n\nThank you for submitting your uniform request! We'll notify you as soon as matching items become available.\n\n**Request Details:**\n- {{item_name}}\n- Size: {{item_size}}\n- Preferred Condition: {{preferred_condition}}\n- School: {{school_name}}\n\nWe'll search our marketplace and contact you when we find matches. This usually takes 1-3 business days."
            }
          }
        },
        "button2": {
          "type": "Button",
          "data": {
            "style": {
              "textAlign": "center",
              "backgroundColor": "{{primaryColor}}",
              "color": "#ffffff",
              "borderRadius": 6,
              "paddingX": 24,
              "paddingY": 12
            },
            "props": { "text": "View My Requests", "url": "{{requests_url}}" }
          }
        },
        "footer2": {
          "type": "Text",
          "data": {
            "style": { "textAlign": "center", "color": "#6B7280", "fontSize": 12, "lineHeight": 16 },
            "props": { "text": "Questions? Contact our support team at {{supportEmail}}\n\n{{siteName}} - {{siteUrl}}" }
          }
        }
      },
      variables: {
        user_name: { description: "Recipient's full name", example: "John Smith", required: true },
        item_name: { description: "Name of the requested uniform item", example: "School Blazer", required: true },
        item_size: { description: "Size requested", example: "Age 12", required: true },
        preferred_condition: { description: "Preferred condition", example: "Good or Better", required: true },
        school_name: { description: "School name", example: "Greystones Community NS", required: true },
        requests_url: { description: "URL to view user's requests", example: "https://example.com/dashboard/requests", required: true },
        primaryColor: { description: "Primary brand color", example: "#3b82f6", required: false },
        supportEmail: { description: "Support email address", example: "support@example.com", required: false },
        siteName: { description: "Site name", example: "SpipUniform", required: false },
        siteUrl: { description: "Site URL", example: "https://spipuniform.com", required: false }
      },
      isActive: true,
      isDefault: true
    },
    {
      name: 'Listing Confirmation',
      type: 'notification' as const,
      subject: 'Listing Posted Successfully - {{item_name}}',
      htmlContent: `
        <div style="max-width: 640px; margin: 0 auto; font-family: system-ui, sans-serif; background:#ffffff;">
          <div style="margin-bottom:16px;">
            <h1 style="text-align: center; color: #111827; font-size: 24px; line-height: 30px;">Your Listing is Live!</h1>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: left; color: #374151; font-size: 14px; line-height: 20px;">Hi {{user_name}},<br><br>Great news! Your uniform listing has been posted successfully and is now visible to families at {{school_name}}.<br><br><strong>Listing Details:</strong><br>- {{item_name}}<br>- Size: {{item_size}}<br>- Condition: {{item_condition}}<br>- Price: {{item_price}}<br><br>We'll notify you when interested families contact you. Check your dashboard regularly for new messages!</div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: center;"><a href="{{listings_url}}" style="background-color: {{primaryColor}}; color: #ffffff; border-radius: 6px; padding: 12px 24px; text-decoration: none; display: inline-block;">View My Listings</a></div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="text-align: center; color: #6B7280; font-size: 12px; line-height: 16px;">Remember to respond promptly to inquiries to keep families interested.<br><br>{{siteName}} - {{siteUrl}}</div>
          </div>
        </div>
      `,
      jsonContent: {
        "root": {
          "type": "Container",
          "data": {
            "style": {
              "backgroundColor": "#ffffff",
              "padding": { "top": 24, "bottom": 24, "left": 24, "right": 24 },
              "sectionGap": 16
            },
            "props": { "childrenIds": ["heading3", "text3", "button3", "footer3"] }
          }
        },
        "heading3": {
          "type": "Heading",
          "data": {
            "style": { "textAlign": "center", "color": "#111827", "fontSize": 24, "lineHeight": 30 },
            "props": { "text": "Your Listing is Live!", "level": "h1" }
          }
        },
        "text3": {
          "type": "Text",
          "data": {
            "style": { "textAlign": "left", "color": "#374151", "fontSize": 14, "lineHeight": 20 },
            "props": {
              "text": "Hi {{user_name}},\n\nGreat news! Your uniform listing has been posted successfully and is now visible to families at {{school_name}}.\n\n**Listing Details:**\n- {{item_name}}\n- Size: {{item_size}}\n- Condition: {{item_condition}}\n- Price: {{item_price}}\n\nWe'll notify you when interested families contact you. Check your dashboard regularly for new messages!"
            }
          }
        },
        "button3": {
          "type": "Button",
          "data": {
            "style": {
              "textAlign": "center",
              "backgroundColor": "{{primaryColor}}",
              "color": "#ffffff",
              "borderRadius": 6,
              "paddingX": 24,
              "paddingY": 12
            },
            "props": { "text": "View My Listings", "url": "{{listings_url}}" }
          }
        },
        "footer3": {
          "type": "Text",
          "data": {
            "style": { "textAlign": "center", "color": "#6B7280", "fontSize": 12, "lineHeight": 16 },
            "props": { "text": "Remember to respond promptly to inquiries to keep families interested.\n\n{{siteName}} - {{siteUrl}}" }
          }
        }
      },
      variables: {
        user_name: { description: "Recipient's full name", example: "John Smith", required: true },
        item_name: { description: "Name of the listed uniform item", example: "School Blazer", required: true },
        item_size: { description: "Size of the item", example: "Age 12", required: true },
        item_condition: { description: "Condition of the item", example: "Excellent", required: true },
        item_price: { description: "Price of the item", example: "€25.00", required: true },
        school_name: { description: "School name", example: "Greystones Community NS", required: true },
        listings_url: { description: "URL to view user's listings", example: "https://example.com/dashboard/listings", required: true },
        primaryColor: { description: "Primary brand color", example: "#3b82f6", required: false },
        siteName: { description: "Site name", example: "SpipUniform", required: false },
        siteUrl: { description: "Site URL", example: "https://spipuniform.com", required: false }
      },
      isActive: true,
      isDefault: true
    }
  ];

  for (const template of templates) {
    const exists = await db.select().from(emailTemplates).where(eq(emailTemplates.name, template.name)).limit(1);
    if (!exists[0]) {
      await db.insert(emailTemplates).values(template as any);
      console.log(`Created template: ${template.name}`);
    } else {
      console.log(`Template already exists: ${template.name}`);
    }
  }

  console.log('Email templates seeding completed.');
}

// Run the seed function
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEmailTemplates()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedEmailTemplates };