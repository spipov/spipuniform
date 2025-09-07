/** biome-ignore-all lint/suspicious/noConsole: Console logs in CLI tools are acceptable */

import * as v from "valibot";
import { signUp } from "@/lib/auth-client";
import { registerSchema } from "@/schemas/auth";
import prompts from "prompts";

(async () => {
  const response = await prompts(
    [
      {
        type: "text",
        name: "email",
        message: "Enter admin email",
      },
      {
        type: "text",
        name: "name",
        message: "Enter admin name",
      },
      {
        type: "password",
        name: "password",
        message: "Enter admin password",
      },
      {
        type: "password",
        name: "confirmPassword",
        message: "Confirm admin password",
      },
    ],
    {
      onCancel: () => {
        console.log("Admin creation cancelled.");
        process.exit(0);
      },
    }
  );

  if (response.password !== response.confirmPassword) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  try {
    v.parse(registerSchema, response);
  } catch (error) {
    console.error("Validation errors:");
    if (error instanceof v.ValiError) {
      error.issues.forEach((issue) => {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
      });
    } else {
      console.error("Unknown validation error:", error);
    }
    process.exit(1);
  }

  // Since we validated, we can safely use the data
  const parsed = { data: v.parse(registerSchema, response) };

  try {
    const result = await signUp.email({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });

    if (result.error) {
      console.error(`Failed to create admin user: ${result.error.message}`);
      process.exit(1);
    } else {
      console.log(`Admin user created successfully: ${parsed.data.email}`);
      process.exit(0);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`An unexpected error occurred: ${error.message}`);
    } else {
      console.error("An unexpected error occurred.");
    }
    process.exit(1);
  }
})();
