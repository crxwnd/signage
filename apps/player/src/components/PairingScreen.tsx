'use client';

/**
 * PairingScreen Component
 * Displays pairing UI for unconfigured SmartTV displays
 */

interface PairingScreenProps {
    code: string | null;
    isConnected: boolean;
    error: string | null;
    onRequestCode: () => void;
}

export function PairingScreen({
    code,
    isConnected,
    error,
    onRequestCode
}: PairingScreenProps) {
    return (
        <div className="pairing-screen">
            <div className="pairing-content">
                <h1>Digital Signage</h1>

                {!isConnected && (
                    <div className="status connecting">
                        <div className="spinner"></div>
                        <p>Connecting to server...</p>
                    </div>
                )}

                {isConnected && !code && !error && (
                    <div className="status">
                        <button onClick={onRequestCode} className="pairing-button">
                            Get Pairing Code
                        </button>
                        <p className="hint">Click to get a code to pair this display</p>
                    </div>
                )}

                {isConnected && code && (
                    <div className="code-display">
                        <p className="label">Enter this code in the admin panel:</p>
                        <div className="code">{code}</div>
                        <p className="hint">Waiting for confirmation...</p>
                        <div className="spinner small"></div>
                    </div>
                )}

                {error && (
                    <div className="status error">
                        <p>⚠️ {error}</p>
                        <button onClick={onRequestCode} className="retry-button">
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
        .pairing-screen {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
        }

        .pairing-content {
          text-align: center;
          padding: 40px;
        }

        h1 {
          font-size: 3rem;
          margin-bottom: 40px;
          font-weight: 300;
          letter-spacing: 2px;
        }

        .status {
          margin-top: 20px;
        }

        .status.connecting {
          opacity: 0.8;
        }

        .status.error {
          color: #ff6b6b;
        }

        .code-display {
          margin-top: 30px;
        }

        .label {
          font-size: 1.2rem;
          opacity: 0.8;
          margin-bottom: 20px;
        }

        .code {
          font-size: 5rem;
          font-weight: bold;
          letter-spacing: 15px;
          font-family: 'Courier New', monospace;
          background: rgba(255,255,255,0.1);
          padding: 30px 50px;
          border-radius: 15px;
          margin: 20px 0;
        }

        .hint {
          font-size: 1rem;
          opacity: 0.6;
          margin-top: 20px;
        }

        .pairing-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 20px 40px;
          font-size: 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .pairing-button:hover {
          background: #45a049;
        }

        .retry-button {
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 1.2rem;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 20px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        .spinner.small {
          width: 30px;
          height: 30px;
          margin-top: 30px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
