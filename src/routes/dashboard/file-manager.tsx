import { createFileRoute } from "@tanstack/react-router";
import { FileManager } from "@/components/file-system";

export const Route = createFileRoute("/dashboard/file-manager")({  
  component: FileManagerPage,
});

function FileManagerPage() {
  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
          <p className="text-gray-600 mt-2">Manage your files and folders across multiple storage providers</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <FileManager />
      </div>
    </div>
  );
}