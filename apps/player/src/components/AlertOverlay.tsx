/**
 * AlertOverlay Component
 * Displays alert notifications with type-specific styling
 */

'use client';

import { useEffect, useState } from 'react';

type AlertType = 'INFO' | 'WARNING' | 'EMERGENCY';

interface ContentSource {
    type: string;
    alert?: {
        id: string;
        name: string;
        message?: string | null;
        type: string;
    };
}

interface AlertOverlayProps {
    source: ContentSource;
    children?: React.ReactNode;
}

const alertTypeColors: Record<AlertType, { bg: string; border: string; text: string }> = {
    INFO: {
        bg: 'bg-blue-900/90',
        border: 'border-blue-500',
        text: 'text-blue-100',
    },
    WARNING: {
        bg: 'bg-yellow-900/90',
        border: 'border-yellow-500',
        text: 'text-yellow-100',
    },
    EMERGENCY: {
        bg: 'bg-red-900/95',
        border: 'border-red-500',
        text: 'text-red-100',
    },
};

export function AlertOverlay({ source, children }: AlertOverlayProps) {
    const [visible, setVisible] = useState(false);

    const alertType = (source.alert?.type as AlertType) || 'INFO';
    const colors = alertTypeColors[alertType];

    // Animate in
    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Content behind overlay */}
            <div className={`w-full h-full ${alertType === 'EMERGENCY' ? 'opacity-0' : 'opacity-30'}`}>
                {children}
            </div>

            {/* Alert Overlay */}
            <div
                className={`
          absolute inset-0 flex flex-col items-center justify-center
          ${colors.bg} border-8 ${colors.border}
          transition-all duration-500
          ${visible ? 'opacity-100' : 'opacity-0'}
        `}
            >
                {/* Alert Icon */}
                <div className="mb-8">
                    {alertType === 'EMERGENCY' && (
                        <svg className="w-32 h-32 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L1 21h22L12 2zm0 3.83L19.13 19H4.87L12 5.83zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z" />
                        </svg>
                    )}
                    {alertType === 'WARNING' && (
                        <svg className="w-24 h-24 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                        </svg>
                    )}
                    {alertType === 'INFO' && (
                        <svg className="w-24 h-24 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                    )}
                </div>

                {/* Alert Title */}
                <h1 className={`text-4xl md:text-6xl font-bold ${colors.text} text-center mb-4`}>
                    {source.alert?.name}
                </h1>

                {/* Alert Message */}
                {source.alert?.message && (
                    <p className={`text-2xl md:text-3xl ${colors.text} text-center max-w-3xl px-8`}>
                        {source.alert.message}
                    </p>
                )}

                {/* Type Badge */}
                <div className={`mt-8 px-6 py-2 rounded-full ${colors.border} border-2`}>
                    <span className={`text-xl font-semibold ${colors.text}`}>
                        {alertType === 'EMERGENCY' ? 'EMERGENCIA' : alertType === 'WARNING' ? 'ADVERTENCIA' : 'AVISO'}
                    </span>
                </div>
            </div>
        </div>
    );
}
