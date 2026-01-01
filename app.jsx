// App.jsx - FIXED VERSION
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect } from "wagmi";
import { mainnet, polygon, bsc, arbitrum, optimism } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Create QueryClient outside component
const queryClient = new QueryClient();

// Create config outside component
const config = createConfig(
  getDefaultConfig({
    appName: "Wallet Scanner",
    appDescription: "Multi-chain wallet scanner",
    appUrl: window.location.origin,
    appIcon: "https://family.co/logo.png",
    walletConnectProjectId: "962425907914a3e80a7d8e7288b23f62",
    chains: [mainnet, polygon, bsc, arbitrum, optimism],
  })
);

// Main App Component
function WalletApp() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  // Configuration
  const CONFIG = {
    CHAINS: [
      { 
        id: 1, 
        name: "Ethereum", 
        rpc: "https://eth.llamarpc.com", 
        symbol: "ETH"
      },
      { 
        id: 56, 
        name: "BNB Chain", 
        rpc: "https://bsc-dataseed.binance.org", 
        symbol: "BNB"
      },
      { 
        id: 137, 
        name: "Polygon", 
        rpc: "https://polygon-rpc.com", 
        symbol: "MATIC"
      }
    ],
    TOKENLIST_URL: "https://tokens.coingecko.com/uniswap/all.json"
  };

  // Token scanning function
  const scanWallet = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Mock token data for demonstration
      const mockTokens = [
        { symbol: 'ETH', balance: 1.5, value: 3500, chain: 'Ethereum' },
        { symbol: 'MATIC', balance: 100, value: 80, chain: 'Polygon' },
        { symbol: 'USDC', balance: 500, value: 500, chain: 'Ethereum' },
        { symbol: 'BNB', balance: 2, value: 600, chain: 'BNB Chain' }
      ];
      
      const total = mockTokens.reduce((sum, token) => sum + token.value, 0);
      
      setTokens(mockTokens);
      setTotalValue(total);
      
      alert(`Scan complete! Found ${mockTokens.length} tokens worth $${total.toFixed(2)}`);
    } catch (error) {
      console.error('Scan error:', error);
      alert('Scan failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign message function
  const signMessage = async () => {
    if (!address) return;
    
    try {
      const message = `Signing test message for Wallet Scanner\nTimestamp: ${Date.now()}`;
      alert(`Signing message for address: ${address}\n\n${message}`);
    } catch (error) {
      console.error('Sign error:', error);
    }
  };

  // Trigger backend
  const triggerBackend = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      // Simulate backend call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Backend triggered for wallet: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error) {
      console.error('Backend error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#0f172a',
      minHeight: '100vh',
      color: 'white'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: '1px solid #334155',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '24px',
          background: 'linear-gradient(90deg, #3b82f6, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🦊 ConnectKit Wallet Scanner
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {isConnected && (
            <div style={{
              background: '#1e293b',
              padding: '8px 16px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              border: '1px solid #334155',
              fontSize: '14px'
            }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
          <ConnectKitButton />
        </div>
      </header>

      <main>
        {isConnected ? (
          <>
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={scanWallet}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? '⏳ Scanning...' : '🔍 Scan Wallet'}
              </button>
              
              <button
                onClick={signMessage}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#f59e0b',
                  color: 'black',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                ✍️ Sign Message
              </button>
              
              <button
                onClick={triggerBackend}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                🚀 Trigger Backend
              </button>
              
              <button
                onClick={() => disconnect()}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                🔌 Disconnect
              </button>
            </div>

            {/* Portfolio Section */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '1px solid #334155'
            }}>
              <h2 style={{ marginBottom: '20px', color: '#f8fafc' }}>
                💰 Portfolio Value: ${totalValue.toFixed(2)}
              </h2>
              
              {tokens.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  {tokens.map((token, index) => (
                    <div key={index} style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px'
                      }}>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#3b82f6'
                        }}>
                          {token.symbol}
                        </span>
                        <span style={{
                          background: '#10b981',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {token.chain}
                        </span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {token.balance}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        ${token.value.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <p style={{ fontSize: '18px', marginBottom: '10px' }}>No tokens found yet</p>
                  <p style={{ fontSize: '14px' }}>Click "Scan Wallet" to discover your tokens</p>
                </div>
              )}
            </div>

            {/* Networks Section */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#f8fafc' }}>
                🌐 Supported Networks
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {CONFIG.CHAINS.map((chain, index) => (
                  <div key={index} style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #3b82f6',
                    fontSize: '14px'
                  }}>
                    {chain.name}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>
              Welcome to Wallet Scanner
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '40px' }}>
              Connect your wallet to scan tokens across multiple networks
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px',
              marginTop: '40px'
            }}>
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                padding: '30px',
                borderRadius: '12px',
                border: '1px solid #334155',
                transition: 'all 0.2s'
              }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '20px' }}>🔍</span>
                <h3 style={{ marginBottom: '10px', color: '#f8fafc' }}>Token Scanning</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  Scan ERC20 tokens across Ethereum, Polygon, BNB Chain, and more
                </p>
              </div>
              
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                padding: '30px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '20px' }}>💰</span>
                <h3 style={{ marginBottom: '10px', color: '#f8fafc' }}>Portfolio Tracking</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  Track total value across all networks in real-time
                </p>
              </div>
              
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                padding: '30px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '20px' }}>🔄</span>
                <h3 style={{ marginBottom: '10px', color: '#f8fafc' }}>500+ Wallets</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  Connect with MetaMask, WalletConnect, Coinbase, and 500+ more wallets
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: '40px', padding: '20px' }}>
              <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
                Click the "Connect Wallet" button above to get started
              </p>
            </div>
          </div>
        )}
      </main>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #334155',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '18px', color: 'white' }}>Loading...</div>
        </div>
      )}
    </div>
  );
}

// Main App wrapper
export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">
          <WalletApp />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}