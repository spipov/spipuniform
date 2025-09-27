import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { School, MapPin, Plus } from 'lucide-react';

interface SchoolRequestDialogProps {
  countyId: string;
  countyName: string;
  localityId: string;
  localityName: string;
  schoolType: 'primary' | 'secondary';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SchoolRequestDialog({
  countyId,
  countyName,
  localityId,
  localityName,
  schoolType,
  isOpen,
  onClose,
  onSuccess
}: SchoolRequestDialogProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    website: '',
    phone: '',
    email: '',
    additionalInfo: ''
  });

  // Create school request mutation
  const createSchoolRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/spipuniform/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request school');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('School request submitted successfully! We\'ll review and add it soon.');
      setFormData({ name: '', address: '', website: '', phone: '', email: '', additionalInfo: '' });
      queryClient.invalidateQueries({ queryKey: ['schools-by-location-and-type'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleCreateRequest = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter the school name');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Please enter the school address');
      return;
    }

    const requestData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      countyId,
      localityId,
      level: schoolType,
      website: formData.website.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      isActive: false, // School requests start as inactive until approved
      additionalInfo: formData.additionalInfo.trim() || undefined
    };

    createSchoolRequestMutation.mutate(requestData);
  };

  const handleClose = () => {
    setFormData({ name: '', address: '', website: '', phone: '', email: '', additionalInfo: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-blue-500" />
            Request to Add School
          </DialogTitle>
          <DialogDescription>
            Help us add {schoolType} schools to our database. We'll review and approve new schools.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-blue-800">
              <MapPin className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Location: {localityName}, {countyName}</p>
                <p className="text-blue-700">
                  Adding schools helps other parents find and list uniform items in your area.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={`Enter ${schoolType} school name`}
              />
            </div>

            <div>
              <Label htmlFor="schoolAddress">School Address *</Label>
              <Input
                id="schoolAddress"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full school address including street, town"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolWebsite">Website (Optional)</Label>
                <Input
                  id="schoolWebsite"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://schoolwebsite.ie"
                />
              </div>

              <div>
                <Label htmlFor="schoolPhone">Phone (Optional)</Label>
                <Input
                  id="schoolPhone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="School phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="schoolEmail">Email (Optional)</Label>
              <Input
                id="schoolEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="School email address"
              />
            </div>

            <div>
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="Any additional details that might help us verify the school"
                rows={2}
              />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-green-800">
              <Plus className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">What happens next?</p>
                <p className="text-green-700">
                  We'll review your request and add the school to our database.
                  You'll be able to use it for listings and requests once approved.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateRequest}
            disabled={createSchoolRequestMutation.isPending || !formData.name.trim() || !formData.address.trim()}
          >
            {createSchoolRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}