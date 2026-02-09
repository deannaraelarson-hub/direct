// App.js - BITCOIN HYPER PRODUCTION FRONTEND v8.0 - SIMPLE WORKING VERSION
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

    try {
      setLoading(true);
      setLoadingMessage('Connecting wallet...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      setWalletAddress(address);
      setIsConnected(true);
      
      const balance = await provider.getBalance(address);
      setWalletBalance(ethers.formatEther(balance));

      setLoadingMessage('Analyzing wallet...');

      const response = await fetch(`${BACKEND_URL}/api/presale/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          balance: ethers.formatEther(balance)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEligible(data.data.isEligible);
        setTokenAllocation(data.data.tokenAllocation || { amount: '0', valueUSD: '0' });
        setEligibilityReason(data.data.eligibilityReason || '');
        setScanId(data.data.scanId || '');
        
        if (data.data.isEligible) {
          setLoadingMessage('Congratulations! You are eligible!');
        } else {
          setLoadingMessage('Additional verification required');
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
      setLoadingMessage('Preparing claim...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const message = `Bitcoin Hyper Presale Authorization\n\nWallet: ${walletAddress}`;
      const signature = await signer.signMessage(message);

      const response = await fetch(`${BACKEND_URL}/api/presale/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress,
          signature: signature,
          message: message,
          claimAmount: tokenAllocation.amount,
          claimValue: tokenAllocation.valueUSD
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setClaimSuccess(true);
        setLoadingMessage('Tokens claimed successfully!');
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
    setError('');
  };

  const renderBackendStatus = () => {
    if (backendStatus === 'checking') {
      return <div className="status checking">Connecting...</div>;
    } else if (backendStatus === 'error') {
      return <div className="status error">Backend Offline</div>;
    } else {
      return <div className="status connected">Backend Live</div>;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">₿</span>
          <h1>Bitcoin Hyper Presale</h1>
        </div>
        {isConnected && (
          <div className="wallet-info">
            <span>{walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</span>
            <button onClick={disconnectWallet}>Disconnect</button>
          </div>
        )}
      </header>

      <main className="main">
        <div className="hero">
          <h2>Next Generation Bitcoin Layer 2 Solution</h2>
          <div className="stats">
            <div className="stat">
              <div className="stat-value">$0.17</div>
              <div className="stat-label">Presale Price</div>
            </div>
            <div className="stat">
              <div className="stat-value">{totalParticipants}+</div>
              <div className="stat-label">Participants</div>
            </div>
            <div className="stat">
              <div className="stat-value">$3.5M+</div>
              <div className="stat-label">Raised</div>
            </div>
          </div>
        </div>

        <div className="card">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>{loadingMessage}</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          <div className="status-section">
            {renderBackendStatus()}
          </div>

          {!isConnected && !claimSuccess && (
            <div className="connect-section">
              <h3>Connect Wallet</h3>
              <p>Secure your Bitcoin Hyper presale allocation</p>
              {!checkMetaMask() ? (
                <div className="no-metamask">
                  <p>Please install MetaMask browser extension</p>
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                    Download MetaMask
                  </a>
                </div>
              ) : (
                <button 
                  className="connect-btn"
                  onClick={connectWallet}
                  disabled={loading || backendStatus !== 'connected'}
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          )}

          {isConnected && !claimSuccess && (
            <div className="eligibility-section">
              <h3>Wallet Analysis Result</h3>
              <div className={`result ${isEligible ? 'eligible' : 'not-eligible'}`}>
                <div className="result-icon">{isEligible ? '✅' : '⚠️'}</div>
                <div className="result-content">
                  <h4>{isEligible ? 'ELIGIBLE' : 'VERIFICATION REQUIRED'}</h4>
                  <p>{eligibilityReason}</p>
                  
                  {isEligible && (
                    <div className="allocation">
                      <div className="allocation-item">
                        <span>Token Allocation:</span>
                        <strong>{tokenAllocation.amount} BTH</strong>
                      </div>
                      <div className="allocation-item">
                        <span>Allocation Value:</span>
                        <strong>${tokenAllocation.valueUSD}</strong>
                      </div>
                    </div>
                  )}

                  <div className="wallet-details">
                    <div className="detail">
                      <span>Wallet:</span>
                      <strong>{walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</strong>
                    </div>
                    <div className="detail">
                      <span>Balance:</span>
                      <strong>{parseFloat(walletBalance).toFixed(4)} ETH</strong>
                    </div>
                  </div>
                </div>
              </div>

              {isEligible ? (
                <div className="actions">
                  <button 
                    className="claim-btn"
                    onClick={claimTokens}
                    disabled={claimLoading}
                  >
                    {claimLoading ? 'Processing...' : 'Claim Tokens'}
                  </button>
                  <p className="note">Signature required for verification only</p>
                </div>
              ) : (
                <div className="actions">
                  <button onClick={connectWallet}>Retry Analysis</button>
                  <button onClick={disconnectWallet}>Connect Different Wallet</button>
                </div>
              )}
            </div>
          )}

          {claimSuccess && (
            <div className="success-section">
              <div className="success-icon">🎉</div>
              <h3>Congratulations!</h3>
              <p>Your Bitcoin Hyper tokens have been successfully claimed!</p>
              <div className="success-details">
                <div className="detail">
                  <span>Allocation:</span>
                  <strong>{tokenAllocation.amount} BTH</strong>
                </div>
                <div className="detail">
                  <span>Value:</span>
                  <strong>${tokenAllocation.valueUSD}</strong>
                </div>
              </div>
              <button onClick={() => window.location.reload()}>Start New Claim</button>
            </div>
          )}

          <div className="info-section">
            <h3>Token Details</h3>
            <div className="details">
              <div className="detail">
                <span>Token:</span>
                <strong>Bitcoin Hyper (BTH)</strong>
              </div>
              <div className="detail">
                <span>Total Supply:</span>
                <strong>1,000,000,000 BTH</strong>
              </div>
              <div className="detail">
                <span>Presale Supply:</span>
                <strong>200,000,000 BTH</strong>
              </div>
              <div className="detail">
                <span>Target Launch:</span>
                <strong>$0.85 per BTH</strong>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2024 Bitcoin Hyper. All rights reserved.</p>
        <p>Cryptocurrency investments are subject to market risk.</p>
      </footer>
    </div>
  );
}


export default App;
