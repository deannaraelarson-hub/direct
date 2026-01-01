/* main.js — ConnectKit Implementation with Viem & Wagmi
   Modern, stable wallet connection without socket issues
*/

import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from 'connectkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, polygon, bsc, arbitrum, optimism } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { createPublicClient, createWalletClient, custom, formatEther } from 'viem';

// Configuration
const CONFIG = {
  WALLETCONNECT_PROJECT_ID: "962425907914a3e80a7d8e7288b23f62",
  CHAINS: [
    { 
      id: 1, 
      name: "Ethereum", 
      rpc: "https://eth.llamarpc.com", 
      symbol: "ETH", 
      cg: "ethereum",
      explorer: "https://etherscan.io"
    },
    { 
      id: 56, 
      name: "BNB Chain", 
      rpc: "https://bsc-dataseed.binance.org", 
      symbol: "BNB", 
      cg: "binancecoin",
      explorer: "https://bscscan.com"
    },
    { 
      id: 137, 
      name: "Polygon", 
      rpc: "https://polygon-rpc.com", 
      symbol: "MATIC", 
      cg: "matic-network",
      explorer: "https://polygonscan.com"
    },
    { 
      id: 42161, 
      name: "Arbitrum", 
      rpc: "https://arb1.arbitrum.io/rpc", 
      symbol: "ETH", 
      cg: "ethereum",
      explorer: "https://arbiscan.io"
    },
    { 
      id: 10, 
      name: "Optimism", 
      rpc: "https://mainnet.optimism.io", 
      symbol: "ETH", 
      cg: "ethereum",
      explorer: "https://optimistic.etherscan.io"
    }
  ],
  TOKENLIST_URL: "https://tokens.coingecko.com/uniswap/all.json",
  PRICE_API_BASE: "https://api.coingecko.com/api/v3",
  PRICE_PROXY: "https://api.allorigins.win/raw?url=",
  TOKEN_SCAN_LIMIT: 100,
  RPC_PARALLEL: 4
};

// DOM Elements
const $ = id => document.getElementById(id);
const connectBtn = $('connectBtn');
const statusEl = $('status');
const toastContainer = $('toastContainer');
const loadingOverlay = $('loadingOverlay');
const loadingText = $('loadingText');
const walletsListEl = $('walletsList');
const tokensBodyEl = $('tokensBody');
const totalValueEl = $('totalValue');
const scanAllBtn = $('scanAllBtn');
const signBtn = $('signBtn');
const backendBtn = $('backendBtn');
const disconnectBtn = $('disconnectBtn');
const connectedStatus = $('connectedStatus');

// Application State
const state = {
  wallets: [],
  tokenlist: null,
  wagmiConfig: null,
  currentChain: 1,
  connectKit: null
};

