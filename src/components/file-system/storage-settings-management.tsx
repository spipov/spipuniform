import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import * as v from "valibot";

// Safe QueryClient hook that handles SSR
function useSafeQueryClient(): QueryClient | null {
  try {
    return useQueryClient();
  } catch (error) {
    console.warn("QueryClient not available:", error);
    return null;
  }
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  HardDrive, 
  Cloud, 
  CloudCog,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  TestTube
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StorageSettings, NewStorageSettings, StorageProvider } from "@/db/schema";

const storageSchema = v.object({
  provider: v.picklist(['local', 's3', 'pcloud'], 'Please select a storage provider'),
  name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
  description: v.optional(v.string()),
  config: v.object({
    basePath: v.optional(v.string()),
    maxFileSize: v.optional(v.number()),
    accessKeyId: v.optional(v.string()),
    secretAccessKey: v.optional(v.string()),
    region: v.optional(v.string()),
    bucket: v.optional(v.string()),
    endpoint: v.optional(v.string()),
    clientId: v.optional(v.string()),
    clientSecret: v.optional(v.string()),
  }),
  isActive: v.optional(v.boolean()),
});

interface StorageSettingsManagementProps {
  className?: string;
}

// Client-side only wrapper
function StorageSettingsManagementClient({ className }: StorageSettingsManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSettings, setEditingSettings] = useState<StorageSettings | null>(null);
  const [settingsToDelete, setSettingsToDelete] = useState<StorageSettings | null>(null);
  const [testingSettings, setTestingSettings] = useState<string | null>(null);
  
  const queryClient = useSafeQueryClient();

  // Fetch all storage settings
  const { data: allSettings, isLoading } = useQuery<StorageSettings[]>({
    queryKey: ['storage-settings'],
    queryFn: async () => {
      const response = await fetch('/api/storage-settings');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: NewStorageSettings & { id?: string }) => {
      const { id, ...payload } = data;
      const method = id ? 'PUT' : 'POST';
      const body = id ? { id, ...payload } : payload;
      
      const response = await fetch('/api/storage-settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-settings'] });
      setShowForm(false);
      setEditingSettings(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/storage-settings?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-settings'] });
      setSettingsToDelete(null);
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/storage-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', id }),
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-settings'] });
    },
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      setTestingSettings(id);
      const response = await fetch('/api/storage-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', id }),
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      console.log('Test result:', data);
    },
    onSettled: () => {
      setTestingSettings(null);
    },
  });

  // Form
  const form = useForm({
    defaultValues: {
      provider: 'local' as StorageProvider,
      name: '',
      description: '',
      config: {
        basePath: './uploads',
        maxFileSize: 10 * 1024 * 1024,
      },
      isActive: false,
    } as NewStorageSettings & { id?: string },
    validatorAdapter: valibotValidator(),
    validators: {
      onChange: storageSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  const handleEdit = (settings: StorageSettings) => {
    setEditingSettings(settings);
    form.reset();
    form.setFieldValue('provider', settings.provider);
    form.setFieldValue('name', settings.name);
    form.setFieldValue('description', settings.description || '');
    form.setFieldValue('config', settings.config);
    form.setFieldValue('isActive', settings.isActive);
    form.setFieldValue('id', settings.id);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingSettings(null);
    form.reset();
    setShowForm(true);
  };

  const getProviderIcon = (provider: StorageProvider) => {
    switch (provider) {
      case 'local':
        return <HardDrive className="h-5 w-5" />;
      case 's3':
        return <Cloud className="h-5 w-5" />;
      case 'pcloud':
        return <CloudCog className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: StorageProvider) => {
    switch (provider) {
      case 'local':
        return 'Local Storage';
      case 's3':
        return 'Amazon S3';
      case 'pcloud':
        return 'pCloud';
      default:
        return provider;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Storage Settings</h2>
          <p className="text-gray-600 mt-1">Configure your storage providers</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Storage Provider
        </Button>
      </div>

      {/* Storage Provider Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allSettings?.map((settings) => (
            <Card key={settings.id} className={cn("relative", settings.isActive && "ring-2 ring-blue-500")}>
              {settings.isActive && (
                <Badge className="absolute -top-2 -right-2 bg-blue-500">
                  Active
                </Badge>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getProviderIcon(settings.provider)}
                    <div>
                      <CardTitle className="text-lg">{settings.name}</CardTitle>
                      <CardDescription>{getProviderName(settings.provider)}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.description && (
                  <p className="text-sm text-gray-600">{settings.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(settings)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testMutation.mutate(settings.id)}
                    disabled={testingSettings === settings.id}
                  >
                    <TestTube className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  
                  {!settings.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => activateMutation.mutate(settings.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                  )}
                  
                  {!settings.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettingsToDelete(settings)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Configuration Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSettings ? 'Edit Storage Settings' : 'Add Storage Provider'}
            </CardTitle>
            <CardDescription>
              Configure your storage provider settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provider Selection */}
                <form.Field name="provider">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Storage Provider</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value as StorageProvider)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Storage</SelectItem>
                          <SelectItem value="s3">Amazon S3</SelectItem>
                          <SelectItem value="pcloud">pCloud</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors && (
                        <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Name */}
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Configuration Name</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., Production S3"
                      />
                      {field.state.meta.errors && (
                        <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Description */}
              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={field.state.value || ''}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Describe this storage configuration..."
                    />
                  </div>
                )}
              </form.Field>

              {/* Provider-specific config */}
              <form.Subscribe selector={(state) => state.values.provider}>
                {(provider) => (
                  <div className="space-y-4">
                    <h4 className="font-medium">Provider Configuration</h4>
                    
                    {provider === 'local' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <form.Field name="config.basePath">
                          {(field) => (
                            <div className="space-y-2">
                              <Label>Base Path</Label>
                              <Input
                                value={field.state.value || './uploads'}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="./uploads"
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name="config.maxFileSize">
                          {(field) => (
                            <div className="space-y-2">
                              <Label>Max File Size (bytes)</Label>
                              <Input
                                type="number"
                                value={field.state.value || 10485760}
                                onChange={(e) => field.handleChange(parseInt(e.target.value, 10))}
                                placeholder="10485760"
                              />
                            </div>
                          )}
                        </form.Field>
                      </div>
                    )}

                    {provider === 's3' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <form.Field name="config.accessKeyId">
                          {(field) => (
                            <div className="space-y-2">
                              <Label>Access Key ID</Label>
                              <Input
                                value={field.state.value || ''}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Your AWS access key"
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name="config.secretAccessKey">
                          {(field) => (
                            <div className="space-y-2">
                              <Label>Secret Access Key</Label>
                              <Input
                                type="password"
                                value={field.state.value || ''}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Your AWS secret key"
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name="config.region">
                          {(field) => (
                            <div className="space-y-2">
                              <Label>Region</Label>
                              <Input
                                value={field.state.value || ''}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="us-east-1"
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name="config.bucket">
                          {(field) => (
                            <div className="space-y-2">
                              <Label>Bucket Name</Label>
                              <Input
                                value={field.state.value || ''}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="your-bucket-name"
                              />
                            </div>
                          )}
                        </form.Field>
                      </div>
                    )}

                    {provider === 'pcloud' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <form.Field name="config.clientId">
                          {(field) => (
                            <div className="space-y-2">
                              <Label>Client ID</Label>
                              <Input
                                value={field.state.value || ''}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Your pCloud client ID"
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name="config.clientSecret">
                          {(field) => (
                            <div className="space-y-2">
                              <Label>Client Secret</Label>
                              <Input
                                type="password"
                                value={field.state.value || ''}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Your pCloud client secret"
                              />
                            </div>
                          )}
                        </form.Field>
                      </div>
                    )}
                  </div>
                )}
              </form.Subscribe>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : editingSettings ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!settingsToDelete} onOpenChange={() => setSettingsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the storage configuration "{settingsToDelete?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => settingsToDelete && deleteMutation.mutate(settingsToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Main component with SSR safety
export function StorageSettingsManagement({ className }: StorageSettingsManagementProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR
  if (typeof window === 'undefined' || !mounted) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading storage settings...</span>
        </div>
      </div>
    );
  }

  return <StorageSettingsManagementClient className={className} />;
}