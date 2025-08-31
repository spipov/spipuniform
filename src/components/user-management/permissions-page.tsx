import * as React from "react";
import { useState, useEffect } from "react";
import { Search, Shield, Users, Eye, Edit } from "lucide-react";
import { RoleService, type Role } from "@/lib/services/role-service";
import { UserService, type User } from "@/lib/services/user-service";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface PermissionsPageState {
  users: User[];
  roles: Role[];
  loading: boolean;
  searchTerm: string;
  selectedRole: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface PermissionMatrix {
  [userId: string]: {
    user: User;
    role: Role | null;
    permissions: Record<string, boolean>;
  };
}

export function PermissionsPage() {
  const [state, setState] = useState<PermissionsPageState>({
    users: [],
    roles: [],
    loading: true,
    searchTerm: "",
    selectedRole: "all",
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({});
  const [allPermissions, setAllPermissions] = useState<Array<{ key: string; label: string }>>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const fetchData = async (page = 1, search = "", roleFilter = "all") => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Fetch users and roles in parallel
      const [usersResponse, rolesResponse, permissions] = await Promise.all([
        UserService.getUsers({
          page,
          limit: 10,
          search: search || undefined,
          roleId: roleFilter !== "all" ? roleFilter : undefined,
          sortBy: "name",
          sortOrder: "asc",
        }),
        RoleService.getAllRoles(),
        RoleService.getAllPermissions(),
      ]);

      setState((prev) => ({
        ...prev,
        users: usersResponse.users,
        roles: rolesResponse,
        currentPage: usersResponse.pagination.page,
        totalPages: usersResponse.pagination.totalPages,
        totalCount: usersResponse.pagination.total,
        loading: false,
      }));

      setAllPermissions(permissions);

      // Build permission matrix
      const matrix: PermissionMatrix = {};
      usersResponse.users.forEach((user) => {
        const userRole = rolesResponse.find((role) => role.id === user.roleId);
        matrix[user.id] = {
          user,
          role: userRole || null,
          permissions: userRole?.permissions || {},
        };
      });
      setPermissionMatrix(matrix);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData(1, state.searchTerm, state.selectedRole);
  }, []);

  const handleSearch = (value: string) => {
    setState((prev) => ({ ...prev, searchTerm: value }));
    fetchData(1, value, state.selectedRole);
  };

  const handleRoleFilter = (value: string) => {
    setState((prev) => ({ ...prev, selectedRole: value }));
    fetchData(1, state.searchTerm, value);
  };

  const handlePageChange = (page: number) => {
    fetchData(page, state.searchTerm, state.selectedRole);
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
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

  const renderRoleColor = (color: string) => (
    <div
      className="w-3 h-3 rounded-full border border-gray-300"
      style={{ backgroundColor: color }}
      title={`Role color: ${color}`}
    />
  );

  const getPermissionCount = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
          <p className="text-muted-foreground">
            View and manage user permissions through role assignments
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Overview of user permissions based on their assigned roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={state.selectedRole} onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {state.roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      {renderRoleColor(role.color)}
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-[100px]" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.users.map((user) => {
                    const userMatrix = permissionMatrix[user.id];
                    const isExpanded = expandedUsers.has(user.id);

                    return (
                      <React.Fragment key={user.id}>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {userMatrix?.role ? (
                              <div className="flex items-center gap-2">
                                {renderRoleColor(userMatrix.role.color)}
                                <span className="font-medium">{userMatrix.role.name}</span>
                              </div>
                            ) : (
                              <Badge variant="outline">No Role</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {userMatrix?.role ? (
                              <Badge variant="secondary">
                                <Shield className="mr-1 h-3 w-3" />
                                {getPermissionCount(userMatrix.permissions)} permissions
                              </Badge>
                            ) : (
                              <Badge variant="outline">No Permissions</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.banned ? (
                              <Badge variant="destructive">Banned</Badge>
                            ) : (
                              <Badge variant="success">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserExpansion(user.id)}
                            >
                              {isExpanded ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <Edit className="h-4 w-4" />
                              )}
                              {isExpanded ? "Hide" : "View"} Permissions
                            </Button>
                          </TableCell>
                        </TableRow>

                        {isExpanded && userMatrix?.role && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/30">
                              <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">
                                    Detailed Permissions for {user.name}
                                  </h4>
                                  <Badge variant="outline">Role: {userMatrix.role.name}</Badge>
                                </div>

                                <div className="grid gap-4">
                                  {Object.entries(permissionGroups).map(([category, perms]) => (
                                    <div key={category} className="space-y-2">
                                      <h5 className="text-sm font-medium capitalize text-muted-foreground">
                                        {category}
                                      </h5>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {perms.map((permission) => (
                                          <div
                                            key={permission.key}
                                            className="flex items-center space-x-2"
                                          >
                                            <Checkbox
                                              checked={userMatrix.permissions[permission.key] || false}
                                              disabled
                                            />
                                            <span className="text-sm">
                                              {getPermissionDisplayName(permission.key)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>

              {state.users.length === 0 && (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No users found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {state.searchTerm || state.selectedRole !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "No users have been created yet"}
                  </p>
                </div>
              )}

              {state.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(state.currentPage - 1) * 10 + 1} to{" "}
                    {Math.min(state.currentPage * 10, state.totalCount)} of {state.totalCount} users
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
    </div>
  );
}