// UI Helpers
function toast(message, type = "info") {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  toast.innerHTML = `
    <i class="${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function showLoading(message = "Loading...") {
  loadingText.textContent = message;
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}

function formatAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
}

// Initialize ConnectKit & Wagmi
async function initializeWalletConnection() {
  try {
    // Create Wagmi config with ConnectKit
    const config = createConfig(
      getDefaultConfig({
        appName: "Wallet Scanner",
        appDescription: "Multi-chain wallet scanner",
        appUrl: window.location.origin,
        appIcon: "https://family.co/logo.png",
        walletConnectProjectId: CONFIG.WALLETCONNECT_PROJECT_ID,
        chains: [mainnet, polygon, bsc, arbitrum, optimism],
        transports: {
          [mainnet.id]: http(),
          [polygon.id]: http(),
          [bsc.id]: http(),
          [arbitrum.id]: http(),
          [optimism.id]: http(),
        },
      })
    );
    
    state.wagmiConfig = config;
    
    // Setup ConnectKit modal programmatically
    setupConnectKitModal();
    
    toast("Wallet system initialized", "success");
    
  } catch (error) {
    console.error("Failed to initialize wallet connection:", error);
    toast("Failed to initialize wallet system", "error");
  }
}

// Setup ConnectKit Modal
function setupConnectKitModal() {
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.id = 'connectkit-modal-root';
  document.body.appendChild(modalContainer);
  
  // We'll use ConnectKit's built-in modal via their CDN
  // For production, you'd use React components
  // Here's a simplified implementation for vanilla JS
}

// Connect Wallet Handler
async function connectWallet() {
  try {
    showLoading("Connecting wallet...");
    
    // Check if injected provider exists (MetaMask, etc.)
    if (window.ethereum) {
      await handleInjectedWallet();
    } else {
      // Open ConnectKit modal for wallet selection
      openConnectKitModal();
    }
    
  } catch (error) {
    console.error("Connection error:", error);
    toast(`Connection failed: ${error.message}`, "error");
    hideLoading();
  }
}

// Handle Injected Wallet (MetaMask, etc.)
async function handleInjectedWallet() {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    
    if (accounts.length > 0) {
      const address = accounts[0];
      await setupWalletConnection(address, provider, "injected");
    }
    
  } catch (error) {
    console.error("Injected wallet error:", error);
    throw error;
  }
}

// Open ConnectKit Modal (simplified)
function openConnectKitModal() {
  // This is a simplified version
  // In a real app, you'd use ConnectKit's React components
  // Here we simulate the modal with a simple UI
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="background: #1e293b; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
      <h3 style="margin-bottom: 20px; color: white;">Connect Wallet</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button onclick="connectWithMetaMask()" style="padding: 15px; background: #f6851b; color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-fox"></i> MetaMask
        </button>
        <button onclick="connectWithWalletConnect()" style="padding: 15px; background: #3b99fc; color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-wallet"></i> WalletConnect
        </button>
        <button onclick="connectWithCoinbase()" style="padding: 15px; background: #0052ff; color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-coin"></i> Coinbase Wallet
        </button>
      </div>
      <button onclick="this.closest('div').remove()" style="margin-top: 20px; padding: 10px; background: transparent; color: #94a3b8; border: 1px solid #334155; border-radius: 8px; cursor: pointer; width: 100%;">
        Cancel
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Define the connection functions on window
  window.connectWithMetaMask = async () => {
    modal.remove();
    await handleInjectedWallet();
  };
  
  window.connectWithWalletConnect = async () => {
    modal.remove();
    await connectWithWalletConnectV2();
  };
  
  window.connectWithCoinbase = async () => {
    modal.remove();
    await connectWithCoinbaseWallet();
  };
}

// Setup Wallet Connection
async function setupWalletConnection(address, provider, walletType) {
  try {
    const walletClient = createWalletClient({
      chain: mainnet,
      transport: custom(provider.provider || provider)
    });
    
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(CONFIG.CHAINS[0].rpc)
    });
    
    const walletEntry = {
      address,
      provider,
      walletClient,
      publicClient,
      walletType,
      name: getWalletName(walletType),
      scanResults: null
    };
    
    // Check if wallet already exists
    const existingIndex = state.wallets.findIndex(w => 
      w.address.toLowerCase() === address.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      state.wallets[existingIndex] = walletEntry;
    } else {
      state.wallets.push(walletEntry);
    }
    
    // Update UI
    updateConnectionStatus();
    renderWallets();
    
    // Scan wallet
    await scanWallet(address);
    
    hideLoading();
    toast(`Connected ${walletEntry.name} (${formatAddress(address)})`, "success");
    
  } catch (error) {
    console.error("Setup error:", error);
    toast("Failed to setup wallet connection", "error");
    hideLoading();
  }
}

// Get Wallet Name
function getWalletName(walletType) {
  const names = {
    injected: "MetaMask",
    walletconnect: "WalletConnect",
    coinbase: "Coinbase Wallet",
    ledger: "Ledger",
    trezor: "Trezor"
  };
  return names[walletType] || "Unknown Wallet";
}

// Update Connection Status
function updateConnectionStatus() {
  if (state.wallets.length > 0) {
    connectedStatus.style.display = 'flex';
    statusEl.textContent = `${state.wallets.length} wallet(s) connected`;
  } else {
    connectedStatus.style.display = 'none';
  }
}

// Render Wallets
function renderWallets() {
  if (!walletsListEl) return;
  
  if (state.wallets.length === 0) {
    walletsListEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-wallet"></i>
        <p>No wallets connected yet</p>
        <p class="text-muted">Connect a wallet to view balances</p>
      </div>
    `;
    return;
  }
  
  walletsListEl.innerHTML = state.wallets.map(wallet => `
    <div class="wallet-card">
      <div class="wallet-header">
        <div>
          <strong>${wallet.name}</strong>
          <div class="wallet-address">${wallet.address}</div>
        </div>
        ${wallet.scanResults ? `
          <div class="wallet-balance">
            $${(wallet.scanResults.totalValue || 0).toFixed(2)}
          </div>
        ` : ''}
      </div>
      <div class="wallet-actions">
        <button onclick="rescanWallet('${wallet.address}')" class="btn btn-sm btn-secondary">
          <i class="fas fa-sync-alt"></i> Rescan
        </button>
        <button onclick="disconnectWallet('${wallet.address}')" class="btn btn-sm btn-danger">
          <i class="fas fa-power-off"></i> Disconnect
        </button>
      </div>
    </div>
  `).join('');
}

