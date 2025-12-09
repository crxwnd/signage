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
import { useToast } from '@/hooks/use-toast';
import { createDisplay } from '@/lib/api/displays';
import { useAreas } from '@/hooks/useAreas'; // IMPORTANTE

// Schema actualizado con areaId
const createDisplaySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  location: z.string().min(1, 'Location is required'),
  areaId: z.string().optional(), // Nuevo campo
  orientation: z.enum(['horizontal', 'vertical']),
  resolution: z.enum(['1920x1080', '3840x2160']),
});

type CreateDisplayFormData = z.infer<typeof createDisplaySchema>;

interface CreateDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDisplayModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDisplayModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const { areas, isLoading: areasLoading } = useAreas({ enabled: isOpen }); // Cargar áreas al abrir

  const [formData, setFormData] = React.useState<CreateDisplayFormData>({
    name: '',
    location: '',
    areaId: '', // Inicializar vacío
    orientation: 'horizontal',
    resolution: '1920x1080',
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CreateDisplayFormData, string>>
  >({});

  const handleChange = (
    field: keyof CreateDisplayFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // 1. Validar
      const result = createDisplaySchema.safeParse(formData);

      if (!result.success) {
        const formattedErrors: Partial<Record<keyof CreateDisplayFormData, string>> = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof CreateDisplayFormData;
          formattedErrors[field] = issue.message;
        });
        setErrors(formattedErrors);
        setIsLoading(false);
        return;
      }

      // 2. Enviar a la API
      // Nota: hotelId debería venir del contexto de auth, por ahora usamos default
      // Enviamos undefined si areaId es string vacío para que el backend lo ignore
      await createDisplay({
        name: result.data.name,
        location: result.data.location,
        hotelId: 'seed-hotel-1', // Temporal, idealmente dinámico
        areaId: result.data.areaId || undefined,
      });

      toast({
        title: 'Success',
        description: 'Display created successfully',
      });

      // 3. Limpiar y cerrar
      setFormData({
        name: '',
        location: '',
        areaId: '',
        orientation: 'horizontal',
        resolution: '1920x1080',
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create display',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Display</DialogTitle>
          <DialogDescription>
            Register a new screen to the signage network.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* NAME */}
          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Lobby Main Screen"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* LOCATION */}
          <div className="grid gap-2">
            <Label htmlFor="location">Location Description</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g. Near the main entrance"
              disabled={isLoading}
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          {/* AREA SELECT (NUEVO) */}
          <div className="grid gap-2">
            <Label htmlFor="area">Area (Optional)</Label>
            <Select
              value={formData.areaId || 'none'}
              onValueChange={(value) => handleChange('areaId', value === 'none' ? '' : value)}
              disabled={isLoading || areasLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={areasLoading ? "Loading areas..." : "Select Area"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Area Assigned</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ORIENTATION & RESOLUTION */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={formData.orientation}
                onValueChange={(value: any) => handleChange('orientation', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select
                value={formData.resolution}
                onValueChange={(value: any) => handleChange('resolution', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1080p (FHD)</SelectItem>
                  <SelectItem value="3840x2160">4K (UHD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Display'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}