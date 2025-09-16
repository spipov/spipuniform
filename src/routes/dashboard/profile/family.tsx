import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, School, Calendar, Ruler, MoreHorizontal, Baby } from 'lucide-react';

interface FamilyMember {
  id: string;
  userProfileId: string;
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  schoolId?: string;
  schoolYear?: string;
  currentSizes?: Record<string, string>;
  growthNotes?: string;
  showInProfile: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute('/dashboard/profile/family')({
  component: FamilyPage,
});

function FamilyPage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    schoolId: '',
    schoolYear: '',
    currentSizes: {} as Record<string, string>,
    growthNotes: '',
    showInProfile: true,
    isActive: true
  });

  const sizeCategories = [
    'Shirt',
    'Trousers',
    'Skirt',
    'Shoes',
    'Jumper',
    'Blazer',
    'PE Kit',
    'School Bag'
  ];

  const schoolYears = [
    'Junior Infants',
    'Senior Infants',
    '1st Class',
    '2nd Class',
    '3rd Class',
    '4th Class',
    '5th Class',
    '6th Class',
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    '5th Year',
    '6th Year'
  ];

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/family-members', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
      } else {
        toast.error('Failed to load family members');
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      schoolId: '',
      schoolYear: '',
      currentSizes: {},
      growthNotes: '',
      showInProfile: true,
      isActive: true
    });
    setEditingMember(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName || '',
      dateOfBirth: member.dateOfBirth || '',
      schoolId: member.schoolId || '',
      schoolYear: member.schoolYear || '',
      currentSizes: member.currentSizes || {},
      growthNotes: member.growthNotes || '',
      showInProfile: member.showInProfile,
      isActive: member.isActive
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setSaving(true);
    
    try {
      const url = editingMember 
        ? `/api/family-members/${editingMember.id}`
        : '/api/family-members';
      
      const method = editingMember ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingMember ? 'Family member updated' : 'Family member added');
        setIsDialogOpen(false);
        resetForm();
        fetchFamilyMembers();
      } else {
        toast.error(data.error || 'Failed to save family member');
      }
    } catch (error) {
      console.error('Error saving family member:', error);
      toast.error('Failed to save family member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) return;
    
    try {
      const response = await fetch(`/api/family-members/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Family member removed');
        fetchFamilyMembers();
      } else {
        toast.error(data.error || 'Failed to remove family member');
      }
    } catch (error) {
      console.error('Error deleting family member:', error);
      toast.error('Failed to remove family member');
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const updateSize = (category: string, size: string) => {
    setFormData({
      ...formData,
      currentSizes: {
        ...formData.currentSizes,
        [category]: size
      }
    });
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Family Members
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your children's details and uniform requirements
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Family Member
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : familyMembers.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Baby className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No family members added yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your children's details to track their uniform sizes and school information
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Family Member
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {familyMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Baby className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {member.firstName} {member.lastName}
                        </h3>
                        {!member.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {!member.showInProfile && (
                          <Badge variant="outline">Hidden</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {member.dateOfBirth && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Age {calculateAge(member.dateOfBirth)} 
                              ({new Date(member.dateOfBirth).toLocaleDateString()})
                            </span>
                          </div>
                        )}
                        
                        {member.schoolYear && (
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4" />
                            <span>{member.schoolYear}</span>
                          </div>
                        )}
                        
                        {member.currentSizes && Object.keys(member.currentSizes).length > 0 && (
                          <div className="flex items-start gap-2">
                            <Ruler className="h-4 w-4 mt-0.5" />
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(member.currentSizes).map(([category, size]) => (
                                <Badge key={category} variant="secondary" className="text-xs">
                                  {category}: {size}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {member.growthNotes && (
                          <div className="text-sm">
                            <span className="font-medium">Notes:</span> {member.growthNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(member)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Edit Family Member' : 'Add Family Member'}
            </DialogTitle>
            <DialogDescription>
              {editingMember 
                ? 'Update your family member\'s details and uniform sizes.'
                : 'Add your child\'s details to track their uniform requirements.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolYear">School Year</Label>
                  <Select value={formData.schoolYear} onValueChange={(value) => setFormData({...formData, schoolYear: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school year" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Current Sizes</Label>
                <div className="grid grid-cols-2 gap-3">
                  {sizeCategories.map((category) => (
                    <div key={category} className="space-y-1">
                      <Label className="text-sm">{category}</Label>
                      <Input
                        value={formData.currentSizes[category] || ''}
                        onChange={(e) => updateSize(category, e.target.value)}
                        placeholder={`${category} size`}
                        className="h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="growthNotes">Growth Notes</Label>
                <Input
                  id="growthNotes"
                  value={formData.growthNotes}
                  onChange={(e) => setFormData({...formData, growthNotes: e.target.value})}
                  placeholder="e.g., Growing fast, may need bigger soon"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showInProfile"
                    checked={formData.showInProfile}
                    onCheckedChange={(checked) => setFormData({...formData, showInProfile: checked})}
                  />
                  <Label htmlFor="showInProfile">Show in profile</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : (editingMember ? 'Update' : 'Add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}