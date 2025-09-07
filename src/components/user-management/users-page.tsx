import * as React from "react";
import { useState, useEffect } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Ban, UserCheck } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDialog } from "./user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { BanUserDialog } from "./ban-user-dialog";

interface UsersPageProps {
  className?: string;
}

export function UsersPage({ className }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogType, setDialogType] = useState<"create" | "edit" | "delete" | "ban" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const limit = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await UserService.getUsers({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setUsers(response.users);
      setTotalPages(response.pagination.pages);
      setTotalUsers(response.pagination.total);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Roles are now simple and don't need to be fetched

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    // fetchRoles(); // No longer needed with simplified roles
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setDialogType("create");
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setDialogType("edit");
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDialogType("delete");
    setIsDialogOpen(true);
  };

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setDialogType("ban");
    setIsDialogOpen(true);
  };

  const handleUnbanUser = async (user: User) => {
    try {
      await UserService.unbanUser(user.id);
      fetchUsers();
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  const handleDialogSuccess = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setDialogType(null);
    fetchUsers();
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setDialogType(null);
  };

  const getRoleName = (role: string) => {
    return role || "user";
  };

  const getRoleColor = (role: string) => {
    // Simple color mapping for Better Auth roles
    switch (role) {
      case "admin":
        return "#ef4444"; // Red for admin
      case "user":
      default:
        return "#3b82f6"; // Blue for user
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions ({totalUsers} total)
              </CardDescription>
            </div>
            <Button onClick={handleCreateUser}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <select className="border rounded px-2 py-1 text-sm" onChange={(e) => {
                const v = e.target.value;
                const url = new URL(window.location.href);
                if (v) url.searchParams.set('emailVerified', v === 'verified' ? 'true' : 'false'); else url.searchParams.delete('emailVerified');
                window.history.replaceState({}, '', url.toString());
                fetchUsers();
              }} defaultValue="">
                <option value="">Verification: All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
              <select className="border rounded px-2 py-1 text-sm" onChange={(e) => {
                const v = e.target.value;
                const url = new URL(window.location.href);
                if (v) url.searchParams.set('moderation', v); else url.searchParams.delete('moderation');
                window.history.replaceState({}, '', url.toString());
                fetchUsers();
              }} defaultValue="">
                <option value="">Moderation: All</option>
                <option value="pending">Pending Approval</option>
                <option value="banned">Banned</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Moderation</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getRoleColor(user.role || "user"),
                            color: getRoleColor(user.role || "user"),
                          }}
                        >
                          {getRoleName(user.role || "user")}
                        </Badge>
                      </TableCell>
                      {/* Verification column */}
                      <TableCell>
                        {user.emailVerified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Unverified</Badge>
                        )}
                      </TableCell>

                      {/* Moderation column */}
                      <TableCell>
                        {user.banned ? (
                          user.banReason === 'PENDING_APPROVAL' ? (
                            <Badge variant="outline">Pending Approval</Badge>
                          ) : (
                            <Badge variant="destructive">Banned</Badge>
                          )
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Resend verification (visible if not verified) */}
                            {!user.emailVerified && (
                              <DropdownMenuItem onClick={async () => {
                                try {
                                  await fetch('/api/users/actions', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'resend-verification', userId: selectedUserId }),
                                  });
                                } catch (e) { console.error(e); }
                              }}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Resend Verification
                              </DropdownMenuItem>
                            )}

                            {user.banned && user.banReason === 'PENDING_APPROVAL' ? (
                              <>
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    await fetch('/api/users-approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, action: 'approve' }) });
                                    fetchUsers();
                                  } catch (e) { console.error(e); }
                                }}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    await fetch('/api/users-approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, action: 'reject' }) });
                                    fetchUsers();
                                  } catch (e) { console.error(e); }
                                }}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {user.banned ? (
                                  <DropdownMenuItem onClick={() => handleUnbanUser(user)}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Unban
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleBanUser(user)}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Ban
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * limit + 1} to{" "}
                    {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
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

      {/* Dialogs */}
      {(dialogType === "create" || dialogType === "edit") && (
        <UserDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          user={selectedUser}
          onSuccess={handleDialogSuccess}
          onCancel={handleDialogClose}
        />
      )}

      {dialogType === "delete" && selectedUser && (
        <DeleteUserDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          user={selectedUser}
          onSuccess={handleDialogSuccess}
          onCancel={handleDialogClose}
        />
      )}

      {dialogType === "ban" && selectedUser && (
        <BanUserDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          user={selectedUser}
          onSuccess={handleDialogSuccess}
          onCancel={handleDialogClose}
        />
      )}
    </div>
  );
}
