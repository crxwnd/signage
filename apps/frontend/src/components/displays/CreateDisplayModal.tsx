/**
 * CreateDisplayModal Component
 * Modal to create a new display
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createDisplay } from '@/lib/api/displays';

const displayFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters').max(200, 'Location must be less than 200 characters'),
  deviceInfo: z.string().optional(),
});

type DisplayFormValues = z.infer<typeof displayFormSchema>;

interface CreateDisplayModalProps {
  hotelId?: string;
  onSuccess?: () => void;
}

export function CreateDisplayModal({ hotelId, onSuccess }: CreateDisplayModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues: {
      name: '',
      location: '',
      deviceInfo: '',
    },
  });

  async function onSubmit(data: DisplayFormValues) {
    if (!hotelId) {
      toast.error('Missing configuration', {
        description: 'No hotel ID available to create display',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Parse deviceInfo as JSON if provided
      let deviceInfoParsed: Record<string, unknown> | undefined = undefined;
      if (data.deviceInfo) {
        try {
          deviceInfoParsed = JSON.parse(data.deviceInfo);
        } catch {
          // If not valid JSON, treat as a simple object with a note
          deviceInfoParsed = { note: data.deviceInfo };
        }
      }

      await createDisplay({
        name: data.name,
        location: data.location,
        hotelId,
        areaId: null, // As per requirements
        deviceInfo: deviceInfoParsed,
      });

      toast.success('Display created', {
        description: 'The new display has been successfully added.',
      });

      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create display:', error);
      toast.error('Failed to create display', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isSubmitDisabled = isLoading || !hotelId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#254D6E] hover:bg-[#254D6E]/90 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Display
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#EDECE4]/95 backdrop-blur-sm border-[#B88F69]/20">
        <DialogHeader>
          <DialogTitle className="text-[#254D6E]">Add New Display</DialogTitle>
          <DialogDescription>
            Create a new display configuration for your digital signage network.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#254D6E]">Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lobby Main Display" {...field} className="bg-white/50 border-[#254D6E]/20 focus:border-[#254D6E]" />
                  </FormControl>
                  <FormDescription>
                    A unique name to identify this display.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#254D6E]">Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Entrance, First Floor" {...field} className="bg-white/50 border-[#254D6E]/20 focus:border-[#254D6E]" />
                  </FormControl>
                  <FormDescription>
                    Physical location of the device.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#254D6E]">Device Info (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"model": "Samsung QM55", "ip": "192.168.1.100"}'
                      className="resize-none bg-white/50 border-[#254D6E]/20 focus:border-[#254D6E]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional technical details (JSON or text).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!hotelId && (
               <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Cannot create display: No Hotel ID found. Ensure there is at least one display or hotel configured.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-[#254D6E]/20 text-[#254D6E] hover:bg-[#254D6E]/5">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitDisabled} className="bg-[#254D6E] hover:bg-[#254D6E]/90 text-white">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Display
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
