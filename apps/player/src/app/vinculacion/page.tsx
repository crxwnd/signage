'use client';

/**
 * Vinculación Page
 * Shows QR code, unique code, and direct link for pairing displays
 */

import { useEffect, useState } from 'react';
import { usePlayerSocket } from '@/hooks/usePlayerSocket';

const PLAYER_URL = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:3002';

export default function VinculacionPage() {
    const [mounted, setMounted] = useState(false);

    // Socket for pairing
    const {
        isConnected,
        pairingCode,
        error,
        requestPairing,
    } = usePlayerSocket({
        displayId: null,
        onPaired: (displayId) => {
            // Redirect to player with displayId
            window.location.href = `/?displayId=${displayId}`;
        },
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-request pairing code when connected
    useEffect(() => {
        if (isConnected && !pairingCode && !error) {
            requestPairing();
        }
    }, [isConnected, pairingCode, error, requestPairing]);

    const directLink = pairingCode
        ? `${PLAYER_URL}/?displayId=PENDING&code=${pairingCode}`
        : null;

    // Generate QR data URL using a simple QR library pattern
    const qrDataUrl = pairingCode ? generateQRDataUrl(pairingCode, directLink) : null;

    if (!mounted) {
        return null;
    }

    return (
        <div className="vinculacion-screen">
            <div className="vinculacion-content">
                {/* Logo/Header */}
                <div className="header">
                    <div className="logo">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                    </div>
                    <h1>Digital Signage</h1>
                    <p className="subtitle">Sistema de Vinculación de Pantallas</p>
                </div>

                {/* Connection Status */}
                <div className={`status-indicator ${isConnected ? 'connected' : 'connecting'}`}>
                    <div className="status-dot" />
                    <span>{isConnected ? 'Conectado al servidor' : 'Conectando...'}</span>
                </div>

                {/* Main Content */}
                {isConnected && pairingCode && (
                    <div className="pairing-options">
                        {/* Option 1: QR Code */}
                        <div className="option-card qr-card">
                            <h2>Opción 1: Escanear QR</h2>
                            <p>Escanea con la app del panel de administración</p>
                            <div className="qr-container">
                                {qrDataUrl ? (
                                    <img src={qrDataUrl} alt="QR Code" className="qr-image" />
                                ) : (
                                    <div className="qr-placeholder">
                                        <QRCodeSVG value={JSON.stringify({ code: pairingCode, url: directLink })} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Option 2: Code */}
                        <div className="option-card code-card">
                            <h2>Opción 2: Código Único</h2>
                            <p>Ingresa este código en el panel de administración</p>
                            <div className="code-display">
                                {pairingCode.split('').map((char, i) => (
                                    <span key={i} className="code-char">{char}</span>
                                ))}
                            </div>
                            <p className="code-hint">Válido por 10 minutos</p>
                        </div>

                        {/* Option 3: Direct Link */}
                        <div className="option-card link-card">
                            <h2>Opción 3: Link Directo</h2>
                            <p>Copia este link para configurar remotamente</p>
                            <div className="link-display">
                                <code>{directLink || 'Generando...'}</code>
                            </div>
                            <button
                                className="copy-button"
                                onClick={() => {
                                    if (directLink) {
                                        navigator.clipboard.writeText(directLink);
                                    }
                                }}
                            >
                                📋 Copiar Link
                            </button>
                        </div>
                    </div>
                )}

                {/* Waiting message */}
                {isConnected && pairingCode && (
                    <div className="waiting-message">
                        <div className="spinner" />
                        <p>Esperando confirmación desde el panel de administración...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="error-message">
                        <p>⚠️ {error}</p>
                        <button onClick={requestPairing} className="retry-button">
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Loading state */}
                {!isConnected && (
                    <div className="loading-state">
                        <div className="spinner large" />
                        <p>Iniciando sistema de vinculación...</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .vinculacion-screen {
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: white;
                    overflow: auto;
                    padding: 40px 20px;
                }

                .vinculacion-content {
                    max-width: 1200px;
                    width: 100%;
                    text-align: center;
                }

                .header {
                    margin-bottom: 40px;
                }

                .logo {
                    display: inline-flex;
                    padding: 20px;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    border-radius: 24px;
                    margin-bottom: 24px;
                }

                h1 {
                    font-size: 3rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .subtitle {
                    font-size: 1.25rem;
                    color: #64748b;
                }

                .status-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 50px;
                    font-size: 0.875rem;
                    margin-bottom: 40px;
                }

                .status-indicator.connected {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                }

                .status-indicator.connecting {
                    background: rgba(234, 179, 8, 0.1);
                    color: #eab308;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: currentColor;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .pairing-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 24px;
                    margin-bottom: 40px;
                }

                .option-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 32px 24px;
                    backdrop-filter: blur(10px);
                }

                .option-card h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #f1f5f9;
                }

                .option-card p {
                    font-size: 0.875rem;
                    color: #94a3b8;
                    margin-bottom: 24px;
                }

                .qr-container {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    display: inline-block;
                }

                .qr-image, .qr-placeholder {
                    width: 180px;
                    height: 180px;
                }

                .code-display {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .code-char {
                    width: 48px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 700;
                    font-family: 'Courier New', monospace;
                    background: rgba(59, 130, 246, 0.2);
                    border: 2px solid rgba(59, 130, 246, 0.5);
                    border-radius: 8px;
                }

                .code-hint {
                    font-size: 0.75rem !important;
                    color: #64748b !important;
                }

                .link-display {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    overflow-x: auto;
                }

                .link-display code {
                    font-size: 0.75rem;
                    color: #60a5fa;
                    word-break: break-all;
                }

                .copy-button {
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.5);
                    color: #60a5fa;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .copy-button:hover {
                    background: rgba(59, 130, 246, 0.3);
                }

                .waiting-message {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: #94a3b8;
                    font-size: 0.875rem;
                }

                .loading-state {
                    padding: 60px 20px;
                }

                .loading-state p {
                    margin-top: 24px;
                    color: #64748b;
                }

                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .spinner.large {
                    width: 48px;
                    height: 48px;
                    border-width: 3px;
                    margin: 0 auto;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    padding: 24px;
                    border-radius: 12px;
                    color: #fca5a5;
                }

                .retry-button {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.5);
                    color: #fca5a5;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-top: 16px;
                }

                @media (max-width: 768px) {
                    h1 { font-size: 2rem; }
                    .pairing-options { grid-template-columns: 1fr; }
                    .code-char { width: 40px; height: 54px; font-size: 1.5rem; }
                }
            `}</style>
        </div>
    );
}

// Simple QR Code SVG component (inline to avoid dependencies)
function QRCodeSVG({ value }: { value: string }) {
    // This is a placeholder - in production use a library like 'qrcode'
    // For now, show the code as text
    const code = JSON.parse(value).code;
    return (
        <div style={{
            width: 180,
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f1f5f9',
            borderRadius: 8,
            flexDirection: 'column',
            gap: 8
        }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Código QR</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>{code}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Escanear con app</div>
        </div>
    );
}

// Generate QR as data URL (placeholder - use qrcode library in production)
function generateQRDataUrl(_code: string, _url: string | null): string | null {
    // In production, use a library like 'qrcode' to generate actual QR
    // For now, return null to use the SVG placeholder
    return null;
}
