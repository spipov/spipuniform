import { createFileRoute } from "@tanstack/react-router";
import { StorageSettingsManagement } from "@/components/file-system/storage-settings-management";

export const Route = createFileRoute("/dashboard/storage-settings")({  
  component: StorageSettingsPage,
});

function StorageSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Settings</h1>
          <p className="text-gray-600 mt-2">Configure your storage providers (Local, S3, pCloud)</p>
        </div>
      </div>
      <StorageSettingsManagement />
    </div>
  );
}