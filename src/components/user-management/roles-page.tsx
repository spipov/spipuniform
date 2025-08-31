import * as React from "react";
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Users, Shield } from "lucide-react";
import { RoleService, type Role } from "@/lib/services/role-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleDialog } from "./role-dialog";
import { DeleteRoleDialog } from "./delete-role-dialog";

interface RolesPageState {
  roles: Role[];
  loading: boolean;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface DialogState {
  roleDialog: {
    open: boolean;
    mode: "create" | "edit";
    role?: Role;
  };
  deleteDialog: {
    open: boolean;
    role?: Role;
  };
}

export function RolesPage() {
  const [state, setState] = useState<RolesPageState>({
    roles: [],
    loading: true,
    searchTerm: "",
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const [dialogs, setDialogs] = useState<DialogState>({
    roleDialog: { open: false, mode: "create" },
    deleteDialog: { open: false },
  });

  const fetchRoles = async (page = 1, search = "") => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await RoleService.getRoles({
        page,
        limit: 10,
        search: search || undefined,
        sortBy: "name",
        sortOrder: "asc",
      });
      setState((prev) => ({
        ...prev,
        roles: response.roles,
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        totalCount: response.pagination.total,
        loading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchRoles(1, state.searchTerm);
  }, []);

  const handleSearch = (value: string) => {
    setState((prev) => ({ ...prev, searchTerm: value }));
    fetchRoles(1, value);
  };

  const handlePageChange = (page: number) => {
    fetchRoles(page, state.searchTerm);
  };

  const openCreateDialog = () => {
    setDialogs((prev) => ({
      ...prev,
      roleDialog: { open: true, mode: "create" },
    }));
  };

  const openEditDialog = (role: Role) => {
    setDialogs((prev) => ({
      ...prev,
      roleDialog: { open: true, mode: "edit", role },
    }));
  };

  const openDeleteDialog = (role: Role) => {
    setDialogs((prev) => ({
      ...prev,
      deleteDialog: { open: true, role },
    }));
  };

  const closeRoleDialog = () => {
    setDialogs((prev) => ({
      ...prev,
      roleDialog: { open: false, mode: "create" },
    }));
  };

  const closeDeleteDialog = () => {
    setDialogs((prev) => ({
      ...prev,
      deleteDialog: { open: false },
    }));
  };

  const handleRoleSuccess = () => {
    closeRoleDialog();
    fetchRoles(state.currentPage, state.searchTerm);
  };

  const handleDeleteSuccess = () => {
    closeDeleteDialog();
    fetchRoles(state.currentPage, state.searchTerm);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>Configure roles and their associated permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {state.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-8 w-[100px]" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>{renderRoleColor(role.color)}</TableCell>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Shield className="mr-1 h-3 w-3" />
                          {getPermissionCount(role.permissions)} permissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Users className="mr-1 h-3 w-3" />
                          {role.userCount || 0} users
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {role.isSystem && <Badge variant="secondary">System</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(role)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Role
                            </DropdownMenuItem>
                            {!role.isSystem && (
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(role)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Role
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {state.roles.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No roles found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {state.searchTerm
                      ? "Try adjusting your search terms"
                      : "Get started by creating a new role"}
                  </p>
                  {!state.searchTerm && (
                    <div className="mt-6">
                      <Button onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Role
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {state.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(state.currentPage - 1) * 10 + 1} to{" "}
                    {Math.min(state.currentPage * 10, state.totalCount)} of {state.totalCount} roles
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(state.currentPage - 1)}
                      disabled={state.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {state.currentPage} of {state.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(state.currentPage + 1)}
                      disabled={state.currentPage >= state.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {dialogs.roleDialog.open && (
        <RoleDialog
          open={dialogs.roleDialog.open}
          onOpenChange={closeRoleDialog}
          mode={dialogs.roleDialog.mode}
          role={dialogs.roleDialog.role}
          onSuccess={handleRoleSuccess}
          onCancel={closeRoleDialog}
        />
      )}

      {dialogs.deleteDialog.open && dialogs.deleteDialog.role && (
        <DeleteRoleDialog
          open={dialogs.deleteDialog.open}
          onOpenChange={closeDeleteDialog}
          role={dialogs.deleteDialog.role}
          onSuccess={handleDeleteSuccess}
          onCancel={closeDeleteDialog}
        />
      )}
    </div>
  );
}
