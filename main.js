// ==============================
// MultiChain Wallet Scanner - MAIN.JS (Stable connect + CORS-aware price fetching)
// Changes in this version:
// - Avoids aggressive WalletConnect auto-flows on mobile; prefers injected providers or app deep-links.
// - Uses a CORS-fallback strategy for CoinGecko: direct fetch -> allorigins.win proxy -> local defaults.
// - Improved provider detection for MetaMask / Binance / Trust across provider arrays.
// - Clear, user-friendly error messages and fallback flows for mobile (open app deep-links then instruct).
// - Expanded common tokens (WBTC, USDT, USDC, BUSD, etc.) for major chains so these are discovered reliably.
// Notes:
// - Some mobile wallets will ONLY connect via their in-app browser or via WalletConnect. This script prefers in-app injection when available,
//   otherwise opens the wallet app (deep-link) and asks the user to return to finish connection. If you want WalletConnect flows, add a dedicated
//   "Connect with WalletConnect" button and invoke that explicitly (not automatic).
// - CoinGecko may enforce rate limits; this script uses a public proxy fallback (allorigins.win) when direct CORS fails. For production, run your own proxy or call CoinGecko from your backend.
// ==============================

const CONFIG = {
  WALLET_LINKS: {
    metamask: {
      mobile: {
        // prefer host-only format to open MetaMask mobile's dapp flow
        android: 'https://metamask.app.link/dapp/' + window.location.host,
        ios: 'https://metamask.app.link/dapp/' + window.location.host,
        universal: 'https://metamask.app.link/dapp/' + window.location.host
      },
      desktop: 'https://metamask.io/download.html'
    },
    binance: {
      mobile: {
        // Binance mobile deep link patterns vary by region; fallback to official wallet page
        android: 'https://www.binance.com/en/wallet',
        ios: 'https://www.binance.com/en/wallet',
        universal: 'https://www.binance.com/en/wallet'
      },
      desktop: 'https://www.binance.org/en/download'
    },
    trust: {
      mobile: {
        android: 'https://link.trustwallet.com/open_url?coin_id=714&url=' + encodeURIComponent(window.location.href),
        ios: 'trust://browse?url=' + encodeURIComponent(window.location.href),
        universal: 'https://link.trustwallet.com/open_url?coin_id=714&url=' + encodeURIComponent(window.location.href)
      },
      desktop: 'https://trustwallet.com/'
    },
    phantom: {
      mobile: {
        android: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href),
        ios: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href),
        universal: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href)
      },
      desktop: 'https://phantom.app/'
    }
  },

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

  PRICE_API_BASE: 'https://api.coingecko.com/api/v3',
  COINGECKO_PROXY: 'https://api.allorigins.win/raw?url=', // fallback for CORS blocked responses
  TOKENLIST_SOURCE: 'https://tokens.coingecko.com/uniswap/all.json',
  TOKEN_SCAN_MAX_PER_CHAIN: 250,
  RPC_CONCURRENCY: 6
};

// -----------------------------
// State
// -----------------------------
let state = {
  wallets: [],
  selectedChains: [1,56,137,42161,10,43114,250,'solana'],
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  tokenlist: null
};

// -----------------------------
// Utility: CORS-aware fetch for CoinGecko
// Tries direct fetch; if blocked (CORS) or fails, tries proxy; if still fails, return null.
// -----------------------------
async function fetchWithCorsFallback(url) {
  try {
    const resp = await fetch(url, { method: 'GET', mode: 'cors' });
    if (resp.ok) return resp;
    // Non-OK could be rate-limited; fall through to proxy
  } catch (err) {
    // likely CORS or network error -> fall back to proxy
  }

  // Try proxy
  try {
    const proxied = CONFIG.COINGECKO_PROXY + encodeURIComponent(url);
    const resp2 = await fetch(proxied, { method: 'GET' });
    if (resp2.ok) return resp2;
  } catch (err2) {
    // fails -> give up
  }
  return null;
}

async function getSimplePriceById(coinId) {
  const url = `${CONFIG.PRICE_API_BASE}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`;
  const resp = await fetchWithCorsFallback(url);
  if (!resp) return null;
  try {
    const data = await resp.json();
    return data?.[coinId]?.usd ?? null;
  } catch (e) {
    return null;
  }
}

