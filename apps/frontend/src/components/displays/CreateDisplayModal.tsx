/**
 * Create Display Modal
 * Modal form for creating new display devices
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  toast,
} from '@/components/ui';
import { createDisplay, getDisplays } from '@/lib/api/displays';
import { getAreas } from '@/lib/api/areas';
import type { CreateDisplayPayload, Area } from '@shared-types';

// Validation schema
const createDisplaySchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  location: z
    .string()
    .min(3, 'Location must be at least 3 characters')
    .max(200, 'Location must not exceed 200 characters'),
  areaId: z.string().optional(),
  deviceInfo: z.string().optional(),
});

type CreateDisplayFormValues = z.infer<typeof createDisplaySchema>;

interface CreateDisplayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Modal component for creating new displays
 */
export function CreateDisplayModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateDisplayModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Use seed hotel ID as default fallback
  const [hotelId, setHotelId] = useState<string>('seed-hotel-1');
  const [areas, setAreas] = useState<Area[]>([]);

  const form = useForm<CreateDisplayFormValues>({
    resolver: zodResolver(createDisplaySchema),
    defaultValues: {
      name: '',
      location: '',
      areaId: '',
      deviceInfo: '',
    },
  });

  // Fetch hotelId and areas from existing displays
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch hotelId from first display
        const response = await getDisplays({}, { page: 1, limit: 1 });
        let fetchedHotelId = 'seed-hotel-1';

        if (response.items.length > 0 && response.items[0]) {
          console.log('Fetched hotelId from existing display:', response.items[0].hotelId);
          fetchedHotelId = response.items[0].hotelId;
          setHotelId(fetchedHotelId);
        } else {
          console.log('No existing displays, using default hotelId: seed-hotel-1');
        }

        // Fetch areas for this hotel
        const areasData = await getAreas(fetchedHotelId);
        console.log('Fetched areas:', areasData);
        setAreas(areasData);
      } catch (error) {
        console.error('Failed to fetch data, using defaults:', error);
      }
    }

    fetchData();
  }, []);

  async function onSubmit(values: CreateDisplayFormValues) {
    setIsLoading(true);

    try {
      // Prepare payload for API
      const payload: CreateDisplayPayload = {
        name: values.name,
        location: values.location,
        hotelId: hotelId,
        areaId: values.areaId && values.areaId.trim() !== '' ? values.areaId : null,
      };

      console.log('Creating display with payload:', payload);

      await createDisplay(payload);

      toast({
        title: 'Display created',
        description: `${values.name} has been successfully created.`,
      });

      // Reset form and close modal
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Failed to create display',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        style={{
          background:
            'linear-gradient(135deg, rgba(237, 236, 228, 0.95) 0%, rgba(184, 143, 105, 0.85) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(37, 77, 110, 0.2)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: '#254D6E' }}>Add New Display</DialogTitle>
          <DialogDescription>
            Create a new display device for your hotel signage system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#254D6E' }}>
                    Display Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Lobby Main Display"
                      {...field}
                      disabled={isLoading}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: form.formState.errors.name
                          ? '#ef4444'
                          : 'rgba(37, 77, 110, 0.2)',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Field */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#254D6E' }}>
                    Location <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Main Lobby - Entrance"
                      {...field}
                      disabled={isLoading}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: form.formState.errors.location
                          ? '#ef4444'
                          : 'rgba(37, 77, 110, 0.2)',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Area ID Field */}
            <FormField
              control={form.control}
              name="areaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#254D6E' }}>Area</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderColor: 'rgba(37, 77, 110, 0.2)',
                        }}
                      >
                        <SelectValue placeholder="Select an area (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {areas.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          Loading areas...
                        </SelectItem>
                      ) : (
                        areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Assign the display to a specific area of the hotel
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Device Info Field */}
            <FormField
              control={form.control}
              name="deviceInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#254D6E' }}>Device Info</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Samsung SmartTV 55&quot; Model XYZ123"
                      className="resize-none"
                      {...field}
                      disabled={isLoading}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: 'rgba(37, 77, 110, 0.2)',
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about the device hardware
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isLoading}
                style={{
                  borderColor: '#254D6E',
                  color: '#254D6E',
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: '#254D6E',
                  color: '#EDECE4',
                }}
                className="hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Display
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
