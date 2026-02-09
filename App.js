import React, { useState, useEffect } from 'react';
import './App.css';

// Main App Component - Simplified version that will build
function App() {
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  const BACKEND_API = "https://tokenbackend-5xab.onrender.com/api";

  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_API}/health`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend connected:', data);
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.error('❌ Backend test error:', error);
        setBackendStatus('error');
      }
    };
    
    testBackend();
  }, []);

  const testBackendManually = async () => {
    setBackendStatus('checking');
    try {
      const response = await fetch(`${BACKEND_API}/health`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="app-header">
          <div className="logo-container">
            <div className="logo-icon">₿</div>
            <div>
              <h1 className="logo-title">BITCOIN HYPER</h1>
              <div className="logo-subtitle">OFFICIAL PRESALE LAUNCH</div>
            </div>
          </div>
          
          <div className="header-actions">
            {backendStatus === 'connected' && (
              <div className="backend-indicator connected">
                <span className="indicator-dot"></span>
                <span>Backend LIVE</span>
              </div>
            )}
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-bitcoin">₿</div>
          
          <h2 className="hero-title">
            NEXT GENERATION BITCOIN ECOSYSTEM
          </h2>
          
          <p className="hero-description">
            Bitcoin Hyper brings DeFi 2.0 to the Bitcoin ecosystem. Join the presale now 
            and be part of the revolution.
          </p>
          
          {/* Backend Status */}
          {backendStatus === 'checking' ? (
            <div className="backend-checking-container">
              <div className="backend-checking-spinner"></div>
              <h3 className="backend-checking-title">
                Establishing Secure Connection...
              </h3>
              <p className="backend-checking-description">
                Connecting to Bitcoin Hyper backend systems
              </p>
            </div>
          ) : backendStatus === 'error' ? (
            <div className="backend-error-container">
              <div className="backend-error-icon">🔴</div>
              <h3 className="backend-error-title">
                Connection Issue Detected
              </h3>
              <p className="backend-error-description">
                Please check your connection and try again
              </p>
              <button 
                onClick={testBackendManually}
                className="retry-button"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="cta-container">
              <div className="cta-icon">🚀</div>
              <h3 className="cta-title">
                System Ready
              </h3>
              <p className="cta-description">
                Bitcoin Hyper presale platform is live and ready
              </p>
              <div className="backend-status-small">
                <span className="status-dot connected"></span>
                <span>Backend: Connected & Monitoring</span>
              </div>
            </div>
          )}
        </section>

        <section className="features-section">
          <h2 className="features-title">
            WHY BITCOIN HYPER?
          </h2>
          
          <div className="features-grid">
            {[
              {
                icon: '⚡',
                title: 'Lightning Fast',
                desc: 'Transaction speeds up to 100x faster than traditional Bitcoin'
              },
              {
                icon: '🛡️',
                title: 'Secure & Audited',
                desc: 'Fully audited smart contracts with multi-sig security'
              },
              {
                icon: '📈',
                title: 'High Yield',
                desc: 'Earn yields up to 45% APR through our DeFi ecosystem'
              },
              {
                icon: '🌐',
                title: 'Multi-Chain',
                desc: 'Native interoperability across Ethereum, BSC, Polygon, and more'
              },
              {
                icon: '🎯',
                title: 'Limited Supply',
                desc: 'Only 100M tokens ever minted. True scarcity model'
              },
              {
                icon: '🚀',
                title: 'Massive Growth',
                desc: 'Backed by top VCs with 100x growth potential'
              }
            ].map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">
                  {feature.title}
                </h3>
                <p className="feature-description">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="app-footer">
          <div className="footer-bitcoin">₿</div>
          <div className="footer-description">
            Bitcoin Hyper is the next evolution of Bitcoin. Join the presale now to secure your position.
          </div>
          <div className="footer-links">
            <span>© 2024 Bitcoin Hyper. All rights reserved.</span>
            <span>|</span>
            <span className={backendStatus === 'connected' ? 'status-connected' : 'status-error'}>
              {backendStatus === 'connected' ? '✅ System LIVE' : '⚠️ System Offline'}
            </span>
            <span>|</span>
            <span>Official Presale Platform</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
