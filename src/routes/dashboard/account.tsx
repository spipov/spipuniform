import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileChooser } from "@/components/file-system/file-chooser";
import type { FileItem } from "@/db/schema";

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
  const [showFileChooser, setShowFileChooser] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }
    setChangingPassword(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChangingPassword(false);
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
              {showFileChooser ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Choose Avatar Image</h3>
                    <button
                      type="button"
                      onClick={() => setShowFileChooser(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <FileChooser
                    type="image"
                    onFileSelect={async (file: FileItem) => {
                      if (!file.url) {
                        setError("Selected file has no URL");
                        return;
                      }
                      setUploadingAvatar(true);
                      setMessage(null);
                      setError(null);
                      try {
                        // Use the existing file from storage by copying it to avatar
                        const fd = new FormData();
                        // Fetch the file content and create a new File object
                        const response = await fetch(file.url);
                        const blob = await response.blob();
                        const avatarFile = new File([blob], file.name, { type: blob.type });
                        fd.set("file", avatarFile);
                        
                        const res = await fetch("/api/avatar", {
                          method: "POST",
                          credentials: "include",
                          body: fd,
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Avatar upload failed");
                        setProfile((p) => (p ? { ...p, image: data.url } : p));
                        setShowFileChooser(false);
                        setMessage("Avatar updated successfully");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setUploadingAvatar(false);
                      }
                    }}
                    onCancel={() => setShowFileChooser(false)}
                    title="Select Avatar Image"
                    description="Choose an image from your files or upload a new one"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.currentTarget.files?.[0] || null)}
                      className="block text-sm"
                    />
                    <button
                      type="button"
                      disabled={!avatarFile || uploadingAvatar}
                      onClick={async () => {
                        if (!avatarFile) {
                          setError("Please select a file to upload");
                          return;
                        }
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
                          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                          setMessage("Avatar updated successfully");
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setUploadingAvatar(false);
                        }
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 disabled:opacity-50"
                    >
                      {uploadingAvatar ? "Uploading..." : "Upload New"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFileChooser(true)}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      📁 Browse Files
                    </button>
                    {profile?.image && (
                      <button
                        type="button"
                        onClick={onRemoveAvatar}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={onSave} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  id="name"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={profile?.email || ""}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
              {message && (
                <div className="fixed top-4 right-4 z-50 rounded-lg bg-green-50 border border-green-200 p-4 shadow-lg">
                  <div className="text-sm font-medium text-green-800">{message}</div>
                </div>
              )}
              {error && (
                <div className="fixed top-4 right-4 z-50 rounded-lg bg-red-50 border border-red-200 p-4 shadow-lg">
                  <div className="text-sm font-medium text-red-800">{error}</div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Security Settings</h2>
            <form onSubmit={onChangePassword} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  disabled={changingPassword}
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  disabled={changingPassword}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 transition-all duration-200 text-gray-900 placeholder-gray-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  disabled={changingPassword}
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {changingPassword ? "Changing Password..." : "Change Password"}
              </button>
            </form>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Forgot your password?</p>
              <a
                href="/auth/reset-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Reset Password via Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}