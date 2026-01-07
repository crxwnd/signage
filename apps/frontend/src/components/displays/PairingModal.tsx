'use client';

/**
 * PairingModal Component
 * UI for pairing physical displays with the signage system
 */

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Link2, QrCode, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PairingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    displays: Array<{ id: string; name: string; status: string }>;
    onSuccess: () => void;
}

export function PairingModal({ open, onOpenChange, displays, onSuccess }: PairingModalProps) {
    const [mode, setMode] = useState<'code' | 'qr'>('code');
    const [pairingCode, setPairingCode] = useState('');
    const [selectedDisplayId, setSelectedDisplayId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Filter to show only offline/unpaired displays
    const availableDisplays = displays.filter(d => d.status === 'OFFLINE');

    const handlePair = async () => {
        if (!pairingCode || !selectedDisplayId) {
            toast.error('Please enter the pairing code and select a display');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authenticatedFetch(`${API_URL}/api/displays/confirm-pairing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: pairingCode.toUpperCase(),
                    displayId: selectedDisplayId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Display paired successfully!');
                setPairingCode('');
                setSelectedDisplayId('');
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(data.error?.message || 'Failed to pair display');
            }
        } catch (error) {
            toast.error('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Generate QR with pairing URL for the selected display
    const qrValue = selectedDisplayId
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pair?displayId=${selectedDisplayId}`
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        Pair Display
                    </DialogTitle>
                    <DialogDescription>
                        Connect a physical display to your signage network
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <Button
                        variant={mode === 'code' ? 'default' : 'ghost'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setMode('code')}
                    >
                        <Keyboard className="h-4 w-4 mr-2" />
                        Enter Code
                    </Button>
                    <Button
                        variant={mode === 'qr' ? 'default' : 'ghost'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setMode('qr')}
                    >
                        <QrCode className="h-4 w-4 mr-2" />
                        Show QR
                    </Button>
                </div>

                <div className="space-y-4 py-4">
                    {/* Select Display */}
                    <div className="space-y-2">
                        <Label>Select Display to Pair</Label>
                        <Select value={selectedDisplayId} onValueChange={setSelectedDisplayId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a display..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableDisplays.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        No offline displays available
                                    </SelectItem>
                                ) : (
                                    availableDisplays.map((display) => (
                                        <SelectItem key={display.id} value={display.id}>
                                            {display.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Only offline displays can be paired
                        </p>
                    </div>

                    {mode === 'code' ? (
                        /* Code Entry Mode */
                        <div className="space-y-2">
                            <Label>Pairing Code</Label>
                            <Input
                                placeholder="Enter 6-character code (e.g., 1ML93L)"
                                value={pairingCode}
                                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                className="text-center text-2xl font-mono tracking-widest"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the code displayed on your SmartTV screen
                            </p>
                        </div>
                    ) : (
                        /* QR Code Mode */
                        <div className="space-y-2">
                            <Label>Scan QR Code with the Display</Label>
                            {selectedDisplayId ? (
                                <div className="flex justify-center p-4 bg-white rounded-lg">
                                    <QRCodeSVG
                                        value={qrValue}
                                        size={200}
                                        level="H"
                                        includeMargin
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[200px] bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        Select a display first to generate QR code
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground text-center">
                                Point the SmartTV camera at this QR code
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    {mode === 'code' && (
                        <Button
                            onClick={handlePair}
                            disabled={!pairingCode || !selectedDisplayId || isLoading}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Pair Display
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