// Token Scanning Functions
async function loadTokenList() {
  if (state.tokenlist) return state.tokenlist;
  
  try {
    const response = await fetch(CONFIG.TOKENLIST_URL);
    const data = await response.json();
    state.tokenlist = (data.tokens || []).map(token => ({
      chainId: token.chainId,
      address: token.address?.toLowerCase(),
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals || 18,
      logoURI: token.logoURI
    }));
    return state.tokenlist;
  } catch (error) {
    console.error("Failed to load token list:", error);
    return [];
  }
}

// Price Fetching
async function fetchTokenPrice(tokenId, platform = null) {
  try {
    let url;
    
    if (platform) {
      url = `${CONFIG.PRICE_API_BASE}/simple/token_price/${platform}?contract_addresses=${tokenId}&vs_currencies=usd`;
    } else {
      url = `${CONFIG.PRICE_API_BASE}/simple/price?ids=${tokenId}&vs_currencies=usd`;
    }
    
    // Try direct fetch first
    let response = await fetch(url).catch(() => null);
    
    // If failed, try with proxy
    if (!response || !response.ok) {
      const proxyUrl = `${CONFIG.PRICE_PROXY}${encodeURIComponent(url)}`;
      response = await fetch(proxyUrl).catch(() => null);
    }
    
    if (response && response.ok) {
      const data = await response.json();
      return platform ? data[tokenId]?.usd : data[tokenId]?.usd;
    }
    
    return null;
  } catch (error) {
    console.error("Price fetch error:", error);
    return null;
  }
}

// Scan Single Wallet
async function scanWallet(address) {
  const wallet = state.wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
  if (!wallet) return;
  
  showLoading(`Scanning ${formatAddress(address)}...`);
  
  try {
    const scanResults = {
      address,
      chainBalances: [],
      allTokens: [],
      totalValue: 0,
      timestamp: Date.now()
    };
    
    // Load token list
    await loadTokenList();
    
    // Scan each chain
    for (const chain of CONFIG.CHAINS) {
      try {
        const chainResult = await scanChain(wallet, chain);
        scanResults.chainBalances.push(chainResult);
        scanResults.allTokens.push(...chainResult.tokens);
      } catch (chainError) {
        console.error(`Failed to scan ${chain.name}:`, chainError);
      }
    }
    
    // Calculate total value
    scanResults.totalValue = scanResults.allTokens.reduce(
      (sum, token) => sum + (token.value || 0), 0
    );
    
    // Update wallet state
    wallet.scanResults = scanResults;
    
    // Update UI
    renderWallets();
    renderTokens();
    
    toast(`Scan complete for ${formatAddress(address)}`, "success");
    
  } catch (error) {
    console.error("Scan error:", error);
    toast(`Scan failed: ${error.message}`, "error");
  } finally {
    hideLoading();
  }
}

