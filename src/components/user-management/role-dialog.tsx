import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import { RoleService, type Role } from "@/lib/services/role-service";
import { createRoleSchema, updateRoleSchema } from "@/schemas/user-management";
import type * as v from "valibot";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type CreateRoleInput = v.InferInput<typeof createRoleSchema>;
type UpdateRoleInput = v.InferInput<typeof updateRoleSchema>;

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  role?: Role;
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export function RoleDialog({
  open,
  onOpenChange,
  mode,
  role,
  onSuccess,
  onCancel,
}: RoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [allPermissions, setAllPermissions] = useState<Array<{ key: string; label: string }>>([]);

  const isEdit = mode === "edit";
  const schema = isEdit ? updateRoleSchema : createRoleSchema;

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    } as CreateRoleInput | UpdateRoleInput,
    validatorAdapter: valibotValidator(),
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        setLoading(true);
        setError(null);

        const roleData = {
          ...value,
          color: selectedColor,
          permissions,
        };

        if (isEdit && role) {
          await RoleService.updateRole(role.id, roleData as UpdateRoleInput);
        } else {
          await RoleService.createRole(roleData as CreateRoleInput);
        }

        onSuccess();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} role`
        );
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const allPerms = await RoleService.getAllPermissions();
        setAllPermissions(allPerms);

        if (isEdit && role) {
          setSelectedColor(role.color);
          setPermissions(role.permissions);
          form.setFieldValue("name", role.name);
          form.setFieldValue("description", role.description || "");
        } else {
          // Initialize with empty permissions for create mode
          const emptyPermissions: Record<string, boolean> = {};
          allPerms.forEach((perm) => {
            emptyPermissions[perm.key] = false;
          });
          setPermissions(emptyPermissions);
          form.setFieldValue("name", "");
          form.setFieldValue("description", "");
        }
      } catch (err) {
        console.error("Failed to load permissions:", err);
      }
    };

    if (open) {
      loadPermissions();
      setError(null);
    }
  }, [open, isEdit, role, form]);

  const handleCancel = () => {
    form.reset();
    setError(null);
    setSelectedColor(defaultColors[0]);
    setPermissions({});
    onCancel();
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: checked,
    }));
  };

  const handleSelectAllPermissions = (checked: boolean) => {
    const updatedPermissions: Record<string, boolean> = {};
    allPermissions.forEach((perm) => {
      updatedPermissions[perm.key] = checked;
    });
    setPermissions(updatedPermissions);
  };

  const getPermissionDisplayName = (permission: string) => {
    return RoleService.getPermissionDisplayName(permission);
  };

  const groupPermissions = (permissions: Array<{ key: string; label: string }>) => {
    const groups: Record<string, Array<{ key: string; label: string }>> = {};
    permissions.forEach((perm) => {
      const category =
        perm.key
          .split(/(?=[A-Z])/)
          .slice(0, -1)
          .join(" ")
          .toLowerCase() || "general";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(perm);
    });
    return groups;
  };

  const permissionGroups = groupPermissions(allPermissions);
  const selectedCount = Object.values(permissions).filter(Boolean).length;
  const allSelected = selectedCount === allPermissions.length;
  const someSelected = selectedCount > 0 && selectedCount < allPermissions.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Role" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the role details and permissions"
              : "Create a new role with specific permissions and settings"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter role name"
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-red-600">
                      {typeof field.state.meta.errors[0] === 'string' 
                        ? field.state.meta.errors[0] 
                        : field.state.meta.errors[0]?.message || 'Invalid input'
                      }
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="space-y-2">
              <Label>Role Color</Label>
              <div className="space-y-3">
                {/* Color Picker Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    title="Choose custom color"
                  />
                  <span className="text-sm text-gray-600">Custom color: {selectedColor}</span>
                </div>
                
                {/* Predefined Colors */}
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">Quick colors:</Label>
                  <div className="flex flex-wrap gap-2">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          selectedColor === color ? "border-gray-900 ring-2 ring-gray-300" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        title={`Select ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter role description (optional)"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-red-600">
                    {typeof field.state.meta.errors[0] === 'string' 
                      ? field.state.meta.errors[0] 
                      : field.state.meta.errors[0]?.message || 'Invalid input'
                    }
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Permissions</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleSelectAllPermissions}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All ({selectedCount}/{allPermissions.length})
                </Label>
              </div>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto">
              {Object.entries(permissionGroups).map(([category, perms]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((permission) => (
                        <div key={permission.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.key}
                            checked={permissions[permission.key] || false}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(permission.key, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={permission.key}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
