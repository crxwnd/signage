'use client';

/**
 * Two-Factor Authentication Modal
 * Allows users to setup, verify, or disable 2FA
 */

import { useState } from 'react';
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
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { setup2FA, verify2FA, disable2FA, type Setup2FAResponse } from '@/lib/api/auth';

interface TwoFactorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentStatus: boolean; // true = 2FA enabled, false = disabled
    onStatusChange: () => void; // callback to refresh user data
}

type ModalStep = 'initial' | 'setup' | 'verify' | 'disable';

export function TwoFactorModal({
    isOpen,
    onClose,
    currentStatus,
    onStatusChange,
}: TwoFactorModalProps) {
    const [step, setStep] = useState<ModalStep>(currentStatus ? 'disable' : 'initial');
    const [setupData, setSetupData] = useState<Setup2FAResponse | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reset state when modal opens/closes
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Reset state on close
            setStep(currentStatus ? 'disable' : 'initial');
            setSetupData(null);
            setCode('');
            setError(null);
            setIsLoading(false);
            setCopied(false);
            onClose();
        }
    };

    // Step 1: Start 2FA setup
    const handleStartSetup = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await setup2FA();
            setSetupData(data);
            setStep('verify');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to setup 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify code and enable 2FA
    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await verify2FA(code);
            onStatusChange(); // Refresh user data
            handleOpenChange(false); // Close modal
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Disable 2FA
    const handleDisable = async () => {
        if (code.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await disable2FA(code);
            onStatusChange(); // Refresh user data
            handleOpenChange(false); // Close modal
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    // Copy secret to clipboard
    const handleCopySecret = async () => {
        if (setupData?.secret) {
            await navigator.clipboard.writeText(setupData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Handle code input (only digits, max 6)
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
        setError(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                {/* Initial State - 2FA Disabled */}
                {step === 'initial' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Set Up Two-Factor Authentication
                            </DialogTitle>
                            <DialogDescription>
                                Add an extra layer of security to your account by requiring a verification code from your phone.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <p className="text-sm text-muted-foreground">
                                You will need an authenticator app like:
                            </p>
                            <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                                <li>Google Authenticator</li>
                                <li>Microsoft Authenticator</li>
                                <li>Authy</li>
                            </ul>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleStartSetup} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continue Setup
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Verify State - Show QR Code */}
                {step === 'verify' && setupData && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-green-500" />
                                Scan QR Code
                            </DialogTitle>
                            <DialogDescription>
                                Scan this QR code with your authenticator app, then enter the 6-digit code below.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center gap-4 py-4">
                            {/* QR Code */}
                            <div className="rounded-lg border bg-white p-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={setupData.qrCode}
                                    alt="2FA QR Code"
                                    className="h-48 w-48"
                                />
                            </div>

                            {/* Manual Entry Option */}
                            <div className="w-full">
                                <Label className="text-xs text-muted-foreground">
                                    Can&apos;t scan? Enter this code manually:
                                </Label>
                                <div className="mt-1 flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono break-all">
                                        {setupData.secret}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopySecret}
                                        className="shrink-0"
                                    >
                                        {copied ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Verification Code Input */}
                            <div className="w-full space-y-2">
                                <Label htmlFor="verify-code">Verification Code</Label>
                                <Input
                                    id="verify-code"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="000000"
                                    value={code}
                                    onChange={handleCodeChange}
                                    className="text-center text-2xl tracking-widest font-mono"
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                />
                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep('initial');
                                    setSetupData(null);
                                    setCode('');
                                    setError(null);
                                }}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleVerify}
                                disabled={isLoading || code.length !== 6}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Enable
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Disable State - 2FA Currently Enabled */}
                {step === 'disable' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShieldOff className="h-5 w-5 text-orange-500" />
                                Disable Two-Factor Authentication
                            </DialogTitle>
                            <DialogDescription>
                                Enter a code from your authenticator app to disable 2FA. This will make your account less secure.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
                                <p className="text-sm text-orange-800 dark:text-orange-200">
                                    ⚠️ Disabling 2FA will remove the extra security layer from your account.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="disable-code">Verification Code</Label>
                                <Input
                                    id="disable-code"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="000000"
                                    value={code}
                                    onChange={handleCodeChange}
                                    className="text-center text-2xl tracking-widest font-mono"
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                />
                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDisable}
                                disabled={isLoading || code.length !== 6}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Disable 2FA
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