async function getTokenPriceByContract(contractAddress, platformId) {
  if (!contractAddress || !platformId) return null;
  const url = `${CONFIG.PRICE_API_BASE}/simple/token_price/${platformId}?contract_addresses=${encodeURIComponent(contractAddress)}&vs_currencies=usd`;
  const resp = await fetchWithCorsFallback(url);
  if (!resp) return null;
  try {
    const data = await resp.json();
    const key = Object.keys(data || {})[0];
    return key ? data[key]?.usd ?? null : null;
  } catch (e) {
    return null;
  }
}

// -----------------------------
// Wallet Detection & Connectors
// - Desktop: prefer injected providers
// - Mobile: prefer injected provider if present (wallet's in-app browser),
//           otherwise open deep link to wallet app and instruct user to connect inside app
// Note: WalletConnect is not auto-invoked; add explicit WalletConnect if you need it.
// -----------------------------
const WalletManager = {
  isAvailable(walletId) {
    try {
      switch (walletId) {
        case 'metamask':
          if (window.ethereum?.isMetaMask) return true;
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

  getMobileLink(walletId) {
    const entry = CONFIG.WALLET_LINKS[walletId];
    if (!entry) return '#';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return entry.mobile.android;
    if (ua.includes('iphone') || ua.includes('ipad')) return entry.mobile.ios;
    return entry.mobile.universal;
  },

  // GENERAL connect entry used by UI
  async connect(walletId) {
    // If provider is injected (even on mobile), prefer that
    const injected = this.findInjectedProviderFor(walletId);
    if (injected) {
      return this.connectInjected(injected, walletId);
    }

    // If mobile and no injection, open deep link to wallet app and inform user
    if (state.isMobile) {
      const link = this.getMobileLink(walletId);
      if (link && link !== '#') {
        // Save pending to help user when returning
        localStorage.setItem('pendingWallet', walletId);
        localStorage.setItem('pendingWalletTime', Date.now());
        // Open deep link (this will open app if installed)
        window.location.href = link;
        throw new Error(`${this.getName(walletId)} app opened. Complete the connection in the app and return to the browser, then click the wallet icon again to finish connecting.`);
      } else {
        throw new Error(`${this.getName(walletId)} deep link not configured on this site.`);
      }
    }

    // Desktop & no injection -> instruct how to install
    throw new Error(`${this.getName(walletId)} not found. Please install the extension or use the wallet's browser to connect.`);
  },

  getName(id) {
    return { metamask: 'MetaMask', binance: 'Binance Wallet', trust: 'Trust Wallet', phantom: 'Phantom' }[id] || id;
  },

  findInjectedProviderFor(walletId) {
    // Check window.ethereum and providers array for matching flags
    if (!window) return null;
    if (walletId === 'phantom') {
      if (window.solana && window.solana.isPhantom) return { type: 'solana', provider: window.solana };
      return null;
    }
    // EVM providers (MetaMask/Binance/Trust)
    if (window.ethereum) {
      // If direct provider matches
      if (walletId === 'metamask' && window.ethereum.isMetaMask) return { type: 'evm', provider: window.ethereum };
      if (walletId === 'binance' && (window.ethereum.isBinance || window.BinanceChain)) return { type: 'evm', provider: window.ethereum };
      if (walletId === 'trust' && (window.ethereum.isTrust || window.ethereum.isTrustWallet)) return { type: 'evm', provider: window.ethereum };

      // If providers array exists, search for matching flags
      if (Array.isArray(window.ethereum.providers)) {
        const providers = window.ethereum.providers;
        for (const p of providers) {
          if (walletId === 'metamask' && p.isMetaMask) return { type: 'evm', provider: p };
          if (walletId === 'binance' && p.isBinance) return { type: 'evm', provider: p };
          if (walletId === 'trust' && (p.isTrust || p.isTrustWallet)) return { type: 'evm', provider: p };
        }
      }
    }
    // Global BinanceChain/BSC provider
    if ((walletId === 'binance') && (window.BinanceChain || window.BSC)) {
      return { type: 'evm', provider: window.BinanceChain || window.BSC };
    }
    // web3.currentProvider fallback
    if (walletId === 'metamask' && window.web3 && window.web3.currentProvider) {
      return { type: 'evm', provider: window.web3.currentProvider };
    }
    return null;
  },

  async connectInjected(found, walletId) {
    if (!found) throw new Error('No injected provider found');
    if (found.type === 'solana') {
      // Phantom
      const sol = found.provider;
      try {
        const resp = await sol.connect({ onlyIfTrusted: false });
        const publicKey = resp.publicKey?.toString?.() || sol.publicKey?.toString?.();
        if (!publicKey) throw new Error('No Phantom public key returned');
        return {
          address: publicKey,
          chainId: 'solana',
          type: 'solana',
          name: 'Phantom',
          provider: sol,
          walletType: 'phantom',
          isConnected: true
        };
      } catch (err) {
        if (err.code === 4001) throw new Error('User rejected Phantom connection');
        throw err;
      }
    }

    // EVM provider
    const provider = found.provider;
    try {
      // Request accounts
      const accounts = await provider.request?.({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned from provider');
      const address = accounts[0];
      // chain id
      let chainIdHex = null;
      try {
        chainIdHex = await provider.request({ method: 'eth_chainId' });
      } catch (_) { /* ignore */ }
      const chainId = chainIdHex ? (typeof chainIdHex === 'string' ? parseInt(chainIdHex, 16) : chainIdHex) : null;
      return {
        address,
        chainId,
        type: 'evm',
        name: this.getName(walletId),
        provider,
        walletType: walletId,
        isConnected: true
      };
    } catch (err) {
      if (err.code === 4001) throw new Error(`${this.getName(walletId)} connection rejected by user`);
      throw err;
    }
  }
};

// -----------------------------
// Token scanning helpers (native + common ERC20 + basic SPL enumeration)
// Notes: scanning every token on chain is not feasible from client; this uses a tokenlist + common tokens to discover the most-used tokens.
// -----------------------------
const TokenScanner = {
  async scanWallet(wallet) {
    const results = { wallet, chainBalances: [], allTokens: [], totalValue: 0, timestamp: Date.now() };

    if (wallet.type === 'evm') {
      for (const chain of CONFIG.EVM_CHAINS) {
        if (!state.selectedChains.includes(chain.id)) continue;
        try {
          const native = await this.getNativeBalance(wallet.address, chain.rpc);
          const nativePrice = await this.getNativePrice(chain);
          const nativeValue = native * (nativePrice ?? this.defaultPrice(chain.symbol));
          const chainResult = {
            chain,
            nativeBalance: { symbol: chain.symbol, balance: parseFloat(native.toFixed(6)), price: nativePrice || this.defaultPrice(chain.symbol), value: nativeValue },
            tokens: [],
            totalValue: nativeValue
          };

          // Build token candidates: common tokens + tokenlist tokens (limited)
          const candidates = this.getCommonTokens(chain.id).slice().map(t => ({...t}));
          const tokenlist = await this.getTokenList();
          const listForChain = tokenlist.filter(t => t.chainId === chain.id).slice(0, CONFIG.TOKEN_SCAN_MAX_PER_CHAIN);
          for (const t of listForChain) {
            const normalized = { address: (t.address||'').toLowerCase(), symbol: t.symbol, name: t.name, decimals: t.decimals || 18 };
            if (!candidates.some(c => (c.address||'').toLowerCase() === normalized.address)) {
              candidates.push(normalized);
            }
          }

          // Limit final candidates
          const toCheck = candidates.slice(0, CONFIG.TOKEN_SCAN_MAX_PER_CHAIN);

          // Concurrency scanning
          let idx = 0;
          const foundTokens = [];
          const worker = async () => {
            while (idx < toCheck.length) {
              const i = idx++;
              const token = toCheck[i];
              try {
                const balance = await this.getERC20Balance(wallet.address, token.address, chain.rpc, token.decimals || 18);
                if (balance > 0) {
                  // Try contract price via CoinGecko
                  let price = await getTokenPriceByContract(token.address, chain.cgPlatform).catch(()=> null);
                  if (price == null) {
                    price = await getSimplePriceById(this.getCoinId(token.symbol)).catch(()=> null);
                  }
                  const value = balance * (price || this.defaultPrice(token.symbol));
                  foundTokens.push({
                    address: token.address,
                    symbol: token.symbol,
                    name: token.name,
                    balance: parseFloat(balance.toFixed(6)),
                    decimals: token.decimals || 18,
                    price: price || this.defaultPrice(token.symbol),
                    value,
                    chain: chain.name,
                    type: 'erc20',
                    logo: this.getTokenLogo(token.symbol)
                  });
                }
              } catch (e) {
                // ignore per-token errors
              }
            }
          };

          const workers = [];
          for (let w=0; w<CONFIG.RPC_CONCURRENCY; w++) workers.push(worker());
          await Promise.all(workers);

          foundTokens.sort((a,b)=> (b.value||0)-(a.value||0));
          chainResult.tokens = foundTokens;
          chainResult.totalValue += foundTokens.reduce((s,t)=> s + (t.value||0), 0);

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
            logo: this.getTokenLogo(chain.symbol)
          });
          if (foundTokens.length) results.allTokens.push(...foundTokens);

        } catch (err) {
          console.warn('Error scanning chain', chain.name, err);
        }
      }
    } else if (wallet.type === 'solana') {
      // Native SOL
      try {
        const balance = await this.getSolanaBalance(wallet.address);
        const price = await getSimplePriceById('solana').catch(()=> null);
        const value = balance * (price || this.defaultPrice('SOL'));
        const chain = CONFIG.NON_EVM_CHAINS.find(c => c.id === 'solana');
        const chainResult = {
          chain,
          nativeBalance: { symbol: 'SOL', balance: parseFloat(balance.toFixed(6)), price: price || this.defaultPrice('SOL'), value },
          tokens: [],
          totalValue: value
        };
        results.chainBalances.push(chainResult);
        results.allTokens.push({
          address: 'native',
          symbol: 'SOL',
          name: 'Solana',
          balance: chainResult.nativeBalance.balance,
          price: chainResult.nativeBalance.price,
          value: chainResult.nativeBalance.value,
          chain: 'Solana', type: 'native', logo: this.getTokenLogo('SOL')
        });

        // Best-effort: enumerate token accounts (limited to top N)
        try {
          const rpcResp = await fetch('https://api.mainnet-beta.solana.com', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ jsonrpc: '2.0', id:1, method: 'getTokenAccountsByOwner', params: [ wallet.address, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed' } ] })
          });
          const data = await rpcResp.json();
          if (data.result && Array.isArray(data.result.value)) {
            const accounts = data.result.value.slice(0, 40);
            for (const a of accounts) {
              try {
                const parsed = a.account?.data?.parsed?.info;
                const tokenAmount = parsed?.tokenAmount;
                const uiAmount = tokenAmount?.uiAmount || 0;
                if (uiAmount > 0) {
                  results.allTokens.push({
                    address: parsed.mint,
                    symbol: tokenAmount?.tokenSymbol || 'SPL',
                    name: parsed?.meta?.name || 'SPL Token',
                    balance: parseFloat(uiAmount.toFixed(6)),
                    price: 0,
                    value: 0,
                    chain: 'Solana',
                    type: 'spl',
                    logo: this.getTokenLogo('SOL')
                  });
                }
              } catch(e){}
            }
          }
        } catch(e) { /* ignore heavy SPL enumeration errors */ }
      } catch (e) { console.warn('Solana scan error', e); }
    }

    // Final totals
    results.totalValue = results.allTokens.reduce((sum,t) => sum + (t.value||0), 0);
    return results;
  },

  // RPC helpers
  async getNativeBalance(address, rpc) {
    try {
      const resp = await fetch(rpc, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] })
      });
      const j = await resp.json();
      return j.result ? parseInt(j.result, 16) / 1e18 : 0;
    } catch (e) {
      return 0;
    }
  },

  async getERC20Balance(owner, tokenAddress, rpc, decimals = 18) {
    if (!tokenAddress || tokenAddress === '0x') return 0;
    try {
      const data = '0x70a08231000000000000000000000000' + owner.slice(2).toLowerCase();
      const resp = await fetch(rpc, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: tokenAddress, data }, 'latest']})
      });
      const j = await resp.json();
      if (j.result && j.result !== '0x') {
        return parseInt(j.result, 16) / Math.pow(10, decimals);
      }
    } catch (e) {}
    return 0;
  },

  async getSolanaBalance(address) {
    try {
      const resp = await fetch('https://api.mainnet-beta.solana.com', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getBalance', params:[address] })
      });
      const j = await resp.json();
      return j.result ? j.result.value / 1e9 : 0;
    } catch (e) { return 0; }
  },

  // Tokenlist caching
  async getTokenList() {
    if (state.tokenlist) return state.tokenlist;
    try {
      const resp = await fetch(CONFIG.TOKENLIST_SOURCE);
      if (!resp.ok) { state.tokenlist = []; return []; }
      const j = await resp.json();
      // store minimal fields: chainId, address, symbol, name, decimals
      state.tokenlist = (j.tokens || []).map(t => ({
        chainId: t.chainId,
        address: (t.address || '').toLowerCase(),
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals || 18
      }));
      return state.tokenlist;
    } catch (e) {
      state.tokenlist = [];
      return [];
    }
  },

  // Common token whitelist (ensures WBTC / USDT / USDC / BUSD etc.)
  getCommonTokens(chainId) {
    const map = {
      1: [
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
        { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
      ],
      56: [
        { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
        { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
        { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', decimals: 18 },
        { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', symbol: 'BTCB', name: 'BTCB Token', decimals: 18 }
      ],
      137: [
        { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ],
      42161: [
        { address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ],
      10: [
        { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ],
      43114: [
        { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ],
      250: [
        { address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ]
    };
    return map[chainId] || [];
  },

  getTokenLogo(symbol) {
    const logos = {
      'ETH':'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      'BNB':'https://assets.coingecko.com/coins/images/825/small/bnb-icon2.png',
      'MATIC':'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      'SOL':'https://assets.coingecko.com/coins/images/4128/small/solana.png',
      'BTC':'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      'USDT':'https://assets.coingecko.com/coins/images/325/small/Tether.png',
      'USDC':'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
      'BUSD':'https://assets.coingecko.com/coins/images/9576/small/BUSD.png'
    };
    return logos[symbol?.toUpperCase()] || `https://via.placeholder.com/40/cccccc/000000?text=${(symbol||'TKN').substring(0,3)}`;
  },

  defaultPrice(sym) {
    const def = { 'ETH':2500, 'BNB':300, 'MATIC':0.8, 'SOL':100, 'AVAX':30, 'FTM':0.3, 'BTC':45000, 'USDT':1, 'USDC':1, 'DAI':1, 'BUSD':1 };
    return def[(sym||'').toUpperCase()] || 0;
  },

  getCoinId(sym) {
    const map = { 'ETH':'ethereum','BNB':'binancecoin','MATIC':'matic-network','SOL':'solana','AVAX':'avalanche-2','FTM':'fantom','BTC':'bitcoin','USDT':'tether','USDC':'usd-coin','DAI':'dai','BUSD':'binance-usd' };
    return map[(sym||'').toUpperCase()] || (sym||'').toLowerCase();
  }
};

// -----------------------------
// UI helpers (minimal, reuse developer's previous UI functions)
// - Provide simple toasts & render functions required by flow
// -----------------------------
const UI = {
  showToast(msg, type='info') {
    const container = document.getElementById('toastContainer');
    if (!container) return console.log(`[${type}] ${msg}`);
    const d = document.createElement('div');
    d.className = 'toast ' + type;
    d.innerText = msg;
    container.appendChild(d);
    setTimeout(()=> d.remove(), 6000);
  },
  showLoading(msg) {
    const ov = document.getElementById('loadingOverlay');
    const txt = document.getElementById('loadingText');
    if (txt) txt.textContent = msg;
    if (ov) ov.style.display = 'flex';
  },
  hideLoading() {
    const ov = document.getElementById('loadingOverlay');
    if (ov) ov.style.display = 'none';
  },
  renderConnectedWallets() {
    const container = document.getElementById('walletsList');
    if (!container) return;
    if (!state.wallets.length) { container.innerHTML = '<p>No wallets connected</p>'; return; }
    container.innerHTML = state.wallets.map(w => `
      <div class="wallet-chip" style="background:${w.color||'#ddd'}">
        <div><strong>${w.name}</strong><div>${formatAddress(w.address)}</div></div>
        <button onclick="disconnectWallet('${w.address}')">Disconnect</button>
      </div>
    `).join('');
  },
  renderTokens() {
    const tb = document.getElementById('tokensBody');
    if (!tb) return;
    const all = [];
    state.wallets.forEach(w => { if (w.scanResults?.allTokens) all.push(...w.scanResults.allTokens); });
    if (!all.length) { tb.innerHTML = '<tr><td>No tokens</td></tr>'; return; }
    all.sort((a,b)=> (b.value||0)-(a.value||0));
    tb.innerHTML = all.map(t => `<tr><td>${t.symbol}</td><td>${t.balance}</td><td>$${(t.price||0).toFixed(6)}</td><td>$${(t.value||0).toFixed(2)}</td><td>${t.chain}</td></tr>`).join('');
    const tot = all.reduce((s,t)=> s + (t.value||0), 0);
    const tv = document.getElementById('totalValue');
    if (tv) tv.textContent = `Total Value: $${tot.toFixed(2)}`;
  }
};

// -----------------------------
// Helpers
// -----------------------------
function formatAddress(address) {
  if (!address) return '';
  return `${address.substring(0,6)}...${address.substring(address.length-4)}`;
}

async function connectWalletAndScan(walletId) {
  UI.showLoading(`Connecting ${walletId}...`);
  try {
    const wallet = await WalletManager.connect(walletId);
    // Add or update in state
    const existsIdx = state.wallets.findIndex(w => w.address && wallet.address && w.address.toLowerCase() === wallet.address.toLowerCase());
    if (existsIdx !== -1) state.wallets[existsIdx] = wallet; else state.wallets.push(wallet);
    UI.renderConnectedWallets();
    // Auto-scan
    const scanner = TokenScanner;
    const results = await scanner.scanWallet(wallet);
    const idx = state.wallets.findIndex(w => w.address.toLowerCase() === wallet.address.toLowerCase());
    if (idx !== -1) state.wallets[idx].scanResults = results;
    UI.renderTokens();
    UI.showToast(`Scanned ${wallet.name}`, 'success');
  } catch (err) {
    UI.showToast(err.message || err.toString(), 'error');
  } finally {
    UI.hideLoading();
  }
}

async function scanAll() {
  if (!state.wallets.length) return UI.showToast('No wallets connected', 'warning');
  UI.showLoading('Scanning all connected wallets...');
  try {
    for (const w of state.wallets) {
      const res = await TokenScanner.scanWallet(w);
      const idx = state.wallets.findIndex(x => x.address === w.address);
      if (idx !== -1) state.wallets[idx].scanResults = res;
    }
    UI.renderTokens();
    UI.showToast('All scans complete', 'success');
  } catch (e) {
    UI.showToast('Scan failed: ' + (e.message || e), 'error');
  } finally { UI.hideLoading(); }
}

function disconnectWallet(address) {
  state.wallets = state.wallets.filter(w => w.address !== address);
  UI.renderConnectedWallets();
  UI.renderTokens();
  UI.showToast('Wallet disconnected', 'info');
}

// -----------------------------
// Expose global functions for HTML/UI
// -----------------------------
window.connectWallet = connectWalletAndScan;
window.scanAllSelectedChains = scanAll;
window.disconnectWallet = disconnectWallet;

// -----------------------------
// Init: prefetch tokenlist in background
// -----------------------------
(async function init() {
  // load tokenlist in background (best-effort)
  try {
    await TokenScanner.getTokenList();
  } catch (e) { /* ignore */ }

  // If returning from mobile deep-link attempt, notify user
  const pending = localStorage.getItem('pendingWallet');
  const pendingTime = localStorage.getItem('pendingWalletTime');
  if (pending && pendingTime && (Date.now() - parseInt(pendingTime,10) < 2 * 60 * 1000)) {
    UI.showToast(`Returned from ${pending}. If you finished connection in the wallet app, click the wallet icon here to finalize.`, 'info');
    localStorage.removeItem('pendingWallet');
    localStorage.removeItem('pendingWalletTime');
  }

  // simple UI notifications
  UI.showToast(state.isMobile ? 'Tap a wallet to open in its app' : 'Click a wallet to connect and scan', 'info');
})();

// -----------------------------
// Price helper convenience used by TokenScanner
// -----------------------------
async function getSimplePriceById(coinId) {
  // uses fetchWithCorsFallback inside
  return await getSimplePriceByIdInternal(coinId);
}
async function getSimplePriceByIdInternal(coinId) {
  const val = await getSimplePriceById(coinId);
  if (val != null) return val;
  // fallback default values
  const fallback = { 'ethereum':2500, 'binancecoin':300, 'solana':100, 'avalanche-2':30, 'fantom':0.3, 'matic-network':0.8, 'bitcoin':45000 };
  return fallback[coinId] || 0;
}

// -----------------------------
// Expose some utilities to console for debugging
// -----------------------------
window._mc_debug = {
  config: CONFIG,
  state,
  WalletManager,
  TokenScanner
};
