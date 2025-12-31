// ==============================
// ULTIMATE MULTI-CHAIN WALLET SCANNER - BINANCE FOCUS
// ==============================

const CONFIG = {
    // Simplified EVM Chains (only main ones)
    EVM_CHAINS: [
        { id: 1, name: 'Ethereum', rpc: 'https://rpc.ankr.com/eth', symbol: 'ETH', explorer: 'https://etherscan.io', color: '#627EEA' },
        { id: 56, name: 'BNB Chain', rpc: 'https://bsc-dataseed.binance.org', symbol: 'BNB', explorer: 'https://bscscan.com', color: '#F0B90B' },
        { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com', symbol: 'MATIC', explorer: 'https://polygonscan.com', color: '#8247E5' },
        { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', symbol: 'ETH', explorer: 'https://arbiscan.io', color: '#28A0F0' },
        { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io', color: '#FF0420' },
        { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', explorer: 'https://snowtrace.io', color: '#E84142' },
        { id: 250, name: 'Fantom', rpc: 'https://rpcapi.fantom.network', symbol: 'FTM', explorer: 'https://ftmscan.com', color: '#1969FF' },
        { id: 25, name: 'Cronos', rpc: 'https://evm.cronos.org', symbol: 'CRO', explorer: 'https://cronoscan.com', color: '#121926' },
        { id: 42220, name: 'Celo', rpc: 'https://forno.celo.org', symbol: 'CELO', explorer: 'https://celoscan.io', color: '#35D07F' },
        { id: 8453, name: 'Base', rpc: 'https://mainnet.base.org', symbol: 'ETH', explorer: 'https://basescan.org', color: '#0052FF' },
    ],
    
    // Non-EVM Chains
    NON_EVM_CHAINS: [
        { id: 'solana', name: 'Solana', rpc: 'https://api.mainnet-beta.solana.com', symbol: 'SOL', explorer: 'https://explorer.solana.com', color: '#9945FF' },
        { id: 'tron', name: 'Tron', rpc: 'https://api.trongrid.io', symbol: 'TRX', explorer: 'https://tronscan.org', color: '#FF060A' },
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', explorer: 'https://blockchain.info', color: '#F7931A' },
    ]
};

// State
let state = {
    wallets: [],
    tokens: [],
    selectedChains: [1, 56, 137, 42161, 10, 43114, 250, 'solana', 'tron', 'bitcoin'],
    isScanning: false,
    totalValue: 0
};

// ==============================
// WALLET DETECTION & CONNECTION
// ==============================

const WalletManager = {
    // Detect available wallets
    detectWallets() {
        const wallets = [];
        
        // 1. Binance Wallet - DIRECT DETECTION
        if (window.BinanceChain || window.BSC) {
            wallets.push({
                id: 'binance',
                name: 'Binance Wallet',
                type: 'evm',
                icon: 'fab fa-binance',
                color: '#F0B90B',
                priority: 1
            });
        }
        
        // 2. MetaMask
        if (window.ethereum && window.ethereum.isMetaMask) {
            wallets.push({
                id: 'metamask',
                name: 'MetaMask',
                type: 'evm',
                icon: 'fab fa-metamask',
                color: '#f6851b',
                priority: 2
            });
        }
        
        // 3. Phantom
        if (window.solana && window.solana.isPhantom) {
            wallets.push({
                id: 'phantom',
                name: 'Phantom',
                type: 'solana',
                icon: 'fas fa-ghost',
                color: '#ab9ff2',
                priority: 3
            });
        }
        
        // 4. Trust Wallet
        if (window.trustwallet) {
            wallets.push({
                id: 'trust',
                name: 'Trust Wallet',
                type: 'evm',
                icon: 'fas fa-shield-alt',
                color: '#3375bb',
                priority: 4
            });
        }
        
        return wallets.sort((a, b) => a.priority - b.priority);
    },
    
    // Connect to specific wallet
    async connectWallet(walletId) {
        switch(walletId) {
            case 'binance':
                return await this.connectBinance();
            case 'metamask':
                return await this.connectMetaMask();
            case 'phantom':
                return await this.connectPhantom();
            case 'trust':
                return await this.connectTrust();
            default:
                throw new Error(`Wallet ${walletId} not supported`);
        }
    },
    
    // BINANCE WALLET CONNECTION - STRICT & DIRECT
    async connectBinance() {
        console.log('🔄 Connecting Binance Wallet...');
        
        // STRICT Binance Wallet detection
        if (typeof window.BinanceChain === "undefined") {
            // Try alternative name
            if (typeof window.BSC === "undefined") {
                throw new Error(
                    "Binance Wallet not detected. Install the Binance Wallet browser extension."
                );
            } else {
                window.BinanceChain = window.BSC;
            }
        }

        const provider = window.BinanceChain;

        try {
            // Force popup (this ALWAYS opens Binance Wallet UI)
            const accounts = await provider.request({
                method: "eth_requestAccounts"
            });

            if (!accounts || !accounts.length) {
                throw new Error("Binance Wallet connection rejected");
            }

            const address = accounts[0];
            
            // Get current chain
            let chainId;
            try {
                chainId = await provider.request({ method: "eth_chainId" });
            } catch (e) {
                chainId = '0x38'; // Default to BSC
            }

            console.log("✅ Binance Wallet connected:", address);

            return {
                address: address,
                chainId: parseInt(chainId, 16),
                type: 'evm',
                name: 'Binance Wallet',
                icon: 'fab fa-binance',
                color: '#F0B90B',
                provider: provider,
                walletType: 'binance'
            };

        } catch (err) {
            console.error("Binance Wallet connection error:", err);
            throw new Error(err.message || "Failed to connect Binance Wallet");
        }
    },
    
    // MetaMask connection
    async connectMetaMask() {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
            throw new Error('MetaMask not detected');
        }
        
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            const chainIdHex = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            
            return {
                address: accounts[0],
                chainId: parseInt(chainIdHex, 16),
                type: 'evm',
                name: 'MetaMask',
                icon: 'fab fa-metamask',
                color: '#f6851b',
                provider: window.ethereum,
                walletType: 'metamask'
            };
        } catch (error) {
            throw new Error(`MetaMask: ${error.message}`);
        }
    },
    
    // Phantom connection
    async connectPhantom() {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not detected');
        }
        
        try {
            const resp = await window.solana.connect();
            
            return {
                address: resp.publicKey.toString(),
                chainId: 'solana',
                type: 'solana',
                name: 'Phantom',
                icon: 'fas fa-ghost',
                color: '#ab9ff2',
                provider: window.solana,
                walletType: 'phantom'
            };
        } catch (error) {
            throw new Error(`Phantom: ${error.message}`);
        }
    },
    
    // Trust Wallet connection
    async connectTrust() {
        if (!window.trustwallet) {
            throw new Error('Trust Wallet not detected');
        }
        
        try {
            const accounts = await window.trustwallet.request({ 
                method: 'eth_requestAccounts' 
            });
            
            const chainIdHex = await window.trustwallet.request({ 
                method: 'eth_chainId' 
            });
            
            return {
                address: accounts[0],
                chainId: parseInt(chainIdHex, 16),
                type: 'evm',
                name: 'Trust Wallet',
                icon: 'fas fa-shield-alt',
                color: '#3375bb',
                provider: window.trustwallet,
                walletType: 'trust'
            };
        } catch (error) {
            throw new Error(`Trust Wallet: ${error.message}`);
        }
    }
};

// ==============================
// TOKEN SCANNER
// ==============================

const TokenScanner = {
    async scanWallet(wallet) {
        console.log(`🔍 Scanning ${wallet.name}...`);
        
        const results = {
            wallet: wallet,
            chainBalances: [],
            allTokens: [],
            totalValue: 0
        };
        
        try {
            if (wallet.type === 'evm') {
                // Scan selected EVM chains
                for (const chain of CONFIG.EVM_CHAINS) {
                    if (state.selectedChains.includes(chain.id)) {
                        try {
                            console.log(`Scanning ${chain.name}...`);
                            const chainResult = await this.scanEVMChain(wallet.address, chain);
                            if (chainResult && chainResult.totalValue > 0) {
                                results.chainBalances.push(chainResult);
                                results.allTokens.push(...chainResult.tokens);
                                results.totalValue += chainResult.totalValue;
                            }
                        } catch (error) {
                            console.log(`Skipped ${chain.name}:`, error.message);
                        }
                    }
                }
            }
            
            // Scan Solana
            if (wallet.type === 'solana' && state.selectedChains.includes('solana')) {
                try {
                    console.log('Scanning Solana...');
                    const solResult = await this.scanSolana(wallet.address);
                    if (solResult && solResult.totalValue > 0) {
                        results.chainBalances.push(solResult);
                        results.allTokens.push(...solResult.tokens);
                        results.totalValue += solResult.totalValue;
                    }
                } catch (error) {
                    console.log('Skipped Solana:', error.message);
                }
            }
            
            // Scan Tron
            if (wallet.type !== 'solana' && state.selectedChains.includes('tron')) {
                try {
                    console.log('Scanning Tron...');
                    const tronResult = await this.scanTron(wallet.address);
                    if (tronResult && tronResult.totalValue > 0) {
                        results.chainBalances.push(tronResult);
                        results.allTokens.push(...tronResult.tokens);
                        results.totalValue += tronResult.totalValue;
                    }
                } catch (error) {
                    console.log('Skipped Tron:', error.message);
                }
            }
            
            console.log(`✅ Scan complete: ${results.chainBalances.length} chains, ${results.allTokens.length} tokens`);
            return results;
            
        } catch (error) {
            console.error('Scan error:', error);
            return results;
        }
    },
    
    async scanEVMChain(address, chain) {
        try {
            // Get native balance
            const balance = await this.getNativeBalance(address, chain.rpc);
            const price = await this.getTokenPrice(chain.symbol);
            const value = balance * price;
            
            const tokens = [{
                address: 'native',
                symbol: chain.symbol,
                name: `${chain.name} Native`,
                balance: balance.toFixed(6),
                decimals: 18,
                price: price,
                value: value,
                chain: chain.name,
                chainId: chain.id,
                type: 'native',
                logo: this.getTokenLogo(chain.symbol)
            }];
            
            // Get ERC20 tokens from chain explorer
            try {
                const erc20Tokens = await this.getERC20Tokens(address, chain);
                tokens.push(...erc20Tokens);
            } catch (e) {
                console.log(`No ERC20 tokens for ${chain.name}:`, e.message);
            }
            
            const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
            
            return {
                chain: chain,
                nativeBalance: {
                    symbol: chain.symbol,
                    balance: balance.toFixed(6),
                    price: price,
                    value: value
                },
                tokens: tokens,
                totalValue: totalValue
            };
            
        } catch (error) {
            console.error(`Failed to scan ${chain.name}:`, error);
            throw error;
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
            console.error('Balance fetch error:', error);
            return 0;
        }
    },
    
    async getERC20Tokens(address, chain) {
        const tokens = [];
        
        // For BSC, try multiple methods
        if (chain.id === 56) {
            try {
                // Method 1: BSCScan API
                const bscTokens = await this.getBSCScanTokens(address);
                tokens.push(...bscTokens);
            } catch (e) {
                console.log('BSCScan method failed:', e.message);
                
                // Method 2: Simple token detection for common tokens
                const commonTokens = this.getCommonBSCTokens(address, chain);
                if (commonTokens.length > 0) {
                    tokens.push(...commonTokens);
                }
            }
        }
        
        // For Ethereum
        if (chain.id === 1) {
            try {
                const ethTokens = await this.getEthereumTokens(address);
                tokens.push(...ethTokens);
            } catch (e) {
                console.log('Ethereum tokens fetch failed:', e.message);
            }
        }
        
        return tokens;
    },
    
    async getBSCScanTokens(address) {
        // You need a BSCScan API key for this
        // For demo, we'll use public endpoints
        const tokens = [];
        
        // Common BSC tokens
        const commonTokens = [
            {
                address: '0x55d398326f99059fF775485246999027B3197955',
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 18
            },
            {
                address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 18
            },
            {
                address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
                symbol: 'BUSD',
                name: 'Binance USD',
                decimals: 18
            },
            {
                address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
                symbol: 'DAI',
                name: 'Dai Stablecoin',
                decimals: 18
            },
            {
                address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
                symbol: 'WBNB',
                name: 'Wrapped BNB',
                decimals: 18
            }
        ];
        
        // Check balances for each token
        for (const token of commonTokens) {
            try {
                const balance = await this.getTokenBalance(address, token.address, CONFIG.EVM_CHAINS.find(c => c.id === 56).rpc);
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
                        chain: 'BNB Chain',
                        chainId: 56,
                        type: 'erc20',
                        logo: this.getTokenLogo(token.symbol)
                    });
                }
            } catch (e) {
                console.log(`Failed to get balance for ${token.symbol}:`, e.message);
            }
        }
        
        return tokens;
    },
    
    getCommonBSCTokens(address, chain) {
        // Simplified token list for demo
        return [];
    },
    
    async getTokenBalance(walletAddress, tokenAddress, rpcUrl) {
        try {
            const data = '0x70a08231000000000000000000000000' + walletAddress.slice(2);
            
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
                return parseInt(result.result, 16) / 1e18;
            }
            return 0;
        } catch (error) {
            console.error('Token balance error:', error);
            return 0;
        }
    },
    
    async scanSolana(address) {
        try {
            const solPrice = await this.getTokenPrice('SOL');
            
            // Get SOL balance
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
            const solBalance = data.result ? data.result.value / 1e9 : 0;
            
            if (solBalance === 0) return null;
            
            const solValue = solBalance * solPrice;
            
            const tokens = [{
                address: 'native',
                symbol: 'SOL',
                name: 'Solana',
                balance: solBalance.toFixed(6),
                decimals: 9,
                price: solPrice,
                value: solValue,
                chain: 'Solana',
                type: 'native',
                logo: this.getTokenLogo('SOL')
            }];
            
            const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
            
            return {
                chain: CONFIG.NON_EVM_CHAINS.find(c => c.id === 'solana'),
                nativeBalance: {
                    symbol: 'SOL',
                    balance: solBalance.toFixed(6),
                    price: solPrice,
                    value: solValue
                },
                tokens: tokens,
                totalValue: totalValue
            };
            
        } catch (error) {
            console.error('Solana scan error:', error);
            return null;
        }
    },
    
    async scanTron(address) {
        // Only scan if address looks like a Tron address
        if (!address.startsWith('T') && !address.startsWith('0x')) {
            return null;
        }
        
        try {
            const trxPrice = await this.getTokenPrice('TRX');
            
            // Simple Tron balance check
            const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);
            const data = await response.json();
            
            let trxBalance = 0;
            if (data.data && data.data.length > 0) {
                trxBalance = data.data[0].balance / 1000000;
            }
            
            if (trxBalance === 0) return null;
            
            const trxValue = trxBalance * trxPrice;
            
            const tokens = [{
                address: 'native',
                symbol: 'TRX',
                name: 'Tron',
                balance: trxBalance.toFixed(6),
                decimals: 6,
                price: trxPrice,
                value: trxValue,
                chain: 'Tron',
                type: 'native',
                logo: this.getTokenLogo('TRX')
            }];
            
            const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
            
            return {
                chain: CONFIG.NON_EVM_CHAINS.find(c => c.id === 'tron'),
                nativeBalance: {
                    symbol: 'TRX',
                    balance: trxBalance.toFixed(6),
                    price: trxPrice,
                    value: trxValue
                },
                tokens: tokens,
                totalValue: totalValue
            };
            
        } catch (error) {
            console.error('Tron scan error:', error);
            return null;
        }
    },
    
    // PRICE FETCHING
    async getTokenPrice(symbol) {
        const cacheKey = `price_${symbol}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < 300000) { // 5 minutes
                return data.price;
            }
        }
        
        try {
            // Try Binance API
            const binanceSymbol = symbol === 'BNB' ? 'BNBUSDT' : `${symbol.toUpperCase()}USDT`;
            const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
            
            if (response.ok) {
                const data = await response.json();
                const price = parseFloat(data.price) || 0;
                
                if (price > 0) {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        price: price,
                        timestamp: Date.now()
                    }));
                    return price;
                }
            }
        } catch (error) {
            console.log(`Binance price failed for ${symbol}, trying CoinGecko...`);
        }
        
        // Fallback to CoinGecko
        try {
            const coinId = this.getCoinId(symbol);
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            
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
            console.log(`CoinGecko price failed for ${symbol}`);
        }
        
        // Default prices
        const defaultPrices = {
            'ETH': 2500,
            'BNB': 300,
            'MATIC': 0.8,
            'SOL': 100,
            'AVAX': 30,
            'FTM': 0.3,
            'TRX': 0.1,
            'BTC': 45000,
            'USDT': 1,
            'USDC': 1,
            'DAI': 1,
            'BUSD': 1
        };
        
        return defaultPrices[symbol.toUpperCase()] || 0;
    },
    
    getCoinId(symbol) {
        const mapping = {
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'MATIC': 'matic-network',
            'SOL': 'solana',
            'AVAX': 'avalanche-2',
            'FTM': 'fantom',
            'TRX': 'tron',
            'BTC': 'bitcoin',
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'DAI': 'dai',
            'BUSD': 'binance-usd'
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
        return logos[symbol.toUpperCase()] || `https://via.placeholder.com/32/cccccc/000000?text=${symbol.substring(0, 3)}`;
    },
    
    async getEthereumTokens(address) {
        // Simplified - just common tokens
        const tokens = [];
        
        const commonTokens = [
            {
                address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 6
            },
            {
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6
            }
        ];
        
        for (const token of commonTokens) {
            try {
                const balance = await this.getTokenBalance(address, token.address, CONFIG.EVM_CHAINS.find(c => c.id === 1).rpc);
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
                        chain: 'Ethereum',
                        chainId: 1,
                        type: 'erc20',
                        logo: this.getTokenLogo(token.symbol)
                    });
                }
            } catch (e) {
                console.log(`Failed to get Ethereum token ${token.symbol}:`, e.message);
            }
        }
        
        return tokens;
    }
};

