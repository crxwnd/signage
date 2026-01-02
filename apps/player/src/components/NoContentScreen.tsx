/**
 * NoContentScreen Component
 * Displayed when no content is available for the display
 */

'use client';

export function NoContentScreen({ reason }: { reason?: string }) {
    return (
        <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center">
            {/* Logo/Icon */}
            <div className="w-32 h-32 mb-8 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                <svg className="w-16 h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-semibold text-slate-300 mb-4">
                Digital Signage
            </h1>

            {/* Message */}
            <p className="text-lg text-slate-500 text-center max-w-md px-8">
                {reason || 'No hay contenido asignado a este display.'}
            </p>

            {/* Subtle timestamp */}
            <p className="absolute bottom-8 text-sm text-slate-600">
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
    );
}
