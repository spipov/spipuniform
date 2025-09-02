import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Key,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Shield,
  Database,
  Cloud,
  Mail,
  Webhook,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Credential {
  id: string;
  name: string;
  type: 'oauth_google' | 'oauth_microsoft' | 'smtp' | 'imap' | 'api_key' | 'webhook' | 'database' | 'storage';
  provider: 'google' | 'microsoft' | 'aws' | 'azure' | 'sendgrid' | 'mailgun' | 'custom';
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  tenantId?: string;
  projectId?: string;
  region?: string;
  endpoint?: string;
  config?: any;
  isActive: boolean;
  isDefault: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function CredentialsManagement() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Load credentials on component mount
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/credentials');

      if (response.ok) {
        const data = await response.json();
        setCredentials(data.data || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to load credentials');
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredential = async () => {
    if (!selectedCredential) return;

    try {
      setSaving(true);
      const method = selectedCredential.id ? 'PUT' : 'POST';
      const url = selectedCredential.id
        ? `/api/credentials/${selectedCredential.id}`
        : '/api/credentials';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedCredential)
      });

      if (response.ok) {
        const apiResponse = await response.json();
        const savedCredential = apiResponse.data;
        if (selectedCredential.id) {
          setCredentials(creds =>
            creds.map(c => c.id === savedCredential.id ? savedCredential : c)
          );
        } else {
          setCredentials(creds => [...creds, savedCredential]);
        }
        toast.success(selectedCredential.id ? 'Credential updated' : 'Credential created');
        setIsDialogOpen(false);
        setSelectedCredential(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save credential');
      }
    } catch (error) {
      console.error('Failed to save credential:', error);
      toast.error('Failed to save credential');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    try {
      const response = await fetch(`/api/credentials/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCredentials(creds => creds.filter(c => c.id !== id));
        toast.success('Credential deleted');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete credential');
      }
    } catch (error) {
      console.error('Failed to delete credential:', error);
      toast.error('Failed to delete credential');
    }
  };

  const handleCreateNewCredential = () => {
    setSelectedCredential({
      id: '',
      name: '',
      type: 'api_key',
      provider: 'custom',
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleEditCredential = (credential: Credential) => {
    setSelectedCredential(credential);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'oauth_google':
      case 'oauth_microsoft':
        return <Shield className="h-4 w-4" />;
      case 'smtp':
      case 'imap':
        return <Mail className="h-4 w-4" />;
      case 'api_key':
        return <Key className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'storage':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getProviderBadge = (provider: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      google: 'default',
      microsoft: 'secondary',
      aws: 'outline',
      azure: 'outline',
      sendgrid: 'default',
      mailgun: 'default',
      custom: 'secondary'
    };
    return <Badge variant={variants[provider] || 'outline'}>{provider.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading credentials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Credentials Management</h2>
          <p className="text-muted-foreground">
            Manage API keys, OAuth credentials, and other authentication data
          </p>
        </div>
        <Button onClick={handleCreateNewCredential}>
          <Plus className="mr-2 h-4 w-4" />
          Add Credential
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Credentials</TabsTrigger>
          <TabsTrigger value="oauth">OAuth</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {credentials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No credentials configured</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first credential to get started with API integrations
                </p>
                <Button onClick={handleCreateNewCredential}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Credential
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {credentials.map((credential) => (
                <Card key={credential.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          {getTypeIcon(credential.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{credential.name}</h4>
                            {credential.isDefault && (
                              <Badge variant="default">Default</Badge>
                            )}
                            {getProviderBadge(credential.provider)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {credential.description || `${credential.type.replace('_', ' ').toUpperCase()} credential`}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Type: {credential.type.replace('_', ' ')}</span>
                            <span>Provider: {credential.provider}</span>
                            <span>Created: {new Date(credential.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSecretVisibility(credential.id)}
                        >
                          {showSecrets[credential.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCredential(credential)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCredential(credential.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="oauth" className="space-y-4">
          <div className="grid gap-4">
            {credentials
              .filter(c => c.type.startsWith('oauth_'))
              .map((credential) => (
                <Card key={credential.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Shield className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{credential.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {credential.provider.toUpperCase()} OAuth
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCredential(credential)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid gap-4">
            {credentials
              .filter(c => c.type === 'api_key')
              .map((credential) => (
                <Card key={credential.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Key className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{credential.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            API Key for {credential.provider.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCredential(credential)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <div className="grid gap-4">
            {credentials
              .filter(c => ['smtp', 'imap'].includes(c.type))
              .map((credential) => (
                <Card key={credential.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Mail className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{credential.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {credential.type.toUpperCase()} for {credential.provider.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCredential(credential)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCredential?.id ? 'Edit' : 'Create'} Credential
            </DialogTitle>
            <DialogDescription>
              Configure authentication credentials for external services
            </DialogDescription>
          </DialogHeader>

          {selectedCredential && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credName">Credential Name</Label>
                  <Input
                    id="credName"
                    value={selectedCredential.name}
                    onChange={(e) => setSelectedCredential({...selectedCredential, name: e.target.value})}
                    placeholder="My Google API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credType">Type</Label>
                  <Select
                    value={selectedCredential.type}
                    onValueChange={(value: any) =>
                      setSelectedCredential({...selectedCredential, type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oauth_google">OAuth Google</SelectItem>
                      <SelectItem value="oauth_microsoft">OAuth Microsoft</SelectItem>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="imap">IMAP</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credProvider">Provider</Label>
                  <Select
                    value={selectedCredential.provider}
                    onValueChange={(value: any) =>
                      setSelectedCredential({...selectedCredential, provider: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="microsoft">Microsoft</SelectItem>
                      <SelectItem value="aws">AWS</SelectItem>
                      <SelectItem value="azure">Azure</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credDescription">Description</Label>
                  <Input
                    id="credDescription"
                    value={selectedCredential.description || ''}
                    onChange={(e) => setSelectedCredential({...selectedCredential, description: e.target.value})}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              {/* OAuth Fields */}
              {(selectedCredential.type === 'oauth_google' || selectedCredential.type === 'oauth_microsoft') && (
                <div className="space-y-4">
                  <h4 className="font-medium">OAuth Configuration</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        value={selectedCredential.clientId || ''}
                        onChange={(e) => setSelectedCredential({...selectedCredential, clientId: e.target.value})}
                        placeholder="Your OAuth client ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientSecret">Client Secret</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={selectedCredential.clientSecret || ''}
                        onChange={(e) => setSelectedCredential({...selectedCredential, clientSecret: e.target.value})}
                        placeholder="Your OAuth client secret"
                      />
                    </div>
                  </div>
                  {selectedCredential.type === 'oauth_microsoft' && (
                    <div className="space-y-2">
                      <Label htmlFor="tenantId">Tenant ID</Label>
                      <Input
                        id="tenantId"
                        value={selectedCredential.tenantId || ''}
                        onChange={(e) => setSelectedCredential({...selectedCredential, tenantId: e.target.value})}
                        placeholder="Azure AD tenant ID"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SMTP/IMAP Fields */}
              {(selectedCredential.type === 'smtp' || selectedCredential.type === 'imap') && (
                <div className="space-y-4">
                  <h4 className="font-medium">{selectedCredential.type.toUpperCase()} Configuration</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="host">{selectedCredential.type.toUpperCase()} Host</Label>
                      <Input
                        id="host"
                        value={selectedCredential.endpoint || ''}
                        onChange={(e) => setSelectedCredential({...selectedCredential, endpoint: e.target.value})}
                        placeholder={`smtp.${selectedCredential.provider}.com`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        value={selectedCredential.region || ''}
                        onChange={(e) => setSelectedCredential({...selectedCredential, region: e.target.value})}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={selectedCredential.username || ''}
                        onChange={(e) => setSelectedCredential({...selectedCredential, username: e.target.value})}
                        placeholder="your-email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={selectedCredential.password || ''}
                        onChange={(e) => setSelectedCredential({...selectedCredential, password: e.target.value})}
                        placeholder="Your password"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* API Key Fields */}
              {selectedCredential.type === 'api_key' && (
                <div className="space-y-4">
                  <h4 className="font-medium">API Key Configuration</h4>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={selectedCredential.apiKey || ''}
                      onChange={(e) => setSelectedCredential({...selectedCredential, apiKey: e.target.value})}
                      placeholder="Your API key"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={selectedCredential.isActive}
                    onCheckedChange={(checked) => setSelectedCredential({...selectedCredential, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={selectedCredential.isDefault}
                    onCheckedChange={(checked) => setSelectedCredential({...selectedCredential, isDefault: checked})}
                  />
                  <Label htmlFor="isDefault">Set as default</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveCredential} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedCredential.id ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}