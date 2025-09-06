"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import { useRouter, useSearch } from "@tanstack/react-router";
import * as v from "valibot";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// Schema for requesting password reset
const requestResetSchema = v.object({
  email: v.pipe(v.string(), v.nonEmpty("Email is required"), v.email("Invalid email format")),
});

// Schema for resetting password with token
const resetPasswordSchema = v.pipe(
  v.object({
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

type RequestResetSchema = v.InferInput<typeof requestResetSchema>;
type ResetPasswordSchema = v.InferInput<typeof resetPasswordSchema>;

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const search = useSearch({ from: "/auth/reset-password" }) as { token?: string };
  const hasToken = !!search.token;

  const requestForm = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      await onRequestReset(value);
    },
    validatorAdapter: valibotValidator(),
    validators: {
      onChange: requestResetSchema,
    },
  });

  const resetForm = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      await onResetPassword(value);
    },
    validatorAdapter: valibotValidator(),
    validators: {
      onChange: resetPasswordSchema,
    },
  });

  const onRequestReset = async (data: RequestResetSchema) => {
    setIsLoading(true);
    try {
      const result = await authClient.forgetPassword({
        email: data.email,
        redirectTo: "/auth/reset-password",
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to send reset email");
      } else {
        setEmailSent(true);
        toast.success("Password reset email sent! Check your inbox.");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordSchema) => {
    if (!search.token) {
      toast.error("Invalid reset token");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token: search.token,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to reset password");
      } else {
        toast.success("Password reset successfully! Please sign in.");
        router.navigate({ to: "/auth/signin" });
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent && !hasToken) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a password reset link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button variant="outline" onClick={() => setEmailSent(false)} className="w-full">
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{hasToken ? "Reset your password" : "Forgot your password?"}</CardTitle>
          <CardDescription>
            {hasToken
              ? "Enter your new password below"
              : "Enter your email address and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasToken ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                resetForm.handleSubmit();
              }}
            >
              <div className="flex flex-col gap-6">
                <resetForm.Field name="password">
                  {(field) => (
                    <div className="grid gap-3">
                      <Label htmlFor="password">New Password</Label>
                      <PasswordInput
                        id="password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={isLoading}
                      />
                      {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-600">
                          {field.state.meta.errors
                            .map((error: string | { message?: string }) =>
                              typeof error === "string" ? error : error.message || String(error)
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </resetForm.Field>
                <resetForm.Field name="confirmPassword">
                  {(field) => (
                    <div className="grid gap-3">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <PasswordInput
                        id="confirmPassword"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={isLoading}
                      />
                      {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-600">
                          {field.state.meta.errors
                            .map((error: string | { message?: string }) =>
                              typeof error === "string" ? error : error.message || String(error)
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </resetForm.Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting password..." : "Reset password"}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requestForm.handleSubmit();
              }}
            >
              <div className="flex flex-col gap-6">
                <requestForm.Field name="email">
                  {(field) => (
                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={isLoading}
                      />
                      {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-600">
                          {field.state.meta.errors
                            .map((error: string | { message?: string }) =>
                              typeof error === "string" ? error : error.message || String(error)
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </requestForm.Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending reset email..." : "Send reset email"}
                </Button>
              </div>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            Remember your password?{" "}
            <a href="/auth/signin" className="underline underline-offset-4">
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
