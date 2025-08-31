import * as v from "valibot";

// Registration schema for user validation
export const registerSchema = v.pipe(
  v.object({
    email: v.pipe(v.string(), v.nonEmpty("Email is required"), v.email("Invalid email format")),
    name: v.pipe(
      v.string(),
      v.nonEmpty("Name is required"),
      v.minLength(2, "Name must be at least 2 characters"),
      v.maxLength(50, "Name must be less than 50 characters")
    ),
    password: v.pipe(
      v.string(),
      v.nonEmpty("Password is required"),
      v.minLength(8, "Password must be at least 8 characters"),
      v.regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      )
    ),
    confirmPassword: v.pipe(v.string(), v.nonEmpty("Password confirmation is required")),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirmPassword"]],
      (input) => input.password === input.confirmPassword,
      "Passwords do not match"
    ),
    ["confirmPassword"]
  )
);

export type RegisterSchema = v.InferInput<typeof registerSchema>;

// Login schema
export const loginSchema = v.object({
  email: v.pipe(v.string(), v.nonEmpty("Email is required"), v.email("Invalid email format")),
  password: v.pipe(v.string(), v.nonEmpty("Password is required")),
});

export type LoginSchema = v.InferInput<typeof loginSchema>;
