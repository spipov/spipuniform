import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  Row,
  HeaderGroup,
  Cell,
} from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Search,
  School,
  MapPin,
  ExternalLink,
  Eye,
  Edit,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Building,
  Plus,
  CheckCircle,
  X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SchoolCreationDialog } from '@/components/school-creation-dialog';

interface EnhancedSchool {
  id: string;
  name: string;
  address?: string;
  countyId?: string;
  localityId?: string;
  level?: 'primary' | 'secondary' | 'mixed';
  website?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  listingCount: number;
  associatedAccountsCount: number;
  countyName?: string;
  localityName?: string;
}

interface SchoolFormData {
  name: string;
  address: string;
  level: 'primary' | 'secondary' | 'mixed';
  website: string;
  phone: string;
  email: string;
}

const columnHelper = createColumnHelper<EnhancedSchool>();

export function SchoolManagementTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<EnhancedSchool | null>(null);
  const [editingSchool, setEditingSchool] = useState<EnhancedSchool | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Check if mobile
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  // Fetch enhanced schools data
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools-enhanced'],
    queryFn: async () => {
      const response = await fetch('/api/schools');
      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      return data.schools || [];
    },
  });

  // Update school mutation
  const updateSchool = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SchoolFormData> }) => {
      const response = await fetch(`/api/schools/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update school');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-enhanced'] });
      toast.success('School updated successfully');
      setShowEditDialog(false);
      setEditingSchool(null);
    },
    onError: () => {
      toast.error('Failed to update school');
    },
  });

  // Activate school mutation
  const activateSchool = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/schools/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (!response.ok) throw new Error('Failed to activate school');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-enhanced'] });
      toast.success('School activated successfully');
    },
    onError: () => {
      toast.error('Failed to activate school');
    },
  });

  // Hide school mutation
  const hideSchool = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/schools/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (!response.ok) throw new Error('Failed to hide school');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-enhanced'] });
      toast.success('School hidden successfully');
    },
    onError: () => {
      toast.error('Failed to hide school');
    },
  });

  const columns = useMemo<ColumnDef<EnhancedSchool, any>[]>(() => [
    columnHelper.accessor('name', {
      header: 'School Name',
      cell: ({ getValue, row }: { getValue: () => any; row: Row<EnhancedSchool> }) => (
        <div className="flex items-center gap-2">
          <School className="h-4 w-4 text-primary" />
          <span className="font-medium">{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('localityName', {
      header: 'Locality',
      cell: ({ getValue }: { getValue: () => any }) => getValue() || 'Not specified',
    }),
    columnHelper.accessor('countyName', {
      header: 'County',
      cell: ({ getValue }: { getValue: () => any }) => getValue() || 'Not specified',
    }),
    columnHelper.accessor('listingCount', {
      header: 'Listings',
      cell: ({ getValue }: { getValue: () => any }) => (
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('associatedAccountsCount', {
      header: 'Accounts',
      cell: ({ getValue }: { getValue: () => any }) => (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('level', {
      header: 'Level',
      cell: ({ getValue }: { getValue: () => any }) => (
        <Badge variant="outline">
          {getValue() || 'Not specified'}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: Row<EnhancedSchool> }) => (
        <div className="flex items-center gap-2">
          {!row.original.isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => activateSchool.mutate(row.original.id)}
              disabled={activateSchool.isPending}
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          {row.original.isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hideSchool.mutate(row.original.id)}
              disabled={hideSchool.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSchool(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingSchool(row.original);
              setShowEditDialog(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.original.website && (
            <Button variant="ghost" size="sm" asChild>
              <a href={row.original.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: schools,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSchool) return;

    const formData = new FormData(e.currentTarget);
    const data: Partial<SchoolFormData> = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      level: formData.get('level') as 'primary' | 'secondary' | 'mixed',
      website: formData.get('website') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    };

    updateSchool.mutate({ id: editingSchool.id, data });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schools Management</CardTitle>
          <CardDescription>Manage activated schools in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Schools Management</CardTitle>
            <CardDescription>
              Manage activated schools in the system ({schools.length} schools) - Only shows schools created through proper channels
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(String(event.target.value))}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create School
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {schools.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activated schools found</p>
          </div>
        ) : isMobile ? (
          // Mobile accordion view
          <div className="space-y-3">
            {table.getFilteredRowModel().rows.map((row: Row<EnhancedSchool>) => (
              <div key={row.id} className="border rounded-lg p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => {
                    const newExpanded = new Set(expandedRows);
                    if (newExpanded.has(row.id)) {
                      newExpanded.delete(row.id);
                    } else {
                      newExpanded.add(row.id);
                    }
                    setExpandedRows(newExpanded);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">{row.original.name}</h4>
                  </div>
                  {expandedRows.has(row.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
                {expandedRows.has(row.id) && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Locality:</span>
                        <p className="text-muted-foreground">{row.original.localityName || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium">County:</span>
                        <p className="text-muted-foreground">{row.original.countyName || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Listings:</span>
                        <p className="text-muted-foreground">{row.original.listingCount}</p>
                      </div>
                      <div>
                        <span className="font-medium">Accounts:</span>
                        <p className="text-muted-foreground">{row.original.associatedAccountsCount}</p>
                      </div>
                      <div>
                        <span className="font-medium">Level:</span>
                        <Badge variant="outline" className="mt-1">
                          {row.original.level || 'Not specified'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 flex-wrap">
                      {!row.original.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activateSchool.mutate(row.original.id)}
                          disabled={activateSchool.isPending}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activate
                        </Button>
                      )}
                      {row.original.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => hideSchool.mutate(row.original.id)}
                          disabled={hideSchool.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Hide
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSchool(row.original)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSchool(row.original);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {row.original.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={row.original.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Desktop table view
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup: HeaderGroup<EnhancedSchool>) => (
                  <tr key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row: Row<EnhancedSchool>) => (
                    <tr key={row.id} className="border-b transition-colors hover:bg-muted/50">
                      {row.getVisibleCells().map((cell: Cell<EnhancedSchool, any>) => (
                        <td key={cell.id} className="p-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* School Detail Dialog */}
      <Dialog open={!!selectedSchool} onOpenChange={() => setSelectedSchool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>School Details</DialogTitle>
            <DialogDescription>
              View detailed information about this school
            </DialogDescription>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{selectedSchool.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Level</Label>
                  <p className="text-sm">{selectedSchool.level || 'Not specified'}</p>
                </div>
              </div>
              {selectedSchool.address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm">{selectedSchool.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Locality</Label>
                  <p className="text-sm">{selectedSchool.localityName || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">County</Label>
                  <p className="text-sm">{selectedSchool.countyName || 'Not specified'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Listings</Label>
                  <p className="text-sm">{selectedSchool.listingCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Associated Accounts</Label>
                  <p className="text-sm">{selectedSchool.associatedAccountsCount}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedSchool.website && (
                  <div>
                    <Label className="text-sm font-medium">Website</Label>
                    <p className="text-sm">
                      <a href={selectedSchool.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedSchool.website}
                      </a>
                    </p>
                  </div>
                )}
                {selectedSchool.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedSchool.phone}</p>
                  </div>
                )}
              </div>
              {selectedSchool.email && (
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedSchool.email}</p>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(selectedSchool.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedSchool(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit School Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
            <DialogDescription>
              Update school information
            </DialogDescription>
          </DialogHeader>
          {editingSchool && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">School Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingSchool.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select name="level" defaultValue={editingSchool.level || 'primary'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={editingSchool.address || ''}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    defaultValue={editingSchool.website || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={editingSchool.phone || ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingSchool.email || ''}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateSchool.isPending}
                >
                  {updateSchool.isPending ? 'Updating...' : 'Update School'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* School Creation Dialog */}
      <SchoolCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          // Refresh the schools data
          queryClient.invalidateQueries({ queryKey: ['schools-enhanced'] });
        }}
      />
    </Card>
  );
}