"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import { useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { signIn, getSession } from "@/lib/auth-client";
import { loginSchema, type LoginSchema } from "@/schemas/auth";
import { toast } from "sonner";

export function SigninForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to sign in");
      } else {
        toast.success("Successfully signed in!");
        // Wait until session cookie is established to avoid redirect race on /dashboard
        let tries = 0;
        let sess = await getSession();
        while (!sess && tries < 20) { // up to ~2s
          await new Promise((r) => setTimeout(r, 100));
          tries += 1;
          sess = await getSession();
        }
        // console.log("[SigninForm] post-signin session present=", Boolean(sess), "tries=", tries);
        if (!sess) {
          // If still no session, stay on page and inform user
          toast.error("We couldn't establish your session. Please try again.");
          return;
        }
        router.navigate({ to: "/dashboard" });
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validatorAdapter: valibotValidator(),
    validators: {
      onChange: loginSchema,
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>Enter your email and password to sign in</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-6">
              <form.Field name="email">
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
              </form.Field>
              <form.Field name="password">
                {(field) => (
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="/auth/reset-password"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
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
              </form.Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/auth/signup" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
