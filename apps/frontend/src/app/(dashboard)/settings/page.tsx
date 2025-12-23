'use client';

/**
 * Settings Page
 * User preferences and application settings
 * Placeholder - under development
 */

import { Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();

    const settingsSections = [
        {
            icon: User,
            title: 'Profile',
            description: 'Manage your personal information and account details',
        },
        {
            icon: Bell,
            title: 'Notifications',
            description: 'Configure how you receive alerts and updates',
        },
        {
            icon: Shield,
            title: 'Security',
            description: 'Two-factor authentication and password settings',
        },
        {
            icon: Palette,
            title: 'Appearance',
            description: 'Customize the look and feel of the application',
        },
    ];

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
                                <p className="text-sm text-muted-foreground">2FA</p>
                                <p className="font-medium">
                                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Settings Sections Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {settingsSections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Card key={section.title} className="cursor-pointer hover:bg-accent/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Icon className="h-5 w-5" />
                                    {section.title}
                                </CardTitle>
                                <CardDescription>{section.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground italic">
                                    Coming soon...
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Development Notice */}
            <Card className="border-dashed">
                <CardContent className="flex items-center gap-3 py-4">
                    <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Esta sección está en desarrollo. Próximamente podrás configurar todas las opciones.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
