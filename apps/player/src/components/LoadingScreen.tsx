/**
 * LoadingScreen Component
 * Displayed while content source is being fetched
 */

'use client';

export function LoadingScreen() {
    return (
        <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center">
            {/* Spinner */}
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>

            {/* Text */}
            <p className="text-xl text-slate-400 animate-pulse">
                Cargando contenido...
            </p>
        </div>
    );
}
