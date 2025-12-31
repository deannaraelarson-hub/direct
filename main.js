// ==============================
// MULTI-CHAIN WALLET SCANNER - MAIN.JS (MOBILE + DESKTOP FIXES)
// - Adds WalletConnect fallback for mobile wallets (MetaMask Mobile, Trust, Binance, many others)
// - Uses proper MetaMask universal link format (host-based) to avoid App Store redirect
// - Attempts Phantom deep-link/connect for mobile as a fallback
// - More exhaustive token discovery using CoinGecko tokenlist + contract price lookups
// - Concurrency control and caching to avoid RPC overloads
// - Improved error messages and robust provider handling
// NOTE: This script dynamically loads @walletconnect/web3-provider when needed (via unpkg CDN).
// ==============================

const CONFIG = {
  WALLET_LINKS: {
    metamask: {
      // Use host-only universal link (avoids App Store redirection in many cases)
      mobile: {
        android: 'https://metamask.app.link/dapp/' + window.location.host,
        ios: 'https://metamask.app.link/dapp/' + window.location.host,
        universal: 'https://metamask.app.link/dapp/' + window.location.host
      },
      desktop: 'https://metamask.io/download.html',
      extension: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#initialize/welcome'
    },
    binance: {
      // Many Binance mobile users use WalletConnect or the Binance app; deep link fallback:
      mobile: {
        android: 'https://www.binance.com/en/wallet', // fallback to wallet page
        ios: 'https://www.binance.com/en/wallet',
        universal: 'https://www.binance.com/en/wallet'
      },
      desktop: 'https://www.binance.org/en/download',
      extension: 'chrome-extension://fhbohimaelbohpjbbldcngcnapndodjp/home.html'
    },
    trust: {
      mobile: {
        android: 'https://link.trustwallet.com/open_url?coin_id=714&url=' + encodeURIComponent(window.location.href),
        ios: 'trust://browse?url=' + encodeURIComponent(window.location.href),
        universal: 'https://link.trustwallet.com/open_url?coin_id=714&url=' + encodeURIComponent(window.location.href)
      },
      desktop: 'https://trustwallet.com/',
      extension: 'chrome-extension://egjidjbpglichdcondbcbdnbeeppgdph/home.html'
    },
    phantom: {
      // Phantom universal deeplink pattern
      mobile: {
        android: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href),
        ios: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href),
        universal: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href)
      },
      desktop: 'https://phantom.app/',
      extension: 'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/home.html'
    }
  },

  // Chains (added coingecko platform ids for contract price endpoint)
  EVM_CHAINS: [
    { id: 1, name: 'Ethereum', rpc: 'https://rpc.ankr.com/eth', symbol: 'ETH', explorer: 'https://etherscan.io', color: '#627EEA', cgPlatform: 'ethereum' },
    { id: 56, name: 'BNB Chain', rpc: 'https://bsc-dataseed.binance.org', symbol: 'BNB', explorer: 'https://bscscan.com', color: '#F0B90B', cgPlatform: 'binance-smart-chain' },
    { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com', symbol: 'MATIC', explorer: 'https://polygonscan.com', color: '#8247E5', cgPlatform: 'polygon-pos' },
    { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', symbol: 'ETH', explorer: 'https://arbiscan.io', color: '#28A0F0', cgPlatform: 'arbitrum-one' },
    { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io', color: '#FF0420', cgPlatform: 'optimistic-ethereum' },
    { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', explorer: 'https://snowtrace.io', color: '#E84142', cgPlatform: 'avalanche' },
    { id: 250, name: 'Fantom', rpc: 'https://rpc.ankr.com/fantom', symbol: 'FTM', explorer: 'https://ftmscan.com', color: '#1969FF', cgPlatform: 'fantom' }
  ],

  NON_EVM_CHAINS: [
    { id: 'solana', name: 'Solana', rpc: 'https://api.mainnet-beta.solana.com', symbol: 'SOL', explorer: 'https://explorer.solana.com', color: '#9945FF', cgPlatform: 'solana' }
  ],

  PRICE_API: 'https://api.coingecko.com/api/v3',
  TOKENLIST_SOURCE: 'https://tokens.coingecko.com/uniswap/all.json', // large list of tokens across chains
  TOKEN_SCAN_MAX_PER_CHAIN: 350,
  RPC_CONCURRENCY: 6,
  WC_PROVIDER_CDN: 'https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js',
  WC_BRIDGE: 'https://bridge.walletconnect.org'
};

// Simple in-memory + localStorage state
let state = {
  wallets: [],
  tokens: [],
  selectedChains: [1,56,137,42161,10,43114,250,'solana'],
  isScanning: false,
  totalValue: 0,
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  tokenlistCache: null,
  wcProvider: null // walletconnect provider instance when used
};

// ------------------------------
// Utility: dynamic script loader
// ------------------------------
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(new Error('Failed to load script: ' + src));
    document.head.appendChild(s);
  });
}

