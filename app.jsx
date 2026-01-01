// App.jsx - COMPLETE Multi-Chain Wallet Scanner
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http, useAccount, useDisconnect } from "wagmi";
import { 
  mainnet, polygon, bsc, arbitrum, optimism, avalanche, 
  fantom, gnosis, celo, base, zora, linea, polygonZkEvm 
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Create outside components
const queryClient = new QueryClient();

// All supported EVM chains
const allChains = [
  mainnet, polygon, bsc, arbitrum, optimism, avalanche,
  fantom, gnosis, celo, base, zora, linea, polygonZkEvm
];

// Create config with all chains
const config = createConfig(
  getDefaultConfig({
    appName: "Multi-Chain Wallet Scanner",
    appDescription: "Scan assets across all EVM chains",
    appUrl: "https://profound-frangollo-3b98e1.netlify.app",
    appIcon: "https://family.co/logo.png",
    walletConnectProjectId: "962425907914a3e80a7d8e7288b23f62",
    chains: allChains,
  })
);

// Chain configuration
const CHAIN_CONFIGS = {
  1: { name: "Ethereum", symbol: "ETH", rpc: "https://eth.llamarpc.com", explorer: "https://etherscan.io" },
  56: { name: "BNB Chain", symbol: "BNB", rpc: "https://bsc-dataseed.binance.org", explorer: "https://bscscan.com" },
  137: { name: "Polygon", symbol: "MATIC", rpc: "https://polygon-rpc.com", explorer: "https://polygonscan.com" },
  42161: { name: "Arbitrum", symbol: "ETH", rpc: "https://arb1.arbitrum.io/rpc", explorer: "https://arbiscan.io" },
  10: { name: "Optimism", symbol: "ETH", rpc: "https://mainnet.optimism.io", explorer: "https://optimistic.etherscan.io" },
  43114: { name: "Avalanche", symbol: "AVAX", rpc: "https://api.avax.network/ext/bc/C/rpc", explorer: "https://snowtrace.io" },
  250: { name: "Fantom", symbol: "FTM", rpc: "https://rpc.ftm.tools", explorer: "https://ftmscan.com" },
  100: { name: "Gnosis", symbol: "xDai", rpc: "https://rpc.gnosischain.com", explorer: "https://gnosisscan.io" },
  42220: { name: "Celo", symbol: "CELO", rpc: "https://forno.celo.org", explorer: "https://celoscan.io" },
  8453: { name: "Base", symbol: "ETH", rpc: "https://mainnet.base.org", explorer: "https://basescan.org" },
  7777777: { name: "Zora", symbol: "ETH", rpc: "https://rpc.zora.energy", explorer: "https://explorer.zora.energy" },
  59144: { name: "Linea", symbol: "ETH", rpc: "https://rpc.linea.build", explorer: "https://lineascan.build" },
  1101: { name: "Polygon zkEVM", symbol: "ETH", rpc: "https://zkevm-rpc.com", explorer: "https://zkevm.polygonscan.com" },
};

function WalletApp() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [scannedChains, setScannedChains] = useState([]);
  const [mobileWarning, setMobileWarning] = useState(false);

  // Check if mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      setMobileWarning(true);
    }
  }, []);

  // Mock token scanning function
  const scanAllChains = async () => {
    if (!address) return;
    
    setScanning(true);
    setTokens([]);
    setScannedChains([]);
    
    try {
      // Simulate scanning each chain
      for (const chainId of Object.keys(CHAIN_CONFIGS)) {
        if (scanning === false) break; // Allow cancellation
        
        setScannedChains(prev => [...prev, parseInt(chainId)]);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate mock tokens for each chain
        const chainConfig = CHAIN_CONFIGS[chainId];
        const mockTokens = generateMockTokens(chainConfig, address);
        
        setTokens(prev => [...prev, ...mockTokens]);
        
        // Update total value
        const newTotal = [...tokens, ...mockTokens].reduce((sum, token) => sum + token.value, 0);
        setTotalValue(newTotal);
      }
      
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setScanning(false);
    }
  };

  // Generate mock tokens for demonstration
  const generateMockTokens = (chainConfig, address) => {
    const baseTokens = [
      { symbol: chainConfig.symbol, name: `${chainConfig.name} Native`, balance: Math.random() * 10, value: Math.random() * 10000 },
      { symbol: 'USDT', name: 'Tether USD', balance: Math.random() * 5000, value: Math.random() * 5000 },
      { symbol: 'USDC', name: 'USD Coin', balance: Math.random() * 3000, value: Math.random() * 3000 },
      { symbol: 'DAI', name: 'Dai Stablecoin', balance: Math.random() * 2000, value: Math.random() * 2000 },
    ];
    
    const altCoins = ['LINK', 'UNI', 'AAVE', 'SUSHI', 'CRV', 'MKR', 'SNX', 'COMP', 'YFI'];
    const altTokens = altCoins.slice(0, Math.floor(Math.random() * 4)).map(symbol => ({
      symbol,
      name: `${symbol} Token`,
      balance: Math.random() * 100,
      value: Math.random() * 5000
    }));
    
    return [...baseTokens, ...altTokens].map(token => ({
      ...token,
      chain: chainConfig.name,
      chainId: parseInt(Object.keys(CHAIN_CONFIGS).find(key => CHAIN_CONFIGS[key].name === chainConfig.name)),
      address: address,
      value: parseFloat(token.value.toFixed(2)),
      balance: parseFloat(token.balance.toFixed(4)),
    }));
  };

  // Sign message function
  const signMessage = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      // In a real app, you would use wagmi's useSignMessage hook
      const message = `Authorize Multi-Chain Scanner\nAddress: ${address}\nTime: ${new Date().toISOString()}`;
      
      // Simulate signing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Message signed successfully!\n\n${message}`);
    } catch (error) {
      console.error('Sign error:', error);
      alert('Failed to sign message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger backend API
  const triggerBackend = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      
      const payload = {
        address,
        chainId: chain?.id || 1,
        timestamp: Date.now(),
        tokens: tokens,
        totalValue: totalValue
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Backend payload:', payload);
      alert(`Backend API triggered for ${address.slice(0, 6)}...${address.slice(-4)}\n\nCheck console for payload.`);
      
    } catch (error) {
      console.error('Backend error:', error);
      alert('Backend error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel scanning
  const cancelScan = () => {
    setScanning(false);
    setLoading(false);
  };

  // Format value
  const formatValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Mobile warning */}
      {mobileWarning && (
        <div style={{
          background: '#f59e0b',
          color: 'black',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          border: '1px solid #d97706'
        }}>
          📱 Mobile Tip: Use your wallet's in-app browser (Open in MetaMask/Trust) for best experience
        </div>
      )}

      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: '1px solid #334155',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            🦊 Multi-Chain Wallet Scanner
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Scan assets across 13+ EVM chains • 500+ wallet support
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          {isConnected && address && (
            <div style={{
              background: '#1e293b',
              padding: '8px 16px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              border: '1px solid #334155',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%'
              }}></div>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          )}
          <ConnectKitButton />
        </div>
      </header>

      <main>
        {isConnected ? (
          <>
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={scanAllChains}
                disabled={scanning || loading}
                style={{
                  padding: '12px 24px',
                  background: scanning ? '#6b7280' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: scanning ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '140px'
                }}
              >
                {scanning ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span> Scanning...
                  </>
                ) : (
                  <>🔍 Scan All Chains</>
                )}
              </button>
              
              <button
                onClick={signMessage}
                disabled={loading || scanning}
                style={{
                  padding: '12px 24px',
                  background: '#f59e0b',
                  color: 'black',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ✍️ Sign Message
              </button>
              
              <button
                onClick={triggerBackend}
                disabled={loading || scanning}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🚀 Trigger Backend
              </button>
              
              <button
                onClick={() => disconnect()}
                disabled={scanning}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔌 Disconnect
              </button>
              
              {scanning && (
                <button
                  onClick={cancelScan}
                  style={{
                    padding: '12px 24px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}
                >
                  ❌ Cancel
                </button>
              )}
            </div>

            {/* Total Value */}
            {totalValue > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '30px',
                border: '1px solid #334155',
                textAlign: 'center'
              }}>
                <h2 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>TOTAL PORTFOLIO VALUE</h2>
                <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#10b981' }}>
                  {formatValue(totalValue)}
                </div>
                <p style={{ color: '#94a3b8', marginTop: '8px' }}>
                  Across {tokens.filter((v,i,a)=>a.findIndex(t=>t.chain===v.chain)===i).length} networks • {tokens.length} tokens
                </p>
              </div>
            )}

            {/* Chains Being Scanned */}
            {scanning && scannedChains.length > 0 && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '30px',
                border: '1px solid #334155'
              }}>
                <h3 style={{ marginBottom: '15px', color: '#f8fafc' }}>🌐 Scanning Networks</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {scannedChains.map(chainId => (
                    <div key={chainId} style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid #3b82f6',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#10b981',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                      }}></div>
                      {CHAIN_CONFIGS[chainId]?.name || `Chain ${chainId}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tokens Table */}
            {tokens.length > 0 && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '30px',
                border: '1px solid #334155',
                overflowX: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#f8fafc' }}>📊 Token Balances</h3>
                  <button
                    onClick={() => setTokens([])}
                    style={{
                      padding: '8px 16px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Clear Results
                  </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: '600' }}>Token</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: '600' }}>Balance</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: '600' }}>Value</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: '600' }}>Network</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((token, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {token.symbol.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600' }}>{token.symbol}</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{token.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>
                          {token.balance.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#10b981' }}>
                          {formatValue(token.value)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            border: '1px solid #3b82f6'
                          }}>
                            {token.chain}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <button
                            onClick={() => alert(`View ${token.symbol} on explorer`)}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              color: '#3b82f6',
                              border: '1px solid #3b82f6',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            🔍 View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Supported Networks */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#f8fafc' }}>🌍 Supported Networks (13+)</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Object.keys(CHAIN_CONFIGS).map(chainId => (
                  <div key={chainId} style={{
                    background: scannedChains.includes(parseInt(chainId)) 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(59, 130, 246, 0.1)',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: scannedChains.includes(parseInt(chainId)) 
                      ? '1px solid #10b981' 
                      : '1px solid #3b82f6',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {scannedChains.includes(parseInt(chainId)) && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#10b981',
                        borderRadius: '50%'
                      }}></div>
                    )}
                    {CHAIN_CONFIGS[chainId].name}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ 
              fontSize: '64px',
              marginBottom: '20px',
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🦊
            </div>
            <h2 style={{ fontSize: '36px', marginBottom: '15px' }}>Multi-Chain Wallet Scanner</h2>
            <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              Connect your wallet to scan assets across 13+ EVM networks, view token balances, and manage your portfolio
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '25px',
              maxWidth: '1000px',
              margin: '0 auto 50px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '30px',
                borderRadius: '16px',
                border: '1px solid #334155',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '20px', color: '#3b82f6' }}>🔍</div>
                <h3 style={{ marginBottom: '12px', color: '#f8fafc' }}>Multi-Chain Scanning</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  Scan assets across Ethereum, Polygon, BNB Chain, Arbitrum, Optimism, and 8+ more EVM networks
                </p>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '30px',
                borderRadius: '16px',
                border: '1px solid #334155',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '20px', color: '#10b981' }}>💰</div>
                <h3 style={{ marginBottom: '12px', color: '#f8fafc' }}>Portfolio Analytics</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  View total value, token breakdowns, and network distribution with real-time pricing
                </p>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '30px',
                borderRadius: '16px',
                border: '1px solid #334155',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '20px', color: '#8b5cf6' }}>🔄</div>
                <h3 style={{ marginBottom: '12px', color: '#f8fafc' }}>500+ Wallet Support</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  Connect with MetaMask, WalletConnect, Coinbase, Trust, Binance, and 500+ more wallets
                </p>
              </div>
            </div>
            
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', maxWidth: '600px', margin: '0 auto' }}>
              <p style={{ color: '#94a3b8', marginBottom: '15px' }}>
                <span style={{ color: '#10b981' }}>✓</span> Click "Connect Wallet" button above to begin
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Works on Desktop & Mobile • No installation required • Secure & private
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {(loading || scanning) && (
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
            width: '60px',
            height: '60px',
            border: '4px solid #334155',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '20px', color: 'white', textAlign: 'center' }}>
            {scanning ? 'Scanning networks...' : 'Processing...'}
            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
              {scanning && `Scanned ${scannedChains.length} of ${Object.keys(CHAIN_CONFIGS).length} networks`}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .mobile-column { flex-direction: column; }
          table { font-size: 14px; }
          button { width: 100%; margin-bottom: 10px; }
        }
      `}</style>
    </div>
  );
}

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
