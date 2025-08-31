import * as React from "react";
import { useState } from "react";
import { RoleService, type Role } from "@/lib/services/role-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, AlertTriangle } from "lucide-react";

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
  onCancel,
}: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await RoleService.deleteRole(role.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onCancel();
  };

  const getPermissionCount = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  const renderRoleColor = (color: string) => (
    <div
      className="w-4 h-4 rounded-full border border-gray-300"
      style={{ backgroundColor: color }}
      title={`Role color: ${color}`}
    />
  );

  const hasUsers = (role.userCount || 0) > 0;
  const isSystemRole = role.isSystem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Role
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the role and remove it from
            all users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            {renderRoleColor(role.color)}
            <div className="flex-1">
              <div className="font-medium">{role.name}</div>
              <div className="text-sm text-muted-foreground">
                {role.description || "No description"}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Badge variant="secondary">
                <Shield className="mr-1 h-3 w-3" />
                {getPermissionCount(role.permissions)} permissions
              </Badge>
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" />
                {role.userCount || 0} users
              </Badge>
              {isSystemRole && <Badge variant="secondary">System</Badge>}
            </div>
          </div>

          {isSystemRole && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                System Role Protection
              </div>
              <p className="mt-1">
                This is a system role and cannot be deleted. System roles are essential for the
                application to function properly.
              </p>
            </div>
          )}

          {hasUsers && !isSystemRole && (
            <div className="p-3 text-sm text-yellow-800 bg-yellow-50 rounded-md border border-yellow-200">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Users Assigned
              </div>
              <p className="mt-1">
                This role is currently assigned to {role.userCount} user
                {role.userCount !== 1 ? "s" : ""}. Deleting this role will remove it from all
                assigned users.
              </p>
            </div>
          )}

          {!isSystemRole && (
            <div className="text-sm text-muted-foreground">
              Deleting <strong>{role.name}</strong> will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Permanently remove the role from the system</li>
                <li>Remove this role from all assigned users</li>
                <li>Users will lose all permissions associated with this role</li>
                {hasUsers && (
                  <li className="text-yellow-700">
                    Affect {role.userCount} user{role.userCount !== 1 ? "s" : ""} currently using
                    this role
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || isSystemRole}
          >
            {loading ? "Deleting..." : "Delete Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
