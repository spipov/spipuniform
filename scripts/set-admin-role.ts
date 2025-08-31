import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setAdminRole() {
  try {
    const email = await question("Enter the email of the user to make admin: ");
    
    // Find the user
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    
    if (existingUser.length === 0) {
      console.log("❌ User not found with email:", email);
      process.exit(1);
    }
    
    // Update user role to admin
    await db.update(user)
      .set({ role: "admin" })
      .where(eq(user.email, email));
    
    console.log("✅ Successfully set admin role for user:", email);
    
  } catch (error) {
    console.error("❌ Error setting admin role:", error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

setAdminRole();