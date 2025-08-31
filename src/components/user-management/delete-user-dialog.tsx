import * as React from "react";
import { useState } from "react";
import { UserService, type User } from "@/lib/services/user-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  onCancel,
}: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await UserService.deleteUser(user.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account and remove
            all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
          <Avatar className="h-12 w-12">
            <div className="flex h-full w-full items-center justify-center bg-muted text-lg font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{user.name}</strong>? This will:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Permanently remove the user account</li>
            <li>Delete all user sessions</li>
            <li>Remove user from all associated records</li>
          </ul>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
