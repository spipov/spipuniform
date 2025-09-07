import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string | null;
}

export const Route = createFileRoute("/dashboard/account")({
  beforeLoad: async () => {
    const isServer = typeof window === "undefined";
    if (isServer) return;
    const res = await fetch("/api/auth/permissions", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/" });
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewDashboard) throw redirect({ to: "/" });
  },
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfile(data.user);
        setName(data.user?.name || "");
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setProfile(data.user);
      setMessage("Profile updated");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onUploadAvatar(e: React.FormEvent) {
    e.preventDefault();
    if (!avatarFile) return;
    setUploadingAvatar(true);
    setMessage(null);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", avatarFile);
      const res = await fetch("/api/avatar", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Avatar upload failed");
      setProfile((p) => (p ? { ...p, image: data.url } : p));
      setAvatarFile(null);
      setMessage("Avatar updated");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onRemoveAvatar() {
    setUploadingAvatar(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/avatar", { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove avatar");
      setProfile((p) => (p ? { ...p, image: null } : p));
      setMessage("Avatar removed");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 border">
                {profile?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <form onSubmit={onUploadAvatar} className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.currentTarget.files?.[0] || null)}
                  className="block text-sm"
                />
                <button
                  type="submit"
                  disabled={!avatarFile || uploadingAvatar}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 disabled:opacity-50"
                >
                  {uploadingAvatar ? "Uploading..." : "Upload"}
                </button>
                {profile?.image && (
                  <button
                    type="button"
                    onClick={onRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Remove
                  </button>
                )}
              </form>
            </div>
            <form onSubmit={onSave} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  id="name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                {message && <span className="text-green-600 text-sm">{message}</span>}
                {error && <span className="text-red-600 text-sm">{error}</span>}
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6 space-y-3">
            <h2 className="text-xl font-semibold">Security</h2>
            <form
              action="/auth/reset-password"
              method="get"
              className="space-y-3"
            >
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}