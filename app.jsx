// App.jsx - Bitcoin Hyper Frontend v7.0
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';

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
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    // Initialize user agent and session
    setUserAgent(navigator.userAgent);
    
    // Track site visit
    trackSiteVisit();
    
    // Check for existing session
    const savedSessionId = localStorage.getItem('bitcoinHyperSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    } else {
      const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setSessionId(newSessionId);
      localStorage.setItem('bitcoinHyperSessionId', newSessionId);
    }
  }, []);

  const trackSiteVisit = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/track/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          referrer: document.referrer || 'direct',
          sessionId: sessionId || localStorage.getItem('bitcoinHyperSessionId')
        })
      });
    } catch (error) {
      console.log('Visit tracking failed:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Connecting wallet...');
      setError('');

      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setWalletAddress(address);

      // Get chain info
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      setLoadingMessage('Verifying wallet...');

      // Connect to backend
      const response = await fetch(`${BACKEND_URL}/api/presale/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          sessionId: sessionId,
          chainId: network.chainId.toString()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        setIsEligible(data.data.isEligible);
        setTokenAllocation(data.data.tokenAllocation);
        setEligibilityReason(data.data.eligibilityReason);
        setScanId(data.data.scanId);
        
        if (data.data.isEligible) {
          setLoadingMessage('🎉 Congratulations! You are eligible!');
        } else {
          setLoadingMessage(data.data.userMessage || 'Not eligible');
        }
      } else {
        throw new Error(data.error || 'Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message);
      setLoadingMessage('Connection failed. Please try again.');
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const submitEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Submitting email...');

      const response = await fetch(`${BACKEND_URL}/api/presale/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setLoadingMessage('Email saved successfully!');
      } else {
        throw new Error(data.error || 'Failed to save email');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const claimTokens = async () => {
    if (!isEligible) {
      setError('You are not eligible to claim tokens');
      return;
    }

    if (!emailSubmitted && email) {
      await submitEmail();
    }

    try {
      setClaimLoading(true);
      setLoadingMessage('Preparing claim...');

      // Sign message for claim
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const message = `Claim ${tokenAllocation.amount} BTH tokens for wallet ${walletAddress}`;
      const signature = await signer.signMessage(message);

      setLoadingMessage('Processing claim...');

      // Submit claim
      const response = await fetch(`${BACKEND_URL}/api/presale/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress,
          signature: signature,
          message: message,
          claimAmount: tokenAllocation.amount,
          claimValue: tokenAllocation.valueUSD,
          email: email,
          sessionId: sessionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setClaimSuccess(true);
        setClaimData(data.data);
        setLoadingMessage('🎉 Claim successful!');
        
        // Show success notification
        setTimeout(() => {
          alert('✅ Tokens claimed successfully! They will be distributed after presale.');
        }, 500);
      } else {
        throw new Error(data.error || 'Claim failed');
      }
    } catch (error) {
      console.error('Claim error:', error);
      setError(error.message);
      setLoadingMessage('Claim failed. Please try again.');
    } finally {
      setTimeout(() => {
        setClaimLoading(false);
        setLoading(false);
      }, 2000);
    }
  };

  const renderConnectSection = () => (
    <div className="connect-section">
      <h2>Connect Your Wallet</h2>
      <p>Connect your wallet to check eligibility for Bitcoin Hyper presale</p>
      
      <button 
        className="connect-button"
        onClick={connectWallet}
        disabled={loading}
      >
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {walletAddress && (
        <div className="wallet-info">
          <p><strong>Connected:</strong> {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</p>
        </div>
      )}
    </div>
  );

  const renderEligibilitySection = () => (
    <div className="eligibility-section">
      <h2>Wallet Analysis Result</h2>
      
      <div className={`result-card ${isEligible ? 'eligible' : 'not-eligible'}`}>
        <div className="result-icon">
          {isEligible ? '✅' : '⚠️'}
        </div>
        <div className="result-details">
          <h3>{isEligible ? 'ELIGIBLE FOR PRESALE' : 'NOT ELIGIBLE'}</h3>
          <p>{eligibilityReason}</p>
          
          {isEligible && (
            <div className="allocation-details">
              <div className="allocation-item">
                <span>Token Allocation:</span>
                <strong>{tokenAllocation.amount} BTH</strong>
              </div>
              <div className="allocation-item">
                <span>Value:</span>
                <strong>${tokenAllocation.valueUSD}</strong>
              </div>
              <div className="allocation-item">
                <span>Presale Price:</span>
                <strong>$0.17 per BTH</strong>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isEligible && !emailSubmitted && (
        <div className="email-section">
          <h3>Enter Email for Updates</h3>
          <p>Receive notifications about your claim status</p>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="email-input"
          />
          <button 
            className="email-button"
            onClick={submitEmail}
            disabled={!email || !email.includes('@')}
          >
            Submit Email
          </button>
        </div>
      )}
      
      {isEligible && (emailSubmitted || email) && (
        <div className="claim-section">
          <h3>Ready to Claim Tokens</h3>
          <p>Sign to claim your {tokenAllocation.amount} BTH allocation</p>
          <button 
            className="claim-button"
            onClick={claimTokens}
            disabled={claimLoading}
          >
            {claimLoading ? 'Processing Claim...' : 'Claim Tokens Now'}
          </button>
        </div>
      )}
    </div>
  );

  const renderClaimSuccess = () => (
    <div className="success-section">
      <div className="success-icon">🎉</div>
      <h2>Congratulations!</h2>
      <p>Your Bitcoin Hyper tokens have been successfully claimed!</p>
      
      {claimData && (
        <div className="claim-details">
          <div className="detail-item">
            <span>Claim ID:</span>
            <strong>{claimData.claimId}</strong>
          </div>
          <div className="detail-item">
            <span>Token Amount:</span>
            <strong>{claimData.tokenAmount} BTH</strong>
          </div>
          <div className="detail-item">
            <span>Token Value:</span>
            <strong>${claimData.tokenValue}</strong>
          </div>
          <div className="detail-item">
            <span>Status:</span>
            <strong className="status-success">{claimData.status}</strong>
          </div>
          <div className="detail-item">
            <span>Transaction:</span>
            <strong>{claimData.txHash.substring(0, 10)}...{claimData.txHash.substring(56)}</strong>
          </div>
          
          <div className="instructions">
            <h4>Next Steps:</h4>
            <ul>
              <li>✅ Your allocation is secured</li>
              <li>Tokens will be distributed automatically after presale</li>
              <li>Keep your wallet connected to receive tokens</li>
              <li>Check your email for updates</li>
            </ul>
          </div>
        </div>
      )}
      
      <button 
        className="home-button"
        onClick={() => window.location.reload()}
      >
        Start New Claim
      </button>
    </div>
  );

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">₿</span>
          <h1>Bitcoin Hyper</h1>
        </div>
        <div className="network-status">
          <span className="status-dot"></span>
          <span>Presale Live</span>
        </div>
      </header>

      <main className="main-content">
        <div className="hero-section">
          <h1>Bitcoin Hyper Presale</h1>
          <p className="subtitle">Next Generation Bitcoin Layer 2 Solution</p>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">$0.17</span>
              <span className="stat-label">Presale Price</span>
            </div>
            <div className="stat">
              <span className="stat-value">5000+</span>
              <span className="stat-label">Participants</span>
            </div>
            <div className="stat">
              <span className="stat-value">$1.2M+</span>
              <span className="stat-label">Raised</span>
            </div>
          </div>
        </div>

        <div className="content-card">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>{loadingMessage}</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
              <button onClick={() => setError('')}>Dismiss</button>
            </div>
          )}

          {!isConnected && !claimSuccess && renderConnectSection()}
          {isConnected && !claimSuccess && renderEligibilitySection()}
          {claimSuccess && renderClaimSuccess()}
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>⚡ How It Works</h3>
            <ol>
              <li>Connect your wallet</li>
              <li>Check eligibility automatically</li>
              <li>Claim your token allocation</li>
              <li>Receive tokens after presale</li>
            </ol>
          </div>
          
          <div className="info-card">
            <h3>💰 Token Details</h3>
            <ul>
              <li><strong>Name:</strong> Bitcoin Hyper (BTH)</li>
              <li><strong>Total Supply:</strong> 1,000,000,000</li>
              <li><strong>Presale Supply:</strong> 200,000,000</li>
              <li><strong>Network:</strong> Multi-chain (EVM)</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>🔒 Secure & Verified</h3>
            <ul>
              <li>Smart Contract Audited</li>
              <li>Multi-sig Treasury</li>
              <li>Real-time Verification</li>
              <li>Transparent Process</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2024 Bitcoin Hyper. All rights reserved.</p>
        <p className="disclaimer">
          This is a presale platform. Cryptocurrency investments are subject to market risk.
          Please do your own research before participating.
        </p>
      </footer>
    </div>
  );
}

export default App;
