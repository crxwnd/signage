'use client';

import * as React from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Validation schema for display creation form
 */
const createDisplaySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  location: z.string().min(1, 'Location is required'),
  orientation: z.enum(['horizontal', 'vertical']),
  resolution: z.enum(['1920x1080', '3840x2160']),
});

type CreateDisplayFormData = z.infer<typeof createDisplaySchema>;

interface CreateDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal component for creating a new display
 *
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback when modal closes
 * @param onSuccess - Optional callback when display is created successfully
 */
export function CreateDisplayModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDisplayModalProps) {
  const [formData, setFormData] = React.useState<CreateDisplayFormData>({
    name: '',
    location: '',
    orientation: 'horizontal',
    resolution: '1920x1080',
  });
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CreateDisplayFormData, string>>
  >({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  /**
   * Reset form state when modal closes
   */
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        location: '',
        orientation: 'horizontal',
        resolution: '1920x1080',
      });
      setErrors({});
      setErrorMessage(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  /**
   * Handle form field changes
   */
  const handleChange = (
    field: keyof CreateDisplayFormData,
    value: string
  ) => {
    setFormData((prev: CreateDisplayFormData) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev: Partial<Record<keyof CreateDisplayFormData, string>>) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrors({});

    // Validate form data
    const result = createDisplaySchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateDisplayFormData, string>> =
        {};
      result.error.issues.forEach((error) => {
        const field = error.path[0] as keyof CreateDisplayFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      console.log('Form data:', result.data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      console.log('Display created successfully!');
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('Error creating display:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to create display'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Display</DialogTitle>
          <DialogDescription>
            Add a new display to your signage system. Fill in the required
            information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Name Field */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Lobby Display 1"
                disabled={isLoading}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Location Field */}
            <div className="grid gap-2">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. Main Lobby, Reception Area"
                disabled={isLoading}
                className={errors.location ? 'border-destructive' : ''}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>

            {/* Orientation Field */}
            <div className="grid gap-2">
              <Label htmlFor="orientation">
                Orientation <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.orientation}
                onValueChange={(value) =>
                  handleChange('orientation', value as 'horizontal' | 'vertical')
                }
                disabled={isLoading}
              >
                <SelectTrigger id="orientation">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
              {errors.orientation && (
                <p className="text-sm text-destructive">{errors.orientation}</p>
              )}
            </div>

            {/* Resolution Field */}
            <div className="grid gap-2">
              <Label htmlFor="resolution">
                Resolution <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.resolution}
                onValueChange={(value) =>
                  handleChange(
                    'resolution',
                    value as '1920x1080' | '3840x2160'
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger id="resolution">
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                  <SelectItem value="3840x2160">3840x2160 (4K UHD)</SelectItem>
                </SelectContent>
              </Select>
              {errors.resolution && (
                <p className="text-sm text-destructive">{errors.resolution}</p>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-md bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Display'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
