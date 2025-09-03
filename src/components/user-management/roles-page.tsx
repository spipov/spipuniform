import * as React from "react";
import { useState, useEffect } from "react";
import { Shield, Users, Info, Plus, Edit, Trash2 } from "lucide-react";
import { RoleService, type Role } from "@/lib/services/role-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RoleDialog } from "./role-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function RolesPage() {
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await RoleService.getRoles({ limit: 100 });
      setRoles(response.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateRole = () => {
    setEditingRole(undefined);
    setShowRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowRoleDialog(true);
  };

  const handleDeleteRole = async () => {
    if (!deleteRole) return;
    
    try {
      setDeleting(true);
      await RoleService.deleteRole(deleteRole.id);
      await loadRoles();
      setDeleteRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleSuccess = () => {
    setShowRoleDialog(false);
    setEditingRole(undefined);
    loadRoles();
  };

  const getPermissionCount = (permissions: any) => {
    if (!permissions) return 0;
    if (typeof permissions === 'object') {
      return Object.values(permissions).filter(Boolean).length;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions in your Better Auth system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreateRole}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
          <Button 
            onClick={() => setShowRoleInfo(true)}
            variant="outline"
          >
            <Info className="mr-2 h-4 w-4" />
            Role Information
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Management
          </CardTitle>
          <CardDescription>
            Create and manage custom roles with permissions. Roles sync with Better Auth automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading roles...</div>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No roles found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first role with custom permissions.
              </p>
              <Button onClick={handleCreateRole}>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: role.color }}
                        />
                        <div>
                          <div className="font-semibold">{role.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {role.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{role.userCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Shield className="mr-1 h-3 w-3" />
                        {getPermissionCount(role.permissions)} permissions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteRole(role)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && roles.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Role Management System</h4>
              <p className="text-sm text-muted-foreground mb-3">
                This hybrid system combines Better Auth's simple role approach with advanced role management capabilities.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create custom roles with specific permissions and colors</li>
                <li>• Role names automatically sync with Better Auth's user.role field</li>
                <li>• Users are assigned roles through the user management interface</li>
                <li>• Permission changes take effect immediately across the system</li>
                <li>• Roles cannot be deleted if they are assigned to users</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <RoleDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        mode={editingRole ? "edit" : "create"}
        role={editingRole}
        onSuccess={handleRoleSuccess}
        onCancel={() => {
          setShowRoleDialog(false);
          setEditingRole(undefined);
        }}
      />

      {/* Info Dialog - placeholder for now */}
      <RoleDialog
        open={showRoleInfo}
        onOpenChange={setShowRoleInfo}
        mode="create"
        onSuccess={() => {}}
        onCancel={() => setShowRoleInfo(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deleteRole?.name}"? 
              {deleteRole?.userCount && deleteRole.userCount > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  This role is currently assigned to {deleteRole.userCount} user(s) and cannot be deleted.
                </span>
              )}
              {(!deleteRole?.userCount || deleteRole.userCount === 0) && (
                <span className="block mt-2">
                  This action cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {(!deleteRole?.userCount || deleteRole.userCount === 0) && (
              <AlertDialogAction
                onClick={handleDeleteRole}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete Role"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}