import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Upload,
  Download,
  Copy,
  Trash2,
  Edit,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Settings,
  Package
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  productType: string;
  size: string;
  condition: string;
  price: string;
  status: 'active' | 'pending' | 'sold' | 'removed';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  schoolName?: string;
  localityName?: string;
  countyName?: string;
  categoryName?: string;
  imageCount: number;
}

interface BulkOperation {
  type: 'import' | 'update' | 'delete' | 'duplicate';
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  total: number;
  errors: string[];
}

export function ShopBulkTools() {
  const [activeTab, setActiveTab] = useState<'import' | 'manage'>('manage');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation>({
    type: 'import',
    status: 'idle',
    progress: 0,
    total: 0,
    errors: []
  });
  const [importData, setImportData] = useState('');
  const [updateField, setUpdateField] = useState('');
  const [updateValue, setUpdateValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  const fetchListings = async () => {
    try {
      // TODO: Replace with real API call to /api/shop-listings
      // const response = await fetch('/api/shop-listings', { credentials: 'include' });
      // const result = await response.json();
      // if (result.success) {
      //   setListings(result.listings);
      // } else {
      //   toast.error(result.error || 'Failed to load listings');
      // }

      // Mock data for development - replace with real API data
      const mockListings: Listing[] = [
        {
          id: '1',
          title: 'School Jumper - Navy',
          productType: 'Jumper',
          size: 'Age 7-8',
          condition: 'New',
          price: '25.00',
          status: 'active',
          viewCount: 89,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          schoolName: 'Greystones Community NS',
          localityName: 'Greystones',
          countyName: 'Wicklow',
          categoryName: 'Uniform Tops',
          imageCount: 3
        },
        {
          id: '2',
          title: 'PE Kit Complete',
          productType: 'PE Kit',
          size: 'Age 8-9',
          condition: 'Excellent',
          price: '35.00',
          status: 'active',
          viewCount: 67,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          schoolName: 'Greystones Community NS',
          localityName: 'Greystones',
          countyName: 'Wicklow',
          categoryName: 'PE Kit',
          imageCount: 2
        },
        {
          id: '3',
          title: 'School Shoes - Black',
          productType: 'Shoes',
          size: 'UK 2',
          condition: 'Good',
          price: '20.00',
          status: 'pending',
          viewCount: 54,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          schoolName: 'Delgany NS',
          localityName: 'Delgany',
          countyName: 'Wicklow',
          categoryName: 'Footwear',
          imageCount: 1
        }
      ];

      setListings(mockListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setListingsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      toast.success('File loaded successfully');
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!importData.trim()) {
      toast.error('Please provide data to import');
      return;
    }

    setBulkOperation({
      type: 'import',
      status: 'processing',
      progress: 0,
      total: 10, // Mock total
      errors: []
    });

    // Simulate import process
    for (let i = 0; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setBulkOperation(prev => ({
        ...prev,
        progress: i
      }));
    }

    setBulkOperation(prev => ({
      ...prev,
      status: 'completed',
      progress: 10
    }));

    toast.success('Bulk import completed successfully');
  };

  const handleBulkUpdate = async () => {
    if (selectedListings.length === 0) {
      toast.error('Please select listings to update');
      return;
    }

    if (!updateField || !updateValue) {
      toast.error('Please specify field and value to update');
      return;
    }

    setBulkOperation({
      type: 'update',
      status: 'processing',
      progress: 0,
      total: selectedListings.length,
      errors: []
    });

    try {
      // TODO: Replace with real API call to /api/shop-bulk
      // const updates: any = {};
      // if (updateField === 'price') updates.price = updateValue;
      // if (updateField === 'status') updates.status = updateValue;
      // if (updateField === 'conditionId') updates.conditionId = updateValue;
      //
      // const response = await fetch('/api/shop-bulk', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify({
      //     operation: 'update',
      //     listingIds: selectedListings,
      //     updates
      //   })
      // });
      //
      // const result = await response.json();
      // if (result.success) {
      //   // Handle success
      // } else {
      //   // Handle error
      // }

      // Mock successful update for development
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      setBulkOperation(prev => ({
        ...prev,
        status: 'completed',
        progress: selectedListings.length
      }));
      setSelectedListings([]);
      setUpdateField('');
      setUpdateValue('');
      toast.success(`Successfully updated ${selectedListings.length} listings`);
      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error('Error updating listings:', error);
      setBulkOperation(prev => ({
        ...prev,
        status: 'error',
        errors: ['Network error occurred']
      }));
      toast.error('Failed to update listings');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedListings.length === 0) {
      toast.error('Please select listings to delete');
      return;
    }

    setBulkOperation({
      type: 'delete',
      status: 'processing',
      progress: 0,
      total: selectedListings.length,
      errors: []
    });

    try {
      // TODO: Replace with real API call to /api/shop-bulk
      // const response = await fetch('/api/shop-bulk', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify({
      //     operation: 'delete',
      //     listingIds: selectedListings
      //   })
      // });
      //
      // const result = await response.json();
      // if (result.success) {
      //   // Handle success
      // } else {
      //   // Handle error
      // }

      // Mock successful delete for development
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      setBulkOperation(prev => ({
        ...prev,
        status: 'completed',
        progress: selectedListings.length
      }));
      setSelectedListings([]);
      toast.success(`Successfully deleted ${selectedListings.length} listings`);
      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error('Error deleting listings:', error);
      setBulkOperation(prev => ({
        ...prev,
        status: 'error',
        errors: ['Network error occurred']
      }));
      toast.error('Failed to delete listings');
    }
  };

  const handleBulkDuplicate = async () => {
    if (selectedListings.length === 0) {
      toast.error('Please select listings to duplicate');
      return;
    }

    setBulkOperation({
      type: 'duplicate',
      status: 'processing',
      progress: 0,
      total: selectedListings.length,
      errors: []
    });

    try {
      // TODO: Replace with real API call to /api/shop-bulk
      // const response = await fetch('/api/shop-bulk', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify({
      //     operation: 'duplicate',
      //     listingIds: selectedListings
      //   })
      // });
      //
      // const result = await response.json();
      // if (result.success) {
      //   // Handle success
      // } else {
      //   // Handle error
      // }

      // Mock successful duplicate for development
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      setBulkOperation(prev => ({
        ...prev,
        status: 'completed',
        progress: selectedListings.length
      }));
      setSelectedListings([]);
      toast.success(`Successfully duplicated ${selectedListings.length} listings`);
      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error('Error duplicating listings:', error);
      setBulkOperation(prev => ({
        ...prev,
        status: 'error',
        errors: ['Network error occurred']
      }));
      toast.error('Failed to duplicate listings');
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,product_type,size,condition,price,status,school_id
School Jumper,Jumper,Age 7-8,New,25.00,active,school-1
PE Kit,PE Kit,Age 8-9,Excellent,35.00,active,school-1
School Shoes,Shoes,UK 2,Good,20.00,pending,school-2`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listings_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportListings = () => {
    const csvContent = [
      'id,title,product_type,size,condition,price,status,view_count,created_at',
      ...listings.map(listing =>
        `${listing.id},"${listing.title}",${listing.productType},${listing.size},${listing.condition},${listing.price},${listing.status},${listing.viewCount},"${listing.createdAt}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_listings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Listings exported successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Bulk Listing Tools
        </h2>
        <p className="text-muted-foreground mt-1">
          Import, export, and manage multiple listings at once
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'manage' ? 'default' : 'outline'}
          onClick={() => setActiveTab('manage')}
        >
          <Edit className="h-4 w-4 mr-2" />
          Manage Listings
        </Button>
        <Button
          variant={activeTab === 'import' ? 'default' : 'outline'}
          onClick={() => setActiveTab('import')}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import/Export
        </Button>
      </div>

      {activeTab === 'import' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Listings
              </CardTitle>
              <CardDescription>
                Upload a CSV file to bulk import listings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CSV File</Label>
                <Input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-muted-foreground">
                  Select a CSV file with your listings data
                </p>
              </div>

              <div className="space-y-2">
                <Label>Preview Data</Label>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Or paste CSV data directly here..."
                  rows={8}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button
                  onClick={handleBulkImport}
                  disabled={bulkOperation.status === 'processing' || !importData.trim()}
                >
                  {bulkOperation.status === 'processing' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import Listings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Listings
              </CardTitle>
              <CardDescription>
                Download your listings data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export all your current listings to a CSV file for backup or editing.
              </p>

              <div className="space-y-2">
                <Label>Export Options</Label>
                <div className="flex gap-2">
                  <Button onClick={exportListings}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Listings
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">CSV Format</h4>
                <p className="text-sm text-muted-foreground">
                  Your export will include: ID, Title, Product Type, Size, Condition, Price, Status, School ID
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'manage' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Bulk Operations
            </CardTitle>
            <CardDescription>
              Select multiple listings to perform bulk operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Bulk Actions Bar */}
              {selectedListings.length > 0 && (
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedListings.length} listing{selectedListings.length !== 1 ? 's' : ''} selected
                  </span>

                  <div className="flex gap-2 ml-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Bulk Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Update Listings</DialogTitle>
                          <DialogDescription>
                            Update the same field for all selected listings
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Field to Update</Label>
                            <Select value={updateField} onValueChange={setUpdateField}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="price">Price</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                                <SelectItem value="condition">Condition</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>New Value</Label>
                            {updateField === 'price' && (
                              <Input
                                type="number"
                                step="0.01"
                                value={updateValue}
                                onChange={(e) => setUpdateValue(e.target.value)}
                                placeholder="Enter new price"
                              />
                            )}
                            {updateField === 'status' && (
                              <Select value={updateValue} onValueChange={setUpdateValue}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="sold">Sold</SelectItem>
                                  <SelectItem value="removed">Removed</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {updateField === 'condition' && (
                              <Select value={updateValue} onValueChange={setUpdateValue}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="New">New</SelectItem>
                                  <SelectItem value="Excellent">Excellent</SelectItem>
                                  <SelectItem value="Good">Good</SelectItem>
                                  <SelectItem value="Fair">Fair</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          <Button
                            onClick={handleBulkUpdate}
                            disabled={bulkOperation.status === 'processing'}
                            className="w-full"
                          >
                            {bulkOperation.status === 'processing' ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Update {selectedListings.length} Listings
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm" onClick={handleBulkDuplicate}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Listings</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedListings.length} listing{selectedListings.length !== 1 ? 's' : ''}?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              {/* Listings Table */}
              <div className="border rounded-lg">
                {listingsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading listings...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 mb-4" />
                    <p>No listings found</p>
                    <p className="text-sm">Create some listings to use bulk operations</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedListings.length === listings.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedListings(listings.map(l => l.id));
                              } else {
                                setSelectedListings([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Product Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedListings.includes(listing.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedListings([...selectedListings, listing.id]);
                                } else {
                                  setSelectedListings(selectedListings.filter(id => id !== listing.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{listing.title}</TableCell>
                          <TableCell>{listing.productType}</TableCell>
                          <TableCell>{listing.size}</TableCell>
                          <TableCell>{listing.condition}</TableCell>
                          <TableCell>€{listing.price}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                listing.status === 'active' ? 'default' :
                                listing.status === 'pending' ? 'secondary' :
                                listing.status === 'sold' ? 'outline' : 'destructive'
                              }
                            >
                              {listing.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation Progress */}
      {bulkOperation.status !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {bulkOperation.status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
              {bulkOperation.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {bulkOperation.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              Bulk Operation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{bulkOperation.type.charAt(0).toUpperCase() + bulkOperation.type.slice(1)}ing listings...</span>
                <span>{bulkOperation.progress}/{bulkOperation.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(bulkOperation.progress / bulkOperation.total) * 100}%` }}
                />
              </div>
              {bulkOperation.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {bulkOperation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}