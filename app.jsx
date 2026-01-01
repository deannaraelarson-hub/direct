import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http, useAccount } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Create outside components
const queryClient = new QueryClient();

const config = createConfig(
  getDefaultConfig({
    appName: "Wallet Scanner",
    appUrl: "https://your-site.netlify.app",
    walletConnectProjectId: "962425907914a3e80a7d8e7288b23f62",
    chains: [mainnet],
  })
);

function WalletApp() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);

  const handleScan = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Scanned! Found tokens worth $1,234.56`);
    }, 1000);
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
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
            <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
            <button 
              onClick={handleScan}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Scan Wallet
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2>Connect Your Wallet</h2>
            <p style={{ color: '#94a3b8', margin: '20px 0' }}>
              Click the Connect Wallet button above
            </p>
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
        <ConnectKitProvider>
          <WalletApp />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
