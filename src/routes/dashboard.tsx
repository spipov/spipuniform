import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '../components/dashboard/dashboard';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <Dashboard />
      </div>
    </div>
  );
}