// App.jsx - UNIVERSAL Multi-Chain Wallet Scanner (EVM + Non-EVM)
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http, useAccount, useDisconnect, useBalance } from "wagmi";
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

// MOBILE-FRIENDLY CONFIG with REAL Project ID
const config = createConfig(
  getDefaultConfig({
    appName: "Universal Chain Scanner",
    appDescription: "Scan assets across EVM & non-EVM chains",
    appUrl: "https://profound-frangollo-3b98e1.netlify.app",
    appIcon: "https://family.co/logo.png",
    walletConnectProjectId: "962425907914a3e80a7d8e7288b23f62", // Your real ID
    chains: allChains,
    transports: allChains.reduce((acc, chain) => {
      acc[chain.id] = http();
      return acc;
    }, {}),
    // Enhanced mobile metadata
    walletConnectMetadata: {
      name: "Universal Chain Scanner",
      description: "Scan Bitcoin, Solana, Ethereum, and 30+ chains",
      url: "https://profound-frangollo-3b98e1.netlify.app",
      icons: ["https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png"]
    }
  })
);

// Universal chain configuration (EVM + Non-EVM)
const UNIVERSAL_CHAINS = {
  // EVM Chains (Your existing + more)
  evm: {
    1: { 
      name: "Ethereum", 
      symbol: "ETH", 
      type: "evm",
      rpc: "https://eth.llamarpc.com", 
      explorer: "https://etherscan.io",
      nativeCoin: "ETH"
    },
    56: { 
      name: "BNB Chain", 
      symbol: "BNB", 
      type: "evm",
      rpc: "https://bsc-dataseed.binance.org", 
      explorer: "https://bscscan.com",
      nativeCoin: "BNB"
    },
    137: { 
      name: "Polygon", 
      symbol: "MATIC", 
      type: "evm",
      rpc: "https://polygon-rpc.com", 
      explorer: "https://polygonscan.com",
      nativeCoin: "MATIC"
    },
    250: { 
      name: "Fantom", 
      symbol: "FTM", 
      type: "evm",
      rpc: "https://rpc.ftm.tools", 
      explorer: "https://ftmscan.com",
      nativeCoin: "FTM"
    },
    42161: { name: "Arbitrum", symbol: "ETH", type: "evm", rpc: "https://arb1.arbitrum.io/rpc", explorer: "https://arbiscan.io", nativeCoin: "ETH" },
    10: { name: "Optimism", symbol: "ETH", type: "evm", rpc: "https://mainnet.optimism.io", explorer: "https://optimistic.etherscan.io", nativeCoin: "ETH" },
    43114: { name: "Avalanche", symbol: "AVAX", type: "evm", rpc: "https://api.avax.network/ext/bc/C/rpc", explorer: "https://snowtrace.io", nativeCoin: "AVAX" },
    100: { name: "Gnosis", symbol: "xDai", type: "evm", rpc: "https://rpc.gnosischain.com", explorer: "https://gnosisscan.io", nativeCoin: "xDai" },
    42220: { name: "Celo", symbol: "CELO", type: "evm", rpc: "https://forno.celo.org", explorer: "https://celoscan.io", nativeCoin: "CELO" },
    8453: { name: "Base", symbol: "ETH", type: "evm", rpc: "https://mainnet.base.org", explorer: "https://basescan.org", nativeCoin: "ETH" },
    7777777: { name: "Zora", symbol: "ETH", type: "evm", rpc: "https://rpc.zora.energy", explorer: "https://explorer.zora.energy", nativeCoin: "ETH" },
    59144: { name: "Linea", symbol: "ETH", type: "evm", rpc: "https://rpc.linea.build", explorer: "https://lineascan.build", nativeCoin: "ETH" },
    1101: { name: "Polygon zkEVM", symbol: "ETH", type: "evm", rpc: "https://zkevm-rpc.com", explorer: "https://zkevm.polygonscan.com", nativeCoin: "ETH" },
  },
  
  // NON-EVM Chains (New additions)
  nonevm: {
    "bitcoin": { 
      name: "Bitcoin", 
      symbol: "BTC", 
      type: "utxo",
      api: "https://blockstream.info/api", 
      explorer: "https://blockstream.info",
      nativeCoin: "BTC"
    },
    "solana": { 
      name: "Solana", 
      symbol: "SOL", 
      type: "solana",
      api: "https://api.mainnet-beta.solana.com", 
      explorer: "https://solscan.io",
      nativeCoin: "SOL"
    },
    "cardano": { 
      name: "Cardano", 
      symbol: "ADA", 
      type: "cardano",
      api: "https://cardano-mainnet.blockfrost.io/api/v0", 
      explorer: "https://cardanoscan.io",
      nativeCoin: "ADA"
    },
    "ripple": { 
      name: "Ripple", 
      symbol: "XRP", 
      type: "xrp",
      api: "https://s2.ripple.com:51234", 
      explorer: "https://xrpscan.com",
      nativeCoin: "XRP"
    },
    "polkadot": { 
      name: "Polkadot", 
      symbol: "DOT", 
      type: "substrate",
      api: "https://rpc.polkadot.io", 
      explorer: "https://polkadot.subscan.io",
      nativeCoin: "DOT"
    },
    "cosmos": { 
      name: "Cosmos", 
      symbol: "ATOM", 
      type: "cosmos",
      api: "https://cosmoshub.stakesystems.io", 
      explorer: "https://www.mintscan.io/cosmos",
      nativeCoin: "ATOM"
    },
    "tron": { 
      name: "Tron", 
      symbol: "TRX", 
      type: "tron",
      api: "https://api.trongrid.io", 
      explorer: "https://tronscan.org",
      nativeCoin: "TRX"
    },
    "litecoin": { 
      name: "Litecoin", 
      symbol: "LTC", 
      type: "utxo",
      api: "https://blockchair.com/litecoin", 
      explorer: "https://blockchair.com/litecoin",
      nativeCoin: "LTC"
    },
    "dogecoin": { 
      name: "Dogecoin", 
      symbol: "DOGE", 
      type: "utxo",
      api: "https://dogechain.info/api/v1", 
      explorer: "https://dogechain.info",
      nativeCoin: "DOGE"
    }
  }
};

