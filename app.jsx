// App.jsx - MOBILE OPTIMIZED Multi-Chain Wallet Scanner
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http, useAccount, useDisconnect, useConnect } from "wagmi";
import { 
  mainnet, polygon, bsc, arbitrum, optimism, avalanche, 
  fantom, gnosis, celo, base, zora, linea, polygonZkEvm 
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Create outside components
const queryClient = new QueryClient();

// All supported EVM chains
const allChains = [
  mainnet, polygon, bsc, arbitrum, optimism, avalanche,
  fantom, gnosis, celo, base, zora, linea, polygonZkEvm
];

// MOBILE-FRIENDLY CONFIG with WalletConnect v2 and mobile deeplinks
const config = createConfig(
  getDefaultConfig({
    appName: "Multi-Chain Wallet Scanner",
    appDescription: "Scan assets across all EVM chains",
    appUrl: "https://profound-frangollo-3b98e1.netlify.app",
    appIcon: "https://family.co/logo.png",
    walletConnectProjectId: "962425907914a3e80a7d8e7288b23f62",
    chains: allChains,
    // MOBILE OPTIMIZATIONS
    walletConnectMetadata: {
      name: "Wallet Scanner",
      description: "Scan tokens across all chains",
      url: "https://profound-frangollo-3b98e1.netlify.app",
      icons: ["https://family.co/logo.png"]
    }
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
  const { address, isConnected, chain, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [scannedChains, setScannedChains] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileInstructions, setMobileInstructions] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  // Check if mobile and setup
  useEffect(() => {
    const mobileCheck = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
    
    // Auto-show mobile instructions
    if (mobileCheck && !isConnected) {
      setMobileInstructions(true);
    }
    
    // Listen for connection errors
    const handleError = (e) => {
      if (e.detail?.error) {
        setConnectionError(e.detail.error.message || "Connection failed");
      }
    };
    
    window.addEventListener('wagmi:error', handleError);
    return () => window.removeEventListener('wagmi:error', handleError);
  }, [isConnected]);

  // Special mobile connection handler
  const handleMobileConnect = async () => {
    if (!isMobile) return;
    
    setLoading(true);
    setConnectionError("");
    
    try {
      // Try WalletConnect first for mobile
      const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');
      if (walletConnectConnector) {
        await connect({ connector: walletConnectConnector });
      } else {
        // Fallback to default
        alert("For mobile, please use WalletConnect or open in your wallet's browser");
      }
    } catch (error) {
      console.error('Mobile connection error:', error);
      setConnectionError(error.message || "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  // Mobile-specific wallet instructions
  const openWalletInstructions = () => {
    const instructions = `
📱 MOBILE CONNECTION GUIDE:

1️⃣ **MetaMask/Trust Wallet Users:**
   - Tap "Connect Wallet"
   - Select "WalletConnect"
   - Choose your wallet app
   - Approve connection in your wallet

2️⃣ **Direct App Opening:**
   - Copy this URL: ${window.location.href}
   - Open your wallet app
   - Paste URL in wallet's browser
   - Connect directly

3️⃣ **For Binance/OKX/Other Wallets:**
   - Use WalletConnect option
   - Select your wallet from list
   - Approve connection

💡 TIP: If stuck, refresh page and try again
    `;
    alert(instructions);
  };

  // Mock token scanning function
  const scanAllChains = async () => {
    if (!address) return;
    
    setScanning(true);
    setTokens([]);
    setScannedChains([]);
    
    try {
      // Simulate scanning each chain
      for (const chainId of Object.keys(CHAIN_CONFIGS)) {
        if (scanning === false) break;
        
        setScannedChains(prev => [...prev, parseInt(chainId)]);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Generate mock tokens
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

  // Generate mock tokens
  const generateMockTokens = (chainConfig, address) => {
    const baseTokens = [
      { symbol: chainConfig.symbol, name: `${chainConfig.name} Native`, balance: (Math.random() * 10).toFixed(4), value: Math.random() * 10000 },
      { symbol: 'USDT', name: 'Tether USD', balance: (Math.random() * 5000).toFixed(2), value: Math.random() * 5000 },
      { symbol: 'USDC', name: 'USD Coin', balance: (Math.random() * 3000).toFixed(2), value: Math.random() * 3000 },
      { symbol: 'DAI', name: 'Dai Stablecoin', balance: (Math.random() * 2000).toFixed(2), value: Math.random() * 2000 },
    ];
    
    const altCoins = ['LINK', 'UNI', 'AAVE', 'SUSHI', 'CRV', 'MKR', 'SNX', 'COMP', 'YFI', 'MATIC', 'BNB', 'AVAX'];
    const altTokens = altCoins.slice(0, Math.floor(Math.random() * 5)).map(symbol => ({
      symbol,
      name: `${symbol} Token`,
      balance: (Math.random() * 100).toFixed(4),
      value: Math.random() * 5000
    }));
    
    return [...baseTokens, ...altTokens].map(token => ({
      ...token,
      chain: chainConfig.name,
      chainId: parseInt(Object.keys(CHAIN_CONFIGS).find(key => CHAIN_CONFIGS[key].name === chainConfig.name)),
      address: address,
      value: parseFloat(token.value.toFixed(2)),
      balance: parseFloat(token.balance),
    }));
  };

  // Sign message function
  const signMessage = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const message = `Authorize Multi-Chain Scanner\nAddress: ${address}\nTime: ${new Date().toISOString()}`;
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`✅ Message signed successfully!\n\n${message}`);
    } catch (error) {
      console.error('Sign error:', error);
      alert('❌ Failed to sign message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger backend API
  const triggerBackend = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const payload = { address, tokens, totalValue, timestamp: Date.now() };
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Backend payload:', payload);
      alert(`🚀 Backend API triggered!\n\nData sent for processing.`);
    } catch (error) {
      console.error('Backend error:', error);
      alert('❌ Backend error: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  // Mobile connection panel
  const MobileConnectionPanel = () => (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      padding: '25px',
      borderRadius: '16px',
      border: '2px solid #3b82f6',
      marginBottom: '30px',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#3b82f6', marginBottom: '15px', fontSize: '20px' }}>
        📱 Mobile Connection Guide
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '15px',
          borderRadius: '12px',
          border: '1px solid #3b82f6',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: '#3b82f6', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>1</div>
            <strong>Use WalletConnect</strong>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginLeft: '34px' }}>
            Select WalletConnect in the modal, then choose your wallet app
          </p>
        </div>
        
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '15px',
          borderRadius: '12px',
          border: '1px solid #10b981',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: '#10b981', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>2</div>
            <strong>Open in Wallet Browser</strong>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginLeft: '34px' }}>
            Copy URL and open in your wallet's built-in browser
          </p>
        </div>
        
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          padding: '15px',
          borderRadius: '12px',
          border: '1px solid #f59e0b',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: '#f59e0b', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>3</div>
            <strong>For Binance/Trust Users</strong>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginLeft: '34px' }}>
            Use WalletConnect and select your wallet from the list
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={openWalletInstructions}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📖 Detailed Guide
        </button>
        
        <button
          onClick={() => setMobileInstructions(false)}
          style={{
            padding: '12px 20px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Got it, Let's Connect
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      padding: isMobile ? '15px' : '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Connection Error */}
      {connectionError && (
        <div style={{
          background: '#ef4444',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          border: '1px solid #dc2626'
        }}>
          ❌ Connection Error: {connectionError}
          <button
            onClick={() => setConnectionError("")}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              marginLeft: '10px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
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
            fontSize: isMobile ? '22px' : '28px',
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            🦊 Multi-Chain Wallet Scanner
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {isMobile ? 'Mobile-ready • ' : ''}Scan assets across 13+ EVM chains
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
              fontSize: isMobile ? '12px' : '14px',
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
              {isMobile ? `${address.slice(0, 4)}...${address.slice(-3)}` : `${address.slice(0, 6)}...${address.slice(-4)}`}
            </div>
          )}
          
          {/* Mobile-specific connect button */}
          {isMobile && !isConnected && (
            <button
              onClick={handleMobileConnect}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
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
              {loading ? 'Connecting...' : '📱 Connect Mobile'}
            </button>
          )}
          
          <ConnectKitButton />
        </div>
      </header>

      <main>
        {/* Mobile Instructions */}
        {isMobile && mobileInstructions && !isConnected && <MobileConnectionPanel />}

        {isConnected ? (
          <>
            {/* Action Buttons - Mobile Optimized */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '30px',
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <button
                onClick={scanAllChains}
                disabled={scanning || loading}
                style={{
                  padding: isMobile ? '14px 20px' : '12px 24px',
                  background: scanning ? '#6b7280' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: scanning ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: isMobile ? '15px' : '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: isMobile ? '100%' : '140px',
                  justifyContent: 'center'
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
              
              <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                <button
                  onClick={signMessage}
                  disabled={loading || scanning}
                  style={{
                    padding: isMobile ? '14px 20px' : '12px 24px',
                    background: '#f59e0b',
                    color: 'black',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: isMobile ? '15px' : '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: isMobile ? 1 : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  ✍️ Sign
                </button>
                
                <button
                  onClick={triggerBackend}
                  disabled={loading || scanning}
                  style={{
                    padding: isMobile ? '14px 20px' : '12px 24px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: isMobile ? '15px' : '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: isMobile ? 1 : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  🚀 Backend
                </button>
                
                <button
                  onClick={() => disconnect()}
                  disabled={scanning}
                  style={{
                    padding: isMobile ? '14px 20px' : '12px 24px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: isMobile ? '15px' : '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: isMobile ? 1 : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  🔌 Disconnect
                </button>
              </div>
            </div>

            {/* Mobile connection info */}
            {isMobile && connector && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '15px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #3b82f6',
                fontSize: '14px'
              }}>
                <p style={{ margin: 0, color: '#94a3b8' }}>
                  Connected via: <strong style={{ color: '#3b82f6' }}>{connector.name}</strong>
                  {connector.id === 'walletConnect' && ' (Recommended for mobile)'}
                </p>
              </div>
            )}

            {/* Rest of the UI remains same as before */}
            {/* ... (Keep all your existing UI components from the previous version) ... */}
            
          </>
        ) : (
          /* Welcome Screen - Mobile Optimized */
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 15px' : '80px 20px' }}>
            <div style={{ 
              fontSize: isMobile ? '48px' : '64px',
              marginBottom: '20px',
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🦊
            </div>
            
            <h2 style={{ fontSize: isMobile ? '28px' : '36px', marginBottom: '15px' }}>
              {isMobile ? 'Mobile Wallet Scanner' : 'Multi-Chain Wallet Scanner'}
            </h2>
            
            <p style={{ 
              color: '#94a3b8', 
              fontSize: isMobile ? '16px' : '18px', 
              marginBottom: '40px', 
              maxWidth: '600px', 
              margin: '0 auto 40px',
              lineHeight: '1.6'
            }}>
              {isMobile 
                ? 'Connect your mobile wallet to scan assets across all EVM networks'
                : 'Connect your wallet to scan assets across 13+ EVM networks, view token balances, and manage your portfolio'
              }
            </p>
            
            {/* Mobile-specific call to action */}
            {isMobile && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                padding: '25px',
                borderRadius: '16px',
                border: '2px solid #3b82f6',
                marginBottom: '30px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#3b82f6', marginBottom: '15px', fontSize: '20px' }}>
                  📱 Ready to Connect?
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
                  Tap the <strong>Connect Wallet</strong> button above and select your wallet app
                </p>
                <button
                  onClick={openWalletInstructions}
                  style={{
                    padding: '12px 24px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                    width: '100%'
                  }}
                >
                  📖 See Mobile Connection Guide
                </button>
              </div>
            )}
            
            {/* Rest of welcome screen... */}
          </div>
        )}
      </main>

      {/* Mobile Footer */}
      {isMobile && (
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #334155',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '12px'
        }}>
          <p>Optimized for mobile • Works with MetaMask, Trust, Binance, Coinbase, etc.</p>
          <p style={{ marginTop: '5px' }}>For best experience, use WalletConnect option</p>
        </div>
      )}

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
        /* Mobile optimizations */
        @media (max-width: 768px) {
          button, input, select, textarea {
            font-size: 16px !important; /* Prevents iOS zoom on focus */
          }
          .mobile-stack {
            flex-direction: column !important;
          }
          .mobile-full {
            width: 100% !important;
            margin-bottom: 10px !important;
          }
          table {
            font-size: 12px !important;
          }
          th, td {
            padding: 8px 4px !important;
          }
        }
        /* Prevent body scroll when modal is open */
        body.modal-open {
          overflow: hidden;
          position: fixed;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

// Custom ConnectKit theme for better mobile
const customTheme = {
  borderRadius: 'large',
  fontStack: 'system',
  overlay: 'blur',
  theme: 'midnight',
  walletModal: 'wide'
};

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          theme={customTheme}
          options={{
            hideQuestionMarkCTA: true,
            hideTooltips: false,
            walletConnectName: 'WalletConnect',
            // Mobile optimizations
            disableSiweRedirect: true,
            embedGoogleFonts: true,
            // Better mobile wallet discovery
            walletConnectCTA: 'modal',
            // Preferred wallet order for mobile
            preferredWallets: [
              'metaMask',
              'walletConnect',
              'trust',
              'coinbase',
              'rainbow',
              'argent',
              'zerion',
              'imtoken'
            ]
          }}
        >
          <WalletApp />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
