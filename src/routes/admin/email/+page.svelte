<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { PageData, ActionData } from './$types';
  import { toast } from 'svelte-sonner';

  export let data: PageData;
  export let form: ActionData;

  let activeTab: 'settings' | 'templates' | 'logs' = 'settings';
  let showCreateSettingsForm = false;
  let showCreateTemplateForm = false;
  let editingSettings: any = null;
  let editingTemplate: any = null;

  // Handle form responses
  $: if (form?.success) {
    toast.success(form.message);
    showCreateSettingsForm = false;
    showCreateTemplateForm = false;
    editingSettings = null;
    editingTemplate = null;
  }
  $: if (form?.error) {
    toast.error(form.error);
  }

  function startEditSettings(settings: any) {
    editingSettings = { ...settings };
    showCreateSettingsForm = true;
  }

  function startEditTemplate(template: any) {
    editingTemplate = { ...template };
    showCreateTemplateForm = true;
  }

  function cancelEdit() {
    showCreateSettingsForm = false;
    showCreateTemplateForm = false;
    editingSettings = null;
    editingTemplate = null;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>Email Management - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Email Management</h1>
      <p class="text-gray-600 mt-2">Manage email settings, templates, and logs</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200 mb-8">
    <nav class="-mb-px flex space-x-8">
      <button
        on:click={() => activeTab = 'settings'}
        class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Email Settings
      </button>
      <button
        on:click={() => activeTab = 'templates'}
        class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'templates' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Email Templates
      </button>
      <button
        on:click={() => activeTab = 'logs'}
        class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'logs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Email Logs
      </button>
    </nav>
  </div>

  <!-- Email Settings Tab -->
  {#if activeTab === 'settings'}
    <div class="space-y-8">
      <!-- Active Settings Display -->
      {#if data.activeSettings}
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-green-800 mb-4">Active Email Configuration</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span class="font-medium text-green-700">Provider:</span>
              <span class="ml-2 text-green-900 capitalize">{data.activeSettings.provider}</span>
            </div>
            <div>
              <span class="font-medium text-green-700">From Name:</span>
              <span class="ml-2 text-green-900">{data.activeSettings.fromName}</span>
            </div>
            <div>
              <span class="font-medium text-green-700">From Email:</span>
              <span class="ml-2 text-green-900">{data.activeSettings.fromEmail}</span>
            </div>
          </div>
        </div>
      {:else}
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-yellow-800 mb-2">No Active Email Settings</h2>
          <p class="text-yellow-700">No email configuration is currently active. Create one to start sending emails.</p>
        </div>
      {/if}

      <!-- Create Settings Button -->
      <div class="flex justify-end">
        <button
          on:click={() => showCreateSettingsForm = true}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Email Settings
        </button>
      </div>

      <!-- Create/Edit Settings Form -->
      {#if showCreateSettingsForm}
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-6">
            {editingSettings ? 'Edit' : 'Create'} Email Settings
          </h2>
          
          <form 
            method="POST" 
            action="?/{editingSettings ? 'updateSettings' : 'createSettings'}" 
            use:enhance
            class="space-y-6"
          >
            {#if editingSettings}
              <input type="hidden" name="id" value={editingSettings.id} />
            {/if}
            
            <!-- Provider Selection -->
            <div>
              <label for="provider" class="block text-sm font-medium text-gray-700 mb-2">
                Email Provider *
              </label>
              <select
                id="provider"
                name="provider"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="smtp" selected={editingSettings?.provider === 'smtp'}>SMTP</option>
                <option value="microsoft365" selected={editingSettings?.provider === 'microsoft365'}>Microsoft 365</option>
                <option value="google_workspace" selected={editingSettings?.provider === 'google_workspace'}>Google Workspace</option>
              </select>
            </div>
            
            <!-- Basic Settings -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="fromName" class="block text-sm font-medium text-gray-700 mb-2">
                  From Name *
                </label>
                <input
                  type="text"
                  id="fromName"
                  name="fromName"
                  value={editingSettings?.fromName || ''}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label for="fromEmail" class="block text-sm font-medium text-gray-700 mb-2">
                  From Email *
                </label>
                <input
                  type="email"
                  id="fromEmail"
                  name="fromEmail"
                  value={editingSettings?.fromEmail || ''}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label for="replyToEmail" class="block text-sm font-medium text-gray-700 mb-2">
                Reply-To Email
              </label>
              <input
                type="email"
                id="replyToEmail"
                name="replyToEmail"
                value={editingSettings?.replyToEmail || ''}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <!-- SMTP Settings -->
            <div class="border-t pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="smtpHost" class="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    id="smtpHost"
                    name="smtpHost"
                    value={editingSettings?.smtpHost || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="smtpPort" class="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    id="smtpPort"
                    name="smtpPort"
                    value={editingSettings?.smtpPort || '587'}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="smtpUser" class="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    id="smtpUser"
                    name="smtpUser"
                    value={editingSettings?.smtpUser || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="smtpPassword" class="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    id="smtpPassword"
                    name="smtpPassword"
                    value={editingSettings?.smtpPassword || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div class="mt-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    name="smtpSecure"
                    value="true"
                    checked={editingSettings?.smtpSecure || false}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-900">Use secure connection (TLS/SSL)</span>
                </label>
              </div>
            </div>
            
            <!-- OAuth Settings -->
            <div class="border-t pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">OAuth Configuration (for Microsoft 365 & Google Workspace)</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="clientId" class="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    id="clientId"
                    name="clientId"
                    value={editingSettings?.clientId || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="clientSecret" class="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    id="clientSecret"
                    name="clientSecret"
                    value={editingSettings?.clientSecret || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="refreshToken" class="block text-sm font-medium text-gray-700 mb-2">
                    Refresh Token
                  </label>
                  <input
                    type="text"
                    id="refreshToken"
                    name="refreshToken"
                    value={editingSettings?.refreshToken || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="accessToken" class="block text-sm font-medium text-gray-700 mb-2">
                    Access Token
                  </label>
                  <input
                    type="text"
                    id="accessToken"
                    name="accessToken"
                    value={editingSettings?.accessToken || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <!-- Active Status -->
            <div class="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                value="true"
                checked={editingSettings?.isActive || false}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="isActive" class="ml-2 block text-sm text-gray-900">
                Set as active email configuration
              </label>
            </div>
            
            <!-- Form Actions -->
            <div class="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                on:click={cancelEdit}
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingSettings ? 'Update' : 'Create'} Settings
              </button>
            </div>
          </form>
        </div>
      {/if}

      <!-- Settings List -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">All Email Settings</h2>
        </div>
        
        {#if data.allSettings.length === 0}
          <div class="p-6 text-center text-gray-500">
            No email settings found. Create your first configuration above.
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each data.allSettings as settings}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm font-medium text-gray-900 capitalize">{settings.provider}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{settings.fromName}</div>
                      <div class="text-sm text-gray-500">{settings.fromEmail}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {#if settings.isActive}
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      {:else}
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      {/if}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(settings.createdAt).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex justify-end gap-2">
                        <button
                          on:click={() => startEditSettings(settings)}
                          class="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        
                        <form method="POST" action="?/testSettings" use:enhance class="inline">
                          <input type="hidden" name="id" value={settings.id} />
                          <button type="submit" class="text-green-600 hover:text-green-900">
                            Test
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Email Templates Tab -->
  {#if activeTab === 'templates'}
    <div class="space-y-8">
      <!-- Create Template Button -->
      <div class="flex justify-end">
        <button
          on:click={() => showCreateTemplateForm = true}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Email Template
        </button>
      </div>

      <!-- Create/Edit Template Form -->
      {#if showCreateTemplateForm}
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-6">
            {editingTemplate ? 'Edit' : 'Create'} Email Template
          </h2>
          
          <form 
            method="POST" 
            action="?/{editingTemplate ? 'updateTemplate' : 'createTemplate'}" 
            use:enhance
            class="space-y-6"
          >
            {#if editingTemplate}
              <input type="hidden" name="id" value={editingTemplate.id} />
            {/if}
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editingTemplate?.name || ''}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={editingTemplate?.category || ''}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={editingTemplate?.subject || ''}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={editingTemplate?.description || ''}
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            
            <div>
              <label for="htmlContent" class="block text-sm font-medium text-gray-700 mb-2">
                HTML Content *
              </label>
              <textarea
                id="htmlContent"
                name="htmlContent"
                value={editingTemplate?.htmlContent || ''}
                required
                rows="10"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              ></textarea>
            </div>
            
            <div>
              <label for="textContent" class="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                id="textContent"
                name="textContent"
                value={editingTemplate?.textContent || ''}
                rows="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            
            <div>
              <label for="variables" class="block text-sm font-medium text-gray-700 mb-2">
                Variables (JSON array)
              </label>
              <textarea
                id="variables"
                name="variables"
                value={editingTemplate?.variables ? JSON.stringify(editingTemplate.variables, null, 2) : '[]'}
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder='["userName", "siteName", "actionUrl"]'
              ></textarea>
            </div>
            
            <div class="flex items-center gap-6">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  name="useBranding"
                  value="true"
                  checked={editingTemplate?.useBranding || false}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-900">Use branding variables</span>
              </label>
              
              <label class="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  checked={editingTemplate?.isActive || false}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-900">Active template</span>
              </label>
            </div>
            
            <!-- Form Actions -->
            <div class="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                on:click={cancelEdit}
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </form>
        </div>
      {/if}

      <!-- Templates List -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Email Templates</h2>
        </div>
        
        {#if data.templates.length === 0}
          <div class="p-6 text-center text-gray-500">
            No email templates found. Create your first template above.
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each data.templates as template}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{template.name}</div>
                      <div class="text-sm text-gray-500">{template.subject}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.category || 'Uncategorized'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {#if template.isActive}
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      {:else}
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      {/if}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex justify-end gap-2">
                        <button
                          on:click={() => startEditTemplate(template)}
                          class="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Email Logs Tab -->
  {#if activeTab === 'logs'}
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Email Logs</h2>
      </div>
      
      {#if data.logs.length === 0}
        <div class="p-6 text-center text-gray-500">
          No email logs found. Emails will appear here once sent.
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each data.logs as log}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{log.toEmail}</div>
                    <div class="text-sm text-gray-500">{log.fromEmail}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">{log.subject}</div>
                    {#if log.templateName}
                      <div class="text-sm text-gray-500">Template: {log.templateName}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(log.status)}">
                      {log.status}
                    </span>
                    {#if log.errorMessage}
                      <div class="text-xs text-red-600 mt-1">{log.errorMessage}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {log.provider}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'Not sent'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>