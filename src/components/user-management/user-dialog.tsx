import * as React from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import * as v from "valibot";
import { UserService, type User } from "@/lib/services/user-service";
// Simple schemas for Better Auth compatibility
const createUserSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  email: v.pipe(v.string(), v.email("Invalid email address")),
  password: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
  role: v.picklist(["user", "admin"]),
});

const updateUserSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(1, "Name is required"))),
  email: v.optional(v.pipe(v.string(), v.email("Invalid email address"))),
  role: v.optional(v.picklist(["user", "admin"])),
});

type CreateUserInput = v.InferInput<typeof createUserSchema>;
type UpdateUserInput = v.InferInput<typeof updateUserSchema>;
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  onCancel,
}: UserDialogProps) {
  // Simple roles for Better Auth
  const availableRoles = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
  ];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!user;

  const form = useForm({
    defaultValues: isEditing
      ? {
          name: user?.name || "",
          email: user?.email || "",
          role: user?.role || "user",
        }
      : {
          name: "",
          email: "",
          password: "",
          role: "user",
        },
    onSubmit: async ({ value }) => {
      try {
        setLoading(true);
        setError(null);

        const validatedData = value;

        if (isEditing && user) {
          await UserService.updateUser(user.id, validatedData as UpdateUserInput);
        } else {
          await UserService.createUser(validatedData as CreateUserInput);
        }

        onSuccess();
      } catch (err) {
        if (err instanceof v.ValiError) {
          setError("Please check your input and try again.");
        } else {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        setLoading(false);
      }
    },
    validatorAdapter: valibotValidator(),
  });

  React.useEffect(() => {
    if (open && isEditing && user) {
      form.setFieldValue("name", user.name);
      form.setFieldValue("email", user.email);
      form.setFieldValue("role", user.role || "user");
    } else if (open && !isEditing) {
      form.reset();
    }
  }, [open, isEditing, user, form]);

  const handleCancel = () => {
    form.reset();
    setError(null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[95vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the user information below."
              : "Fill in the details to create a new user account."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            validators={{
              onBlur: v.pipe(v.string(), v.minLength(1, "Name is required")),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter user's full name"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string' 
                      ? field.state.meta.errors[0] 
                      : field.state.meta.errors[0]?.message || 'Invalid input'
                    }
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onBlur: v.pipe(v.string(), v.email("Invalid email address")),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter user's email address"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string' 
                      ? field.state.meta.errors[0] 
                      : field.state.meta.errors[0]?.message || 'Invalid input'
                    }
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {!isEditing && (
            <form.Field
              name="password"
              validators={{
                onBlur: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter a secure password"
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string' 
                        ? field.state.meta.errors[0] 
                        : field.state.meta.errors[0]?.message || 'Invalid input'
                      }
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          )}

          <form.Field
            name="role"
            validators={{
              onBlur: v.picklist(["user", "admin"], "Please select a valid role"),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center space-x-2">
                          <span>{role.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {typeof field.state.meta.errors[0] === 'string' 
                      ? field.state.meta.errors[0] 
                      : field.state.meta.errors[0]?.message || 'Invalid input'
                    }
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
