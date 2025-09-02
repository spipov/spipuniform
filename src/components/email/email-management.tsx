import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Send, Settings, FileText, Activity, Plus, Edit, Trash2, TestTube, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmailSetting {
  id: string;
  configName: string;
  provider: 'smtp' | 'microsoft365' | 'google_workspace';
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  imapHost?: string;
  imapPort?: string;
  imapUser?: string;
  imapPassword?: string;
  imapSecure?: boolean;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiry?: string;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  type: 'welcome' | 'reset_password' | 'verification' | 'notification' | 'custom';
  variables?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  templateId?: string;
  errorMessage?: string;
}

export function EmailManagement() {
  const [emailSettings, setEmailSettings] = useState<EmailSetting[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [selectedSetting, setSelectedSetting] = useState<EmailSetting | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditingSetting, setIsEditingSetting] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadEmailData();
    loadCredentials();
  }, []);

  const loadEmailData = async () => {
    try {
      setLoading(true);
      const [settingsRes, templatesRes, logsRes] = await Promise.all([
        fetch('/api/email/settings'),
        fetch('/api/email/templates'),
        fetch('/api/email/logs')
      ]);

      if (settingsRes.ok) {
        const response = await settingsRes.json();
        setEmailSettings(response.data || []);
      }

      if (templatesRes.ok) {
        const response = await templatesRes.json();
        setEmailTemplates(response.data || []);
      }

      if (logsRes.ok) {
        const response = await logsRes.json();
        setEmailLogs(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load email data:', error);
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleSaveSetting = async () => {
    if (!selectedSetting) return;

    try {
      setSaving(true);
      const method = selectedSetting.id ? 'PUT' : 'POST';
      const url = selectedSetting.id 
        ? `/api/email/settings/${selectedSetting.id}`
        : '/api/email/settings';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSetting)
      });

      if (response.ok) {
        const apiResponse = await response.json();
        const savedSetting = apiResponse.data;
        if (selectedSetting.id) {
          setEmailSettings(settings => 
            settings.map(s => s.id === savedSetting.id ? savedSetting : s)
          );
        } else {
          setEmailSettings(settings => [...settings, savedSetting]);
        }
        toast.success(selectedSetting.id ? 'Setting updated' : 'Setting created');
        setIsSettingDialogOpen(false);
        setSelectedSetting(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save setting');
      }
    } catch (error) {
      console.error('Failed to save setting:', error);
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleActivateSetting = async (id: string) => {
    try {
      const response = await fetch(`/api/email/settings/${id}/activate`, {
        method: 'POST'
      });

      if (response.ok) {
        setEmailSettings(settings => 
          settings.map(setting => ({
            ...setting,
            isActive: setting.id === id
          }))
        );
        toast.success('Email setting activated');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to activate setting');
      }
    } catch (error) {
      console.error('Failed to activate setting:', error);
      toast.error('Failed to activate setting');
    }
  };

  const handleDeleteSetting = async (id: string) => {
    try {
      const response = await fetch(`/api/email/settings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEmailSettings(settings => settings.filter(setting => setting.id !== id));
        toast.success('Email setting deleted');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete setting');
      }
    } catch (error) {
      console.error('Failed to delete setting:', error);
      toast.error('Failed to delete setting');
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      const method = selectedTemplate.id ? 'PUT' : 'POST';
      const url = selectedTemplate.id 
        ? `/api/email/templates/${selectedTemplate.id}`
        : '/api/email/templates';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTemplate)
      });

      if (response.ok) {
        const apiResponse = await response.json();
        const savedTemplate = apiResponse.data;
        if (selectedTemplate.id) {
          setEmailTemplates(templates => 
            templates.map(t => t.id === savedTemplate.id ? savedTemplate : t)
          );
        } else {
          setEmailTemplates(templates => [...templates, savedTemplate]);
        }
        toast.success(selectedTemplate.id ? 'Template updated' : 'Template created');
        setIsTemplateDialogOpen(false);
        setSelectedTemplate(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/email/templates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEmailTemplates(templates => templates.filter(template => template.id !== id));
        toast.success('Template deleted');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleEditSetting = (setting: EmailSetting) => {
    setSelectedSetting(setting);
    setIsSettingDialogOpen(true);
  };

  const handleCreateNewSetting = () => {
    setSelectedSetting({
      id: '',
      configName: '',
      provider: 'smtp',
      fromEmail: '',
      fromName: '',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsSettingDialogOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const handleCreateNewTemplate = () => {
    setSelectedTemplate({
      id: '',
      name: '',
      subject: '',
      htmlContent: '',
      type: 'custom',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsTemplateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading email management...</span>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="settings" className="space-y-6">
      <TabsList>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Provider</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailSettings?.find?.(s => s.isActive)?.provider.toUpperCase() || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current email provider
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailTemplates?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailLogs?.filter(log => log.status === 'sent').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Emails</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailLogs?.filter(log => log.status === 'failed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery failures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email providers and SMTP settings
              </CardDescription>
            </div>
            <Button onClick={handleCreateNewSetting}>
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!emailSettings || emailSettings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No email providers configured. Add one to get started.
              </div>
            ) : (
              emailSettings?.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{setting.configName}</h4>
                      {setting.isActive && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Provider: {setting.provider.toUpperCase()}</p>
                      <p>Email: {setting.fromEmail}</p>
                      {setting.smtpHost && <p>SMTP: {setting.smtpHost}:{setting.smtpPort}</p>}
                      {setting.imapHost && <p>IMAP: {setting.imapHost}:{setting.imapPort}</p>}
                      {setting.clientId && <p>OAuth: Configured</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.success('Test email sent!')}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSetting(setting)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!setting.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateSetting(setting.id)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSetting(setting.id)}
                      disabled={setting.isActive}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="templates" className="space-y-6">
        {/* Email Templates */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Manage reusable email templates with variables
              </CardDescription>
            </div>
            <Button onClick={handleCreateNewTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!emailTemplates || emailTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No email templates created. Create one to get started.
              </div>
            ) : (
              emailTemplates?.map((template) => (
                <div key={template.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        {template.isActive && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Subject: {template.subject}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.htmlContent}
                      </p>
                      {template.variables && Object.keys(template.variables).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.keys(template.variables).map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="logs" className="space-y-6">
        {/* Email Logs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Email Logs</CardTitle>
              <CardDescription>
                Recent email delivery history
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadEmailData}>
              <Activity className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!emailLogs || emailLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No email logs available.
              </div>
            ) : (
              emailLogs?.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.subject}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      To: {log.to} • {new Date(log.sentAt).toLocaleString()}
                      {log.errorMessage && (
                        <span className="text-red-500"> • Error: {log.errorMessage}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>
    </Tabs>

    {/* Edit Setting Dialog */}
    <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedSetting?.id ? 'Edit' : 'Create'} Email Setting
          </DialogTitle>
          <DialogDescription>
            Configure email provider settings and authentication
          </DialogDescription>
        </DialogHeader>

        {selectedSetting && (
          <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settingName">Setting Name</Label>
              <Input
                id="settingName"
                value={selectedSetting.configName}
                onChange={(e) => setSelectedSetting({...selectedSetting, configName: e.target.value})}
                placeholder="Primary SMTP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={selectedSetting.provider}
                onValueChange={(value: 'smtp' | 'microsoft365' | 'google_workspace') =>
                  setSelectedSetting({...selectedSetting, provider: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="microsoft365">Microsoft 365</SelectItem>
                  <SelectItem value="google_workspace">Google Workspace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={selectedSetting.fromName}
                onChange={(e) => setSelectedSetting({...selectedSetting, fromName: e.target.value})}
                placeholder="Your Company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                value={selectedSetting.fromEmail}
                onChange={(e) => setSelectedSetting({...selectedSetting, fromEmail: e.target.value})}
                placeholder="noreply@company.com"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="replyToEmail">Reply To Email</Label>
              <Input
                id="replyToEmail"
                value={selectedSetting.replyToEmail || ''}
                onChange={(e) => setSelectedSetting({...selectedSetting, replyToEmail: e.target.value})}
                placeholder="support@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={selectedSetting.smtpPassword || ''}
                onChange={(e) => setSelectedSetting({...selectedSetting, smtpPassword: e.target.value})}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* OAuth Configuration for Google/Microsoft */}
          {(selectedSetting.provider === 'google_workspace' || selectedSetting.provider === 'microsoft365') && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">OAuth Configuration</h4>

              {/* Credential Selection */}
              <div className="space-y-2">
                <Label htmlFor="oauthCredential">Select OAuth Credential (Optional)</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value) {
                      const credential = credentials.find(c => c.id === value);
                      if (credential) {
                        setSelectedSetting({
                          ...selectedSetting,
                          clientId: credential.clientId,
                          clientSecret: credential.clientSecret,
                          tenantId: credential.tenantId
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose existing credential or enter manually" />
                  </SelectTrigger>
                  <SelectContent>
                    {credentials
                      .filter(c => c.type === 'oauth_google' || c.type === 'oauth_microsoft')
                      .map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          {credential.name} ({credential.provider})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={selectedSetting.clientId || ''}
                    onChange={(e) => setSelectedSetting({...selectedSetting, clientId: e.target.value})}
                    placeholder="Your OAuth client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={selectedSetting.clientSecret || ''}
                    onChange={(e) => setSelectedSetting({...selectedSetting, clientSecret: e.target.value})}
                    placeholder="Your OAuth client secret"
                  />
                </div>
              </div>
              {selectedSetting.provider === 'microsoft365' && (
                <div className="space-y-2">
                  <Label htmlFor="tenantId">Tenant ID</Label>
                  <Input
                    id="tenantId"
                    value={selectedSetting.tenantId || ''}
                    onChange={(e) => setSelectedSetting({...selectedSetting, tenantId: e.target.value})}
                    placeholder="Azure AD tenant ID"
                  />
                </div>
              )}
            </div>
          )}

          {/* SMTP Configuration */}
          {selectedSetting.provider === 'smtp' && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">SMTP Configuration</h4>

              {/* Credential Selection */}
              <div className="space-y-2">
                <Label htmlFor="smtpCredential">Select SMTP Credential (Optional)</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value) {
                      const credential = credentials.find(c => c.id === value);
                      if (credential) {
                        setSelectedSetting({
                          ...selectedSetting,
                          smtpHost: credential.endpoint,
                          smtpPort: credential.region,
                          smtpUser: credential.username,
                          smtpPassword: credential.password,
                          smtpSecure: credential.config?.secure ?? true
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose existing SMTP credential or enter manually" />
                  </SelectTrigger>
                  <SelectContent>
                    {credentials
                      .filter(c => c.type === 'smtp')
                      .map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          {credential.name} ({credential.provider})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={selectedSetting.smtpHost || ''}
                    onChange={(e) => setSelectedSetting({...selectedSetting, smtpHost: e.target.value})}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={selectedSetting.smtpPort || ''}
                    onChange={(e) => setSelectedSetting({...selectedSetting, smtpPort: e.target.value})}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={selectedSetting.smtpUser || ''}
                    onChange={(e) => setSelectedSetting({...selectedSetting, smtpUser: e.target.value})}
                    placeholder="your-email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={selectedSetting.smtpPassword || ''}
                    onChange={(e) => setSelectedSetting({...selectedSetting, smtpPassword: e.target.value})}
                    placeholder="Your SMTP password"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={selectedSetting.smtpSecure ?? true}
                  onChange={(e) => setSelectedSetting({...selectedSetting, smtpSecure: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="smtpSecure">Use secure connection (SSL/TLS)</Label>
              </div>
            </div>
          )}

          {/* IMAP Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">IMAP Configuration (Optional)</h4>

            {/* Credential Selection */}
            <div className="space-y-2">
              <Label htmlFor="imapCredential">Select IMAP Credential (Optional)</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) {
                    const credential = credentials.find(c => c.id === value);
                    if (credential) {
                      setSelectedSetting({
                        ...selectedSetting,
                        imapHost: credential.endpoint,
                        imapPort: credential.region,
                        imapUser: credential.username,
                        imapPassword: credential.password,
                        imapSecure: credential.config?.secure ?? true
                      });
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose existing IMAP credential or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  {credentials
                    .filter(c => c.type === 'imap')
                    .map((credential) => (
                      <SelectItem key={credential.id} value={credential.id}>
                        {credential.name} ({credential.provider})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imapHost">IMAP Host</Label>
                <Input
                  id="imapHost"
                  value={selectedSetting.imapHost || ''}
                  onChange={(e) => setSelectedSetting({...selectedSetting, imapHost: e.target.value})}
                  placeholder="imap.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imapPort">IMAP Port</Label>
                <Input
                  id="imapPort"
                  value={selectedSetting.imapPort || ''}
                  onChange={(e) => setSelectedSetting({...selectedSetting, imapPort: e.target.value})}
                  placeholder="993"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imapUser">IMAP Username</Label>
                <Input
                  id="imapUser"
                  value={selectedSetting.imapUser || ''}
                  onChange={(e) => setSelectedSetting({...selectedSetting, imapUser: e.target.value})}
                  placeholder="your-email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imapPassword">IMAP Password</Label>
                <Input
                  id="imapPassword"
                  type="password"
                  value={selectedSetting.imapPassword || ''}
                  onChange={(e) => setSelectedSetting({...selectedSetting, imapPassword: e.target.value})}
                  placeholder="Your IMAP password"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="imapSecure"
                checked={selectedSetting.imapSecure ?? true}
                onChange={(e) => setSelectedSetting({...selectedSetting, imapSecure: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="imapSecure">Use secure connection (SSL/TLS)</Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={selectedSetting.isActive}
              onCheckedChange={(checked) => setSelectedSetting({...selectedSetting, isActive: checked})}
            />
            <Label htmlFor="isActive">Set as active provider</Label>
          </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSettingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSetting} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedSetting.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.id ? 'Edit' : 'Create'} Email Template
            </DialogTitle>
            <DialogDescription>
              Create and manage reusable email templates
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                  placeholder="Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type</Label>
                <Select
                  value={selectedTemplate.type}
                  onValueChange={(value: 'welcome' | 'reset_password' | 'verification' | 'notification' | 'custom') =>
                    setSelectedTemplate({...selectedTemplate, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="reset_password">Reset Password</SelectItem>
                    <SelectItem value="verification">Verification</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={selectedTemplate.subject}
                onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                placeholder="Welcome to {{company_name}}!"
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="htmlContent">HTML Content</Label>
              <Textarea
                id="htmlContent"
                value={selectedTemplate.htmlContent}
                onChange={(e) => setSelectedTemplate({...selectedTemplate, htmlContent: e.target.value})}
                placeholder="<h1>Hello {{user_name}}</h1><p>Welcome to our platform!</p>"
                rows={6}
              />
            </div>
  
            <div className="flex items-center space-x-2">
              <Switch
                id="templateActive"
                checked={selectedTemplate.isActive}
                onCheckedChange={(checked) => setSelectedTemplate({...selectedTemplate, isActive: checked})}
              />
              <Label htmlFor="templateActive">Active template</Label>
            </div>
  
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedTemplate.id ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}