import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SchoolStockManager } from '@/components/spipuniform/schools/StockManager';
import { School, AlertCircle, CheckCircle, Search, MapPin } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

interface SchoolOwnerInfo {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolLevel: string;
  role: string;
  isActive: boolean;
  localityName?: string;
  countyName?: string;
}

export const Route = createFileRoute('/dashboard/spipuniform/school-stock')({
  component: SchoolStockPage,
});

const columnHelper = createColumnHelper<SchoolOwnerInfo>();

function SchoolStockPage() {
  const { data: session } = useSession();
  const [schoolOwners, setSchoolOwners] = useState<SchoolOwnerInfo[]>([]);
  const [allSchools, setAllSchools] = useState<SchoolOwnerInfo[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Calculate available schools
  const availableSchools = isAdmin ? allSchools : schoolOwners.filter(so => so.isActive);

  // Define table columns - must be defined before useReactTable
  const columns = useMemo<ColumnDef<SchoolOwnerInfo, any>[]>(() => [
    columnHelper.accessor('schoolName', {
      header: 'School Name',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <School className="h-4 w-4 text-primary" />
          <span className="font-medium">{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('localityName', {
      header: 'Locality',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span>{getValue() || 'Not specified'}</span>
        </div>
      ),
    }),
    columnHelper.accessor('countyName', {
      header: 'County',
      cell: ({ getValue }) => getValue() || 'Not specified',
    }),
    columnHelper.accessor('schoolLevel', {
      header: 'Level',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="capitalize">
          {getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Your Role',
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="capitalize">
          {getValue()}
        </Badge>
      ),
    }),
  ], []);

  // Create table instance - must be called after columns are defined
  const table = useReactTable({
    data: availableSchools,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const fetchSchoolOwnerInfo = async () => {
    try {
      // First check if user is admin - admins should have access to all schools
      const permsResponse = await fetch('/api/auth/permissions', {
        credentials: 'include'
      });
      const permsData = await permsResponse.json();

      const userIsAdmin = permsData.role?.toLowerCase() === 'admin' || session?.user?.email === 'admin@admin.com' || permsData.role?.toLowerCase() === 'system_admin';
      setIsAdmin(userIsAdmin);

      if (userIsAdmin) {
        // Admin user - fetch all schools they can manage
        try {
          const schoolsResponse = await fetch('/api/spipuniform/schools', {
            credentials: 'include'
          });
          const schoolsData = await schoolsResponse.json();

          if (schoolsData.success) {
           // Convert schools to SchoolOwnerInfo format for admins
           const adminSchools: SchoolOwnerInfo[] = schoolsData.schools.map((school: any) => ({
             id: `admin-${school.id}`,
             schoolId: school.id,
             schoolName: school.name,
             schoolLevel: school.level,
             role: 'admin',
             isActive: true,
             localityName: school.localityName,
             countyName: school.countyName
           }));
           setAllSchools(adminSchools);
           setSchoolOwners(adminSchools);

            // Auto-select the first school if available
            if (adminSchools.length > 0 && !selectedSchoolId) {
              setSelectedSchoolId(adminSchools[0].schoolId);
            }
          }
        } catch (schoolsError) {
          console.error('Error fetching schools for admin:', schoolsError);
        }
        setLoading(false);
        return;
      }

      // Regular user - check school owner relationships
      const response = await fetch('/api/spipuniform/admin/school-owners?userId=' + session?.user?.id, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setSchoolOwners(data.schoolOwners || []);
        // Auto-select the first active school if available
        const activeSchools = data.schoolOwners.filter((so: SchoolOwnerInfo) => so.isActive);
        if (activeSchools.length > 0 && !selectedSchoolId) {
          setSelectedSchoolId(activeSchools[0].schoolId);
        }
      }
    } catch (error) {
      console.error('Error fetching school owner info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchSchoolOwnerInfo();
    }
  }, [session?.user?.id]);



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading school information...</span>
        </div>
      </div>
    );
  }



  if (!isAdmin && availableSchools.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <School className="h-8 w-8" />
            School Stock Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage leftover uniform items for your school
          </p>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No School Access</h3>
            <p className="text-muted-foreground mb-4">
              You haven't been designated as a school owner or manager yet.
              Contact an administrator to get access to school stock management.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>School owners can list leftover uniform items for their school community.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedSchool = availableSchools.find(so => so.schoolId === selectedSchoolId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <School className="h-8 w-8" />
            School Stock Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage leftover uniform items for your school
          </p>
        </div>


      </div>

      {/* School Selection Table */}
      <Card className="stock-mgmt__school-selector">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Select School
              </CardTitle>
              <CardDescription>
                Choose from your available schools ({availableSchools.length} schools)
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(String(event.target.value))}
                className="pl-8 w-64 stock-mgmt__search-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border stock-mgmt__table">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedSchoolId === row.original.schoolId ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedSchoolId(row.original.schoolId)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <School className="h-8 w-8 opacity-50" />
                        <p>No schools found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* School Info Card */}
      {selectedSchool && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Managing {selectedSchool.schoolName}
            </CardTitle>
            <CardDescription>
              You have {selectedSchool.role} access to manage stock for this school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{selectedSchool.schoolLevel}</Badge>
              <Badge variant="outline">{selectedSchool.role}</Badge>
              <span className="text-sm text-muted-foreground">
                School ID: {selectedSchool.schoolId}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* School Stock Manager */}
      {selectedSchoolId && (
        <SchoolStockManager
          schoolId={selectedSchoolId}
          userId={session?.user?.id || ''}
        />
      )}

      {/* Multiple Schools Info */}
      {availableSchools.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your School Access</CardTitle>
            <CardDescription>
              {isAdmin ? 'You can manage stock for all schools as an administrator' : 'You have access to manage stock for multiple schools'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {availableSchools.map((schoolOwner) => (
                <div key={schoolOwner.schoolId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{schoolOwner.schoolName}</div>
                      <div className="text-sm text-muted-foreground">{schoolOwner.schoolLevel}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{schoolOwner.role}</Badge>
                    {schoolOwner.schoolId === selectedSchoolId && (
                      <Badge className="bg-primary">Active</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}