"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import { useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signUp } from "@/lib/auth-client";
import { registerSchema, type RegisterSchema } from "@/schemas/auth";
import { toast } from "sonner";
import { getBaseUrl } from "@/lib/utils/url";

export function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Array<{ name: string; label: string }>>([]);
  const [selectedRole, setSelectedRole] = useState<string>("family"); // default to Parent

  const router = useRouter();

  useEffect(() => {
    // Check if admin exists
    fetch(`${getBaseUrl()}/api/auth/admin-exists`)
      .then(res => res.json())
      .then(data => setIsFirstAdmin(!data.exists))
      .catch(() => setIsFirstAdmin(false));
  }, []);
  useEffect(() => {
    // Load roles allowed for signup
    const load = async () => {
      try {
        const res = await fetch('/api/auth/roles-public');
        if (res.ok) {
          const data = await res.json();
          const roles = (data?.roles || []) as Array<{ name: string; label: string }>;
          setAvailableRoles(roles);
          if (roles.length && !roles.find(r => r.name === selectedRole)) {
            setSelectedRole(roles[0].name);
          }
        } else {
          setAvailableRoles([
            { name: 'family', label: 'Parent' },
            { name: 'shop', label: 'Shop Owner' },
            { name: 'school_rep', label: 'School Rep' },
          ]);
        }
      } catch {
        setAvailableRoles([
          { name: 'family', label: 'Parent' },
          { name: 'shop', label: 'Shop Owner' },
          { name: 'school_rep', label: 'School Rep' },
        ]);
      }
    };
    load();
  }, []);


  const onSubmit = async (data: RegisterSchema) => {
    setIsLoading(true);
    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to create account");
      } else {
        // If first admin, promote immediately
        if (isFirstAdmin && result.data?.user?.id) {
          try {
            await fetch(`${getBaseUrl()}/api/auth/upgrade-first-admin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: result.data.user.id }),
            });
            toast.success('Welcome! You are the first admin.');
          } catch (error) {
            console.error('Failed to promote first admin:', error);
          }
        } else {
          toast.success("Account created! Check your email for verification.");
        }

        // Set the selected role on the new user and run any post-signup hooks
        const newUserId = result?.data?.user?.id;
        if (newUserId && !isFirstAdmin) {
          try {
            await fetch('/api/auth/signup-post-hook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: newUserId, role: selectedRole }),
            });
          } catch {}
        }

        // Check approval flag, then optionally call post-hook and choose redirect
        let requireApproval = false;
        try {
          const flagRes = await fetch('/api/auth-settings/flag');
          if (flagRes.ok) {
            const flag = await flagRes.json();
            requireApproval = Boolean(flag?.requireAdminApproval);
          }
        } catch {}

        if (requireApproval) {
          router.navigate({ to: "/auth/pending" });
        } else {
          router.navigate({ to: "/auth/signin" });
        }
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validatorAdapter: valibotValidator(),
    validators: {
      onChange: registerSchema,
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your information to create your account</CardDescription>
          {isFirstAdmin && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mt-4">
              <p className="text-green-800 text-sm">You'll be the first admin of this application.</p>
            </div>
          )}
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
              <form.Field name="name">
                {(field) => (
                  <div className="grid gap-3">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
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
              <div className="grid gap-3 auth__role-select">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <form.Field name="password">
                {(field) => (
                  <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
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
              <form.Field name="confirmPassword">
                {(field) => (
                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
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
              </form.Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <a href="/auth/signin" className="underline underline-offset-4">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