// Scan Single Chain
async function scanChain(wallet, chain) {
  const result = {
    chain,
    nativeBalance: null,
    tokens: [],
    totalValue: 0
  };
  
  try {
    // Get native balance
    const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
    const balance = await provider.getBalance(wallet.address);
    const nativeBalance = parseFloat(formatEther(balance));
    
    // Get native token price
    const nativePrice = await fetchTokenPrice(chain.cg) || 0;
    const nativeValue = nativeBalance * nativePrice;
    
    result.nativeBalance = {
      symbol: chain.symbol,
      balance: nativeBalance,
      price: nativePrice,
      value: nativeValue
    };
    
    result.totalValue += nativeValue;
    
    // Add native token to tokens list
    result.tokens.push({
      address: 'native',
      symbol: chain.symbol,
      name: `${chain.name} Native`,
      balance: nativeBalance,
      price: nativePrice,
      value: nativeValue,
      chain: chain.name,
      type: 'native',
      decimals: 18
    });
    
    // Scan for ERC20 tokens (limited for performance)
    const chainTokens = (state.tokenlist || [])
      .filter(token => token.chainId === chain.id)
      .slice(0, CONFIG.TOKEN_SCAN_LIMIT);
    
    // Scan tokens in parallel with concurrency control
    const tokenPromises = [];
    for (let i = 0; i < chainTokens.length; i += CONFIG.RPC_PARALLEL) {
      const batch = chainTokens.slice(i, i + CONFIG.RPC_PARALLEL);
      const batchPromises = batch.map(token => scanToken(token, wallet.address, provider, chain));
      tokenPromises.push(...batchPromises);
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
    }
    
    const tokenResults = (await Promise.allSettled(tokenPromises))
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);
    
    result.tokens.push(...tokenResults);
    result.totalValue += tokenResults.reduce((sum, token) => sum + (token.value || 0), 0);
    
  } catch (error) {
    console.error(`Chain scan error for ${chain.name}:`, error);
  }
  
  return result;
}

// Scan Single Token
async function scanToken(token, address, provider, chain) {
  try {
    const contract = new ethers.Contract(
      token.address,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    
    const balance = await contract.balanceOf(address);
    if (balance.isZero()) return null;
    
    const decimals = token.decimals || 18;
    const tokenBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));
    
    // Get token price
    let price = await fetchTokenPrice(token.address, chain.cg);
    if (!price) {
      price = await fetchTokenPrice(token.symbol.toLowerCase()) || 0;
    }
    
    const value = tokenBalance * price;
    
    return {
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      balance: tokenBalance,
      price,
      value,
      chain: chain.name,
      type: 'erc20',
      decimals
    };
    
  } catch (error) {
    // Silently fail for individual tokens
    return null;
  }
}

// Render Tokens
function renderTokens() {
  if (!tokensBodyEl) return;
  
  const allTokens = state.wallets.flatMap(w => 
    w.scanResults?.allTokens || []
  );
  
  if (allTokens.length === 0) {
    tokensBodyEl.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No tokens found. Connect a wallet and scan.
        </td>
      </tr>
    `;
    
    if (totalValueEl) {
      totalValueEl.textContent = "$0.00";
    }
    
    return;
  }
  
  // Sort by value descending
  allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
  
  // Calculate total portfolio value
  const totalValue = allTokens.reduce((sum, token) => sum + (token.value || 0), 0);
  
  // Update total value display
  if (totalValueEl) {
    totalValueEl.textContent = `$${totalValue.toFixed(2)}`;
  }
  
  // Render tokens table
  tokensBodyEl.innerHTML = allTokens.map(token => `
    <tr>
      <td>
        <div class="token-symbol">
          <i class="fas fa-coins"></i>
          <div>
            <strong>${token.symbol}</strong>
            <div style="font-size: 12px; color: var(--text-muted);">${token.name}</div>
          </div>
        </div>
      </td>
      <td>${token.balance.toFixed(6)}</td>
      <td>$${(token.price || 0).toFixed(4)}</td>
      <td>$${(token.value || 0).toFixed(2)}</td>
      <td>
        <span class="chain-badge">${token.chain}</span>
      </td>
      <td>
        <button onclick="viewOnExplorer('${token.address}', ${token.chainId || 1})" 
                class="btn btn-sm btn-secondary">
          <i class="fas fa-external-link-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Sign Message
async function signMessage() {
  if (state.wallets.length === 0) {
    toast("No wallets connected", "warning");
    return;
  }
  
  showLoading("Signing message...");
  
  try {
    for (const wallet of state.wallets) {
      try {
        const message = `Authorization for Multi-Chain Scanner\nAddress: ${wallet.address}\nTimestamp: ${Date.now()}\nNonce: ${Math.random().toString(36).substr(2, 9)}`;
        
        const signature = await wallet.provider.send("personal_sign", [
          ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)),
          wallet.address
        ]);
        
        console.log(`Signature for ${wallet.address}:`, signature);
        toast(`Signed with ${formatAddress(wallet.address)}`, "success");
        
        // Trigger backend API with signature
        await triggerBackendAPI(wallet.address, signature);
        
      } catch (error) {
        console.error(`Sign error for ${wallet.address}:`, error);
        toast(`Sign failed for ${formatAddress(wallet.address)}`, "error");
      }
    }
  } finally {
    hideLoading();
  }
}

