// ==============================
// MULTI-CHAIN WALLET SCANNER - COMPLETE VERSION
// ==============================

const CONFIG = {
    // Enhanced Wallet Links with proper redirects
    WALLET_LINKS: {
        metamask: {
            mobile: {
                android: 'https://metamask.app.link/dapp/' + window.location.hostname,
                ios: 'https://metamask.app.link/dapp/' + window.location.hostname,
                universal: 'https://metamask.app.link/dapp/' + window.location.hostname
            },
            desktop: 'https://metamask.io/download.html',
            extension: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#initialize/welcome'
        },
        binance: {
            mobile: {
                android: 'https://bscscan.com/address/',
                ios: 'https://bscscan.com/address/',
                universal: 'https://www.binance.org/en/download'
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
        { id: 1, name: 'Ethereum', rpc: 'https://rpc.ankr.com/eth', symbol: 'ETH', explorer: 'https://etherscan.io', color: '#627EEA' },
        { id: 56, name: 'BNB Chain', rpc: 'https://bsc-dataseed.binance.org', symbol: 'BNB', explorer: 'https://bscscan.com', color: '#F0B90B' },
        { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com', symbol: 'MATIC', explorer: 'https://polygonscan.com', color: '#8247E5' },
        { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', symbol: 'ETH', explorer: 'https://arbiscan.io', color: '#28A0F0' },
        { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io', color: '#FF0420' },
        { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', explorer: 'https://snowtrace.io', color: '#E84142' },
        { id: 250, name: 'Fantom', rpc: 'https://rpcapi.fantom.network', symbol: 'FTM', explorer: 'https://ftmscan.com', color: '#1969FF' }
    ],
    
    NON_EVM_CHAINS: [
        { id: 'solana', name: 'Solana', rpc: 'https://api.mainnet-beta.solana.com', symbol: 'SOL', explorer: 'https://explorer.solana.com', color: '#9945FF' }
    ],

    // Token price API
    PRICE_API: 'https://api.coingecko.com/api/v3/simple/price'
};

// State Management
let state = {
    wallets: [],
    tokens: [],
    selectedChains: [1, 56, 137, 42161, 10, 43114, 250, 'solana'],
    isScanning: false,
    totalValue: 0,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    currentWallet: null
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
                    // Check for MetaMask with multiple methods
                    if (typeof window.ethereum !== 'undefined') {
                        // Check if it's actually MetaMask
                        if (window.ethereum.isMetaMask) return true;
                        
                        // Check if MetaMask is in providers array
                        if (window.ethereum.providers) {
                            return window.ethereum.providers.some(p => p.isMetaMask);
                        }
                        
                        // Some older MetaMask versions
                        if (window.ethereum.isMetaMask === undefined) {
                            // Check by requesting accounts
                            return true; // Assume it's MetaMask
                        }
                    }
                    // Check for injected web3
                    if (typeof window.web3 !== 'undefined') {
                        return true;
                    }
                    return false;
                    
                case 'binance':
                    // Check for Binance Chain Wallet
                    if (typeof window.BinanceChain !== 'undefined') return true;
                    if (typeof window.BSC !== 'undefined') return true;
                    return false;
                    
                case 'phantom':
                    // Check for Phantom
                    if (typeof window.solana !== 'undefined') {
                        return window.solana.isPhantom || false;
                    }
                    return false;
                    
                case 'trust':
                    // Check for Trust Wallet (often uses window.ethereum)
                    if (typeof window.ethereum !== 'undefined') {
                        // Trust Wallet often identifies as MetaMask
                        if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
                            return true;
                        }
                        // Check in providers array
                        if (window.ethereum.providers) {
                            return window.ethereum.providers.some(p => p.isTrust || p.isTrustWallet);
                        }
                    }
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
            } else if (window.ethereum.providers) {
                ethereumProvider = window.ethereum.providers.find(p => p.isMetaMask);
            }
        }
        
        if (!ethereumProvider) {
            // Try using injected web3
            if (window.web3 && window.web3.currentProvider) {
                ethereumProvider = window.web3.currentProvider;
            } else {
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
        } else if (window.ethereum?.providers) {
            binanceProvider = window.ethereum.providers.find(p => p.isBinance);
        }
        
        if (!binanceProvider) {
            // Try alternative detection
            if (typeof window.ethereum !== 'undefined') {
                try {
                    // Request accounts to see if it's Binance Wallet
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                    if (accounts && accounts.length > 0) {
                        binanceProvider = window.ethereum;
                    }
                } catch (e) {
                    // Not Binance Wallet
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
            } else if (window.ethereum.providers) {
                trustProvider = window.ethereum.providers.find(p => p.isTrust || p.isTrustWallet);
            }
        }
        
        if (!trustProvider && window.trustwallet) {
            trustProvider = window.trustwallet;
        }
        
        if (!trustProvider) {
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
            // Show scanning started
            UI.showToast(`Scanning ${wallet.name}...`, 'info');
            
            // Scan based on wallet type
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
                    
                    // Get native balance
                    const balance = await this.getNativeBalance(wallet.address, chain.rpc);
                    
                    if (balance > 0 || true) { // Always show chains with balance
                        const price = await this.getTokenPrice(chain.symbol);
                        const value = balance * price;
                        
                        const chainResult = {
                            chain: chain,
                            nativeBalance: {
                                symbol: chain.symbol,
                                balance: balance.toFixed(6),
                                price: price,
                                value: value
                            },
                            tokens: [],
                            totalValue: value
                        };
                        
                        // Try to get ERC20 tokens (optional)
                        try {
                            const tokens = await this.getERC20Tokens(wallet.address, chain);
                            chainResult.tokens = tokens;
                            chainResult.totalValue += tokens.reduce((sum, token) => sum + (token.value || 0), 0);
                        } catch (tokenError) {
                            console.log(`No ERC20 tokens on ${chain.name}:`, tokenError.message);
                        }
                        
                        results.chainBalances.push(chainResult);
                        results.allTokens.push({
                            address: 'native',
                            symbol: chain.symbol,
                            name: `${chain.name} Native`,
                            balance: balance.toFixed(6),
                            price: price,
                            value: value,
                            chain: chain.name,
                            type: 'native',
                            logo: this.getTokenLogo(chain.symbol)
                        });
                        
                        // Add ERC20 tokens to allTokens
                        if (chainResult.tokens.length > 0) {
                            results.allTokens.push(...chainResult.tokens);
                        }
                    }
                    
                } catch (chainError) {
                    console.log(`⚠️ Skipped ${chain.name}:`, chainError.message);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    },

    async scanSolanaWallet(wallet, results) {
        if (!state.selectedChains.includes('solana')) return;
        
        try {
            console.log('📡 Scanning Solana...');
            
            const chain = CONFIG.NON_EVM_CHAINS.find(c => c.id === 'solana');
            const balance = await this.getSolanaBalance(wallet.address);
            const price = await this.getTokenPrice('SOL');
            const value = balance * price;
            
            if (balance > 0 || true) {
                const chainResult = {
                    chain: chain,
                    nativeBalance: {
                        symbol: 'SOL',
                        balance: balance.toFixed(6),
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
                    balance: balance.toFixed(6),
                    price: price,
                    value: value,
                    chain: 'Solana',
                    type: 'native',
                    logo: this.getTokenLogo('SOL')
                });
            }
            
        } catch (solanaError) {
            console.log('⚠️ Solana scan skipped:', solanaError.message);
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

    async getERC20Tokens(address, chain) {
        const tokens = [];
        
        // Common tokens for each chain
        const commonTokens = this.getCommonTokens(chain.id);
        
        for (const token of commonTokens) {
            try {
                const balance = await this.getTokenBalance(address, token.address, chain.rpc, token.decimals);
                if (balance > 0) {
                    const price = await this.getTokenPrice(token.symbol);
                    const value = balance * price;
                    
                    tokens.push({
                        address: token.address,
                        symbol: token.symbol,
                        name: token.name,
                        balance: balance.toFixed(6),
                        decimals: token.decimals,
                        price: price,
                        value: value,
                        chain: chain.name,
                        type: 'erc20',
                        logo: this.getTokenLogo(token.symbol)
                    });
                }
            } catch (error) {
                // Skip token if balance check fails
            }
        }
        
        return tokens;
    },

    getCommonTokens(chainId) {
        const tokens = {
            1: [ // Ethereum
                { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
                { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
                { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 }
            ],
            56: [ // BSC
                { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
                { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
                { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', decimals: 18 }
            ],
            137: [ // Polygon
                { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
                { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
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
            console.error('Token balance error:', error);
            return 0;
        }
    },

    async getTokenPrice(symbol) {
        const cacheKey = `price_${symbol}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < 300000) { // 5 minutes cache
                return data.price;
            }
        }
        
        try {
            const coinId = this.getCoinId(symbol);
            const response = await fetch(`${CONFIG.PRICE_API}?ids=${coinId}&vs_currencies=usd`);
            
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
        
        // Default prices if API fails
        const defaultPrices = {
            'ETH': 2500, 'BNB': 300, 'MATIC': 0.8, 'SOL': 100,
            'AVAX': 30, 'FTM': 0.3, 'TRX': 0.1, 'BTC': 45000,
            'USDT': 1, 'USDC': 1, 'DAI': 1, 'BUSD': 1
        };
        
        return defaultPrices[symbol.toUpperCase()] || 1;
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
// ==============================

const UI = {
    init() {
        this.renderWalletButtons();
        this.renderChainSelector();
        this.updateNetworkStatus();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Handle wallet clicks
        document.querySelectorAll('.wallet-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const walletId = card.classList[1]; // Get wallet type from class
                handleWalletClick(walletId);
            });
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
        
        // Filter out null results
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
                <td>$${token.price ? token.price.toFixed(4) : 'N/A'}</td>
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
        
        loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    },

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
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
        // On mobile, open wallet app
        const mobileLink = WalletManager.getMobileLink(walletId);
        window.location.href = mobileLink;
        
        // Store pending wallet for when user returns
        localStorage.setItem('pendingWallet', walletId);
        localStorage.setItem('pendingWalletTime', Date.now());
        
        // Show message
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
        UI.showToast(error.message, 'error');
        
        // If wallet not found, show install link
        if (error.message.includes('not found') || error.message.includes('not detected')) {
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
            UI.showToast(`Scanned ${validChains} chains, found ${scanResults.allTokens.length} tokens`, 'success');
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
                const message = `Authorize MultiChain Scanner\nAddress: ${wallet.address}\nTotal Value: $${state.totalValue.toFixed(2)}\nTimestamp: ${Date.now()}\nNonce: ${Math.random().toString(36).substring(7)}`;
                
                try {
                    const signature = await wallet.provider.request({
                        method: 'personal_sign',
                        params: [message, wallet.address]
                    });
                    console.log(`${wallet.name} signature:`, signature);
                    UI.showToast(`${wallet.name} signed successfully`, 'success');
                } catch (signError) {
                    console.error(`${wallet.name} sign error:`, signError);
                    UI.showToast(`${wallet.name} sign failed: ${signError.message}`, 'warning');
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
                    UI.showToast(`${wallet.name} sign failed: ${signError.message}`, 'warning');
                }
            }
        }
        
        UI.updateSignatureStatus('All wallets signed and authorized!');
        UI.showSection('authSection');
        UI.hideLoading();
        UI.showToast('All wallets signed successfully! Ready to continue.', 'success');
        
    } catch (error) {
        UI.hideLoading();
        UI.showToast(`Signing failed: ${error.message}`, 'error');
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
        UI.showToast(`Backend error: ${error.message}`, 'error');
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
    console.log('🚀 MultiChain Wallet Scanner Initialized');
    
    // Load saved chain selections
    const savedChains = localStorage.getItem('selectedChains');
    if (savedChains) {
        state.selectedChains = JSON.parse(savedChains);
    }
    
    // Initialize UI
    UI.init();
    
    // Check if returning from mobile wallet
    const pendingWallet = localStorage.getItem('pendingWallet');
    const pendingTime = localStorage.getItem('pendingWalletTime');
    
    if (pendingWallet && pendingTime && (Date.now() - parseInt(pendingTime) < 60000)) {
        // Clear pending status
        localStorage.removeItem('pendingWallet');
        localStorage.removeItem('pendingWalletTime');
        
        // Show message
        UI.showToast(`Returned from ${WalletManager.getWalletName(pendingWallet)}. Connect via extension if on desktop.`, 'info');
    }
    
    // Listen for wallet changes (desktop only)
    if (!state.isMobile) {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Accounts changed:', accounts);
                if (accounts.length === 0) {
                    disconnectAllWallets();
                } else {
                    // Refresh connections
                    state.wallets.forEach(wallet => {
                        if (wallet.type === 'evm') {
                            const index = state.wallets.findIndex(w => w.address === accounts[0]);
                            if (index === -1) {
                                // New account, refresh
                                UI.showToast('Accounts changed, please reconnect', 'info');
                            }
                        }
                    });
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                console.log('Chain changed');
                UI.showToast('Network changed. Please rescan.', 'info');
            });
        }
        
        if (window.BinanceChain) {
            window.BinanceChain.on('accountsChanged', () => {
                console.log('Binance accounts changed');
                UI.showToast('Binance Wallet accounts changed', 'info');
            });
        }
        
        if (window.solana) {
            window.solana.on('connect', () => {
                console.log('Phantom connected');
            });
            
            window.solana.on('disconnect', () => {
                console.log('Phantom disconnected');
                // Remove Phantom wallet from state
                state.wallets = state.wallets.filter(w => w.type !== 'solana');
                UI.renderConnectedWallets();
            });
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
