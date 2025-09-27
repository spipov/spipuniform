import { createFileRoute } from '@tanstack/react-router';
import { DynamicFormComponentsTest } from '@/components/ui/dynamic-form-components-test';

export const Route = createFileRoute('/test-dynamic-form-components')({
  component: () => <DynamicFormComponentsTest />,
});