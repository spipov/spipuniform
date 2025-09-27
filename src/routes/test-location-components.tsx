import { createFileRoute } from '@tanstack/react-router';
import { LocationComponentsTest } from '@/components/ui/location-components-test';

export const Route = createFileRoute('/test-location-components')({
  component: () => <LocationComponentsTest />,
});