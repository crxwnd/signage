'use client';

import { useState } from 'react';
import { useCreateHotel } from '@/hooks/useHotels';
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
import { Loader2 } from 'lucide-react';

interface CreateHotelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateHotelModal({ open, onOpenChange }: CreateHotelModalProps) {
    const createHotel = useCreateHotel();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await createHotel.mutateAsync({
            name: formData.name,
            address: formData.address,
        });

        setFormData({ name: '', address: '' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Hotel</DialogTitle>
                    <DialogDescription>
                        Add a new hotel to the signage network
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Hotel Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Grand Hotel"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Main Street, City"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createHotel.isPending}>
                            {createHotel.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Create Hotel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