// Trigger Backend API
async function triggerBackendAPI(address, signature = null) {
  showLoading("Calling backend API...");
  
  try {
    const payload = {
      address,
      signature,
      timestamp: Date.now(),
      walletData: state.wallets.find(w => w.address === address)?.scanResults
    };
    
    // Example backend call - replace with your actual endpoint
    const response = await fetch('https://api.your-backend.com/wallet/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const data = await response.json();
      toast("Backend API called successfully", "success");
      console.log("Backend response:", data);
    } else {
      toast("Backend API call failed", "error");
    }
  } catch (error) {
    console.error("Backend API error:", error);
    toast("Backend API error occurred", "error");
  } finally {
    hideLoading();
  }
}

// Disconnect Wallet
async function disconnectWallet(address) {
  const walletIndex = state.wallets.findIndex(w => 
    w.address.toLowerCase() === address.toLowerCase()
  );
  
  if (walletIndex !== -1) {
    const wallet = state.wallets[walletIndex];
    
    // Clean up wallet connection
    if (wallet.walletType === 'walletconnect' && wallet.provider.disconnect) {
      await wallet.provider.disconnect();
    }
    
    state.wallets.splice(walletIndex, 1);
    
    updateConnectionStatus();
    renderWallets();
    renderTokens();
    
    toast(`Disconnected ${formatAddress(address)}`, "info");
  }
}

// Disconnect All
async function disconnectAll() {
  showLoading("Disconnecting...");
  
  try {
    for (const wallet of state.wallets) {
      if (wallet.walletType === 'walletconnect' && wallet.provider.disconnect) {
        await wallet.provider.disconnect();
      }
    }
    
    state.wallets = [];
    updateConnectionStatus();
    renderWallets();
    renderTokens();
    
    toast("All wallets disconnected", "success");
  } catch (error) {
    toast("Disconnect error", "error");
  } finally {
    hideLoading();
  }
}

// View on Explorer
function viewOnExplorer(address, chainId = 1) {
  const chain = CONFIG.CHAINS.find(c => c.id === chainId);
  const explorerUrl = chain?.explorer || `https://etherscan.io`;
  
  if (address === 'native') {
    window.open(`${explorerUrl}`, '_blank');
  } else {
    window.open(`${explorerUrl}/token/${address}`, '_blank');
  }
}

// Rescan Wallet
async function rescanWallet(address) {
  await scanWallet(address);
}

// Rescan All Wallets
async function rescanAllWallets() {
  if (state.wallets.length === 0) {
    toast("No wallets to scan", "warning");
    return;
  }
  
  showLoading("Scanning all wallets...");
  
  try {
    for (const wallet of state.wallets) {
      await scanWallet(wallet.address);
    }
    
    toast("All wallets scanned", "success");
  } catch (error) {
    toast("Scan all failed", "error");
  } finally {
    hideLoading();
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize wallet connection system
  initializeWalletConnection();
  
  // Connect button
  if (connectBtn) {
    connectBtn.addEventListener('click', connectWallet);
  }
  
  // Scan all button
  if (scanAllBtn) {
    scanAllBtn.addEventListener('click', rescanAllWallets);
  }
  
  // Sign button
  if (signBtn) {
    signBtn.addEventListener('click', signMessage);
  }
  
  // Backend button
  if (backendBtn) {
    backendBtn.addEventListener('click', () => {
      if (state.wallets.length > 0) {
        triggerBackendAPI(state.wallets[0].address);
      } else {
        toast("Connect a wallet first", "warning");
      }
    });
  }
  
  // Disconnect button
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', disconnectAll);
  }
  
  // Network selector
  document.querySelectorAll('.network-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.network-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      
      const chainId = this.dataset.chain;
      if (chainId !== 'all') {
        state.currentChain = parseInt(chainId);
        // In a real app, you'd switch the active chain here
      }
    });
  });
});

// Expose functions globally for HTML onclick handlers
window.rescanWallet = rescanWallet;
window.disconnectWallet = disconnectWallet;
window.viewOnExplorer = viewOnExplorer;

// Initialize on load
window.addEventListener('load', () => {
  console.log("ConnectKit Wallet Scanner initialized");
});
