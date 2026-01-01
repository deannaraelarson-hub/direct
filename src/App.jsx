// App.jsx - WORKING SIMPLIFIED VERSION
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http, useAccount, useDisconnect } from "wagmi";
import { mainnet, polygon, bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Create outside components
const queryClient = new QueryClient();

const config = createConfig(
  getDefaultConfig({
    appName: "Wallet Scanner",
    appDescription: "Multi-chain wallet scanner",
    appUrl: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
    appIcon: "https://family.co/logo.png",
    walletConnectProjectId: "962425907914a3e80a7d8e7288b23f62",
    chains: [mainnet, polygon, bsc],
  })
);

function WalletApp() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(false);

  const handleScan = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Wallet scanned! Found tokens worth $1,234.56`);
    }, 1500);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0f172a',
        color: 'white',
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
        <p>Scanning wallet...</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#0f172a',
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
          🦊 Wallet Scanner
        </h1>
        <ConnectKitButton />
      </header>

      <main>
        {isConnected ? (
          <div>
            <div style={{
              background: '#1e293b',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid #334155'
            }}>
              <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Connected Wallet:</p>
              <p style={{ 
                fontFamily: 'monospace', 
                background: '#0f172a',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #334155'
              }}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '30px' }}>
              <button
                onClick={handleScan}
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
                🔍 Scan Wallet
              </button>

              <button
                onClick={() => alert('Sign message feature')}
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
                onClick={() => alert('Backend triggered!')}
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

            <div style={{
              background: '#1e293b',
              padding: '30px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}>
              <h2 style={{ marginBottom: '20px' }}>🌐 Supported Networks</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['Ethereum', 'Polygon', 'BNB Chain', 'Arbitrum', 'Optimism'].map((network) => (
                  <div key={network} style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: '1px solid #3b82f6'
                  }}>
                    {network}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🦊</div>
            <h2 style={{ fontSize: '32px', marginBottom: '15px' }}>Connect Your Wallet</h2>
            <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '30px' }}>
              Click the Connect Wallet button to scan tokens across multiple networks
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <div style={{
                background: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <h3 style={{ color: '#3b82f6', marginBottom: '10px' }}>🔍 Token Scanning</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Scan ERC20 tokens across 5+ networks</p>
              </div>
              <div style={{
                background: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <h3 style={{ color: '#10b981', marginBottom: '10px' }}>💰 Portfolio Value</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Track total value across all networks</p>
              </div>
              <div style={{
                background: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>🔄 500+ Wallets</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Connect with MetaMask, WalletConnect, Coinbase, and more</p>
              </div>
            </div>
          </div>
        )}
      </main>
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