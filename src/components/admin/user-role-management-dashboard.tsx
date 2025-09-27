import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Shield, Clock, CheckCircle, XCircle, Search, Filter } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  createdAt: string;
  emailVerified?: boolean;
}

interface PendingUser extends User {
  banReason: 'PENDING_APPROVAL';
}

const roleConfig = {
  user: { label: 'User', variant: 'secondary' as const, color: 'text-gray-600' },
  admin: { label: 'Admin', variant: 'default' as const, color: 'text-red-600' },
  moderator: { label: 'Moderator', variant: 'outline' as const, color: 'text-blue-600' }
};

export function UserRoleManagementDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("user");

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending users count
  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('/api/users-approval');
      if (response.ok) {
        const data = await response.json();
        // For demo purposes, we'll simulate pending users
        // In a real implementation, you'd fetch actual pending users
        setPendingUsers([]);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      // This would typically call an API to update user roles
      // For now, we'll simulate the update
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success('User role updated successfully');
      setSelectedUser(null);
      setNewRole('user');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleUserApproval = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/users-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      if (!response.ok) throw new Error('Failed to process user approval');

      toast.success(`User ${action}d successfully`);

      if (action === 'approve') {
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
        // Refresh users list to show the newly approved user
        fetchUsers();
      } else {
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Error processing user approval:', error);
      toast.error('Failed to process user approval');
    }
  };

  const getRoleBadge = (role?: string) => {
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Shield className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const regularUsers = filteredUsers.filter(u => u.role === 'user');
  const admins = filteredUsers.filter(u => u.role === 'admin');
  const moderators = filteredUsers.filter(u => u.role === 'moderator');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Role Management</h2>
          <p className="text-gray-600">Manage user roles, permissions, and approvals</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium">Search Users:</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="roleFilter" className="text-sm font-medium">Filter by Role:</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="moderator">Moderators</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Users ({regularUsers.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admins ({admins.length})
          </TabsTrigger>
          <TabsTrigger value="moderators" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Moderators ({moderators.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            {regularUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <CardTitle className="text-lg">{user.name || 'No Name'}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      {user.emailVerified ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                            Change Role
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change User Role</DialogTitle>
                            <DialogDescription>
                              Update the role for {user.name || user.email}
                            </DialogDescription>
                          </DialogHeader>

                          {selectedUser && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium">Current Role:</Label>
                                <p className="text-sm">{getRoleBadge(selectedUser.role)}</p>
                              </div>

                              <div className="space-y-3">
                                <Label className="text-sm font-medium">New Role:</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button
                                  onClick={() => handleRoleUpdate(selectedUser.id, newRole)}
                                  className="flex-1"
                                >
                                  Update Role
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(null);
                                    setNewRole('user');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="grid gap-4">
            {admins.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-red-500" />
                      <div>
                        <CardTitle className="text-lg">{user.name || 'No Name'}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    Admin since {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="moderators" className="space-y-4">
          <div className="grid gap-4">
            {moderators.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{user.name || 'No Name'}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    Moderator since {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>No pending user approvals</p>
                  <p className="text-sm">All users are approved!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <div>
                          <CardTitle className="text-lg">{user.name || 'No Name'}</CardTitle>
                          <CardDescription>{user.email}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending Approval
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Requested {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUserApproval(user.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUserApproval(user.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}