// ==============================
// UI MANAGER
// ==============================

const UIManager = {
    init() {
        this.addStyles();
        this.renderWalletButtons();
        this.renderChainSelector();
        this.renderScanResults();
    },
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .wallet-btn {
                background: linear-gradient(135deg, var(--color)20, var(--color)40);
                border: 2px solid var(--color)30;
                padding: 20px;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                cursor: pointer;
                transition: all 0.3s;
                width: 180px;
                text-decoration: none !important;
            }
            
            .wallet-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px var(--color)40;
            }
            
            .connected-wallet {
                background: white;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-left: 4px solid var(--color);
            }
            
            .token-row {
                border-bottom: 1px solid #f1f5f9;
                transition: background 0.2s;
            }
            
            .token-row:hover {
                background: #f8fafc !important;
            }
            
            .chain-badge {
                background: #e2e8f0;
                color: #475569;
                padding: 4px 8px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .scan-btn {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s;
            }
            
            .scan-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
            }
        `;
        document.head.appendChild(style);
    },
    
    renderWalletButtons() {
        const container = document.getElementById('walletsContainer');
        if (!container) return;
        
        const wallets = WalletManager.detectWallets();
        
        if (wallets.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1;">
                    <i class="fas fa-wallet" style="font-size: 48px; color: #94a3b8; margin-bottom: 15px;"></i>
                    <h3 style="margin: 0 0 10px 0; color: #475569;">No Wallets Detected</h3>
                    <p style="color: #64748b; margin: 0 0 20px 0;">Please install a wallet extension</p>
                    <div style="display: flex; flex-direction: column; gap: 10px; max-width: 300px; margin: 0 auto;">
                        <a href="https://chrome.google.com/webstore/detail/binance-chain-wallet/fhbohimaelbohpjbbldcngcnapndodjp" 
                           target="_blank" 
                           style="background: #F0B90B; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; display: flex; align-items: center; gap: 10px; justify-content: center;">
                            <i class="fab fa-binance"></i>
                            <span>Install Binance Wallet</span>
                        </a>
                        <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn" 
                           target="_blank"
                           style="background: #f6851b; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; display: flex; align-items: center; gap: 10px; justify-content: center;">
                            <i class="fab fa-metamask"></i>
                            <span>Install MetaMask</span>
                        </a>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = wallets.map(wallet => `
            <div class="wallet-btn" style="--color: ${wallet.color};" onclick="connectWallet('${wallet.id}')">
                <i class="${wallet.icon}" style="font-size: 40px; color: ${wallet.color};"></i>
                <div style="text-align: center;">
                    <div style="font-weight: 600; color: #1e293b;">${wallet.name}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Click to connect</div>
                </div>
            </div>
        `).join('');
    },
    
    renderConnectedWallets() {
        const container = document.getElementById('connectedWallets');
        if (!container) return;
        
        if (state.wallets.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #64748b; font-style: italic;">
                    No wallets connected yet
                </div>
            `;
            return;
        }
        
        container.innerHTML = state.wallets.map(wallet => `
            <div class="connected-wallet" style="--color: ${wallet.color};">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${wallet.color}20; display: flex; align-items: center; justify-content: center;">
                        <i class="${wallet.icon}" style="color: ${wallet.color}; font-size: 18px;"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600; color: #1e293b;">${wallet.name}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                            ${wallet.address.substring(0, 8)}...${wallet.address.substring(wallet.address.length - 6)}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="rescanWallet('${wallet.address}')" 
                            style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="disconnectWallet('${wallet.address}')" 
                            style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    renderChainSelector() {
        const container = document.getElementById('chainsSelector');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
                ${CONFIG.EVM_CHAINS.map(chain => {
                    const selected = state.selectedChains.includes(chain.id);
                    return `
                        <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: ${selected ? chain.color + '20' : '#f8fafc'}; 
                                border: 1px solid ${selected ? chain.color + '50' : '#e2e8f0'}; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                            <input type="checkbox" ${selected ? 'checked' : ''} 
                                   onchange="toggleChain(${chain.id})" style="cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${chain.color};"></div>
                                <span style="font-size: 14px; color: #334155;">${chain.name}</span>
                            </div>
                        </label>
                    `;
                }).join('')}
                
                ${CONFIG.NON_EVM_CHAINS.map(chain => {
                    const selected = state.selectedChains.includes(chain.id);
                    return `
                        <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: ${selected ? chain.color + '20' : '#f8fafc'}; 
                                border: 1px solid ${selected ? chain.color + '50' : '#e2e8f0'}; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                            <input type="checkbox" ${selected ? 'checked' : ''} 
                                   onchange="toggleChain('${chain.id}')" style="cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${chain.color};"></div>
                                <span style="font-size: 14px; color: #334155;">${chain.name}</span>
                            </div>
                        </label>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    renderScanResults() {
        const container = document.getElementById('scanResults');
        if (!container) return;
        
        const allTokens = [];
        let totalValue = 0;
        
        state.wallets.forEach(wallet => {
            if (wallet.scanResults?.allTokens) {
                allTokens.push(...wallet.scanResults.allTokens);
                totalValue += wallet.scanResults.totalValue || 0;
            }
        });
        
        allTokens.sort((a, b) => b.value - a.value);
        
        if (allTokens.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px;">
                    <i class="fas fa-coins" style="font-size: 48px; color: #cbd5e1; margin-bottom: 15px;"></i>
                    <h3 style="margin: 0 0 10px 0; color: #475569;">No Assets Found</h3>
                    <p style="color: #64748b; margin: 0 0 20px 0;">Connect a wallet and click "Scan" to find assets</p>
                    ${state.wallets.length > 0 ? `
                        <button class="scan-btn" onclick="scanAllWallets()">
                            <i class="fas fa-search"></i>
                            Scan All Wallets
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <h3 style="margin: 0 0 4px 0; color: #1e293b;">Portfolio</h3>
                        <div style="color: #64748b; font-size: 14px;">${allTokens.length} assets found</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="text-align: right;">
                            <div style="font-size: 28px; font-weight: 700; color: #10b981;">$${totalValue.toFixed(2)}</div>
                            <div style="color: #64748b; font-size: 14px;">Total Value</div>
                        </div>
                        <button class="scan-btn" onclick="scanAllWallets()">
                            <i class="fas fa-sync-alt"></i>
                            Rescan All
                        </button>
                    </div>
                </div>
                
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #e2e8f0;">
                                <th style="text-align: left; padding: 12px 8px; color: #64748b; font-weight: 600;">Asset</th>
                                <th style="text-align: right; padding: 12px 8px; color: #64748b; font-weight: 600;">Balance</th>
                                <th style="text-align: right; padding: 12px 8px; color: #64748b; font-weight: 600;">Price</th>
                                <th style="text-align: right; padding: 12px 8px; color: #64748b; font-weight: 600;">Value</th>
                                <th style="text-align: center; padding: 12px 8px; color: #64748b; font-weight: 600;">Chain</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allTokens.map(token => `
                                <tr class="token-row">
                                    <td style="padding: 12px 8px;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <img src="${token.logo}" alt="${token.symbol}" 
                                                 style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                                            <div>
                                                <div style="font-weight: 600; color: #1e293b;">${token.symbol}</div>
                                                <div style="font-size: 12px; color: #64748b;">${token.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="text-align: right; padding: 12px 8px; color: #1e293b; font-weight: 500;">
                                        ${token.balance}
                                    </td>
                                    <td style="text-align: right; padding: 12px 8px; color: #64748b;">
                                        $${token.price?.toFixed(4) || '0.0000'}
                                    </td>
                                    <td style="text-align: right; padding: 12px 8px; font-weight: 600; color: #1e293b;">
                                        $${token.value?.toFixed(2) || '0.00'}
                                    </td>
                                    <td style="text-align: center; padding: 12px 8px;">
                                        <span class="chain-badge">${token.chain}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 5000);
    },
    
    showLoading(message) {
        let loader = document.getElementById('globalLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9998;
                color: white;
            `;
            document.body.appendChild(loader);
        }
        
        loader.innerHTML = `
            <div style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 4px solid white; animation: spin 1s linear infinite;"></div>
            <div style="margin-top: 20px; font-size: 16px;">${message}</div>
        `;
        
        loader.style.display = 'flex';
    },
    
    hideLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) loader.style.display = 'none';
    }
};

// ==============================
// MAIN FUNCTIONS
// ==============================

async function connectWallet(walletId) {
    console.log(`🔄 Connecting to ${walletId}...`);
    
    UIManager.showLoading(`Connecting ${walletId}...`);
    
    try {
        const wallet = await WalletManager.connectWallet(walletId);
        
        // Check if already connected
        const existingIndex = state.wallets.findIndex(w => 
            w.address.toLowerCase() === wallet.address.toLowerCase()
        );
        
        if (existingIndex === -1) {
            state.wallets.push(wallet);
        } else {
            state.wallets[existingIndex] = wallet;
        }
        
        // Update UI
        UIManager.renderConnectedWallets();
        UIManager.showToast(`${wallet.name} connected successfully!`, 'success');
        
        // Auto-scan
        await scanWallet(wallet);
        
        UIManager.hideLoading();
        
    } catch (error) {
        console.error('Connection error:', error);
        UIManager.hideLoading();
        UIManager.showToast(error.message, 'error');
    }
}

async function scanWallet(wallet) {
    if (!wallet) return;
    
    UIManager.showLoading(`Scanning ${wallet.name}...`);
    
    try {
        const results = await TokenScanner.scanWallet(wallet);
        
        // Update wallet
        const index = state.wallets.findIndex(w => w.address === wallet.address);
        if (index !== -1) {
            state.wallets[index].scanResults = results;
        }
        
        // Update UI
        UIManager.renderScanResults();
        
        UIManager.hideLoading();
        
        const tokenCount = results.allTokens.length;
        if (tokenCount > 0) {
            UIManager.showToast(`Found ${tokenCount} assets worth $${results.totalValue.toFixed(2)}`, 'success');
        } else {
            UIManager.showToast('No assets found on selected chains', 'info');
        }
        
    } catch (error) {
        console.error('Scan error:', error);
        UIManager.hideLoading();
        UIManager.showToast('Scan completed with some errors', 'warning');
    }
}

async function scanAllWallets() {
    if (state.wallets.length === 0) {
        UIManager.showToast('No wallets connected', 'warning');
        return;
    }
    
    UIManager.showLoading(`Scanning ${state.wallets.length} wallet(s)...`);
    
    try {
        for (const wallet of state.wallets) {
            await scanWallet(wallet);
        }
        UIManager.showToast('All wallets scanned!', 'success');
    } catch (error) {
        UIManager.showToast('Scan failed', 'error');
    } finally {
        UIManager.hideLoading();
    }
}

async function rescanWallet(address) {
    const wallet = state.wallets.find(w => w.address === address);
    if (wallet) {
        await scanWallet(wallet);
    }
}

function disconnectWallet(address) {
    state.wallets = state.wallets.filter(w => w.address !== address);
    UIManager.renderConnectedWallets();
    UIManager.renderScanResults();
    UIManager.showToast('Wallet disconnected', 'info');
}

function toggleChain(chainId) {
    const index = state.selectedChains.indexOf(chainId);
    if (index === -1) {
        state.selectedChains.push(chainId);
    } else {
        state.selectedChains.splice(index, 1);
    }
    UIManager.renderChainSelector();
}

// ==============================
// INITIALIZATION
// ==============================

// Expose functions globally
window.connectWallet = connectWallet;
window.scanWallet = scanWallet;
window.scanAllWallets = scanAllWallets;
window.disconnectWallet = disconnectWallet;
window.toggleChain = toggleChain;
window.rescanWallet = rescanWallet;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Ultimate Multi-Chain Wallet Scanner Ready');
    
    // Initialize UI
    UIManager.init();
    
    // Show welcome message
    setTimeout(() => {
        UIManager.showToast('Select a wallet to connect and scan', 'info');
    }, 1000);
    
    // Listen for wallet changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', () => {
            console.log('Accounts changed');
            // Refresh connected wallets
            UIManager.renderConnectedWallets();
        });
        
        window.ethereum.on('chainChanged', () => {
            console.log('Chain changed');
            UIManager.showToast('Network changed', 'info');
        });
    }
    
    // Also listen for Binance Chain changes
    if (window.BinanceChain) {
        window.BinanceChain.on('accountsChanged', () => {
            console.log('Binance accounts changed');
            UIManager.renderConnectedWallets();
        });
    }
});