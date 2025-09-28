import { createFileRoute } from '@tanstack/react-router';
import { SchoolManagementTable } from '@/components/school-management-table';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const Route = createFileRoute('/dashboard/spipuniform/schools')({
  component: () => (
    <ProtectedRoute>
      <SchoolsManagement />
    </ProtectedRoute>
  ),
});

function SchoolsManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schools Management</h1>
          <p className="text-muted-foreground">
            Manage activated schools in the system with enhanced table features - only shows schools created through proper channels
          </p>
        </div>
      </div>

      {/* Enhanced School Management Table */}
      <SchoolManagementTable />
    </div>
  );
}