// Comprehensive token database
const TOKEN_DATABASE = {
  // Ethereum major tokens
  "1": [
    { symbol: "ETH", name: "Ethereum", type: "native", address: "native", decimals: 18 },
    { symbol: "USDT", name: "Tether USD", type: "erc20", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", type: "erc20", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    { symbol: "DAI", name: "Dai Stablecoin", type: "erc20", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
    { symbol: "WBTC", name: "Wrapped Bitcoin", type: "erc20", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
    { symbol: "LINK", name: "Chainlink", type: "erc20", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18 },
    { symbol: "UNI", name: "Uniswap", type: "erc20", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18 },
    { symbol: "AAVE", name: "Aave", type: "erc20", address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18 },
    { symbol: "MKR", name: "Maker", type: "erc20", address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", decimals: 18 },
    { symbol: "SNX", name: "Synthetix", type: "erc20", address: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", decimals: 18 },
  ],
  
  // BNB Chain
  "56": [
    { symbol: "BNB", name: "BNB", type: "native", address: "native", decimals: 18 },
    { symbol: "BUSD", name: "Binance USD", type: "bep20", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18 },
    { symbol: "CAKE", name: "PancakeSwap", type: "bep20", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", decimals: 18 },
    { symbol: "XVS", name: "Venus", type: "bep20", address: "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63", decimals: 18 },
  ],
  
  // Polygon
  "137": [
    { symbol: "MATIC", name: "Polygon", type: "native", address: "native", decimals: 18 },
    { symbol: "QUICK", name: "QuickSwap", type: "erc20", address: "0x831753DD7087CaC61aB5644b308642cc1c33Dc13", decimals: 18 },
  ],
  
  // Fantom
  "250": [
    { symbol: "FTM", name: "Fantom", type: "native", address: "native", decimals: 18 },
    { symbol: "BOO", name: "SpookySwap", type: "erc20", address: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE", decimals: 18 },
  ],
  
  // Solana (non-EVM but using same structure)
  "solana": [
    { symbol: "SOL", name: "Solana", type: "native", address: "native", decimals: 9 },
    { symbol: "USDC", name: "USD Coin (Solana)", type: "spl", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
    { symbol: "RAY", name: "Raydium", type: "spl", address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", decimals: 6 },
    { symbol: "SRM", name: "Serum", type: "spl", address: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt", decimals: 6 },
  ],
};

function WalletApp() {
  const { address, isConnected, chain, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ethBalance } = useBalance({ address });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [allTokens, setAllTokens] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [scannedChains, setScannedChains] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [scanMode, setScanMode] = useState("all"); // "all", "evm", "nonevm"

  // Check if mobile
  useEffect(() => {
    const mobileCheck = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
    
    // Listen for connection errors
    const handleError = (e) => {
      if (e.detail?.error) {
        setConnectionError(e.detail.error.message || "Connection failed");
      }
    };
    
    window.addEventListener('wagmi:error', handleError);
    return () => window.removeEventListener('wagmi:error', handleError);
  }, []);

  // Enhanced token scanning function
  const scanUniversalChains = async () => {
    if (!address) return;
    
    setScanning(true);
    setAllTokens([]);
    setScannedChains([]);
    setTotalValue(0);
    
    try {
      let allScannedTokens = [];
      let totalVal = 0;
      
      // Determine which chains to scan
      const chainsToScan = scanMode === "all" 
        ? [...Object.values(UNIVERSAL_CHAINS.evm), ...Object.values(UNIVERSAL_CHAINS.nonevm)]
        : scanMode === "evm" 
          ? Object.values(UNIVERSAL_CHAINS.evm)
          : Object.values(UNIVERSAL_CHAINS.nonevm);
      
      for (const chainConfig of chainsToScan) {
        if (!scanning) break;
        
        setScannedChains(prev => [...prev, chainConfig.name]);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate tokens for this chain
        const chainTokens = await generateChainTokens(chainConfig, address);
        allScannedTokens = [...allScannedTokens, ...chainTokens];
        
        // Update total value
        totalVal = allScannedTokens.reduce((sum, token) => sum + (token.value || 0), 0);
        
        // Update state
        setAllTokens([...allScannedTokens]);
        setTotalValue(totalVal);
      }
      
      console.log("Scan complete:", { tokens: allScannedTokens, total: totalVal });
      
    } catch (error) {
      console.error('Scan error:', error);
      setConnectionError(`Scan failed: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  // Generate tokens for a specific chain
  const generateChainTokens = async (chainConfig, walletAddress) => {
    const tokens = [];
    
    // Add native coin
    const nativeBalance = Math.random() * 10;
    const nativeValue = nativeBalance * (getMockPrice(chainConfig.symbol) || 100);
    
    tokens.push({
      chain: chainConfig.name,
      chainId: chainConfig.type === "evm" ? Object.keys(UNIVERSAL_CHAINS.evm).find(key => UNIVERSAL_CHAINS.evm[key].name === chainConfig.name) : chainConfig.name,
      symbol: chainConfig.symbol,
      name: `${chainConfig.name} Native`,
      type: "native",
      balance: parseFloat(nativeBalance.toFixed(6)),
      value: parseFloat(nativeValue.toFixed(2)),
      address: walletAddress,
      decimals: 18,
    });
    
    // Add major tokens for this chain
    const chainKey = chainConfig.type === "evm" 
      ? Object.keys(UNIVERSAL_CHAINS.evm).find(key => UNIVERSAL_CHAINS.evm[key].name === chainConfig.name)
      : chainConfig.name.toLowerCase();
    
    if (TOKEN_DATABASE[chainKey]) {
      TOKEN_DATABASE[chainKey].forEach(token => {
        if (token.symbol === chainConfig.symbol) return; // Skip native
        
        const balance = Math.random() * (token.symbol.includes("USD") ? 10000 : 100);
        const price = getMockPrice(token.symbol);
        const value = balance * (price || 1);
        
        tokens.push({
          chain: chainConfig.name,
          chainId: chainKey,
          symbol: token.symbol,
          name: token.name,
          type: token.type,
          balance: parseFloat(balance.toFixed(token.decimals > 6 ? 6 : token.decimals)),
          value: parseFloat(value.toFixed(2)),
          address: token.address,
          decimals: token.decimals,
        });
      });
    }
    
    // Add additional random altcoins
    const altCoins = getAltcoinsForChain(chainConfig.name);
    altCoins.forEach(symbol => {
      const balance = Math.random() * 100;
      const price = getMockPrice(symbol);
      const value = balance * (price || 10);
      
      tokens.push({
        chain: chainConfig.name,
        chainId: chainKey,
        symbol: symbol,
        name: `${symbol} Token`,
        type: "erc20",
        balance: parseFloat(balance.toFixed(6)),
        value: parseFloat(value.toFixed(2)),
        address: `0x${Math.random().toString(36).substring(2, 12)}`,
        decimals: 18,
      });
    });
    
    return tokens;
  };

  // Helper: Get mock prices for tokens
  const getMockPrice = (symbol) => {
    const prices = {
      "BTC": 65000, "ETH": 3500, "BNB": 600, "SOL": 180, "ADA": 0.60,
      "XRP": 0.60, "DOT": 8, "ATOM": 12, "TRX": 0.12, "LTC": 85,
      "DOGE": 0.15, "MATIC": 1.10, "AVAX": 40, "FTM": 0.40, "CELO": 0.80,
      "USDT": 1, "USDC": 1, "DAI": 1, "BUSD": 1,
      "LINK": 18, "UNI": 10, "AAVE": 120, "MKR": 2500, "SNX": 4,
      "CAKE": 3, "XVS": 12, "QUICK": 80, "BOO": 1.5,
    };
    return prices[symbol] || Math.random() * 100;
  };

  // Helper: Get altcoins for specific chain
  const getAltcoinsForChain = (chainName) => {
    const altcoins = {
      "Ethereum": ["CRV", "COMP", "YFI", "SUSHI", "BAL", "REN"],
      "BNB Chain": ["ALPACA", "BANANA", "TWT", "BAKE", "BEL"],
      "Polygon": ["SUSHI", "BAL", "CRV", "GHST", "DG"],
      "Fantom": ["SPIRIT", "BEETS", "YFI", "SCREAM", "BOO"],
      "Solana": ["RAY", "SRM", "FIDA", "MAPS", "OXY"],
      "Bitcoin": [], // Bitcoin has no tokens
      "Cardano": ["AGIX", "WMT", "SUNDAE", "MELD"],
      "Ripple": [], // XRP ledger tokens
      "Polkadot": ["GLMR", "ASTR", "MOVR"],
      "Cosmos": ["OSMO", "JUNO", "SCRT"],
    };
    return altcoins[chainName] || [];
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Stop scanning
  const stopScanning = () => {
    setScanning(false);
  };

  // Export data
  const exportData = () => {
    const data = {
      address,
      timestamp: new Date().toISOString(),
      totalValue,
      tokens: allTokens,
      scannedChains
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-scan-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`✅ Data exported! Scanned ${allTokens.length} tokens across ${scannedChains.length} chains.`);
  };

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
          border: '1px solid #dc2626',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>❌ {connectionError}</span>
          <button
            onClick={() => setConnectionError("")}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
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
            background: 'linear-gradient(90deg, #3b82f6, #10b981, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            🌐 Universal Chain Scanner
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {isMobile ? 'Mobile • ' : ''}Scan Bitcoin, Solana, Ethereum, and 20+ chains
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
          
          <ConnectKitButton />
        </div>
      </header>

      <main>
        {isConnected ? (
          <>
            {/* Scan Controls */}
            <div style={{
              background: '#1e293b',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '1px solid #334155'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#e2e8f0' }}>🔍 Scan Configuration</h3>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Scan Mode</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {["all", "evm", "nonevm"].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setScanMode(mode)}
                        style={{
                          padding: '10px 20px',
                          background: scanMode === mode ? '#3b82f6' : '#334155',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}
                      >
                        {mode === "all" ? "All Chains" : mode === "evm" ? "EVM Only" : "Non-EVM"}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Actions</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={scanUniversalChains}
                      disabled={scanning}
                      style={{
                        padding: '12px 24px',
                        background: scanning ? '#6b7280' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: scanning ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {scanning ? (
                        <>
                          <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                          Scanning... ({scannedChains.length}/{scanMode === "all" ? 20 : scanMode === "evm" ? 13 : 7})
                        </>
                      ) : (
                        <>🚀 Scan {scanMode === "all" ? "All Chains" : scanMode === "evm" ? "EVM Chains" : "Non-EVM Chains"}</>
                      )}
                    </button>
                    
                    {scanning && (
                      <button
                        onClick={stopScanning}
                        style={{
                          padding: '12px 24px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ⏹️ Stop
                      </button>
                    )}
                    
                    {allTokens.length > 0 && (
                      <button
                        onClick={exportData}
                        style={{
                          padding: '12px 24px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        💾 Export JSON
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <span>📊 Mode: <strong>{scanMode.toUpperCase()}</strong></span>
                  <span>🔗 EVM Chains: <strong>13</strong></span>
                  <span>🌐 Non-EVM Chains: <strong>7</strong></span>
                  <span>💰 Total Value: <strong>{formatCurrency(totalValue)}</strong></span>
                </div>
              </div>
            </div>

            {/* Results */}
            {allTokens.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ fontSize: '20px', color: '#e2e8f0' }}>
                    📊 Scan Results ({allTokens.length} tokens)
                  </h3>
                  <div style={{
                    background: '#1e293b',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #334155'
                  }}>
                    <strong style={{ color: '#10b981', fontSize: '18px' }}>
                      {formatCurrency(totalValue)}
                    </strong>
                  </div>
                </div>
                
                {/* Chain Summary */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '30px'
                }}>
                  {Array.from(new Set(allTokens.map(t => t.chain))).map(chainName => {
                    const chainTokens = allTokens.filter(t => t.chain === chainName);
                    const chainValue = chainTokens.reduce((sum, t) => sum + t.value, 0);
                    return (
                      <div key={chainName} style={{
                        background: '#1e293b',
                        padding: '15px',
                        borderRadius: '10px',
                        border: '1px solid #334155'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#e2e8f0' }}>{chainName}</strong>
                          <span style={{
                            background: '#334155',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            {chainTokens.length} tokens
                          </span>
                        </div>
                        <div style={{ color: '#10b981', fontSize: '18px', marginTop: '8px' }}>
                          {formatCurrency(chainValue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Token Table */}
                <div style={{
                  overflowX: 'auto',
                  borderRadius: '10px',
                  border: '1px solid #334155'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '800px'
                  }}>
                    <thead style={{
                      background: '#1e293b',
                      borderBottom: '2px solid #334155'
                    }}>
                      <tr>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Chain</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Token</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Balance</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Value</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTokens.slice(0, 50).map((token, index) => (
                        <tr 
                          key={index} 
                          style={{
                            borderBottom: '1px solid #334155',
                            background: index % 2 === 0 ? '#0f172a' : '#1e293b'
                          }}
                        >
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${
                                  token.chain.includes('Ethereum') ? '#8b5cf6' :
                                  token.chain.includes('Bitcoin') ? '#f59e0b' :
                                  token.chain.includes('Solana') ? '#00ffa3' :
                                  token.chain.includes('Cardano') ? '#0033ad' : '#3b82f6'
                                }, #10b981)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px'
                              }}>
                                {token.chain[0]}
                              </div>
                              <span>{token.chain}</span>
                            </div>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <strong>{token.symbol}</strong>
                            <div style={{ color: '#94a3b8', fontSize: '12px' }}>{token.name}</div>
                          </td>
                          <td style={{ padding: '15px', fontFamily: 'monospace' }}>
                            {token.balance.toLocaleString()}
                          </td>
                          <td style={{ padding: '15px', color: '#10b981', fontWeight: '600' }}>
                            {formatCurrency(token.value)}
                          </td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              background: token.type === 'native' ? '#10b981' : 
                                        token.type === 'erc20' ? '#3b82f6' : '#8b5cf6',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              {token.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {allTokens.length > 50 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#94a3b8'
                  }}>
                    Showing 50 of {allTokens.length} tokens
                  </div>
                )}
              </div>
            )}

            {/* Mobile Connection Info */}
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
                  📱 Connected via: <strong style={{ color: '#3b82f6' }}>{connector.name}</strong>
                  {connector.id === 'walletConnect' && ' • Perfect for mobile!'}
                </p>
              </div>
            )}

            {/* Disconnect Button */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={() => disconnect()}
                style={{
                  padding: '12px 30px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                🔌 Disconnect Wallet
              </button>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 15px' : '80px 20px' }}>
            <div style={{ 
              fontSize: isMobile ? '48px' : '64px',
              marginBottom: '20px',
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #8b5cf6, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🌐
            </div>
            
            <h2 style={{ fontSize: isMobile ? '28px' : '36px', marginBottom: '15px' }}>
              Universal Chain Scanner
            </h2>
            
            <p style={{ 
              color: '#94a3b8', 
              fontSize: isMobile ? '16px' : '18px', 
              marginBottom: '40px', 
              maxWidth: '600px', 
              margin: '0 auto 40px',
              lineHeight: '1.6'
            }}>
              Connect your wallet to scan assets across <strong>20+ blockchains</strong> including<br/>
              <span style={{ color: '#f59e0b' }}>Bitcoin</span>, <span style={{ color: '#00ffa3' }}>Solana</span>, <span style={{ color: '#0033ad' }}>Cardano</span>, <span style={{ color: '#3b82f6' }}>Ethereum</span>, and all major EVM chains
            </p>
            
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
                  📱 Mobile Ready
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
                  Tap <strong>"Connect Wallet"</strong> above. Use <strong>WalletConnect</strong> for best mobile experience
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: '#334155',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>MetaMask</span>
                  <span style={{
                    background: '#334155',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>Trust Wallet</span>
                  <span style={{
                    background: '#334155',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>Coinbase</span>
                  <span style={{
                    background: '#334155',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>Binance</span>
                </div>
              </div>
            )}
            
            {/* Supported Chains Grid */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ marginBottom: '20px', color: '#e2e8f0' }}>Supported Chains</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
                gap: '15px',
                marginBottom: '40px'
              }}>
                {[
                  { name: 'Bitcoin', color: '#f59e0b', symbol: 'BTC' },
                  { name: 'Ethereum', color: '#8b5cf6', symbol: 'ETH' },
                  { name: 'Solana', color: '#00ffa3', symbol: 'SOL' },
                  { name: 'Cardano', color: '#0033ad', symbol: 'ADA' },
                  { name: 'BNB Chain', color: '#f0b90b', symbol: 'BNB' },
                  { name: 'Polygon', color: '#8247e5', symbol: 'MATIC' },
                  { name: 'Fantom', color: '#1969ff', symbol: 'FTM' },
                  { name: 'Avalanche', color: '#e84142', symbol: 'AVAX' },
                  { name: 'Arbitrum', color: '#28a0f0', symbol: 'ETH' },
                  { name: 'Optimism', color: '#ff0420', symbol: 'ETH' },
                ].map((chain, i) => (
                  <div 
                    key={i}
                    style={{
                      background: '#1e293b',
                      padding: '15px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: `2px solid ${chain.color}`
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: chain.color,
                      margin: '0 auto 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {chain.symbol[0]}
                    </div>
                    <div style={{ fontSize: '12px', color: '#e2e8f0' }}>{chain.name}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{chain.symbol}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #334155',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '14px'
      }}>
        <p>
          Universal Chain Scanner • Supports Bitcoin, Solana, Cardano, and 20+ chains
          {isMobile && ' • Optimized for mobile'}
        </p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          Uses WalletConnect v2 for secure mobile connections
        </p>
      </footer>

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
            {scanning ? `Scanning ${scannedChains[scannedChains.length - 1] || 'chains'}...` : 'Processing...'}
            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
              {scanning && `${scannedChains.length} of ${scanMode === "all" ? 20 : scanMode === "evm" ? 13 : 7} chains scanned`}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          button, input, select, textarea {
            font-size: 16px !important;
          }
          table {
            font-size: 12px;
          }
          th, td {
            padding: 10px 8px !important;
          }
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        ::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}

// Custom ConnectKit theme
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
            ],
            // Force WalletConnect on mobile
            enforceSupportedChains: false
          }}
        >
          <WalletApp />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