// ------------------------------
// Wallet helpers (MetaMask, Binance, Trust, Phantom, WalletConnect)
// ------------------------------
const WalletManager = {
  getWalletName(id) {
    return {
      metamask: 'MetaMask',
      binance: 'Binance Wallet',
      trust: 'Trust Wallet',
      phantom: 'Phantom'
    }[id] || id;
  },

  getMobileLink(id) {
    const entry = CONFIG.WALLET_LINKS[id];
    if (!entry) return '#';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return entry.mobile.android;
    if (ua.includes('iphone') || ua.includes('ipad')) return entry.mobile.ios;
    return entry.mobile.universal;
  },

  isWalletAvailable(id) {
    try {
      switch (id) {
        case 'metamask':
          if (window.ethereum && window.ethereum.isMetaMask) return true;
          if (Array.isArray(window.ethereum?.providers) && window.ethereum.providers.some(p => p.isMetaMask)) return true;
          if (window.web3) return true;
          return false;
        case 'binance':
          if (window.BinanceChain || window.BSC) return true;
          if (window.ethereum?.isBinance) return true;
          if (Array.isArray(window.ethereum?.providers) && window.ethereum.providers.some(p => p.isBinance)) return true;
          return false;
        case 'trust':
          if (window.ethereum?.isTrust || window.ethereum?.isTrustWallet) return true;
          if (Array.isArray(window.ethereum?.providers) && window.ethereum.providers.some(p => p.isTrust || p.isTrustWallet)) return true;
          return false;
        case 'phantom':
          return !!(window.solana && window.solana.isPhantom);
        default:
          return false;
      }
    } catch (e) {
      return false;
    }
  },

  // Primary public connect function: adapts to mobile using WalletConnect when available
  async connectWallet(id) {
    console.log('[WalletManager] connectWallet', id, 'mobile?', state.isMobile);
    if (state.isMobile) {
      // Try WalletConnect for EVM wallets (MetaMask mobile, Trust, Binance, etc.)
      if (id === 'phantom') {
        // Phantom mobile: try deep link to Phantom app
        return this.connectPhantomMobileFallback();
      }
      // Use WalletConnect for metamask/binance/trust on mobile
      return this.connectViaWalletConnect(id);
    } else {
      // Desktop flow: use injected providers
      switch (id) {
        case 'metamask': return this.connectMetaMask();
        case 'binance': return this.connectBinance();
        case 'trust': return this.connectTrust();
        case 'phantom': return this.connectPhantom();
        default: throw new Error('Unsupported wallet: ' + id);
      }
    }
  },

  // ----------------------
  // Desktop direct connectors
  // ----------------------
  async connectMetaMask() {
    const provider = this.getInjectedProvider('isMetaMask');
    if (!provider) throw new Error('MetaMask not found');
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');
      const chainIdHex = await provider.request({ method: 'eth_chainId' }).catch(()=> '0x1');
      const chainId = parseInt(chainIdHex,16);
      return this._wrapEVMWallet(provider, accounts[0], chainId, 'MetaMask', 'metamask');
    } catch (e) {
      if (e.code === 4001) throw new Error('User rejected connection');
      throw e;
    }
  },

  async connectBinance() {
    const provider = window.BinanceChain || this.getInjectedProvider('isBinance') || window.ethereum;
    if (!provider) throw new Error('Binance Chain Wallet not found');
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');
      const chainIdHex = await provider.request({ method: 'eth_chainId' }).catch(()=> '0x38');
      const chainId = parseInt(chainIdHex,16);
      return this._wrapEVMWallet(provider, accounts[0], chainId, 'Binance Wallet', 'binance');
    } catch (e) {
      if (e.code === 4001) throw new Error('User rejected connection');
      throw e;
    }
  },

  async connectTrust() {
    const provider = this.getInjectedProvider(p=> p.isTrust || p.isTrustWallet) || window.ethereum;
    if (!provider) throw new Error('Trust Wallet not found');
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');
      const chainIdHex = await provider.request({ method: 'eth_chainId' }).catch(()=> '0x1');
      const chainId = parseInt(chainIdHex,16);
      return this._wrapEVMWallet(provider, accounts[0], chainId, 'Trust Wallet', 'trust');
    } catch (e) {
      if (e.code === 4001) throw new Error('User rejected connection');
      throw e;
    }
  },

  async connectPhantom() {
    if (!window.solana || !window.solana.isPhantom) throw new Error('Phantom not found');
    try {
      const resp = await window.solana.connect();
      const publicKey = resp.publicKey.toString();
      return {
        address: publicKey,
        chainId: 'solana',
        type: 'solana',
        name: 'Phantom',
        provider: window.solana,
        walletType: 'phantom',
        isConnected: true
      };
    } catch (e) {
      if (e.code === 4001) throw new Error('User rejected Phantom connection');
      throw e;
    }
  },

  getInjectedProvider(flag) {
    // flag: string key or predicate function
    if (!window.ethereum) return null;
    if (typeof flag === 'function') {
      if (Array.isArray(window.ethereum.providers)) {
        return window.ethereum.providers.find(flag) || null;
      } else if (flag(window.ethereum)) {
        return window.ethereum;
      }
    } else {
      if (window.ethereum.isMetaMask && flag === 'isMetaMask') return window.ethereum;
      if (window.ethereum.isBinance && flag === 'isBinance') return window.ethereum;
      if (Array.isArray(window.ethereum.providers)) {
        const p = window.ethereum.providers.find(pr => !!pr[flag]);
        return p || null;
      }
      if (window.ethereum[flag]) return window.ethereum;
    }
    return null;
  },

  _wrapEVMWallet(provider, address, chainId, name, walletType) {
    return {
      address,
      chainId,
      type: 'evm',
      name,
      icon: 'fas fa-wallet',
      color: '#333',
      provider,
      walletType,
      isConnected: true
    };
  },

  // ----------------------
  // MOBILE: WalletConnect integration
  // ----------------------
  async connectViaWalletConnect(requestedWalletId) {
    // Load provider library if needed
    if (!window.WalletConnectProvider && !state.wcProvider) {
      await loadScript(CONFIG.WC_PROVIDER_CDN).catch(err => {
        console.warn('Failed to load WalletConnect provider script:', err);
      });
    }

    // If we already have a wcProvider, reuse it. Otherwise create a new one.
    if (!state.wcProvider) {
      const ProviderCtor = window.WalletConnectProvider?.default || window.WalletConnectProvider || null;
      if (!ProviderCtor) throw new Error('WalletConnect provider library not available');
      const rpcMap = {};
      CONFIG.EVM_CHAINS.forEach(c => rpcMap[c.id] = c.rpc);
      state.wcProvider = new ProviderCtor({
        rpc: rpcMap,
        bridge: CONFIG.WC_BRIDGE,
        qrcode: true // On mobile we want deep link flow; many wallets will open from universal link shown
      });
    }

    try {
      // Enable will display QR (desktop) or deep link (mobile) depending on environment
      await state.wcProvider.enable();
      // wc provider provides accounts and chainId
      const accounts = state.wcProvider.accounts || state.wcProvider.request?.accounts || [];
      const address = accounts[0];
      const chainId = state.wcProvider.chainId || (await state.wcProvider.request?.({ method: 'eth_chainId' }).catch(()=> '0x1'));
      // Wrap it like other evm wallets
      return {
        address,
        chainId: typeof chainId === 'string' ? parseInt(chainId, 16) : chainId,
        type: 'evm',
        name: requestedWalletId === 'metamask' ? 'MetaMask (WalletConnect)' : (requestedWalletId || 'WalletConnect'),
        icon: 'fas fa-mobile-alt',
        color: '#2d3748',
        provider: state.wcProvider,
        walletType: 'walletconnect',
        isConnected: true
      };
    } catch (err) {
      // If user cancelled or provider failed, attempt fallback to deep link open
      console.warn('WalletConnect enable failed:', err);
      // As fallback, open the mobile deep link for the requested wallet (some mobile wallets will then provide a connect button)
      const link = this.getMobileLink(requestedWalletId);
      if (link && link !== '#') {
        window.location.href = link;
        // store pending and return early - user will need to come back and connect via injected provider
        localStorage.setItem('pendingWallet', requestedWalletId);
        localStorage.setItem('pendingWalletTime', Date.now());
        throw new Error('Attempted WalletConnect flow. If nothing happened, open the wallet app and try "Connect" from there.');
      }
      throw err;
    }
  },

  // Phantom mobile fallback: open deep link and instruct user
  async connectPhantomMobileFallback() {
    // Try to open Phantom deep link and prompt user to return
    const link = this.getMobileLink('phantom');
    if (link && link !== '#') {
      localStorage.setItem('pendingWallet', 'phantom');
      localStorage.setItem('pendingWalletTime', Date.now());
      window.location.href = link;
      throw new Error('Opening Phantom mobile app. Please complete connection in the app and return.');
    }
    throw new Error('Phantom mobile deep link not available.');
  }
};

