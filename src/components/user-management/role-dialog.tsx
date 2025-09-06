import * as React from "react";
import { useState, useEffect, useId } from "react";
import { useForm } from "@tanstack/react-form";
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
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type CreateRoleInput = v.InferInput<typeof createRoleSchema>;
type UpdateRoleInput = v.InferInput<typeof updateRoleSchema>;

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  role?: Role;
  onSuccess: () => void;
  onCancel: () => void;
  onClose?: () => void;
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
  mode = "create",
  role,
  onSuccess,
  onCancel,
  onClose,
}: RoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(role?.color || defaultColors[0]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [allPermissions, setAllPermissions] = useState<Array<{ key: string; label: string }>>([]);
  const formUid = useId();

  const form = useForm({
    defaultValues: {
      name: role?.name || "",
      color: role?.color || selectedColor,
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

  const isEdit = mode === "edit";

  const handleCancel = () => {
    onCancel();
    onClose?.();
  };

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const allPerms = await RoleService.getAllPermissions();
        setAllPermissions(allPerms);
  
        if (role) {
          // Merge role permissions with defaults (default false, except viewDashboard true)
          const defaults: Record<string, boolean> = {};
          allPerms.forEach((perm) => {
            defaults[perm.key] = perm.key === 'viewDashboard';
          });
          const merged: Record<string, boolean> = { ...defaults, ...(role.permissions || {}) } as any;
          setPermissions(merged);
        } else {
          // Initialize with defaults for create mode
          const defaults: Record<string, boolean> = {};
          allPerms.forEach((perm) => {
            defaults[perm.key] = perm.key === 'viewDashboard';
          });
          setPermissions(defaults);
        }
      } catch (err) {
        console.error("Failed to load permissions:", err);
      }
    };
  
    loadPermissions();
    // depend on role to capture permission changes correctly
  }, [role]);

  const handleSelectAllPermissions = (checked: boolean) => {
    const updatedPermissions: Record<string, boolean> = {};
    allPermissions.forEach((perm) => {
      updatedPermissions[perm.key] = checked;
    });
    setPermissions(updatedPermissions);
  };

  const getPermissionDisplayName = (permission: string) => {
    return RoleService.getPermissionDisplayName(permission as any);
  };

  const groupPermissions = (permissions: Array<{ key: string; label: string }>) => {
    const groups: Record<string, Array<{ key: string; label: string }>> = {};
    permissions.forEach((perm) => {
      const category =
        perm.key
          ?.split(/(?=[A-Z])/)
          ?.slice(0, -1)
          ?.join(" ")
          ?.toLowerCase() || "general";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto w-[95vw] sm:w-auto">
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
                  <Label htmlFor={`name-${formUid}`}>Role Name</Label>
                  <Input
                    id={`name-${formUid}`}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Enter role name"
                  />
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
                <Label htmlFor={`description-${formUid}`}>Description</Label>
                <Input
                  id={`description-${formUid}`}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter role description (optional)"
                />
              </div>
            )}
          </form.Field>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Permissions</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`select-all-${formUid}`}
                  checked={allSelected}
                  onCheckedChange={handleSelectAllPermissions}
                />
                <Label htmlFor={`select-all-${formUid}`} className="text-sm">
                  Select All ({selectedCount}/{allPermissions.length})
                </Label>
              </div>
            </div>

            {/* permissions table remains, only ids updated */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[30%]">Category</TableHead>
                        <TableHead>Permission</TableHead>
                        <TableHead className="w-[120px]">Enabled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(permissionGroups).map(([category, perms]) => (
                        <React.Fragment key={category}>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={3} className="font-medium capitalize">
                              {category}
                            </TableCell>
                          </TableRow>
                          {perms.map((permission) => (
                            <TableRow key={permission.key}>
                              <TableCell className="capitalize">{category}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{permission.label}</span>
                                  <span className="text-xs text-muted-foreground">({permission.key})</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Checkbox
                                  id={`${permission.key}-${formUid}`}
                                  checked={permissions[permission.key] || false}
                                  onCheckedChange={(checked) => {
                                    setPermissions((prev) => ({
                                      ...prev,
                                      [permission.key]: Boolean(checked),
                                    }));
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
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