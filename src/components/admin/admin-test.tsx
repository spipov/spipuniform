import { useSession } from "@/lib/auth-client";
import { admin } from "@/lib/auth-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminTest() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<Array<{id: string; email: string; name?: string; role?: string}>>([]);
  const [loading, setLoading] = useState(false);

  const listUsers = async () => {
    setLoading(true);
    try {
      const result = await admin.listUsers({
        query: {
          limit: 10,
        },
      });

      if (result.data) {
        setUsers(result.data.users);
        toast.success(`Found ${result.data.users.length} users`);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error listing users:", error);
      toast.error("Error listing users");
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    try {
      const result = await admin.createUser({
        email: `test${Date.now()}@example.com`,
        name: "Test User",
        password: "TestPass123!",
        role: "user",
      });

      if (result.data) {
        toast.success("Test user created successfully");
        listUsers(); // Refresh the list
      } else {
        toast.error("Failed to create test user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Error creating test user");
    }
  };

  if (!session) {
    return (
      <div className="p-6">
        <p>Please sign in to test admin functionality.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Admin Plugin Test</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current Session:</h3>
          <p>
            <strong>Email:</strong> {session.user?.email}
          </p>
          <p>
            <strong>Name:</strong> {session.user?.name}
          </p>
          <p>
            <strong>Role:</strong> {(session.user as {role?: string})?.role || "Not set"}
          </p>
          <p>
            <strong>User ID:</strong> {session.user?.id}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <Button onClick={listUsers} disabled={loading}>
            {loading ? "Loading..." : "List Users"}
          </Button>
          <Button onClick={createTestUser} variant="outline">
            Create Test User
          </Button>
        </div>

        {users.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Users ({users.length}):</h3>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="bg-white p-3 rounded border">
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Name:</strong> {user.name}
                  </p>
                  <p>
                    <strong>Role:</strong> {user.role || "user"}
                  </p>
                  <p>
                    <strong>Banned:</strong> {user.banned ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
