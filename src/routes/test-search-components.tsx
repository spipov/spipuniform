import { createFileRoute } from '@tanstack/react-router';
import { SearchComponentsTest } from '@/components/ui/search-components-test';

export const Route = createFileRoute('/test-search-components')({
  component: () => <SearchComponentsTest />,
});