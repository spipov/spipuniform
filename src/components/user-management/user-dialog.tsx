import * as React from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import * as v from "valibot";
import { UserService, type User } from "@/lib/services/user-service";
import type { Role } from "@/lib/services/role-service";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/schemas/user-management";
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
  roles: Role[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSuccess,
  onCancel,
}: UserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!user;

  const form = useForm({
    defaultValues: isEditing
      ? {
          name: user?.name || "",
          email: user?.email || "",
          roleId: user?.roleId || "",
          color: user?.color || "#6b7280",
        }
      : {
          name: "",
          email: "",
          password: "",
          roleId: "",
          color: "#6b7280",
        },
    onSubmit: async ({ value }) => {
      try {
        setLoading(true);
        setError(null);

        // Validate the form data
        const schema = isEditing ? updateUserSchema : createUserSchema;
        const validatedData = v.parse(schema, value);

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
      form.setFieldValue("roleId", user.roleId);
      form.setFieldValue("color", user.color);
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
      <DialogContent className="sm:max-w-[425px]">
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
              onChange: isEditing ? updateUserSchema.entries.name : createUserSchema.entries.name,
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
              onChange: isEditing ? updateUserSchema.entries.email : createUserSchema.entries.email,
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
                onChange: createUserSchema.entries.password,
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
            name="roleId"
            validators={{
              onChange: isEditing
                ? updateUserSchema.entries.roleId
                : createUserSchema.entries.roleId,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="roleId">Role</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <span>{role.name}</span>
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

          <form.Field
            name="color"
            validators={{
              onChange: isEditing ? updateUserSchema.entries.color : createUserSchema.entries.color,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="color">User Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="#6b7280"
                    className="flex-1"
                  />
                </div>
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
