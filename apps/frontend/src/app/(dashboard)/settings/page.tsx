'use client';

/**
 * Settings Page
 * User preferences and application settings
 * Includes 2FA configuration
 */

import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, ShieldCheck, ShieldOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { TwoFactorModal } from '@/components/settings/TwoFactorModal';

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

    const handleOpen2FAModal = () => {
        setIs2FAModalOpen(true);
    };

    const handleClose2FAModal = () => {
        setIs2FAModalOpen(false);
    };

    const handle2FAStatusChange = async () => {
        // Refresh user data to get updated 2FA status
        await refreshUser();
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account and application preferences
                    </p>
                </div>
            </div>

            {/* User Info Card */}
            {user && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{user.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Role</p>
                                <p className="font-medium">{user.role.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">2FA Status</p>
                                <div className="flex items-center gap-2">
                                    {user.twoFactorEnabled ? (
                                        <Badge variant="default" className="bg-green-600">
                                            <ShieldCheck className="mr-1 h-3 w-3" />
                                            Enabled
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">
                                            <ShieldOff className="mr-1 h-3 w-3" />
                                            Disabled
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Security Section - 2FA */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security
                    </CardTitle>
                    <CardDescription>
                        Manage your account security settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium">Two-Factor Authentication</h4>
                                {user?.twoFactorEnabled ? (
                                    <Badge variant="default" className="bg-green-600 text-xs">Active</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs">Not configured</Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {user?.twoFactorEnabled
                                    ? 'Your account is protected with two-factor authentication.'
                                    : 'Add an extra layer of security by requiring a verification code.'}
                            </p>
                        </div>
                        <Button
                            variant={user?.twoFactorEnabled ? 'outline' : 'default'}
                            onClick={handleOpen2FAModal}
                        >
                            {user?.twoFactorEnabled ? 'Manage' : 'Enable'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Other Settings Sections */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Profile Section */}
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5" />
                            Profile
                        </CardTitle>
                        <CardDescription>
                            Manage your personal information and account details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic">
                            Coming soon...
                        </p>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                        <CardDescription>
                            Configure how you receive alerts and updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic">
                            Coming soon...
                        </p>
                    </CardContent>
                </Card>

                {/* Appearance Section */}
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Palette className="h-5 w-5" />
                            Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize the look and feel of the application
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic">
                            Coming soon...
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Development Notice */}
            <Card className="border-dashed">
                <CardContent className="flex items-center gap-3 py-4">
                    <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Algunas secciones están en desarrollo. Próximamente podrás configurar más opciones.
                    </p>
                </CardContent>
            </Card>

            {/* 2FA Modal */}
            {user && (
                <TwoFactorModal
                    isOpen={is2FAModalOpen}
                    onClose={handleClose2FAModal}
                    currentStatus={user.twoFactorEnabled}
                    onStatusChange={handle2FAStatusChange}
                />
            )}
        </div>
    );
}