// ------------------------------
// Token Scanner (EVM + Solana basics)
// ------------------------------
const TokenScanner = {
  async scanWallet(wallet) {
    UI.showToast(`Starting scan for ${wallet.name}`, 'info');
    const results = { wallet, chainBalances: [], allTokens: [], totalValue: 0, timestamp: Date.now() };
    state.isScanning = true;

    try {
      if (wallet.type === 'evm') {
        await this.scanEVM(wallet, results);
      } else if (wallet.type === 'solana') {
        await this.scanSolana(wallet, results);
      }

      results.totalValue = results.allTokens.reduce((s,t) => s + (t.value||0), 0);
      state.isScanning = false;
      return results;
    } catch (err) {
      console.error('scanWallet error', err);
      state.isScanning = false;
      results.totalValue = results.allTokens.reduce((s,t) => s + (t.value||0), 0);
      return results;
    }
  },

  async scanEVM(wallet, results) {
    // Prepare tokenlist once
    const tokenlist = await this.getTokenList();

    for (const chain of CONFIG.EVM_CHAINS) {
      if (!state.selectedChains.includes(chain.id)) continue;
      try {
        UI.showToast(`Scanning ${chain.name} native balance...`, 'info');
        const nativeBal = await this.getNativeBalance(wallet.address, chain.rpc);
        const nativePrice = await this.getNativePrice(chain);
        const nativeValue = nativeBal * nativePrice;

        const chainResult = {
          chain,
          nativeBalance: { symbol: chain.symbol, balance: parseFloat(nativeBal.toFixed(6)), price: nativePrice, value: nativeValue },
          tokens: [],
          totalValue: nativeValue
        };

        // Prepare candidate token list for this chain: local common + tokenlist filtered by chainId
        const candidates = this.getCommonTokens(chain.id).concat(
          tokenlist.filter(t => t.chainId === chain.id).slice(0, CONFIG.TOKEN_SCAN_MAX_PER_CHAIN)
        );

        // Remove duplicates by address, preserve first occurrence
        const dedup = [];
        const seen = new Set();
        for (const t of candidates) {
          const addr = (t.address || '').toLowerCase();
          if (!addr || seen.has(addr)) continue;
          seen.add(addr);
          dedup.push(t);
        }

        // Limit again
        const toCheck = dedup.slice(0, CONFIG.TOKEN_SCAN_MAX_PER_CHAIN);
        UI.showToast(`Checking ${toCheck.length} tokens on ${chain.name}`, 'info');

        // concurrency workers
        let i = 0;
        const tokensFound = [];
        const worker = async () => {
          while (i < toCheck.length) {
            const idx = i++;
            const token = toCheck[idx];
            try {
              const balance = await this.getTokenBalance(wallet.address, token.address, chain.rpc, token.decimals || 18);
              if (balance > 0) {
                // price by contract
                let price = await this.getPriceByContract(token.address, chain.cgPlatform);
                if (!price) price = await this.getTokenPrice(token.symbol);
                const value = balance * (price || 0);
                tokensFound.push({
                  address: token.address,
                  symbol: token.symbol,
                  name: token.name,
                  balance: parseFloat(balance.toFixed(6)),
                  decimals: token.decimals || 18,
                  price: price || 0,
                  value: value || 0,
                  chain: chain.name,
                  type: 'erc20',
                  logo: TokenScanner.getTokenLogo(token.symbol)
                });
                // optional live UI update
                UI.renderAllTokens();
              }
            } catch (e) {
              // ignore per-token errors
            }
          }
        };

        const workers = Array.from({length: CONFIG.RPC_CONCURRENCY}, () => worker());
        await Promise.all(workers);

        // sort tokens found
        tokensFound.sort((a,b)=> (b.value||0)-(a.value||0));
        chainResult.tokens = tokensFound;
        chainResult.totalValue += tokensFound.reduce((s,t)=> s + (t.value||0), 0);

        // push results
        results.chainBalances.push(chainResult);
        results.allTokens.push({
          address: 'native',
          symbol: chain.symbol,
          name: `${chain.name} Native`,
          balance: chainResult.nativeBalance.balance,
          price: chainResult.nativeBalance.price,
          value: chainResult.nativeBalance.value,
          chain: chain.name,
          type: 'native',
          logo: TokenScanner.getTokenLogo(chain.symbol)
        });
        if (tokensFound.length) results.allTokens.push(...tokensFound);

      } catch (err) {
        console.warn('Chain scan error', chain.name, err);
      }

      // small throttle between chains
      await new Promise(r=>setTimeout(r, 350));
    }
  },

  async scanSolana(wallet, results) {
    if (!state.selectedChains.includes('solana')) return;
    try {
      const chain = CONFIG.NON_EVM_CHAINS.find(c => c.id === 'solana');
      const bal = await this.getSolanaBalance(wallet.address);
      const price = await this.getNativePrice(chain);
      const value = bal * price;
      const chainResult = {
        chain,
        nativeBalance: { symbol: 'SOL', balance: parseFloat(bal.toFixed(6)), price, value },
        tokens: [], totalValue: value
      };
      results.chainBalances.push(chainResult);
      results.allTokens.push({
        address: 'native',
        symbol: 'SOL',
        name: 'Solana',
        balance: chainResult.nativeBalance.balance,
        price: chainResult.nativeBalance.price,
        value: chainResult.nativeBalance.value,
        chain: 'Solana', type: 'native', logo: TokenScanner.getTokenLogo('SOL')
      });

      // Optional: fetch SPL token accounts (can be heavy). Provide best-effort basic enumerations:
      try {
        // getTokenAccountsByOwner RPC
        const rpcResp = await fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({jsonrpc:'2.0', id:1, method:'getTokenAccountsByOwner', params: [wallet.address, {programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'}, {encoding: 'jsonParsed'}]})
        });
        const data = await rpcResp.json();
        if (data.result && Array.isArray(data.result.value)) {
          const tokenAccounts = data.result.value;
          // We'll attempt to pick the top few mints (avoid scanning hundreds).
          const top = tokenAccounts.slice(0, 40);
          for (const ta of top) {
            try {
              const parsed = ta.account?.data?.parsed?.info;
              if (!parsed) continue;
              const mint = parsed.mint;
              const uiAmount = parsed.tokenAmount?.uiAmount || 0;
              if (uiAmount <= 0) continue;
              // Try to map mint to coingecko via tokenlist (coingecko tokenlist may not include SPL mints).
              // For now, just push a token entry without price (user can extend with a custom mapping).
              results.allTokens.push({
                address: mint,
                symbol: parsed.tokenAmount?.tokenSymbol || 'SPL',
                name: parsed?.meta?.name || 'SPL Token',
                balance: parseFloat(uiAmount.toFixed(6)),
                price: 0,
                value: 0,
                chain: 'Solana',
                type: 'spl',
                logo: TokenScanner.getTokenLogo('SOL')
              });
            } catch (e) {}
          }
        }
      } catch (e) {
        // ignore heavy SPL enumeration errors
      }

    } catch (err) {
      console.warn('Solana scan error', err);
    }
  },

  async getNativeBalance(address, rpcUrl) {
    try {
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({jsonrpc:'2.0', id:1, method:'eth_getBalance', params: [address, 'latest']})
      });
      const data = await resp.json();
      return data.result ? parseInt(data.result,16)/1e18 : 0;
    } catch (e) {
      console.warn('getNativeBalance error', e);
      return 0;
    }
  },

  async getSolanaBalance(address) {
    try {
      const resp = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({jsonrpc:'2.0', id:1, method:'getBalance', params:[address]})
      });
      const data = await resp.json();
      return data.result ? data.result.value/1e9 : 0;
    } catch (e) {
      return 0;
    }
  },

  async getTokenBalance(walletAddress, tokenAddress, rpcUrl, decimals = 18) {
    try {
      const callData = '0x70a08231000000000000000000000000' + walletAddress.slice(2).toLowerCase();
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({jsonrpc:'2.0', id:1, method:'eth_call', params: [{to: tokenAddress, data: callData}, 'latest']})
      });
      const data = await resp.json();
      if (data.result && data.result !== '0x') {
        const val = parseInt(data.result, 16);
        return val / Math.pow(10, decimals);
      }
    } catch (e) {
      // ignore per-token errors
    }
    return 0;
  },

  // fetch & cache tokenlist (Coingecko aggregated Uniswap list)
  async getTokenList() {
    if (state.tokenlistCache) return state.tokenlistCache;
    // Try localStorage
    try {
      const cached = localStorage.getItem('mc_tokenlist_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 3600_000) {
          state.tokenlistCache = parsed.tokens;
          return state.tokenlistCache;
        }
      }
    } catch (e) {}
    try {
      const resp = await fetch(CONFIG.TOKENLIST_SOURCE);
      if (!resp.ok) throw new Error('tokenlist fetch failed');
      const data = await resp.json();
      const tokens = (data.tokens || []).map(t => ({
        chainId: t.chainId,
        address: (t.address || '').toLowerCase(),
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals
      }));
      state.tokenlistCache = tokens;
      try {
        localStorage.setItem('mc_tokenlist_v1', JSON.stringify({ts: Date.now(), tokens}));
      } catch (e) {}
      return tokens;
    } catch (e) {
      console.warn('Failed to load tokenlist:', e);
      state.tokenlistCache = [];
      return [];
    }
  },

  // Basic common tokens per chain (ensure WBTC, USDT, USDC, BNB, etc)
  getCommonTokens(chainId) {
    const list = {
      1: [
        {address:'0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol:'USDT', name:'Tether USD', decimals:6},
        {address:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol:'USDC', name:'USD Coin', decimals:6},
        {address:'0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol:'WBTC', name:'Wrapped BTC', decimals:8},
        {address:'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol:'WETH', name:'Wrapped Ether', decimals:18}
      ],
      56: [
        {address:'0x55d398326f99059fF775485246999027B3197955', symbol:'USDT', name:'Tether USD', decimals:18},
        {address:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol:'USDC', name:'USD Coin', decimals:18},
        {address:'0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol:'BUSD', name:'Binance USD', decimals:18}
      ],
      137: [
        {address:'0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol:'USDT', name:'Tether USD', decimals:6},
        {address:'0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol:'USDC', name:'USD Coin', decimals:6}
      ],
      42161: [
        {address:'0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', symbol:'USDC', name:'USD Coin', decimals:6}
      ],
      10: [
        {address:'0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol:'USDC', name:'USD Coin', decimals:6}
      ],
      43114: [
        {address:'0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol:'USDC', name:'USD Coin', decimals:6}
      ],
      250: [
        {address:'0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', symbol:'USDC', name:'USD Coin', decimals:6}
      ]
    };
    return list[chainId] || [];
  },

  async getPriceByContract(contractAddress, coingeckoPlatform) {
    try {
      if (!contractAddress || !coingeckoPlatform) return null;
      const resp = await fetch(`${CONFIG.PRICE_API}/simple/token_price/${coingeckoPlatform}?contract_addresses=${contractAddress}&vs_currencies=usd`);
      if (!resp.ok) return null;
      const data = await resp.json();
      const key = Object.keys(data)[0];
      if (!key) return null;
      return data[key]?.usd || null;
    } catch (e) {
      return null;
    }
  },

  async getTokenPrice(symbol) {
    try {
      const id = this.getCoinId(symbol);
      const resp = await fetch(`${CONFIG.PRICE_API}/simple/price?ids=${id}&vs_currencies=usd`);
      if (!resp.ok) return this.getDefaultPrice(symbol);
      const data = await resp.json();
      return data[id]?.usd || this.getDefaultPrice(symbol);
    } catch (e) {
      return this.getDefaultPrice(symbol);
    }
  },

  async getNativePrice(chain) {
    try {
      const id = chain.cgPlatform || this.getCoinId(chain.symbol);
      const resp = await fetch(`${CONFIG.PRICE_API}/simple/price?ids=${id}&vs_currencies=usd`);
      if (!resp.ok) return this.getDefaultPrice(chain.symbol);
      const data = await resp.json();
      return data[id]?.usd || this.getDefaultPrice(chain.symbol);
    } catch (e) {
      return this.getDefaultPrice(chain.symbol);
    }
  },

  getCoinId(sym) {
    const m = {'ETH':'ethereum','BNB':'binancecoin','MATIC':'matic-network','SOL':'solana','AVAX':'avalanche-2','FTM':'fantom','BTC':'bitcoin','USDT':'tether','USDC':'usd-coin','DAI':'dai','BUSD':'binance-usd'};
    return m[sym?.toUpperCase()] || sym?.toLowerCase();
  },

  getDefaultPrice(symbol) {
    const def = {'ETH':2500,'BNB':300,'MATIC':0.8,'SOL':100,'AVAX':30,'FTM':0.3,'BTC':45000,'USDT':1,'USDC':1,'DAI':1,'BUSD':1};
    return def[symbol?.toUpperCase()] || 0;
  },

  getTokenLogo(symbol) {
    const logos = {'ETH':'https://assets.coingecko.com/coins/images/279/small/ethereum.png','BNB':'https://assets.coingecko.com/coins/images/825/small/bnb-icon2.png','MATIC':'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png','SOL':'https://assets.coingecko.com/coins/images/4128/small/solana.png','BTC':'https://assets.coingecko.com/coins/images/1/small/bitcoin.png','USDT':'https://assets.coingecko.com/coins/images/325/small/Tether.png','USDC':'https://assets.coingecko.com/coins/images/6319/small/usdc.png'};
    return logos[symbol?.toUpperCase()] || `https://via.placeholder.com/40/cccccc/000000?text=${(symbol||'TKN').substring(0,3)}`;
  }
};

// ------------------------------
// UI (kept minimal here, same as previous implementation expectations)
// ------------------------------
const UI = {
  init() {
    this.renderWalletButtons();
    this.renderChainSelector();
    this.updateNetworkStatus();
    this.setupEventListeners();
  },

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest && e.target.closest('.wallet-card');
      if (card) {
        const id = card.dataset.wallet || card.classList[1];
        handleWalletClick(id);
      }
    });
  },

  renderWalletButtons() {
    const container = document.getElementById('walletGrid');
    if (!container) return;
    const wallets = [
      {id:'metamask', name:'MetaMask', icon:'fab fa-metamask', color:'#f6851b'},
      {id:'binance', name:'Binance Wallet', icon:'fab fa-binance', color:'#F0B90B'},
      {id:'trust', name:'Trust Wallet', icon:'fas fa-shield-alt', color:'#3375bb'},
      {id:'phantom', name:'Phantom', icon:'fas fa-ghost', color:'#ab9ff2'}
    ];
    container.innerHTML = wallets.map(w => {
      const isAvailable = WalletManager.isWalletAvailable(w.id);
      const conn = WalletManager.getMobileLink(w.id);
      const status = state.isMobile ? 'Tap to open' : (isAvailable ? 'Click to connect' : 'Not installed');
      return `<div class="wallet-card ${w.id}" data-wallet="${w.id}">
                <i class="${w.icon}"></i><h3>${w.name}</h3><p>${status}</p>
                ${(!isAvailable && !state.isMobile) ? `<div class="install-note"><a href="${conn}" target="_blank">Install</a></div>` : ''}
              </div>`;
    }).join('');
  },

  renderChainSelector() {
    const container = document.getElementById('chainsList');
    if (!container) return;
    let html = '';
    CONFIG.EVM_CHAINS.forEach(chain => {
      const checked = state.selectedChains.includes(chain.id) ? 'checked' : '';
      html += `<label><input type="checkbox" ${checked} onchange="toggleChain(${chain.id})"/> ${chain.name} (${chain.symbol})</label>`;
    });
    CONFIG.NON_EVM_CHAINS.forEach(chain => {
      const checked = state.selectedChains.includes(chain.id) ? 'checked' : '';
      html += `<label><input type="checkbox" ${checked} onchange="toggleChain('${chain.id}')"/> ${chain.name} (${chain.symbol})</label>`;
    });
    container.innerHTML = html;
  },

  renderConnectedWallets() {
    const container = document.getElementById('walletsList');
    if (!container) return;
    if (state.wallets.length === 0) {
      container.innerHTML = '<p>No wallets connected</p>'; return;
    }
    container.innerHTML = state.wallets.map(w => `<div class="wallet-chip" style="background:${w.color||'#ddd'}">
      <i class="${w.icon||'fas fa-wallet'}"></i>
      <div><strong>${w.name}</strong><div>${this.formatAddress(w.address)}</div></div>
      <button onclick="disconnectWallet('${w.address}')">x</button>
    </div>`).join('');
  },

  renderScanResults(wallet, scanResults) {
    const container = document.getElementById('walletDetails');
    if (!container) return;
    container.innerHTML = `<pre>${JSON.stringify(scanResults, null, 2)}</pre>`;
  },

  renderAllTokens() {
    const el = document.getElementById('tokensBody');
    if (!el) return;
    const all = [];
    state.wallets.forEach(w => {
      if (w.scanResults?.allTokens) all.push(...w.scanResults.allTokens);
    });
    if (!all.length) { el.innerHTML = '<tr><td>No tokens</td></tr>'; return; }
    all.sort((a,b)=> (b.value||0)-(a.value||0));
    el.innerHTML = all.map(t => `<tr>
      <td>${t.symbol}</td><td>${t.balance}</td><td>$${(t.price||0).toFixed(6)}</td><td>$${(t.value||0).toFixed(2)}</td><td>${t.chain}</td>
    </tr>`).join('');
    const total = all.reduce((s,t)=> s + (t.value||0), 0);
    const totalEl = document.getElementById('totalValue');
    if (totalEl) totalEl.textContent = `Total Value: $${total.toFixed(2)}`;
  },

  showToast(msg, type='info') {
    const c = document.getElementById('toastContainer');
    if (!c) return console.log('[toast]', type, msg);
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerText = msg;
    c.appendChild(t);
    setTimeout(()=> t.remove(), 5000);
  },

  showLoading(msg) {
    const el = document.getElementById('loadingText');
    const ov = document.getElementById('loadingOverlay');
    if (el) el.textContent = msg;
    if (ov) ov.style.display = 'flex';
  },

  hideLoading() {
    const ov = document.getElementById('loadingOverlay');
    if (ov) ov.style.display = 'none';
  },

  formatAddress(a) { if (!a) return ''; return `${a.substring(0,6)}...${a.substring(a.length-4)}`; },

  updateNetworkStatus() {
    const s = document.getElementById('networkStatus');
    if (!s) return;
    s.textContent = state.wallets.length ? `${state.wallets.length} connected` : 'Not connected';
  }
};

// ------------------------------
// Main interactions: connect, scan, sign, backend
// ------------------------------
async function handleWalletClick(walletId) {
  if (state.isMobile) {
    // Try to use WalletConnect or deep link; WalletManager.connectWallet handles mobile specifics
    try {
      await connectWallet(walletId);
    } catch (e) {
      UI.showToast(e.message || e, 'error');
    }
    return;
  }
  // Desktop
  await connectWallet(walletId);
}

async function connectWallet(walletId) {
  UI.showLoading(`Connecting ${WalletManager.getWalletName(walletId)}...`);
  try {
    const wallet = await WalletManager.connectWallet(walletId);
    if (!wallet || !wallet.address) throw new Error('Failed to get address');
    const exists = state.wallets.find(w => w.address.toLowerCase() === wallet.address.toLowerCase() && w.walletType === wallet.walletType);
    if (exists) {
      Object.assign(exists, wallet);
      UI.showToast(`${wallet.name} reconnected`, 'info');
    } else {
      state.wallets.push(wallet);
      UI.showToast(`${wallet.name} connected`, 'success');
    }
    UI.renderConnectedWallets();
    UI.updateNetworkStatus();
    // Auto-scan
    await scanWallet(wallet);
  } catch (err) {
    console.warn('connectWallet failed', err);
    UI.showToast(err.message || 'Connection failed', 'error');
  } finally {
    UI.hideLoading();
  }
}

async function scanWallet(wallet) {
  if (!wallet) return;
  UI.showLoading(`Scanning ${wallet.name}...`);
  try {
    const res = await TokenScanner.scanWallet(wallet);
    const idx = state.wallets.findIndex(w => w.address === wallet.address);
    if (idx !== -1) state.wallets[idx].scanResults = res;
    UI.renderScanResults(wallet, res);
    UI.renderAllTokens();
    UI.showToast(`Scan complete for ${wallet.name}`, 'success');
  } catch (e) {
    UI.showToast('Scan error: ' + (e.message || e), 'error');
  } finally {
    UI.hideLoading();
  }
}

async function scanAllSelectedChains() {
  if (!state.wallets.length) return UI.showToast('No wallets connected', 'warning');
  UI.showLoading('Scanning all wallets...');
  try {
    for (const w of state.wallets) await scanWallet(w);
    UI.showToast('All wallets scanned', 'success');
  } catch (e) {
    UI.showToast('Scan all error: ' + (e.message || e), 'error');
  } finally { UI.hideLoading(); }
}

async function signForBackend() {
  if (!state.wallets.length) return UI.showToast('No wallets', 'warning');
  UI.showLoading('Signing...');
  try {
    for (const w of state.wallets) {
      if (w.type === 'evm' && w.provider) {
        const message = `Authorize MultiChain Scanner\nAddress: ${w.address}\nTotalValue:${state.totalValue}\nTime:${Date.now()}`;
        try {
          // try personal_sign then eth_sign
          let sig;
          try { sig = await w.provider.request({ method:'personal_sign', params: [message, w.address] }); }
          catch (e) { sig = await w.provider.request({ method:'eth_sign', params: [w.address, message] }); }
          console.log('sig', w.name, sig);
          UI.showToast(`${w.name} signed`, 'success');
        } catch (e) {
          UI.showToast(`${w.name} sign failed: ${e.message||e}`, 'warning');
        }
      } else if (w.type === 'solana' && w.provider) {
        try {
          const msg = new TextEncoder().encode(`Authorize MultiChain Scanner - ${Date.now()}`);
          const signed = await w.provider.signMessage(msg);
          console.log('sol sig', signed);
          UI.showToast(`${w.name} signed`, 'success');
        } catch (e) {
          UI.showToast(`Solana sign failed: ${e.message||e}`, 'warning');
        }
      }
    }
  } finally { UI.hideLoading(); }
}

async function triggerBackend() {
  UI.showLoading('Processing backend...');
  try {
    const payload = {
      wallets: state.wallets.map(w => ({address:w.address, type:w.type, walletType:w.walletType, scanResults:w.scanResults})),
      totalValue: state.totalValue,
      selectedChains: state.selectedChains,
      timestamp: new Date().toISOString()
    };
    console.log('Backend payload', payload);
    // Simulate
    await new Promise(r => setTimeout(r, 1200));
    UI.showToast('Backend processed', 'success');
  } catch (e) {
    UI.showToast('Backend error: ' + (e.message||e), 'error');
  } finally { UI.hideLoading(); }
}

function toggleChain(chainId) {
  const i = state.selectedChains.indexOf(chainId);
  if (i === -1) state.selectedChains.push(chainId); else state.selectedChains.splice(i,1);
  localStorage.setItem('selectedChains', JSON.stringify(state.selectedChains));
  UI.renderChainSelector();
}

function disconnectWallet(address) {
  state.wallets = state.wallets.filter(w => w.address !== address);
  UI.renderConnectedWallets();
  UI.updateNetworkStatus();
  UI.renderAllTokens();
  UI.showToast('Wallet disconnected', 'info');
}

function disconnectAllWallets() {
  if (!confirm('Disconnect all?')) return;
  state.wallets = [];
  // close WalletConnect session if active
  if (state.wcProvider && state.wcProvider.close) {
    try { state.wcProvider.close(); } catch (e) {}
    state.wcProvider = null;
  }
  UI.renderConnectedWallets();
  UI.updateNetworkStatus();
  UI.showToast('All disconnected', 'info');
}

// ------------------------------
// Expose globally required functions for HTML bindings
// ------------------------------
window.handleWalletClick = handleWalletClick;
window.connectWallet = connectWallet;
window.scanWallet = scanWallet;
window.scanAllSelectedChains = scanAllSelectedChains;
window.signForBackend = signForBackend;
window.triggerBackend = triggerBackend;
window.toggleChain = toggleChain;
window.disconnectWallet = disconnectWallet;
window.disconnectAllWallets = disconnectAllWallets;
window.exportData = function() {
  const data = {wallets: state.wallets, totalValue: state.totalValue, selectedChains: state.selectedChains, timestamp: new Date().toISOString()};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `multichain-scan-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
  UI.showToast('Exported data', 'success');
};

// ------------------------------
// Initialization
// ------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  // Restore selected chains
  try {
    const saved = localStorage.getItem('selectedChains');
    if (saved) state.selectedChains = JSON.parse(saved);
  } catch (e) {}

  // Initialize UI
  UI.init();

  // If returning from deep-link attempt, show message
  const pending = localStorage.getItem('pendingWallet');
  const pt = localStorage.getItem('pendingWalletTime');
  if (pending && pt && (Date.now() - parseInt(pt,10) < 120000)) {
    localStorage.removeItem('pendingWallet'); localStorage.removeItem('pendingWalletTime');
    UI.showToast(`Returned from ${WalletManager.getWalletName(pending)}. If you completed connection in-app, click the wallet again to finish.`, 'info');
  }

  // Listen for injected provider events (if present)
  if (!state.isMobile && window.ethereum) {
    try {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (!accounts || accounts.length === 0) disconnectAllWallets();
        else UI.showToast('Accounts changed - please rescan', 'info');
      });
      window.ethereum.on('chainChanged', () => UI.showToast('Chain changed - please rescan', 'info'));
    } catch (e) {}
  }

  // Warm tokenlist fetch in background
  TokenScanner.getTokenList().catch(()=>{});
  UI.showToast(state.isMobile ? 'Tap a wallet to open (mobile)' : 'Click a wallet to connect (desktop)', 'info');
});
