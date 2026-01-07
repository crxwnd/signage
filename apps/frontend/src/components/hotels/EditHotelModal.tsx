'use client';

import { useState, useEffect } from 'react';
import { useUpdateHotel } from '@/hooks/useHotels';
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
import type { Hotel } from '@/lib/api/hotels';

interface EditHotelModalProps {
    hotel: Hotel;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditHotelModal({ hotel, open, onOpenChange }: EditHotelModalProps) {
    const updateHotel = useUpdateHotel();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
    });

    useEffect(() => {
        if (hotel) {
            setFormData({
                name: hotel.name,
                address: hotel.address,
            });
        }
    }, [hotel]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await updateHotel.mutateAsync({
            id: hotel.id,
            data: {
                name: formData.name,
                address: formData.address,
            },
        });

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Hotel</DialogTitle>
                    <DialogDescription>
                        Update hotel information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Hotel Name *</Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-address">Address *</Label>
                        <Input
                            id="edit-address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateHotel.isPending}>
                            {updateHotel.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
