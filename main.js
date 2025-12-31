// ==============================
// MULTI-CHAIN WALLET SCANNER - UPDATED MAIN.JS
// - Improvements:
//   * Mobile deep links fixed (MetaMask uses full URL, Binance mobile opens wallet deep link if available)
//   * More robust wallet detection
//   * Token discovery using public tokenlists (cached) with safe limits to avoid RPC overload
//   * Contract-based price lookups via CoinGecko when available
//   * Concurrency limit for RPC token balance calls
//   * Fallbacks + better error messages and mobile handling
// ==============================

const CONFIG = {
    // Enhanced Wallet Links with proper redirects / deep links
    WALLET_LINKS: {
        metamask: {
            // Use full encoded URL so MetaMask mobile receives the dapp route instead of App Store redirect
            mobile: {
                android: 'https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href),
                ios: 'https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href),
                universal: 'https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href)
            },
            desktop: 'https://metamask.io/download.html',
            extension: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#initialize/welcome'
        },
        binance: {
            // Try to open Binance Wallet via deep link on mobile; fallback to official download page
            mobile: {
                android: 'binance://wallet', // deep link (may work when app installed)
                ios: 'binance://wallet',
                universal: 'https://www.binance.com/en/download' // fallback
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
            mobile: {
                android: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href),
                ios: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href),
                universal: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href)
            },
            desktop: 'https://phantom.app/',
            extension: 'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/home.html'
        }
    },

    // Chain configurations with working RPCs
    EVM_CHAINS: [
        { id: 1, name: 'Ethereum', rpc: 'https://rpc.ankr.com/eth', symbol: 'ETH', explorer: 'https://etherscan.io', color: '#627EEA', coingeckoPlatform: 'ethereum' },
        { id: 56, name: 'BNB Chain', rpc: 'https://bsc-dataseed.binance.org', symbol: 'BNB', explorer: 'https://bscscan.com', color: '#F0B90B', coingeckoPlatform: 'binance-smart-chain' },
        { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com', symbol: 'MATIC', explorer: 'https://polygonscan.com', color: '#8247E5', coingeckoPlatform: 'polygon-pos' },
        { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', symbol: 'ETH', explorer: 'https://arbiscan.io', color: '#28A0F0', coingeckoPlatform: 'arbitrum-one' },
        { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io', color: '#FF0420', coingeckoPlatform: 'optimistic-ethereum' },
        { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', explorer: 'https://snowtrace.io', color: '#E84142', coingeckoPlatform: 'avalanche' },
        { id: 250, name: 'Fantom', rpc: 'https://rpcapi.fantom.network', symbol: 'FTM', explorer: 'https://ftmscan.com', color: '#1969FF', coingeckoPlatform: 'fantom' }
    ],
    
    NON_EVM_CHAINS: [
        { id: 'solana', name: 'Solana', rpc: 'https://api.mainnet-beta.solana.com', symbol: 'SOL', explorer: 'https://explorer.solana.com', color: '#9945FF', coingeckoPlatform: 'solana' }
    ],

    // Token price API
    PRICE_API: 'https://api.coingecko.com/api/v3',
    
    // Tokenlist source (Uniswap/Coingecko aggregated tokenlist)
    TOKENLIST_SOURCE: 'https://tokens.coingecko.com/uniswap/all.json',

    // Limits to avoid blasting RPC endpoints
    TOKEN_SCAN_MAX_PER_CHAIN: 200, // max number of tokens to attempt per chain (safe default)
    RPC_CONCURRENCY: 8 // concurrent eth_call requests
};

// State Management
let state = {
    wallets: [],
    tokens: [],
    selectedChains: [1, 56, 137, 42161, 10, 43114, 250, 'solana'],
    isScanning: false,
    totalValue: 0,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    currentWallet: null,
    tokenlistsCache: {}, // tokenlist per chain, cached in-memory; persisted to localStorage
};

// ==============================
// ENHANCED WALLET MANAGER
// ==============================

const WalletManager = {
    // Check wallet availability with multiple detection methods
    isWalletAvailable(walletId) {
        try {
            switch(walletId) {
                case 'metamask':
                    if (typeof window.ethereum !== 'undefined') {
                        if (window.ethereum.isMetaMask) return true;
                        if (Array.isArray(window.ethereum.providers)) {
                            if (window.ethereum.providers.some(p => p.isMetaMask)) return true;
                        }
                        // Some dapps check for injected web3
                        if (typeof window.web3 !== 'undefined') return true;
                    }
                    return false;
                case 'binance':
                    if (typeof window.BinanceChain !== 'undefined') return true;
                    if (typeof window.BSC !== 'undefined') return true;
                    if (window.ethereum && (window.ethereum.isBinance || window.ethereum.isOneInch)) return true;
                    if (Array.isArray(window.ethereum?.providers)) {
                        if (window.ethereum.providers.some(p => p.isBinance)) return true;
                    }
                    return false;
                case 'phantom':
                    if (typeof window.solana !== 'undefined') {
                        return !!window.solana.isPhantom;
                    }
                    return false;
                case 'trust':
                    if (window.ethereum) {
                        if (window.ethereum.isTrust || window.ethereum.isTrustWallet) return true;
                        if (Array.isArray(window.ethereum.providers)) {
                            if (window.ethereum.providers.some(p => p.isTrust || p.isTrustWallet)) return true;
                        }
                    }
                    if (typeof window.trustwallet !== 'undefined') return true;
                    return false;
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error checking wallet ${walletId}:`, error);
            return false;
        }
    },

    // Get wallet connection method
    getWalletConnection(walletId) {
        const walletLinks = CONFIG.WALLET_LINKS[walletId];
        if (!walletLinks) return null;

        return {
            isAvailable: this.isWalletAvailable(walletId),
            mobileLink: this.getMobileLink(walletId),
            desktopLink: walletLinks.desktop,
            name: this.getWalletName(walletId)
        };
    },

    getMobileLink(walletId) {
        const walletLinks = CONFIG.WALLET_LINKS[walletId];
        if (!walletLinks) return '#';
        
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('android')) {
            return walletLinks.mobile.android;
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            return walletLinks.mobile.ios;
        } else {
            return walletLinks.mobile.universal;
        }
    },

    getWalletName(walletId) {
        const names = {
            'metamask': 'MetaMask',
            'binance': 'Binance Wallet',
            'trust': 'Trust Wallet',
            'phantom': 'Phantom'
        };
        return names[walletId] || walletId;
    },

    // Main connection function
    async connectWallet(walletId) {
        console.log(`🔄 Connecting to ${walletId}...`);
        
        try {
            let wallet;
            
            switch(walletId) {
                case 'metamask':
                    wallet = await this.connectMetaMask();
                    break;
                case 'binance':
                    wallet = await this.connectBinance();
                    break;
                case 'phantom':
                    wallet = await this.connectPhantom();
                    break;
                case 'trust':
                    wallet = await this.connectTrust();
                    break;
                default:
                    throw new Error('Unsupported wallet type');
            }
            
            if (!wallet || !wallet.address) {
                throw new Error('Failed to get wallet address');
            }
            
            console.log(`✅ Connected to ${wallet.name}: ${wallet.address}`);
            return wallet;
            
        } catch (error) {
            console.error(`❌ Connection failed for ${walletId}:`, error);
            // If user is on mobile and it's a not-found error, prefer redirect to mobile deep link so they can open/install
            if (state.isMobile && (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('not detected'))) {
                const link = this.getMobileLink(walletId);
                if (link && link !== '#') {
                    // Attempt to open deep link
                    window.location.href = link;
                }
            }
            throw error;
        }
    },

    // Enhanced MetaMask connection
    async connectMetaMask() {
        console.log('🔍 Looking for MetaMask...');
        
        let ethereumProvider;
        
        // Find MetaMask in providers
        if (window.ethereum) {
            if (window.ethereum.isMetaMask) {
                ethereumProvider = window.ethereum;
            } else if (Array.isArray(window.ethereum.providers)) {
                ethereumProvider = window.ethereum.providers.find(p => p.isMetaMask);
            }
        }
        
        if (!ethereumProvider) {
            // Try using injected web3
            if (window.web3 && window.web3.currentProvider) {
                ethereumProvider = window.web3.currentProvider;
            } else {
                // If on mobile, redirect to mobile deep link instead of throwing
                if (state.isMobile) {
                    throw new Error('MetaMask not found on this device. Redirecting to MetaMask mobile...');
                }
                throw new Error('MetaMask not found. Please install MetaMask extension from https://metamask.io/download');
            }
        }

        try {
            // Request accounts
            const accounts = await ethereumProvider.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('Please unlock MetaMask and try again');
            }

            const address = accounts[0];
            
            // Get chain ID
            let chainId;
            try {
                const chainIdHex = await ethereumProvider.request({
                    method: 'eth_chainId'
                });
                chainId = parseInt(chainIdHex, 16);
            } catch (e) {
                chainId = 1; // Default to Ethereum
            }

            return {
                address: address,
                chainId: chainId,
                type: 'evm',
                name: 'MetaMask',
                icon: 'fab fa-metamask',
                color: '#f6851b',
                provider: ethereumProvider,
                walletType: 'metamask',
                isConnected: true
            };

        } catch (error) {
            console.error('MetaMask connection error:', error);
            
            // Provide user-friendly error messages
            if (error.code === 4001) {
                throw new Error('MetaMask connection was rejected. Please approve the connection request.');
            } else if (error.code === -32002) {
                throw new Error('MetaMask connection already pending. Please check your MetaMask extension.');
            }
            
            throw new Error(`MetaMask connection failed: ${error.message || 'Unknown error'}`);
        }
    },

    // Enhanced Binance Wallet connection
    async connectBinance() {
        console.log('🔍 Looking for Binance Wallet...');
        
        let binanceProvider;
        
        // Try multiple Binance Wallet identifiers
        if (window.BinanceChain) {
            binanceProvider = window.BinanceChain;
        } else if (window.BSC) {
            binanceProvider = window.BSC;
        } else if (window.ethereum && window.ethereum.isBinance) {
            binanceProvider = window.ethereum;
        } else if (Array.isArray(window.ethereum?.providers)) {
            binanceProvider = window.ethereum.providers.find(p => p.isBinance);
        }
        
        // If not found and on mobile, instruct to open mobile wallet
        if (!binanceProvider) {
            if (state.isMobile) {
                throw new Error('Binance Wallet not found on this device. Redirecting to Binance mobile...');
            }
            // Try generic web3 fallback (user may have Binance under window.ethereum)
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                    if (accounts && accounts.length > 0) {
                        binanceProvider = window.ethereum;
                    }
                } catch (e) {
                    // ignore
                }
            }
        }
        
        if (!binanceProvider) {
            throw new Error('Binance Wallet not found. Please install Binance Wallet extension from https://www.binance.org/en/download');
        }

        try {
            const accounts = await binanceProvider.request({
                method: "eth_requestAccounts"
            });

            if (!accounts || !accounts.length) {
                throw new Error("Please unlock Binance Wallet and try again");
            }

            const address = accounts[0];
            
            let chainId;
            try {
                const chainIdHex = await binanceProvider.request({ 
                    method: "eth_chainId" 
                });
                chainId = parseInt(chainIdHex, 16);
            } catch (e) {
                chainId = 56; // Default to BSC
            }

            console.log("✅ Binance Wallet connected:", address);

            return {
                address: address,
                chainId: chainId,
                type: 'evm',
                name: 'Binance Wallet',
                icon: 'fab fa-binance',
                color: '#F0B90B',
                provider: binanceProvider,
                walletType: 'binance',
                isConnected: true
            };

        } catch (err) {
            console.error("Binance Wallet connection error:", err);
            
            if (err.code === 4001) {
                throw new Error('Binance Wallet connection was rejected');
            }
            
            throw new Error(err.message || "Failed to connect Binance Wallet");
        }
    },

    // Enhanced Phantom connection
    async connectPhantom() {
        console.log('🔍 Looking for Phantom...');
        
        if (typeof window.solana === 'undefined') {
            if (state.isMobile) {
                throw new Error('Phantom not found on this device. Redirecting to Phantom mobile...');
            }
            throw new Error('Phantom wallet not found. Please install Phantom extension from https://phantom.app/');
        }

        if (!window.solana.isPhantom) {
            throw new Error('Phantom wallet not detected. Please make sure Phantom is installed and enabled.');
        }

        try {
            // Connect to Phantom
            let resp;
            if (window.solana.isConnected) {
                resp = { publicKey: window.solana.publicKey };
            } else {
                resp = await window.solana.connect({ onlyIfTrusted: false });
            }
            
            const publicKey = resp.publicKey.toString();
            
            console.log("✅ Phantom connected:", publicKey);

            return {
                address: publicKey,
                chainId: 'solana',
                type: 'solana',
                name: 'Phantom',
                icon: 'fas fa-ghost',
                color: '#ab9ff2',
                provider: window.solana,
                walletType: 'phantom',
                isConnected: true
            };

        } catch (error) {
            console.error("Phantom connection error:", error);
            
            if (error.code === 4001) {
                throw new Error('Phantom connection was rejected');
            }
            
            throw new Error(`Phantom connection failed: ${error.message}`);
        }
    },

    // Enhanced Trust Wallet connection
    async connectTrust() {
        console.log('🔍 Looking for Trust Wallet...');
        
        let trustProvider;
        
        // Try to find Trust Wallet
        if (window.ethereum) {
            if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
                trustProvider = window.ethereum;
            } else if (Array.isArray(window.ethereum.providers)) {
                trustProvider = window.ethereum.providers.find(p => p.isTrust || p.isTrustWallet);
            }
        }
        
        if (!trustProvider && window.trustwallet) {
            trustProvider = window.trustwallet;
        }
        
        if (!trustProvider) {
            if (state.isMobile) {
                throw new Error('Trust Wallet not found on this device. Redirecting to Trust Wallet mobile...');
            }
            // Try generic connection
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                    if (accounts && accounts.length > 0) {
                        trustProvider = window.ethereum;
                    }
                } catch (e) {
                    // Not Trust Wallet
                }
            }
        }
        
        if (!trustProvider) {
            throw new Error('Trust Wallet not found. Please install Trust Wallet extension or use mobile app.');
        }

        try {
            const accounts = await trustProvider.request({ 
                method: 'eth_requestAccounts' 
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('Please unlock Trust Wallet and try again');
            }

            const chainIdHex = await trustProvider.request({ 
                method: 'eth_chainId' 
            });
            
            return {
                address: accounts[0],
                chainId: parseInt(chainIdHex, 16),
                type: 'evm',
                name: 'Trust Wallet',
                icon: 'fas fa-shield-alt',
                color: '#3375bb',
                provider: trustProvider,
                walletType: 'trust',
                isConnected: true
            };
        } catch (error) {
            console.error('Trust Wallet connection error:', error);
            
            if (error.code === 4001) {
                throw new Error('Trust Wallet connection was rejected');
            }
            
            throw new Error(`Trust Wallet connection failed: ${error.message}`);
        }
    }
};

// ==============================
// ENHANCED TOKEN SCANNER
// ==============================

const TokenScanner = {
    async scanWallet(wallet) {
        console.log(`🔍 Starting scan for ${wallet.name}...`);
        
        const results = {
            wallet: wallet,
            chainBalances: [],
            allTokens: [],
            totalValue: 0,
            timestamp: Date.now()
        };
        
        state.isScanning = true;
        
        try {
            UI.showToast(`Scanning ${wallet.name}...`, 'info');
            
            if (wallet.type === 'evm') {
                await this.scanEVMWallet(wallet, results);
            } else if (wallet.type === 'solana') {
                await this.scanSolanaWallet(wallet, results);
            }
            
            // Calculate total value
            results.totalValue = results.allTokens.reduce((sum, token) => sum + (token.value || 0), 0);
            
            console.log(`✅ Scan complete for ${wallet.name}:`, results);
            
            state.isScanning = false;
            return results;
            
        } catch (error) {
            console.error(`❌ Scan failed for ${wallet.name}:`, error);
            state.isScanning = false;
            
            // Return partial results if any
            results.totalValue = results.allTokens.reduce((sum, token) => sum + (token.value || 0), 0);
            return results;
        }
    },

    async scanEVMWallet(wallet, results) {
        // Scan each selected EVM chain
        for (const chain of CONFIG.EVM_CHAINS) {
            if (state.selectedChains.includes(chain.id)) {
                try {
                    console.log(`📡 Scanning ${chain.name}...`);
                    UI.showToast(`Scanning ${chain.name} for ${wallet.name}...`, 'info');

                    // Get native balance
                    const balance = await this.getNativeBalance(wallet.address, chain.rpc);
                    const nativePrice = await this.getNativePrice(chain);
                    const nativeValue = balance * nativePrice;
                    
                    const chainResult = {
                        chain: chain,
                        nativeBalance: {
                            symbol: chain.symbol,
                            balance: parseFloat(balance.toFixed(6)),
                            price: nativePrice,
                            value: nativeValue
                        },
                        tokens: [],
                        totalValue: nativeValue
                    };

                    // Discover tokens via tokenlist (limited) + local common tokens
                    let tokens = [];
                    try {
                        tokens = await this.getERC20Tokens(wallet.address, chain);
                        chainResult.tokens = tokens;
                        chainResult.totalValue += tokens.reduce((sum, t) => sum + (t.value || 0), 0);
                    } catch (tokenError) {
                        console.log(`No ERC20 tokens on ${chain.name} or token discovery failed:`, tokenError.message);
                    }
                    
                    results.chainBalances.push(chainResult);
                    
                    // Add native token entry
                    results.allTokens.push({
                        address: 'native',
                        symbol: chain.symbol,
                        name: `${chain.name} Native`,
                        balance: chainResult.nativeBalance.balance,
                        price: nativePrice,
                        value: nativeValue,
                        chain: chain.name,
                        type: 'native',
                        logo: this.getTokenLogo(chain.symbol)
                    });

                    // Add ERC20 tokens to allTokens (if any)
                    if (chainResult.tokens.length > 0) {
                        results.allTokens.push(...chainResult.tokens);
                    }

                } catch (chainError) {
                    console.log(`⚠️ Skipped ${chain.name}:`, chainError.message || chainError);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 400));
            }
        }
    },

    async scanSolanaWallet(wallet, results) {
        if (!state.selectedChains.includes('solana')) return;
        
        try {
            console.log('📡 Scanning Solana...');
            
            const chain = CONFIG.NON_EVM_CHAINS.find(c => c.id === 'solana');
            const balance = await this.getSolanaBalance(wallet.address);
            const price = await this.getNativePrice(chain);
            const value = balance * price;
            
            if (balance >= 0) {
                const chainResult = {
                    chain: chain,
                    nativeBalance: {
                        symbol: 'SOL',
                        balance: parseFloat(balance.toFixed(6)),
                        price: price,
                        value: value
                    },
                    tokens: [],
                    totalValue: value
                };
                
                results.chainBalances.push(chainResult);
                results.allTokens.push({
                    address: 'native',
                    symbol: 'SOL',
                    name: 'Solana',
                    balance: chainResult.nativeBalance.balance,
                    price: price,
                    value: value,
                    chain: 'Solana',
                    type: 'native',
                    logo: this.getTokenLogo('SOL')
                });

                // Note: full SPL token discovery requires RPC calls to getTokenAccountsByOwner and parsing mint addresses.
                // For brevity and reliability we don't enumerate every SPL token here, but this function can be extended
                // to call getTokenAccountsByOwner and then query each mint's metadata + price via CoinGecko if needed.
            }
            
        } catch (solanaError) {
            console.log('⚠️ Solana scan skipped:', solanaError.message || solanaError);
        }
    },

    async getNativeBalance(address, rpcUrl) {
        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_getBalance',
                    params: [address, 'latest']
                })
            });
            
            const data = await response.json();
            return data.result ? parseInt(data.result, 16) / 1e18 : 0;
        } catch (error) {
            console.error(`Balance fetch error for ${rpcUrl}:`, error);
            return 0;
        }
    },

    async getSolanaBalance(address) {
        try {
            const response = await fetch('https://api.mainnet-beta.solana.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getBalance',
                    params: [address]
                })
            });
            
            const data = await response.json();
            return data.result ? data.result.value / 1e9 : 0;
        } catch (error) {
            console.error('Solana balance error:', error);
            return 0;
        }
    },

    // Attempt to discover ERC20 tokens for an address on a chain.
    // Strategy:
    //  1) Use a tokenlist source to get many tokens for the chain.
    //  2) Merge with a local list of common tokens (whitelist).
    //  3) Limit scanning to TOKEN_SCAN_MAX_PER_CHAIN tokens and use RPC_CONCURRENCY to avoid overload.
    async getERC20Tokens(address, chain) {
        const tokens = [];
        const tryTokens = [];

        // 1) Local common tokens first (fast)
        const common = this.getCommonTokens(chain.id);
        common.forEach(t => {
            // normalize address checksum-insensitive
            tryTokens.push(Object.assign({}, t));
        });

        // 2) Add tokenlist tokens (cached)
        try {
            const tokenlist = await this.fetchTokenListForChain(chain.id);
            // tokenlist tokens have fields: chainId, address, symbol, name, decimals
            const listForChain = tokenlist
                .filter(t => t.chainId === chain.id)
                .slice(0, CONFIG.TOKEN_SCAN_MAX_PER_CHAIN); // cap results

            // Append those not already present
            for (const t of listForChain) {
                if (!tryTokens.some(tt => tt.address.toLowerCase() === t.address.toLowerCase())) {
                    tryTokens.push({
                        address: t.address,
                        symbol: t.symbol,
                        name: t.name,
                        decimals: (t.decimals || 18)
                    });
                }
            }
        } catch (err) {
            console.warn('Tokenlist fetch failed:', err);
        }

        // Limit final token attempts
        const finalList = tryTokens.slice(0, CONFIG.TOKEN_SCAN_MAX_PER_CHAIN);
        UI.showToast(`Checking ${finalList.length} tokens on ${chain.name}...`, 'info');

        // Concurrency queue for RPC calls
        const concurrency = CONFIG.RPC_CONCURRENCY;
        let idx = 0;
        const worker = async () => {
            while (idx < finalList.length) {
                const i = idx++;
                const token = finalList[i];
                try {
                    const balance = await this.getTokenBalance(address, token.address, chain.rpc, token.decimals || 18);
                    if (balance > 0) {
                        // Try to fetch price by contract address
                        let price = await this.getPriceForTokenContract(token.address, chain.coingeckoPlatform);
                        if (!price) {
                            // fallback to symbol-based price
                            price = await this.getTokenPrice(token.symbol);
                        }
                        const value = balance * (price || 0);
                        tokens.push({
                            address: token.address,
                            symbol: token.symbol,
                            name: token.name,
                            balance: parseFloat(balance.toFixed(6)),
                            decimals: token.decimals || 18,
                            price: price || 0,
                            value: value || 0,
                            chain: chain.name,
                            type: 'erc20',
                            logo: this.getTokenLogo(token.symbol)
                        });
                        // Update UI live (optional)
                        UI.renderAllTokens();
                    }
                } catch (error) {
                    // Skip token if balance check fails
                }
            }
        };

        // Spawn workers
        const workers = [];
        for (let w = 0; w < concurrency; w++) workers.push(worker());
        await Promise.all(workers);

        // Sort tokens by value descending
        tokens.sort((a, b) => (b.value || 0) - (a.value || 0));
        return tokens;
    },

    // Fetch tokenlist from configured source, cache per chain in localStorage for 1 hour
    async fetchTokenListForChain(chainId) {
        const cacheKey = `tokenlist_chain_${chainId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 3600000) { // 1 hour
                    return parsed.tokens;
                }
            } catch (e) {
                // ignore and refetch
            }
        }

        const response = await fetch(CONFIG.TOKENLIST_SOURCE);
        if (!response.ok) throw new Error('Failed to fetch tokenlist');
        const data = await response.json();
        const tokens = data.tokens || [];

        // Save minimal token fields to localStorage
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            tokens: tokens.map(t => ({
                chainId: t.chainId,
                address: t.address,
                decimals: t.decimals,
                symbol: t.symbol,
                name: t.name
            }))
        }));

        return tokens.map(t => ({
            chainId: t.chainId,
            address: t.address,
            decimals: t.decimals,
            symbol: t.symbol,
            name: t.name
        }));
    },

    // Local known tokens (whitelist) for quick checks
    getCommonTokens(chainId) {
        const tokens = {
            1: [ // Ethereum - expanded set
                { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
                { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
                { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
                { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
                { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 }
            ],
            56: [ // BSC - expanded set
                { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
                { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
                { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', decimals: 18 },
                { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH', name: 'Ethereum Token on BSC', decimals: 18 }
            ],
            137: [ // Polygon
                { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
                { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
                { address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 }
            ],
            42161: [ // Arbitrum - basic listing
                { address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
                { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 }
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
        return tokens[chainId] || [];
    },

    async getTokenBalance(walletAddress, tokenAddress, rpcUrl, decimals = 18) {
        try {
            // ERC20 balanceOf function signature
            const data = '0x70a08231000000000000000000000000' + walletAddress.slice(2).toLowerCase();
            
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_call',
                    params: [{
                        to: tokenAddress,
                        data: data
                    }, 'latest']
                })
            });
            
            const result = await response.json();
            if (result.result && result.result !== '0x') {
                const balance = parseInt(result.result, 16);
                return balance / Math.pow(10, decimals);
            }
            return 0;
        } catch (error) {
            // console.error('Token balance error:', error);
            return 0;
        }
    },

    // Get native token price (ETH, BNB, MATIC, etc.) by chain config
    async getNativePrice(chain) {
        try {
            // Use CoinGecko simple price endpoint
            const platformId = chain.coingeckoPlatform || this.getCoinId(chain.symbol);
            const resp = await fetch(`${CONFIG.PRICE_API}/simple/price?ids=${platformId}&vs_currencies=usd`);
            if (resp.ok) {
                const data = await resp.json();
                return data[platformId]?.usd || this.getDefaultPrice(chain.symbol);
            }
        } catch (err) {
            // ignore
        }
        return this.getDefaultPrice(chain.symbol);
    },

    // Try to get token price by contract address and platform id using CoinGecko token_price endpoint
    async getPriceForTokenContract(contractAddress, coingeckoPlatform) {
        if (!contractAddress || !coingeckoPlatform) return null;
        try {
            const url = `${CONFIG.PRICE_API}/simple/token_price/${coingeckoPlatform}?contract_addresses=${contractAddress}&vs_currencies=usd`;
            const resp = await fetch(url);
            if (!resp.ok) return null;
            const data = await resp.json();
            const key = Object.keys(data)[0];
            if (!key) return null;
            return data[key].usd || null;
        } catch (err) {
            return null;
        }
    },

    async getTokenPrice(symbol) {
        // Keep backwards compatible: small symbol->coingecko mapping + cache
        const cacheKey = `price_${symbol.toUpperCase()}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < 300000) { // 5 minutes cache
                    return data.price;
                }
            } catch (e) {
                // ignore and fetch
            }
        }
        
        try {
            const coinId = this.getCoinId(symbol);
            const response = await fetch(`${CONFIG.PRICE_API}/simple/price?ids=${coinId}&vs_currencies=usd`);
            
            if (response.ok) {
                const data = await response.json();
                const price = data[coinId]?.usd || 0;
                
                if (price > 0) {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        price: price,
                        timestamp: Date.now()
                    }));
                    return price;
                }
            }
        } catch (error) {
            console.log(`Price fetch failed for ${symbol}:`, error);
        }
        
        return this.getDefaultPrice(symbol);
    },

    getCoinId(symbol) {
        const mapping = {
            'ETH': 'ethereum', 'BNB': 'binancecoin', 'MATIC': 'matic-network',
            'SOL': 'solana', 'AVAX': 'avalanche-2', 'FTM': 'fantom',
            'TRX': 'tron', 'BTC': 'bitcoin', 'USDT': 'tether',
            'USDC': 'usd-coin', 'DAI': 'dai', 'BUSD': 'binance-usd'
        };
        return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
    },

    getDefaultPrice(symbol) {
        const defaultPrices = {
            'ETH': 2500, 'BNB': 300, 'MATIC': 0.8, 'SOL': 100,
            'AVAX': 30, 'FTM': 0.3, 'TRX': 0.1, 'BTC': 45000,
            'USDT': 1, 'USDC': 1, 'DAI': 1, 'BUSD': 1
        };
        return defaultPrices[symbol.toUpperCase()] || 0;
    },

    getTokenLogo(symbol) {
        const logos = {
            'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
            'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2.png',
            'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
            'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
            'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png',
            'FTM': 'https://assets.coingecko.com/coins/images/4001/small/Fantom.png',
            'TRX': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
            'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
            'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
            'USDC': 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
            'DAI': 'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png',
            'BUSD': 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png'
        };
        return logos[symbol.toUpperCase()] || `https://via.placeholder.com/40/cccccc/000000?text=${symbol.substring(0, 3)}`;
    }
};

// ==============================
// UI MANAGER
// (unchanged behavior, minor improvements kept)
// ==============================

const UI = {
    init() {
        this.renderWalletButtons();
        this.renderChainSelector();
        this.updateNetworkStatus();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Delegate: wallet cards may re-render
        document.addEventListener('click', (e) => {
            const card = e.target.closest && e.target.closest('.wallet-card');
            if (card) {
                const walletId = card.dataset.wallet || card.classList[1];
                handleWalletClick(walletId);
            }
        });
    },

    renderWalletButtons() {
        const container = document.getElementById('walletGrid');
        if (!container) return;
        
        const wallets = [
            { id: 'metamask', name: 'MetaMask', icon: 'fab fa-metamask', color: '#f6851b' },
            { id: 'binance', name: 'Binance Wallet', icon: 'fab fa-binance', color: '#F0B90B' },
            { id: 'trust', name: 'Trust Wallet', icon: 'fas fa-shield-alt', color: '#3375bb' },
            { id: 'phantom', name: 'Phantom', icon: 'fas fa-ghost', color: '#ab9ff2' }
        ];
        
        container.innerHTML = wallets.map(wallet => {
            const isAvailable = WalletManager.isWalletAvailable(wallet.id);
            const connection = WalletManager.getWalletConnection(wallet.id);
            
            let statusText = '';
            let statusClass = '';
            
            if (state.isMobile) {
                statusText = 'Tap to open';
                statusClass = 'mobile';
            } else if (isAvailable) {
                statusText = 'Click to connect';
                statusClass = 'available';
            } else {
                statusText = 'Not installed';
                statusClass = 'not-available';
            }
            
            return `
                <div class="wallet-card ${wallet.id} ${statusClass}" data-wallet="${wallet.id}">
                    <i class="${wallet.icon}"></i>
                    <h3>${wallet.name}</h3>
                    <p>${statusText}</p>
                    ${!isAvailable && !state.isMobile ? 
                        `<div class="install-note">
                            <a href="${connection.desktopLink}" target="_blank" onclick="event.stopPropagation()">
                                Install Extension
                            </a>
                        </div>` : ''
                    }
                </div>
            `;
        }).join('');
    },

    renderChainSelector() {
        const container = document.getElementById('chainsList');
        if (!container) return;
        
        let html = '';
        
        // EVM Chains
        CONFIG.EVM_CHAINS.forEach(chain => {
            const isSelected = state.selectedChains.includes(chain.id);
            html += `
                <label class="chain-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="toggleChain(${chain.id})">
                    <span class="chain-name" style="color: ${chain.color}">
                        <i class="fas fa-circle" style="color: ${chain.color}"></i>
                        ${chain.name} (${chain.symbol})
                    </span>
                </label>
            `;
        });
        
        // Non-EVM Chains
        CONFIG.NON_EVM_CHAINS.forEach(chain => {
            const isSelected = state.selectedChains.includes(chain.id);
            html += `
                <label class="chain-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="toggleChain('${chain.id}')">
                    <span class="chain-name" style="color: ${chain.color}">
                        <i class="fas fa-circle" style="color: ${chain.color}"></i>
                        ${chain.name} (${chain.symbol})
                    </span>
                </label>
            `;
        });
        
        container.innerHTML = html;
    },

    renderConnectedWallets() {
        const container = document.getElementById('walletsList');
        if (!container) return;
        
        if (state.wallets.length === 0) {
            container.innerHTML = '<p class="no-wallets">No wallets connected</p>';
            return;
        }

        container.innerHTML = state.wallets.map(wallet => `
            <div class="wallet-chip" style="background: ${wallet.color}">
                <i class="${wallet.icon}"></i>
                <span class="wallet-info">
                    <strong>${wallet.name}</strong>
                    <span class="wallet-address">${this.formatAddress(wallet.address)}</span>
                </span>
                <button class="remove-btn" onclick="disconnectWallet('${wallet.address}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    renderScanResults(wallet, scanResults) {
        const container = document.getElementById('walletDetails');
        if (!container) return;
        
        const validChainResults = scanResults.chainBalances.filter(r => r !== null);
        
        let html = `
            <div class="wallet-details">
                <div class="wallet-header">
                    <div class="wallet-info">
                        <h4>${wallet.name}</h4>
                        <span class="wallet-address">${this.formatAddress(wallet.address)}</span>
                    </div>
                    <div class="wallet-actions">
                        <button class="btn btn-secondary" onclick="rescanWallet('${wallet.address}')">
                            <i class="fas fa-sync-alt"></i> Rescan All Chains
                        </button>
                    </div>
                </div>
                
                <div class="wallet-balance">
                    <div class="balance-value">$${scanResults.totalValue.toFixed(2)}</div>
                    <div class="balance-label">Total Value Across ${validChainResults.length} Chains</div>
                </div>
        `;
        
        if (validChainResults.length > 0) {
            html += `
                <div class="wallet-chains">
                    <h4><i class="fas fa-network-wired"></i> Chain Balances</h4>
                    <div class="chains-grid">
            `;
            
            validChainResults.forEach(chainResult => {
                const chain = chainResult.chain;
                const totalTokens = chainResult.tokens.length;
                html += `
                    <div class="chain-item">
                        <div class="chain-header">
                            <div class="chain-icon" style="background: ${chain.color}">
                                ${chain.symbol.substring(0, 3)}
                            </div>
                            <div class="chain-name">${chain.name}</div>
                        </div>
                        <div class="chain-balance">${chainResult.nativeBalance.balance} ${chainResult.nativeBalance.symbol}</div>
                        <div class="chain-value">$${chainResult.totalValue.toFixed(2)}</div>
                        <div class="chain-tokens">${totalTokens} token${totalTokens !== 1 ? 's' : ''}</div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        
        container.innerHTML = html;
        this.showSection('scanResults');
    },

    renderAllTokens() {
        const tokensBody = document.getElementById('tokensBody');
        const totalValueEl = document.getElementById('totalValue');
        
        if (!tokensBody || !totalValueEl) return;
        
        // Combine tokens from all wallets
        const allTokens = [];
        state.wallets.forEach(wallet => {
            if (wallet.scanResults && wallet.scanResults.allTokens) {
                allTokens.push(...wallet.scanResults.allTokens);
            }
        });
        
        if (allTokens.length === 0) {
            tokensBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-tokens">
                        <i class="fas fa-coins"></i>
                        <div>No tokens found. Scan wallets to see token balances.</div>
                    </td>
                </tr>
            `;
            totalValueEl.textContent = 'Total Value: $0.00';
            state.totalValue = 0;
            return;
        }

        // Calculate total value
        const totalValue = allTokens.reduce((sum, token) => sum + (token.value || 0), 0);
        totalValueEl.textContent = `Total Value: $${totalValue.toFixed(2)}`;
        state.totalValue = totalValue;

        // Sort by value (highest first)
        allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));

        // Render tokens
        tokensBody.innerHTML = allTokens.map(token => `
            <tr class="token-row">
                <td>
                    <div class="token-info">
                        <div class="token-icon" style="background: ${this.getTokenColor(token.symbol)};">
                            ${token.symbol.substring(0, 3)}
                        </div>
                        <div>
                            <div class="token-symbol">${token.symbol}</div>
                            <div class="token-name">${token.name}</div>
                        </div>
                    </div>
                </td>
                <td class="token-balance">${parseFloat(token.balance).toLocaleString(undefined, { 
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 6 
                })}</td>
                <td>$${token.price ? token.price.toFixed(6) : 'N/A'}</td>
                <td class="token-value">$${token.value ? token.value.toFixed(2) : '0.00'}</td>
                <td>
                    <span class="token-chain">${token.chain}</span>
                </td>
            </tr>
        `).join('');
        
        this.showSection('tokensSection');
    },

    getTokenColor(symbol) {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        const index = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    },

    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.log(`[toast ${type}]`, message);
            return;
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    },

    showLoading(message) {
        const loadingText = document.getElementById('loadingText');
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingText || !loadingOverlay) return;
        loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    },

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay) return;
        loadingOverlay.style.display = 'none';
    },

    showSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.classList.remove('hidden');
        }
    },

    hideSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.classList.add('hidden');
        }
    },

    updateNetworkStatus() {
        const networkStatus = document.getElementById('networkStatus');
        if (!networkStatus) return;
        
        const dot = networkStatus.querySelector('.status-dot');
        const text = networkStatus.querySelector('span:last-child');
        
        if (state.wallets.length > 0) {
            dot.style.background = '#10b981';
            text.textContent = `${state.wallets.length} Wallet${state.wallets.length > 1 ? 's' : ''} Connected`;
        } else {
            dot.style.background = '#ef4444';
            text.textContent = 'Not Connected';
        }
    },

    updateSignatureStatus(message) {
        const signatureStatus = document.getElementById('signatureStatus');
        if (!signatureStatus) return;
        
        if (message) {
            signatureStatus.innerHTML = `
                <div style="color: #10b981;">
                    <i class="fas fa-check-circle"></i> ${message}
                </div>
            `;
        } else {
            signatureStatus.innerHTML = `
                <div style="color: #6b7280;">
                    <i class="fas fa-info-circle"></i> No signature yet. Click "Sign & Continue" to authorize.
                </div>
            `;
        }
    }
};

// ==============================
// MAIN FUNCTIONS
// ==============================

async function handleWalletClick(walletId) {
    console.log(`Handling ${walletId} click...`);
    
    if (state.isMobile) {
        // On mobile, open wallet app or redirect to mobile deep link
        const mobileLink = WalletManager.getMobileLink(walletId);
        if (mobileLink) {
            try {
                // If it's an URL that starts with a protocol (like binance://), attempt to open it.
                window.location.href = mobileLink;
            } catch (err) {
                // fallback
                window.open(mobileLink, '_blank');
            }
        }
        
        // Store pending wallet for when user returns
        localStorage.setItem('pendingWallet', walletId);
        localStorage.setItem('pendingWalletTime', Date.now());
        
        setTimeout(() => {
            UI.showToast(`Opening ${WalletManager.getWalletName(walletId)}...`, 'info');
        }, 100);
        
        return;
    }
    
    // On desktop, connect via JavaScript
    await connectWallet(walletId);
}

async function connectWallet(walletId) {
    console.log(`Connecting to ${walletId}...`);
    
    UI.showLoading(`Connecting ${WalletManager.getWalletName(walletId)}...`);
    
    try {
        const wallet = await WalletManager.connectWallet(walletId);
        
        // Check if wallet is already connected
        const existingIndex = state.wallets.findIndex(w => 
            w.address.toLowerCase() === wallet.address.toLowerCase() && 
            w.walletType === wallet.walletType
        );
        
        if (existingIndex !== -1) {
            state.wallets[existingIndex] = wallet;
            UI.showToast(`${wallet.name} reconnected`, 'info');
        } else {
            state.wallets.push(wallet);
            UI.showToast(`${wallet.name} connected successfully!`, 'success');
        }
        
        // Update UI
        UI.renderConnectedWallets();
        UI.updateNetworkStatus();
        UI.showSection('chainsSection');
        UI.showSection('connectedSection');
        
        // Auto-scan the wallet
        await scanWallet(wallet);
        
        UI.hideLoading();
        
    } catch (error) {
        console.error('Connection error:', error);
        UI.hideLoading();
        UI.showToast(error.message || 'Connection failed', 'error');
        
        // If wallet not found, show install link / open mobile deep link
        if (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('not detected') || error.message?.toLowerCase().includes('redirecting')) {
            const connection = WalletManager.getWalletConnection(walletId);
            if (connection && connection.desktopLink) {
                setTimeout(() => {
                    if (confirm(`Would you like to install ${WalletManager.getWalletName(walletId)}?`)) {
                        window.open(connection.desktopLink, '_blank');
                    }
                }, 1000);
            }
        }
    }
}

async function scanWallet(wallet) {
    if (!wallet) return;
    
    UI.showLoading(`Scanning ${wallet.name} across ${state.selectedChains.length} chains...`);
    
    try {
        const scanResults = await TokenScanner.scanWallet(wallet);
        
        // Update wallet with scan results
        const walletIndex = state.wallets.findIndex(w => w.address === wallet.address);
        if (walletIndex !== -1) {
            state.wallets[walletIndex].scanResults = scanResults;
            
            // Update UI
            UI.renderScanResults(wallet, scanResults);
            UI.renderAllTokens();
            
            const validChains = scanResults.chainBalances.filter(r => r !== null).length;
            UI.showToast(`Scanned ${validChains} chains, found ${scanResults.allTokens.length} token entries`, 'success');
        }
        
        UI.hideLoading();
        
    } catch (error) {
        console.error('Scan error:', error);
        UI.hideLoading();
        UI.showToast(`Scan failed: ${error.message}`, 'error');
    }
}

async function scanAllSelectedChains() {
    if (state.wallets.length === 0) {
        UI.showToast('No wallets connected', 'warning');
        return;
    }
    
    UI.showLoading(`Scanning ${state.wallets.length} wallet(s)...`);
    
    try {
        for (const wallet of state.wallets) {
            await scanWallet(wallet);
        }
        UI.showToast('All wallets scanned!', 'success');
    } catch (error) {
        UI.showToast(`Scan failed: ${error.message}`, 'error');
    } finally {
        UI.hideLoading();
    }
}

async function rescanWallet(address) {
    const wallet = state.wallets.find(w => w.address === address);
    if (wallet) {
        await scanWallet(wallet);
    }
}

function toggleChain(chainId) {
    const index = state.selectedChains.indexOf(chainId);
    if (index === -1) {
        state.selectedChains.push(chainId);
    } else {
        state.selectedChains.splice(index, 1);
    }
    
    // Save to localStorage
    localStorage.setItem('selectedChains', JSON.stringify(state.selectedChains));
    
    // Update UI
    UI.renderChainSelector();
}

function disconnectWallet(address) {
    state.wallets = state.wallets.filter(w => w.address !== address);
    
    // Update UI
    UI.renderConnectedWallets();
    UI.updateNetworkStatus();
    UI.renderAllTokens();
    
    if (state.wallets.length === 0) {
        UI.hideSection('chainsSection');
        UI.hideSection('connectedSection');
        UI.hideSection('scanResults');
        UI.hideSection('tokensSection');
        UI.hideSection('authSection');
    }
    
    UI.showToast('Wallet disconnected', 'info');
}

function disconnectAllWallets() {
    if (state.wallets.length === 0) {
        UI.showToast('No wallets connected', 'warning');
        return;
    }
    
    if (!confirm('Disconnect all wallets?')) return;
    
    state.wallets = [];
    state.tokens = [];
    state.totalValue = 0;
    
    UI.renderConnectedWallets();
    UI.updateNetworkStatus();
    UI.renderAllTokens();
    UI.hideSection('chainsSection');
    UI.hideSection('connectedSection');
    UI.hideSection('scanResults');
    UI.hideSection('tokensSection');
    UI.hideSection('authSection');
    
    UI.showToast('All wallets disconnected', 'info');
}

async function signForBackend() {
    if (state.wallets.length === 0) {
        UI.showToast('No wallets connected', 'warning');
        return;
    }
    
    UI.showLoading('Signing message...');
    
    try {
        // Sign with each connected wallet
        for (const wallet of state.wallets) {
            if (wallet.type === 'evm' && wallet.provider) {
                const message = `Authorize MultiChain Scanner\nAddress: ${wallet.address}\nTotal Value: $${(state.totalValue || 0).toFixed(2)}\nTimestamp: ${Date.now()}\nNonce: ${Math.random().toString(36).substring(7)}`;
                
                try {
                    // Some providers expect params [message, address], others the reverse. Try personal_sign first.
                    let signature;
                    try {
                        signature = await wallet.provider.request({
                            method: 'personal_sign',
                            params: [message, wallet.address]
                        });
                    } catch (err) {
                        // try eth_sign as fallback
                        signature = await wallet.provider.request({
                            method: 'eth_sign',
                            params: [wallet.address, message]
                        });
                    }
                    console.log(`${wallet.name} signature:`, signature);
                    UI.showToast(`${wallet.name} signed successfully`, 'success');
                } catch (signError) {
                    console.error(`${wallet.name} sign error:`, signError);
                    UI.showToast(`${wallet.name} sign failed: ${signError.message || signError}`, 'warning');
                }
            } else if (wallet.type === 'solana' && wallet.provider) {
                // Phantom signing
                try {
                    const message = new TextEncoder().encode(`Authorize MultiChain Scanner - ${Date.now()}`);
                    const signedMessage = await wallet.provider.signMessage(message);
                    console.log(`${wallet.name} signature:`, signedMessage.signature);
                    UI.showToast(`${wallet.name} signed successfully`, 'success');
                } catch (signError) {
                    console.error(`${wallet.name} sign error:`, signError);
                    UI.showToast(`${wallet.name} sign failed: ${signError.message || signError}`, 'warning');
                }
            }
        }
        
        UI.updateSignatureStatus('All wallets signed and authorized!');
        UI.showSection('authSection');
        UI.hideLoading();
        UI.showToast('All wallets signed successfully! Ready to continue.', 'success');
        
    } catch (error) {
        UI.hideLoading();
        UI.showToast(`Signing failed: ${error.message || error}`, 'error');
    }
}

async function triggerBackend() {
    try {
        UI.showLoading('Processing with backend...');
        
        // Prepare data for backend
        const backendData = {
            wallets: state.wallets.map(wallet => ({
                address: wallet.address,
                type: wallet.type,
                walletType: wallet.walletType,
                scanResults: wallet.scanResults,
                totalValue: wallet.scanResults?.totalValue || 0
            })),
            tokens: state.tokens,
            totalValue: state.totalValue,
            selectedChains: state.selectedChains,
            timestamp: new Date().toISOString()
        };
        
        console.log('📤 Sending to backend:', backendData);
        
        // Simulate API call (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real app, you would send this to your backend:
        // const response = await fetch('https://your-backend.com/api/process', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(backendData)
        // });
        
        UI.hideLoading();
        UI.updateSignatureStatus('✅ Backend processing complete! Transaction authorized and ready.');
        UI.showToast('Backend processing successful!', 'success');
        
        // Log the data for demonstration
        console.log('✅ Backend would receive:', JSON.stringify(backendData, null, 2));
        
    } catch (error) {
        UI.hideLoading();
        UI.showToast(`Backend error: ${error.message || error}`, 'error');
    }
}

function exportData() {
    if (state.wallets.length === 0) {
        UI.showToast('No data to export', 'warning');
        return;
    }
    
    const exportData = {
        wallets: state.wallets,
        tokens: state.tokens,
        totalValue: state.totalValue,
        selectedChains: state.selectedChains,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `multichain-scan-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    UI.showToast('Data exported successfully!', 'success');
}

function showHelp() {
    UI.showToast(`
        <div style="text-align: left;">
            <strong>How to use:</strong><br>
            1. Click a wallet to connect<br>
            2. Select chains to scan (check boxes)<br>
            3. Click "Scan All Selected Chains"<br>
            4. Click "Sign & Continue" to authorize<br>
            5. Click "Continue & Trigger Backend"<br>
            6. Export data if needed
        </div>
    `, 'info');
}

// ==============================
// INITIALIZATION & EVENT HANDLERS
// ==============================

// Make functions globally available
window.handleWalletClick = handleWalletClick;
window.connectWallet = connectWallet;
window.scanWallet = scanWallet;
window.scanAllSelectedChains = scanAllSelectedChains;
window.rescanWallet = rescanWallet;
window.toggleChain = toggleChain;
window.disconnectWallet = disconnectWallet;
window.disconnectAllWallets = disconnectAllWallets;
window.signForBackend = signForBackend;
window.triggerBackend = triggerBackend;
window.exportData = exportData;
window.showHelp = showHelp;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 MultiChain Wallet Scanner Initialized (updated main.js)');
    
    // Load saved chain selections
    const savedChains = localStorage.getItem('selectedChains');
    if (savedChains) {
        try {
            state.selectedChains = JSON.parse(savedChains);
        } catch (e) {
            // ignore and keep defaults
        }
    }
    
    // Initialize UI
    UI.init();
    
    // Check if returning from mobile wallet
    const pendingWallet = localStorage.getItem('pendingWallet');
    const pendingTime = localStorage.getItem('pendingWalletTime');
    
    if (pendingWallet && pendingTime && (Date.now() - parseInt(pendingTime) < 60000)) {
        localStorage.removeItem('pendingWallet');
        localStorage.removeItem('pendingWalletTime');
        UI.showToast(`Returned from ${WalletManager.getWalletName(pendingWallet)}. Connect via extension if on desktop.`, 'info');
    }
    
    // Listen for wallet changes (desktop only)
    if (!state.isMobile) {
        if (window.ethereum) {
            try {
                window.ethereum.on('accountsChanged', (accounts) => {
                    console.log('Accounts changed:', accounts);
                    if (accounts.length === 0) {
                        disconnectAllWallets();
                    } else {
                        // If main account changed, prompt user to re-scan
                        UI.showToast('Accounts changed, please reconnect or rescan.', 'info');
                    }
                });
                
                window.ethereum.on('chainChanged', () => {
                    console.log('Chain changed');
                    UI.showToast('Network changed. Please rescan.', 'info');
                });
            } catch (e) {
                // provider may not support events
            }
        }
        
        if (window.BinanceChain) {
            try {
                window.BinanceChain.on('accountsChanged', () => {
                    console.log('Binance accounts changed');
                    UI.showToast('Binance Wallet accounts changed', 'info');
                });
            } catch (e) {}
        }
        
        if (window.solana) {
            try {
                window.solana.on('connect', () => {
                    console.log('Phantom connected');
                });
                
                window.solana.on('disconnect', () => {
                    console.log('Phantom disconnected');
                    state.wallets = state.wallets.filter(w => w.type !== 'solana');
                    UI.renderConnectedWallets();
                });
            } catch (e) {}
        }
    }
    
    // Show welcome message
    setTimeout(() => {
        if (state.isMobile) {
            UI.showToast('Tap a wallet to open in its app', 'info');
        } else {
            UI.showToast('Click a wallet to connect and scan', 'info');
        }
    }, 1000);
});
