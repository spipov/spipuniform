import * as React from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import * as v from "valibot";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const banUserSchema = v.object({
  reason: v.pipe(
    v.string(),
    v.minLength(1, "Ban reason is required"),
    v.maxLength(500, "Reason must be less than 500 characters")
  ),
  duration: v.picklist(["1h", "24h", "7d", "30d", "permanent"]),
});

type BanUserInput = v.InferInput<typeof banUserSchema>;

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const banDurations = [
  { value: "1h", label: "1 Hour" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "permanent", label: "Permanent" },
];

export function BanUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  onCancel,
}: BanUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      reason: "",
      duration: "24h" as const,
    },
    onSubmit: async ({ value }) => {
      try {
        setLoading(true);
        setError(null);

        // Validate the form data
        const validatedData = v.parse(banUserSchema, value);

        let banExpires: Date | null = null;
        if (validatedData.duration !== "permanent") {
          const now = new Date();
          switch (validatedData.duration) {
            case "1h":
              banExpires = new Date(now.getTime() + 60 * 60 * 1000);
              break;
            case "24h":
              banExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              break;
            case "7d":
              banExpires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            case "30d":
              banExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              break;
          }
        }

        await UserService.banUser(user.id, {
          reason: validatedData.reason,
          banExpires,
        });

        onSuccess();
      } catch (err) {
        if (err instanceof v.ValiError) {
          setError("Please check your input and try again.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to ban user");
        }
      } finally {
        setLoading(false);
      }
    },
    validatorAdapter: valibotValidator(),
  });

  React.useEffect(() => {
    if (open) {
      form.reset();
      setError(null);
    }
  }, [open, form]);

  const handleCancel = () => {
    form.reset();
    setError(null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            Temporarily or permanently restrict this user's access to the system.
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="reason"
            validators={{
              onChange: banUserSchema.entries.reason,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="reason">Ban Reason</Label>
                <Input
                  id="reason"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter the reason for banning this user"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="duration"
            validators={{
              onChange: banUserSchema.entries.duration,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="duration">Ban Duration</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as BanUserInput["duration"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ban duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {banDurations.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <strong>Warning:</strong> Banning this user will:
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Immediately revoke all active sessions</li>
              <li>Prevent login until the ban expires</li>
              <li>Block access to all system features</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
