<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { PageData, ActionData } from './$types';
  import { toast } from 'svelte-sonner';

  export let data: PageData;
  export let form: ActionData;

  let showCreateForm = false;
  let editingBranding: any = null;
  let selectedFile: File | null = null;
  let selectedFaviconFile: File | null = null;

  // Handle form responses
  $: if (form?.success) {
    toast.success(form.message);
    showCreateForm = false;
    editingBranding = null;
  }
  $: if (form?.error) {
    toast.error(form.error);
  }

  function startEdit(branding: any) {
    editingBranding = { ...branding };
    showCreateForm = true;
  }

  function cancelEdit() {
    showCreateForm = false;
    editingBranding = null;
    selectedFile = null;
    selectedFaviconFile = null;
  }

  function handleFileSelect(event: Event, type: 'logo' | 'favicon') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (type === 'logo') {
        selectedFile = file;
      } else {
        selectedFaviconFile = file;
      }
    }
  }
</script>

<svelte:head>
  <title>Branding Management - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Branding Management</h1>
      <p class="text-gray-600 mt-2">Manage your site's branding and visual identity</p>
    </div>
    <div class="flex gap-4">
      <form method="POST" action="?/ensureDefault" use:enhance>
        <button
          type="submit"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Ensure Default
        </button>
      </form>
      <button
        on:click={() => showCreateForm = true}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add New Branding
      </button>
    </div>
  </div>

  <!-- Active Branding Display -->
  {#if data.activeBranding}
    <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-green-800 mb-4">Active Branding Configuration</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <span class="font-medium text-green-700">Site Name:</span>
          <span class="ml-2 text-green-900">{data.activeBranding.siteName}</span>
        </div>
        <div>
          <span class="font-medium text-green-700">Primary Color:</span>
          <span class="ml-2 text-green-900">{data.activeBranding.primaryColor}</span>
          <div class="inline-block w-4 h-4 ml-2 rounded" style="background-color: {data.activeBranding.primaryColor}"></div>
        </div>
        <div>
          <span class="font-medium text-green-700">Font Family:</span>
          <span class="ml-2 text-green-900">{data.activeBranding.fontFamily}</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-yellow-800 mb-2">No Active Branding</h2>
      <p class="text-yellow-700">No branding configuration is currently active. Create one or activate an existing configuration.</p>
    </div>
  {/if}

  <!-- Create/Edit Form -->
  {#if showCreateForm}
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-6">
        {editingBranding ? 'Edit' : 'Create'} Branding Configuration
      </h2>
      
      <form 
        method="POST" 
        action="?/{editingBranding ? 'update' : 'create'}" 
        use:enhance
        enctype="multipart/form-data"
        class="space-y-6"
      >
        {#if editingBranding}
          <input type="hidden" name="id" value={editingBranding.id} />
        {/if}
        
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="siteName" class="block text-sm font-medium text-gray-700 mb-2">
              Site Name *
            </label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={editingBranding?.siteName || ''}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label for="siteUrl" class="block text-sm font-medium text-gray-700 mb-2">
              Site URL *
            </label>
            <input
              type="url"
              id="siteUrl"
              name="siteUrl"
              value={editingBranding?.siteUrl || ''}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label for="siteDescription" class="block text-sm font-medium text-gray-700 mb-2">
            Site Description
          </label>
          <textarea
            id="siteDescription"
            name="siteDescription"
            value={editingBranding?.siteDescription || ''}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        
        <!-- Logo and Favicon -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="logoUrl" class="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              id="logoUrl"
              name="logoUrl"
              value={editingBranding?.logoUrl || ''}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div class="mt-2">
              <label for="logoFile" class="block text-sm text-gray-600 mb-1">
                Or upload logo file:
              </label>
              <input
                type="file"
                id="logoFile"
                name="logoFile"
                accept="image/*"
                on:change={(e) => handleFileSelect(e, 'logo')}
                class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          
          <div>
            <label for="faviconUrl" class="block text-sm font-medium text-gray-700 mb-2">
              Favicon URL
            </label>
            <input
              type="url"
              id="faviconUrl"
              name="faviconUrl"
              value={editingBranding?.faviconUrl || ''}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div class="mt-2">
              <label for="faviconFile" class="block text-sm text-gray-600 mb-1">
                Or upload favicon file:
              </label>
              <input
                type="file"
                id="faviconFile"
                name="faviconFile"
                accept="image/*"
                on:change={(e) => handleFileSelect(e, 'favicon')}
                class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>
        
        <!-- Colors -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="primaryColor" class="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <input
              type="color"
              id="primaryColor"
              name="primaryColor"
              value={editingBranding?.primaryColor || '#3b82f6'}
              class="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label for="secondaryColor" class="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <input
              type="color"
              id="secondaryColor"
              name="secondaryColor"
              value={editingBranding?.secondaryColor || '#6b7280'}
              class="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label for="accentColor" class="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <input
              type="color"
              id="accentColor"
              name="accentColor"
              value={editingBranding?.accentColor || '#10b981'}
              class="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        
        <!-- Typography -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="fontFamily" class="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              id="fontFamily"
              name="fontFamily"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Inter" selected={editingBranding?.fontFamily === 'Inter'}>Inter</option>
              <option value="Roboto" selected={editingBranding?.fontFamily === 'Roboto'}>Roboto</option>
              <option value="Open Sans" selected={editingBranding?.fontFamily === 'Open Sans'}>Open Sans</option>
              <option value="Lato" selected={editingBranding?.fontFamily === 'Lato'}>Lato</option>
              <option value="Montserrat" selected={editingBranding?.fontFamily === 'Montserrat'}>Montserrat</option>
            </select>
          </div>
          
          <div>
            <label for="fontSize" class="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <select
              id="fontSize"
              name="fontSize"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="14px" selected={editingBranding?.fontSize === '14px'}>14px</option>
              <option value="16px" selected={editingBranding?.fontSize === '16px'}>16px</option>
              <option value="18px" selected={editingBranding?.fontSize === '18px'}>18px</option>
            </select>
          </div>
          
          <div>
            <label for="lineHeight" class="block text-sm font-medium text-gray-700 mb-2">
              Line Height
            </label>
            <select
              id="lineHeight"
              name="lineHeight"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1.4" selected={editingBranding?.lineHeight === '1.4'}>1.4</option>
              <option value="1.5" selected={editingBranding?.lineHeight === '1.5'}>1.5</option>
              <option value="1.6" selected={editingBranding?.lineHeight === '1.6'}>1.6</option>
            </select>
          </div>
        </div>
        
        <!-- Contact Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="contactEmail" class="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={editingBranding?.contactEmail || ''}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label for="supportEmail" class="block text-sm font-medium text-gray-700 mb-2">
              Support Email
            </label>
            <input
              type="email"
              id="supportEmail"
              name="supportEmail"
              value={editingBranding?.supportEmail || ''}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <!-- Custom CSS -->
        <div>
          <label for="customCss" class="block text-sm font-medium text-gray-700 mb-2">
            Custom CSS
          </label>
          <textarea
            id="customCss"
            name="customCss"
            value={editingBranding?.customCss || ''}
            rows="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="/* Add your custom CSS here */"
          ></textarea>
        </div>
        
        <!-- Active Status -->
        <div class="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            value="true"
            checked={editingBranding?.isActive || false}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="isActive" class="ml-2 block text-sm text-gray-900">
            Set as active branding configuration
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
            {editingBranding ? 'Update' : 'Create'} Branding
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Branding List -->
  <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">All Branding Configurations</h2>
    </div>
    
    {#if data.allBranding.length === 0}
      <div class="p-6 text-center text-gray-500">
        No branding configurations found. Create your first one above.
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Colors
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
            {#each data.allBranding as branding}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{branding.siteName}</div>
                  <div class="text-sm text-gray-500">{branding.siteUrl}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex gap-2">
                    <div class="w-4 h-4 rounded" style="background-color: {branding.primaryColor}" title="Primary"></div>
                    <div class="w-4 h-4 rounded" style="background-color: {branding.secondaryColor}" title="Secondary"></div>
                    <div class="w-4 h-4 rounded" style="background-color: {branding.accentColor}" title="Accent"></div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if branding.isActive}
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
                  {new Date(branding.createdAt).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button
                      on:click={() => startEdit(branding)}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    
                    {#if !branding.isActive}
                      <form method="POST" action="?/activate" use:enhance class="inline">
                        <input type="hidden" name="id" value={branding.id} />
                        <button type="submit" class="text-green-600 hover:text-green-900">
                          Activate
                        </button>
                      </form>
                    {:else}
                      <form method="POST" action="?/deactivate" use:enhance class="inline">
                        <input type="hidden" name="id" value={branding.id} />
                        <button type="submit" class="text-yellow-600 hover:text-yellow-900">
                          Deactivate
                        </button>
                      </form>
                    {/if}
                    
                    <form method="POST" action="?/delete" use:enhance class="inline">
                      <input type="hidden" name="id" value={branding.id} />
                      <button 
                        type="submit" 
                        class="text-red-600 hover:text-red-900"
                        onclick="return confirm('Are you sure you want to delete this branding configuration?')"
                      >
                        Delete
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