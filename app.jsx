import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://bitcoin-hyper-backend.onrender.com';
  
  useEffect(() => {
    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setSessionId(newSessionId);
    
    // Track visit
    trackVisit(newSessionId);
  }, []);
  
  const trackVisit = async (sessionId) => {
    try {
      await fetch(`${BACKEND_URL}/api/track/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });
    } catch (error) {
      console.log('Visit tracking error:', error);
    }
  };
  
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnected(true);
        
        // Connect to backend
        await connectToBackend(address);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };
  
  const connectToBackend = async (address) => {
    try {
      setIsScanning(true);
      
      const response = await fetch(`${BACKEND_URL}/api/presale/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          email,
          sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        console.log('Wallet scan complete:', data.data);
      } else {
        throw new Error(data.error || 'Scan failed');
      }
      
    } catch (error) {
      console.error('Backend connection error:', error);
      alert('Failed to scan wallet: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };
  
  const claimTokens = async () => {
    try {
      if (!scanResult || !scanResult.isEligible) {
        alert('You are not eligible to claim tokens.');
        return;
      }
      
      setIsClaiming(true);
      
      // Prepare message for signing
      const message = `Claim Bitcoin Hyper Presale Tokens\n\nWallet: ${walletAddress}\nAllocation: ${scanResult.tokenAllocation.amount} BTH\nValue: $${scanResult.tokenAllocation.valueUSD}\n\nBy signing, you confirm participation in the Bitcoin Hyper presale.`;
      
      // Sign message with MetaMask
      const provider = window.ethereum;
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });
      
      // Send claim request
      const response = await fetch(`${BACKEND_URL}/api/presale/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
          claimAmount: scanResult.tokenAllocation.amount,
          claimValue: scanResult.tokenAllocation.valueUSD,
          email,
          sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Claim failed: HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setClaimResult(result.data);
        
        // Show celebration animation
        showCelebration();
        
        alert('🎉 Congratulations! Your Bitcoin Hyper tokens have been successfully claimed!');
      } else {
        throw new Error(result.error || 'Claim failed');
      }
      
    } catch (error) {
      console.error('Claim error:', error);
      alert('Claim failed: ' + error.message);
    } finally {
      setIsClaiming(false);
    }
  };
  
  const showCelebration = () => {
    // Create celebration elements
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.innerHTML = `
      <div class="confetti-container">
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
        <div class="confetti"></div>
      </div>
      <div class="success-message">
        <h2>🎉 SUCCESS!</h2>
        <p>Your Bitcoin Hyper tokens have been claimed!</p>
      </div>
    `;
    
    document.body.appendChild(celebration);
    
    // Remove after 5 seconds
    setTimeout(() => {
      celebration.remove();
    }, 5000);
  };
  
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">₿</span>
          <h1>BITCOIN HYPER</h1>
          <p className="subtitle">The Future of Bitcoin on Ethereum</p>
        </div>
        
        <div className="wallet-section">
          {isConnected ? (
            <div className="connected-wallet">
              <div className="wallet-badge">
                <span className="dot"></span>
                Connected
              </div>
              <div className="wallet-address">{formatAddress(walletAddress)}</div>
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>
              🔗 Connect Wallet
            </button>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="main">
        {/* Hero Section */}
        <section className="hero">
          <h2>JOIN THE BITCOIN HYPER REVOLUTION</h2>
          <p>Presale now live! Limited allocations available.</p>
          
          <div className="stats">
            <div className="stat">
              <div className="stat-value">$25M</div>
              <div className="stat-label">Target Raise</div>
            </div>
            <div className="stat">
              <div className="stat-value">10,000+</div>
              <div className="stat-label">Participants</div>
            </div>
            <div className="stat">
              <div className="stat-value">0.17</div>
              <div className="stat-label">Presale Price</div>
            </div>
          </div>
        </section>
        
        {/* Wallet Connection Section */}
        <section className="connection-section">
          {!isConnected ? (
            <div className="connect-prompt">
              <div className="wallet-icons">
                <span>🦊</span>
                <span>🔷</span>
                <span>📱</span>
              </div>
              <button className="primary-btn" onClick={connectWallet}>
                🔗 Connect EVM Wallet to Check Eligibility
              </button>
              <p className="hint">Connect any EVM wallet to see your allocation</p>
            </div>
          ) : (
            <div className="wallet-dashboard">
              <div className="wallet-card">
                <div className="wallet-header">
                  <h3>👛 Connected Wallet</h3>
                  <div className="wallet-status">
                    {scanResult?.status === 'eligible' ? '✅ Eligible' : 
                     scanResult?.status === 'not_eligible' ? '❌ Not Eligible' : 
                     isScanning ? '🔍 Scanning...' : 'Connected'}
                  </div>
                </div>
                
                <div className="wallet-details">
                  <div className="address">{walletAddress}</div>
                  
                  <div className="email-input">
                    <label>📧 Email for updates (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  {/* Scan Results */}
                  {scanResult && (
                    <div className="scan-results">
                      <div className="result-card">
                        <h4>Wallet Analysis Results</h4>
                        
                        <div className="result-item">
                          <span>Portfolio Value</span>
                          <strong>${scanResult.totalValueUSD}</strong>
                        </div>
                        
                        <div className="result-item">
                          <span>Status</span>
                          <strong className={scanResult.isEligible ? 'eligible' : 'not-eligible'}>
                            {scanResult.isEligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}
                          </strong>
                        </div>
                        
                        <div className="result-item">
                          <span>Reason</span>
                          <span>{scanResult.eligibilityReason}</span>
                        </div>
                        
                        {scanResult.isEligible && (
                          <>
                            <div className="allocation-card">
                              <h5>🎯 Your Allocation</h5>
                              <div className="allocation-amount">
                                {scanResult.tokenAllocation.amount} <small>BTH</small>
                              </div>
                              <div className="allocation-value">
                                ${scanResult.tokenAllocation.valueUSD}
                              </div>
                            </div>
                            
                            <button 
                              className="claim-btn" 
                              onClick={claimTokens}
                              disabled={isClaiming}
                            >
                              {isClaiming ? 'Processing...' : '🎯 Claim My Tokens'}
                            </button>
                            
                            <p className="claim-note">
                              By claiming, you agree to participate in the Bitcoin Hyper presale.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Scanning State */}
                  {isScanning && (
                    <div className="scanning">
                      <div className="spinner"></div>
                      <p>Scanning wallet for eligibility...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
        
        {/* Claim Results */}
        {claimResult && (
          <section className="claim-success">
            <div className="success-card">
              <div className="success-icon">🎉</div>
              <h2>CONGRATULATIONS!</h2>
              <p className="success-message">Your Bitcoin Hyper tokens have been successfully claimed!</p>
              
              <div className="success-details">
                <div className="detail">
                  <span>Claim ID:</span>
                  <strong>{claimResult.claimId}</strong>
                </div>
                <div className="detail">
                  <span>Tokens:</span>
                  <strong>{claimResult.tokenAmount} BTH</strong>
                </div>
                <div className="detail">
                  <span>Value:</span>
                  <strong>${claimResult.tokenValue}</strong>
                </div>
                <div className="detail">
                  <span>Status:</span>
                  <strong className="success-text">✅ Claimed Successfully</strong>
                </div>
              </div>
              
              <div className="next-steps">
                <h4>📋 What's Next?</h4>
                <ul>
                  <li>Keep your wallet connected</li>
                  <li>Tokens will be distributed after presale</li>
                  <li>Check announcements for updates</li>
                  <li>Thank you for your participation!</li>
                </ul>
              </div>
            </div>
          </section>
        )}
        
        {/* Info Section */}
        <section className="info-section">
          <div className="info-cards">
            <div className="info-card">
              <div className="icon">⚡</div>
              <h4>Fast & Secure</h4>
              <p>Built on Ethereum with military-grade security</p>
            </div>
            <div className="info-card">
              <div className="icon">💰</div>
              <h4>High Returns</h4>
              <p>Early investors get the best allocations</p>
            </div>
            <div className="info-card">
              <div className="icon">🔒</div>
              <h4>Safe & Trusted</h4>
              <p>Audited smart contracts, secure process</p>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">₿ BITCOIN HYPER</div>
          <div className="footer-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Contact</a>
          </div>
          <p className="copyright">© 2024 Bitcoin Hyper. All rights reserved.</p>
        </div>
      </footer>
      
      {/* Celebration CSS */}
      <style jsx>{`
        .celebration {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.95);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.5s ease-out;
        }
        
        .confetti-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #F7931A;
          animation: fall linear infinite;
        }
        
        .confetti:nth-child(1) { left: 10%; animation-duration: 3s; }
        .confetti:nth-child(2) { left: 30%; animation-duration: 4s; background: #10b981; }
        .confetti:nth-child(3) { left: 50%; animation-duration: 2.5s; background: #3b82f6; }
        .confetti:nth-child(4) { left: 70%; animation-duration: 3.5s; background: #ef4444; }
        .confetti:nth-child(5) { left: 90%; animation-duration: 4.5s; background: #8b5cf6; }
        
        .success-message {
          text-align: center;
          color: white;
          z-index: 1001;
        }
        
        .success-message h2 {
          font-size: 48px;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #F7931A, #FFD700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
