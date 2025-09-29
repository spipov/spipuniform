import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { LocalitySearch } from '@/components/shared/locality-search';

interface County {
  id: string;
  name: string;
}

interface SchoolFormData {
  name: string;
  address: string;
  level: 'primary' | 'secondary' | 'mixed';
  website: string;
  phone: string;
  email: string;
  isActive: boolean;
}

interface SchoolCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SchoolCreationDialog({ open, onOpenChange, onSuccess }: SchoolCreationDialogProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');
  const [selectedLocalityName, setSelectedLocalityName] = useState<string>('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    address: '',
    level: 'primary',
    website: '',
    phone: '',
    email: '',
    isActive: true
  });

  const { data: counties } = useQuery<County[]>({
    queryKey: ['counties'],
    queryFn: async () => {
      const response = await fetch('/api/counties');
      if (!response.ok) throw new Error('Failed to fetch counties');
      const data = await response.json();
      return data.counties || [];
    },
  });

  const createSchool = useMutation({
    mutationFn: async (schoolData: any) => {
      const response = await fetch('/api/spipuniform/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create school');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('School created successfully!');
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      handleClose();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create school');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounty) {
      toast.error('Please select a county');
      return;
    }
    if (!selectedLocalityName) {
      toast.error('Please select a locality');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Please enter a school name');
      return;
    }

    let finalAddress = formData.address.trim();
    if (selectedLocalityName && !finalAddress.toLowerCase().includes(selectedLocalityName.toLowerCase())) {
      finalAddress = finalAddress ? `${finalAddress}, ${selectedLocalityName}` : selectedLocalityName;
    }

    createSchool.mutate({
      name: formData.name.trim(),
      address: finalAddress,
      countyId: selectedCounty,
      localityName: selectedLocalityName,
      level: formData.level,
      website: formData.website.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      isActive: formData.isActive
    });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      level: 'primary',
      website: '',
      phone: '',
      email: '',
      isActive: true
    });
    setSelectedCounty('');
    setSelectedLocalityId('');
    setSelectedLocalityName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto school-creation-dialog">
        <DialogHeader>
          <DialogTitle>Create New School</DialogTitle>
          <DialogDescription>
            Add a new school to the system. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="county">County *</Label>
            <Select value={selectedCounty} onValueChange={(value) => {
              setSelectedCounty(value);
              setSelectedLocalityId('');
              setSelectedLocalityName('');
            }}>
              <SelectTrigger id="county">
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {counties?.map((county) => (
                  <SelectItem key={county.id} value={county.id}>{county.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCounty && (
            <LocalitySearch
              countyId={selectedCounty}
              value={selectedLocalityId}
              onChange={(id, name) => {
                setSelectedLocalityId(id);
                setSelectedLocalityName(name);
              }}
              label="Town/Locality *"
              placeholder="Type to search localities..."
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="school-name">School Name *</Label>
            <Input id="school-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., St. Mary's Primary School" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-level">School Level *</Label>
            <Select value={formData.level} onValueChange={(value: 'primary' | 'secondary' | 'mixed') => setFormData({ ...formData, level: value })}>
              <SelectTrigger id="school-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Street address (locality will be added automatically)" rows={2} />
            {selectedLocalityName && (<p className="text-xs text-muted-foreground">Will be combined with: {selectedLocalityName}</p>)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+353 1 234 5678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="info@school.ie" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="is-active" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })} />
            <Label htmlFor="is-active" className="text-sm font-normal cursor-pointer">Mark as active (visible in marketplace)</Label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={createSchool.isPending}>
              {createSchool.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create School
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
