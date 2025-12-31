// ==============================
// COMPLETE MULTI-CHAIN WALLET SCANNER
// ==============================

const CONFIG = {
    // 50+ NETWORK CONFIGURATION
    NETWORKS: [
        // EVM Networks (40+)
        { id: 1, name: 'Ethereum', rpc: 'https://rpc.ankr.com/eth', symbol: 'ETH', type: 'evm', color: '#627EEA', explorer: 'https://etherscan.io' },
        { id: 56, name: 'BNB Smart Chain', rpc: 'https://bsc-dataseed.binance.org', symbol: 'BNB', type: 'evm', color: '#F0B90B', explorer: 'https://bscscan.com' },
        { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com', symbol: 'MATIC', type: 'evm', color: '#8247E5', explorer: 'https://polygonscan.com' },
        { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', symbol: 'ETH', type: 'evm', color: '#28A0F0', explorer: 'https://arbiscan.io' },
        { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io', symbol: 'ETH', type: 'evm', color: '#FF0420', explorer: 'https://optimistic.etherscan.io' },
        { id: 8453, name: 'Base', rpc: 'https://mainnet.base.org', symbol: 'ETH', type: 'evm', color: '#0052FF', explorer: 'https://basescan.org' },
        { id: 43114, name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', type: 'evm', color: '#E84142', explorer: 'https://snowtrace.io' },
        { id: 250, name: 'Fantom', rpc: 'https://rpcapi.fantom.network', symbol: 'FTM', type: 'evm', color: '#1969FF', explorer: 'https://ftmscan.com' },
        { id: 42220, name: 'Celo', rpc: 'https://forno.celo.org', symbol: 'CELO', type: 'evm', color: '#35D07F', explorer: 'https://celoscan.io' },
        { id: 128, name: 'Heco', rpc: 'https://http-mainnet.hecochain.com', symbol: 'HT', type: 'evm', color: '#01943F', explorer: 'https://hecoinfo.com' },
        { id: 321, name: 'KCC', rpc: 'https://rpc-mainnet.kcc.network', symbol: 'KCS', type: 'evm', color: '#FF564F', explorer: 'https://explorer.kcc.io' },
        { id: 25, name: 'Cronos', rpc: 'https://evm.cronos.org', symbol: 'CRO', type: 'evm', color: '#121926', explorer: 'https://cronoscan.com' },
        { id: 100, name: 'Gnosis', rpc: 'https://rpc.gnosischain.com', symbol: 'xDAI', type: 'evm', color: '#3E6957', explorer: 'https://gnosisscan.io' },
        { id: 1088, name: 'Metis', rpc: 'https://andromeda.metis.io/?owner=1088', symbol: 'METIS', type: 'evm', color: '#00DACC', explorer: 'https://andromeda-explorer.metis.io' },
        { id: 1284, name: 'Moonbeam', rpc: 'https://rpc.api.moonbeam.network', symbol: 'GLMR', type: 'evm', color: '#53CBC9', explorer: 'https://moonscan.io' },
        { id: 1285, name: 'Moonriver', rpc: 'https://rpc.api.moonriver.moonbeam.network', symbol: 'MOVR', type: 'evm', color: '#F3B404', explorer: 'https://moonriver.moonscan.io' },
        { id: 1313161554, name: 'Aurora', rpc: 'https://mainnet.aurora.dev', symbol: 'ETH', type: 'evm', color: '#78D64B', explorer: 'https://explorer.aurora.dev' },
        { id: 1666600000, name: 'Harmony', rpc: 'https://api.harmony.one', symbol: 'ONE', type: 'evm', color: '#00AEE9', explorer: 'https://explorer.harmony.one' },
        { id: 8217, name: 'Klaytn', rpc: 'https://public-node-api.klaytnapi.com/v1/cypress', symbol: 'KLAY', type: 'evm', color: '#FF6B35', explorer: 'https://scope.klaytn.com' },
        { id: 40, name: 'Telos', rpc: 'https://mainnet.telos.net/evm', symbol: 'TLOS', type: 'evm', color: '#5A4FCF', explorer: 'https://teloscan.io' },
        { id: 20, name: 'Elastos', rpc: 'https://api.elastos.io/eth', symbol: 'ELA', type: 'evm', color: '#000000', explorer: 'https://explorer.elastos.org' },
        { id: 30, name: 'RSK', rpc: 'https://public-node.rsk.co', symbol: 'RBTC', type: 'evm', color: '#FFCC00', explorer: 'https://explorer.rsk.co' },
        { id: 122, name: 'Fuse', rpc: 'https://rpc.fuse.io', symbol: 'FUSE', type: 'evm', color: '#46E8B6', explorer: 'https://explorer.fuse.io' },
        { id: 333999, name: 'Polygon zkEVM', rpc: 'https://zkevm-rpc.com', symbol: 'ETH', type: 'evm', color: '#8247E5', explorer: 'https://zkevm.polygonscan.com' },
        { id: 534352, name: 'Scroll', rpc: 'https://rpc.scroll.io', symbol: 'ETH', type: 'evm', color: '#FFE66D', explorer: 'https://scrollscan.com' },
        { id: 5000, name: 'Mantle', rpc: 'https://rpc.mantle.xyz', symbol: 'MNT', type: 'evm', color: '#000000', explorer: 'https://explorer.mantle.xyz' },
        { id: 59144, name: 'Linea', rpc: 'https://rpc.linea.build', symbol: 'ETH', type: 'evm', color: '#121212', explorer: 'https://lineascan.build' },
        { id: 324, name: 'zkSync Era', rpc: 'https://mainnet.era.zksync.io', symbol: 'ETH', type: 'evm', color: '#8C8DFC', explorer: 'https://explorer.zksync.io' },
        { id: 1101, name: 'Polygon zkEVM', rpc: 'https://zkevm-rpc.com', symbol: 'ETH', type: 'evm', color: '#8247E5', explorer: 'https://zkevm.polygonscan.com' },
        { id: 5700, name: 'Syscoin', rpc: 'https://rpc.syscoin.org', symbol: 'SYS', type: 'evm', color: '#0082C6', explorer: 'https://explorer.syscoin.org' },
        { id: 288, name: 'Boba', rpc: 'https://mainnet.boba.network', symbol: 'ETH', type: 'evm', color: '#CCFF00', explorer: 'https://bobascan.com' },
        { id: 106, name: 'Velas', rpc: 'https://evmexplorer.velas.com/rpc', symbol: 'VLX', type: 'evm', color: '#9D5BFF', explorer: 'https://evmexplorer.velas.com' },
        { id: 888, name: 'Wanchain', rpc: 'https://gwan-ssl.wandevs.org:56891', symbol: 'WAN', type: 'evm', color: '#136A8A', explorer: 'https://www.wanscan.org' },
        { id: 1231, name: 'Ultron', rpc: 'https://ultron-rpc.net', symbol: 'ULX', type: 'evm', color: '#5A4FCF', explorer: 'https://ulxscan.com' },
        { id: 9001, name: 'Evmos', rpc: 'https://eth.bd.evmos.org:8545', symbol: 'EVMOS', type: 'evm', color: '#ED4E33', explorer: 'https://evm.evmos.org' },
        { id: 7700, name: 'Canto', rpc: 'https://canto.gravitychain.io', symbol: 'CANTO', type: 'evm', color: '#06FC99', explorer: 'https://tuber.build' },
        { id: 4200, name: 'Merlin', rpc: 'https://rpc.merlinchain.io', symbol: 'BTC', type: 'evm', color: '#000000', explorer: 'https://scan.merlinchain.io' },
        { id: 81457, name: 'Blast', rpc: 'https://rpc.blast.io', symbol: 'ETH', type: 'evm', color: '#FCFC03', explorer: 'https://blastscan.io' },
        { id: 42793, name: 'Nautilus', rpc: 'https://api.nautilus.nautchain.xyz', symbol: 'ZBC', type: 'evm', color: '#0066FF', explorer: 'https://explorer.nautchain.xyz' },
        { id: 204, name: 'opBNB', rpc: 'https://opbnb-mainnet-rpc.bnbchain.org', symbol: 'BNB', type: 'evm', color: '#F0B90B', explorer: 'https://mainnet.opbnbscan.com' },
        { id: 148, name: 'Shimmer', rpc: 'https://json-rpc.evm.shimmer.network', symbol: 'SMR', type: 'evm', color: '#4400FF', explorer: 'https://explorer.evm.shimmer.network' },
        { id: 5001, name: 'Mantle Testnet', rpc: 'https://rpc.testnet.mantle.xyz', symbol: 'MNT', type: 'evm', color: '#000000', explorer: 'https://explorer.testnet.mantle.xyz' },
        { id: 80001, name: 'Polygon Mumbai', rpc: 'https://rpc-mumbai.maticvigil.com', symbol: 'MATIC', type: 'evm', color: '#8247E5', explorer: 'https://mumbai.polygonscan.com' },
        { id: 97, name: 'BSC Testnet', rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545', symbol: 'tBNB', type: 'evm', color: '#F0B90B', explorer: 'https://testnet.bscscan.com' },
        { id: 5, name: 'Goerli', rpc: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', symbol: 'ETH', type: 'evm', color: '#627EEA', explorer: 'https://goerli.etherscan.io' },
        
        // Non-EVM Networks (10+)
        { id: 'solana', name: 'Solana', rpc: 'https://api.mainnet-beta.solana.com', symbol: 'SOL', type: 'solana', color: '#9945FF', explorer: 'https://explorer.solana.com' },
        { id: 'tron', name: 'Tron', rpc: 'https://api.trongrid.io', symbol: 'TRX', type: 'tron', color: '#FF060A', explorer: 'https://tronscan.org' },
        { id: 'bitcoin', name: 'Bitcoin', rpc: 'https://blockstream.info/api', symbol: 'BTC', type: 'bitcoin', color: '#F7931A', explorer: 'https://blockchain.com' },
        { id: 'litecoin', name: 'Litecoin', rpc: 'https://litecoin.nownodes.io', symbol: 'LTC', type: 'litecoin', color: '#BFBBBB', explorer: 'https://blockchair.com/litecoin' },
        { id: 'dogecoin', name: 'Dogecoin', rpc: 'https://dogecoin.nownodes.io', symbol: 'DOGE', type: 'dogecoin', color: '#C2A633', explorer: 'https://blockchair.com/dogecoin' },
        { id: 'ripple', name: 'Ripple', rpc: 'https://s1.ripple.com:51234', symbol: 'XRP', type: 'ripple', color: '#23292F', explorer: 'https://xrpscan.com' },
        { id: 'cardano', name: 'Cardano', rpc: 'https://cardano-mainnet.blockfrost.io/api/v0', symbol: 'ADA', type: 'cardano', color: '#0033AD', explorer: 'https://cardanoscan.io' },
        { id: 'polkadot', name: 'Polkadot', rpc: 'wss://rpc.polkadot.io', symbol: 'DOT', type: 'polkadot', color: '#E6007A', explorer: 'https://polkadot.subscan.io' },
        { id: 'cosmos', name: 'Cosmos', rpc: 'https://cosmos-rpc.polkachu.com', symbol: 'ATOM', type: 'cosmos', color: '#2E3148', explorer: 'https://www.mintscan.io/cosmos' },
        { id: 'algorand', name: 'Algorand', rpc: 'https://mainnet-api.algonode.cloud', symbol: 'ALGO', type: 'algorand', color: '#000000', explorer: 'https://algoexplorer.io' },
        { id: 'stellar', name: 'Stellar', rpc: 'https://horizon.stellar.org', symbol: 'XLM', type: 'stellar', color: '#08B5E5', explorer: 'https://stellar.expert/explorer/public' },
        { id: 'tezos', name: 'Tezos', rpc: 'https://mainnet.api.tez.ie', symbol: 'XTZ', type: 'tezos', color: '#2C7DF7', explorer: 'https://tzkt.io' },
        { id: 'near', name: 'NEAR', rpc: 'https://rpc.mainnet.near.org', symbol: 'NEAR', type: 'near', color: '#000000', explorer: 'https://explorer.near.org' },
        { id: 'avalanche-c', name: 'Avalanche C-Chain', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', type: 'evm', color: '#E84142', explorer: 'https://snowtrace.io' }
    ],

    // WALLET DEEP LINKS (CORRECTED)
    WALLET_LINKS: {
        metamask: {
            mobile: {
                android: 'https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href),
                ios: 'https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href),
                universal: 'https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href)
            },
            desktop: 'https://metamask.io/download.html',
            extension: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html'
        },
        binance: {
            mobile: {
                android: 'bnblink://wc?uri=' + encodeURIComponent('wc:' + window.crypto.randomUUID() + '@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=123'),
                ios: 'bnblink://wc?uri=' + encodeURIComponent('wc:' + window.crypto.randomUUID() + '@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=123'),
                universal: 'https://www.binance.org/en/download'
            },
            desktop: 'https://www.binance.org/en/download',
            extension: 'chrome-extension://fhbohimaelbohpjbbldcngcnapndodjp/home.html'
        },
        trust: {
            mobile: {
                android: 'trust://browse?url=' + encodeURIComponent(window.location.href),
                ios: 'trust://browse?url=' + encodeURIComponent(window.location.href),
                universal: 'https://link.trustwallet.com/browser?url=' + encodeURIComponent(window.location.href)
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

    // API Configuration
    APIS: {
        COINGECKO: 'https://api.coingecko.com/api/v3',
        DEBANK: 'https://pro-openapi.debank.com/v1',
        MORALIS: 'https://deep-index.moralis.io/api/v2',
        BLOCKPIPER: 'https://api.blockpi.io/v1/rpc',
        QUICKNODE: 'https://api.quicknode.com/graphql'
    }
};

// State Management
let state = {
    wallets: [],
    tokens: [],
    selectedChains: CONFIG.NETWORKS.map(n => n.id).slice(0, 30), // Select first 30 by default
    isScanning: false,
    totalValue: 0,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    scanProgress: { current: 0, total: 0, chain: '' }
};

// ==============================
// ENHANCED WALLET MANAGER
// ==============================

const WalletManager = {
    // Enhanced wallet detection
    detectAllWallets() {
        const wallets = [];
        
        // MetaMask detection (multiple methods)
        if (window.ethereum?.isMetaMask || 
            window.ethereum?.providers?.some(p => p.isMetaMask) ||
            window.web3?.currentProvider?.isMetaMask ||
            (window.ethereum && !window.ethereum.isBraveWallet && !window.ethereum.isTrust)) {
            wallets.push({
                id: 'metamask',
                name: 'MetaMask',
                type: 'evm',
                icon: 'fab fa-metamask',
                color: '#f6851b',
                isInstalled: true
            });
        }
        
        // Binance Wallet detection
        if (window.BinanceChain || window.BSC || window.ethereum?.isBinance) {
            wallets.push({
                id: 'binance',
                name: 'Binance Wallet',
                type: 'evm',
                icon: 'fab fa-binance',
                color: '#F0B90B',
                isInstalled: true
            });
        }
        
        // Trust Wallet detection
        if (window.trustwallet || 
            window.ethereum?.isTrust || 
            window.ethereum?.isTrustWallet ||
            window.ethereum?.providers?.some(p => p.isTrust || p.isTrustWallet)) {
            wallets.push({
                id: 'trust',
                name: 'Trust Wallet',
                type: 'evm',
                icon: 'fas fa-shield-alt',
                color: '#3375bb',
                isInstalled: true
            });
        }
        
        // Phantom detection
        if (window.solana?.isPhantom) {
            wallets.push({
                id: 'phantom',
                name: 'Phantom',
                type: 'solana',
                icon: 'fas fa-ghost',
                color: '#ab9ff2',
                isInstalled: true
            });
        }
        
        // Always show all wallets (for mobile)
        if (state.isMobile || wallets.length === 0) {
            return [
                { id: 'metamask', name: 'MetaMask', type: 'evm', icon: 'fab fa-metamask', color: '#f6851b', isInstalled: state.isMobile },
                { id: 'binance', name: 'Binance Wallet', type: 'evm', icon: 'fab fa-binance', color: '#F0B90B', isInstalled: state.isMobile },
                { id: 'trust', name: 'Trust Wallet', type: 'evm', icon: 'fas fa-shield-alt', color: '#3375bb', isInstalled: state.isMobile },
                { id: 'phantom', name: 'Phantom', type: 'solana', icon: 'fas fa-ghost', color: '#ab9ff2', isInstalled: state.isMobile }
            ];
        }
        
        return wallets;
    },

    // Get proper mobile deep link
    getMobileDeepLink(walletId) {
        if (!state.isMobile) return null;
        
        const walletLinks = CONFIG.WALLET_LINKS[walletId];
        if (!walletLinks) return null;
        
        const userAgent = navigator.userAgent.toLowerCase();
        let link;
        
        if (userAgent.includes('android')) {
            link = walletLinks.mobile.android;
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            link = walletLinks.mobile.ios;
        } else {
            link = walletLinks.mobile.universal;
        }
        
        // Add timeout redirect
        setTimeout(() => {
            if (!document.hidden) {
                window.location.href = walletLinks.desktop;
            }
        }, 2500);
        
        return link;
    },

    // Enhanced connection handler
    async connectWallet(walletId) {
        console.log(`🔌 Connecting ${walletId}...`);
        
        try {
            // Handle mobile redirect
            if (state.isMobile) {
                const deepLink = this.getMobileDeepLink(walletId);
                if (deepLink) {
                    localStorage.setItem('pendingWallet', walletId);
                    localStorage.setItem('pendingWalletTime', Date.now());
                    window.location.href = deepLink;
                    return null;
                }
            }
            
            // Desktop connection
            let wallet;
            switch(walletId) {
                case 'metamask':
                    wallet = await this.connectMetaMask();
                    break;
                case 'binance':
                    wallet = await this.connectBinance();
                    break;
                case 'trust':
                    wallet = await this.connectTrust();
                    break;
                case 'phantom':
                    wallet = await this.connectPhantom();
                    break;
                default:
                    throw new Error('Unsupported wallet');
            }
            
            console.log(`✅ Connected: ${wallet.name} - ${wallet.address}`);
            return wallet;
            
        } catch (error) {
            console.error(`❌ ${walletId} connection failed:`, error);
            throw error;
        }
    },

    // MetaMask connection (Robust)
    async connectMetaMask() {
        let provider = window.ethereum;
        
        // Find MetaMask in providers array
        if (provider?.providers) {
            provider = provider.providers.find(p => p.isMetaMask) || provider;
        }
        
        if (!provider) {
            // Try legacy web3
            if (window.web3?.currentProvider) {
                provider = window.web3.currentProvider;
            } else {
                throw new Error('MetaMask not detected. Please install MetaMask.');
            }
        }
        
        try {
            // Request accounts with timeout
            const accounts = await Promise.race([
                provider.request({ method: 'eth_requestAccounts' }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection timeout')), 10000)
                )
            ]);
            
            if (!accounts?.[0]) throw new Error('No accounts found');
            
            const chainId = await provider.request({ method: 'eth_chainId' });
            
            return {
                address: accounts[0],
                chainId: parseInt(chainId, 16),
                type: 'evm',
                name: 'MetaMask',
                icon: 'fab fa-metamask',
                color: '#f6851b',
                provider: provider,
                walletType: 'metamask'
            };
        } catch (error) {
            if (error.code === 4001) {
                throw new Error('MetaMask connection rejected');
            }
            throw error;
        }
    },

    // Binance Wallet connection (Robust)
    async connectBinance() {
        let provider = window.BinanceChain || window.BSC;
        
        if (!provider && window.ethereum?.isBinance) {
            provider = window.ethereum;
        }
        
        if (!provider) {
            throw new Error('Binance Wallet not detected. Please install Binance Wallet.');
        }
        
        try {
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (!accounts?.[0]) throw new Error('No accounts found');
            
            const chainId = await provider.request({ method: 'eth_chainId' });
            
            return {
                address: accounts[0],
                chainId: parseInt(chainId, 16),
                type: 'evm',
                name: 'Binance Wallet',
                icon: 'fab fa-binance',
                color: '#F0B90B',
                provider: provider,
                walletType: 'binance'
            };
        } catch (error) {
            if (error.code === 4001) {
                throw new Error('Binance Wallet connection rejected');
            }
            throw error;
        }
    },

    // Trust Wallet connection (Robust)
    async connectTrust() {
        let provider = window.trustwallet;
        
        if (!provider && window.ethereum?.isTrust) {
            provider = window.ethereum;
        }
        
        if (!provider && window.ethereum?.providers) {
            provider = window.ethereum.providers.find(p => p.isTrust || p.isTrustWallet);
        }
        
        if (!provider) {
            // Fallback to generic ethereum
            provider = window.ethereum;
        }
        
        if (!provider) {
            throw new Error('Trust Wallet not detected');
        }
        
        try {
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (!accounts?.[0]) throw new Error('No accounts found');
            
            const chainId = await provider.request({ method: 'eth_chainId' });
            
            return {
                address: accounts[0],
                chainId: parseInt(chainId, 16),
                type: 'evm',
                name: 'Trust Wallet',
                icon: 'fas fa-shield-alt',
                color: '#3375bb',
                provider: provider,
                walletType: 'trust'
            };
        } catch (error) {
            if (error.code === 4001) {
                throw new Error('Trust Wallet connection rejected');
            }
            throw error;
        }
    },

    // Phantom connection (Robust)
    async connectPhantom() {
        if (!window.solana?.isPhantom) {
            throw new Error('Phantom wallet not detected. Please install Phantom.');
        }
        
        try {
            const { publicKey } = await window.solana.connect();
            
            return {
                address: publicKey.toString(),
                chainId: 'solana',
                type: 'solana',
                name: 'Phantom',
                icon: 'fas fa-ghost',
                color: '#ab9ff2',
                provider: window.solana,
                walletType: 'phantom'
            };
        } catch (error) {
            if (error.code === 4001) {
                throw new Error('Phantom connection rejected');
            }
            throw error;
        }
    }
};

// ==============================
// ADVANCED TOKEN SCANNER (50+ NETWORKS)
// ==============================

const TokenScanner = {
    async scanWallet(wallet) {
        console.log(`🚀 Starting deep scan for ${wallet.name}...`);
        
        const results = {
            wallet: wallet,
            chainBalances: [],
            allTokens: [],
            totalValue: 0,
            scanTime: Date.now(),
            networksScanned: 0,
            tokensFound: 0
        };
        
        state.isScanning = true;
        state.scanProgress.total = state.selectedChains.length;
        
        try {
            // Scan based on wallet type
            if (wallet.type === 'evm') {
                await this.scanEVMWallet(wallet, results);
            } else if (wallet.type === 'solana') {
                await this.scanSolanaWallet(wallet, results);
            } else if (wallet.type === 'tron') {
                await this.scanTronWallet(wallet, results);
            }
            
            // Calculate totals
            results.totalValue = results.allTokens.reduce((sum, token) => sum + (token.value || 0), 0);
            results.tokensFound = results.allTokens.length;
            
            console.log(`✅ Scan complete: ${results.networksScanned} networks, ${results.tokensFound} tokens, $${results.totalValue.toFixed(2)}`);
            
            return results;
            
        } catch (error) {
            console.error('Scan error:', error);
            return results;
        } finally {
            state.isScanning = false;
            UI.hideLoading();
        }
    },

    async scanEVMWallet(wallet, results) {
        const evmNetworks = CONFIG.NETWORKS.filter(n => n.type === 'evm' && state.selectedChains.includes(n.id));
        
        for (const network of evmNetworks) {
            state.scanProgress.current++;
            state.scanProgress.chain = network.name;
            UI.updateScanProgress();
            
            try {
                console.log(`📡 Scanning ${network.name}...`);
                
                // Scan native balance
                const nativeResult = await this.scanEVMMative(wallet.address, network);
                if (nativeResult) {
                    results.chainBalances.push(nativeResult.chainResult);
                    results.allTokens.push(...nativeResult.tokens);
                    results.networksScanned++;
                }
                
                // Scan ERC20 tokens (with retry logic)
                try {
                    const erc20Tokens = await this.scanERC20Tokens(wallet.address, network);
                    if (erc20Tokens.length > 0) {
                        results.allTokens.push(...erc20Tokens);
                        results.tokensFound += erc20Tokens.length;
                    }
                } catch (tokenError) {
                    console.log(`Token scan skipped for ${network.name}:`, tokenError.message);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                console.log(`⚠️ Network ${network.name} scan failed:`, error.message);
            }
        }
    },

    async scanEVMMative(address, network) {
        try {
            // Get native balance
            const balance = await this.getEVMBalance(address, network.rpc);
            if (balance === 0 && !state.scanAll) return null;
            
            // Get price
            const price = await this.getTokenPrice(network.symbol);
            const value = balance * price;
            
            const token = {
                address: 'native',
                symbol: network.symbol,
                name: `${network.name} Native`,
                balance: balance.toFixed(8),
                decimals: 18,
                price: price,
                value: value,
                chain: network.name,
                chainId: network.id,
                type: 'native',
                logo: this.getTokenLogo(network.symbol)
            };
            
            const chainResult = {
                chain: network,
                nativeBalance: {
                    symbol: network.symbol,
                    balance: balance.toFixed(8),
                    price: price,
                    value: value
                },
                tokens: [],
                totalValue: value
            };
            
            return { chainResult, tokens: [token] };
            
        } catch (error) {
            console.error(`Native balance error on ${network.name}:`, error);
            return null;
        }
    },

    async scanERC20Tokens(address, network) {
        const tokens = [];
        
        try {
            // Use multiple methods to get tokens
            
            // Method 1: Try Debank API for popular networks
            if ([1, 56, 137, 42161, 10, 43114].includes(network.id)) {
                const debankTokens = await this.getDebankTokens(address, network.id);
                tokens.push(...debankTokens);
            }
            
            // Method 2: Try Covalent API
            const covalentTokens = await this.getCovalentTokens(address, network.id);
            tokens.push(...covalentTokens);
            
            // Method 3: Check common tokens
            const commonTokens = await this.getCommonTokens(address, network);
            tokens.push(...commonTokens);
            
            // Filter duplicates and zero balances
            const uniqueTokens = this.filterUniqueTokens(tokens);
            return uniqueTokens.filter(t => t.balance > 0);
            
        } catch (error) {
            console.log(`ERC20 scan failed for ${network.name}:`, error.message);
            return [];
        }
    },

    async getDebankTokens(address, chainId) {
        try {
            const chainMap = {
                1: 'eth', 56: 'bsc', 137: 'matic', 42161: 'arb',
                10: 'op', 43114: 'avax', 250: 'ftm', 42220: 'celo'
            };
            
            const chainName = chainMap[chainId];
            if (!chainName) return [];
            
            // Note: Debank requires API key in production
            const response = await fetch(`https://openapi.debank.com/v1/user/token_list?id=${address}&chain_id=${chainName}`);
            const data = await response.json();
            
            return data.map(token => ({
                address: token.id,
                symbol: token.symbol || 'UNKNOWN',
                name: token.name || 'Unknown Token',
                balance: token.amount || 0,
                decimals: token.decimals || 18,
                price: token.price || 0,
                value: (token.amount || 0) * (token.price || 0),
                chain: CONFIG.NETWORKS.find(n => n.id === chainId)?.name || 'Unknown',
                type: 'erc20',
                logo: token.logo_url
            })).filter(t => t.balance > 0);
            
        } catch (error) {
            return [];
        }
    },

    async getCovalentTokens(address, chainId) {
        try {
            // Note: Covalent requires API key
            const apiKey = 'ckey_XXXX'; // Replace with your API key
            const response = await fetch(
                `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?key=${apiKey}`
            );
            
            const data = await response.json();
            return data.data.items.map(item => ({
                address: item.contract_address,
                symbol: item.contract_ticker_symbol,
                name: item.contract_name,
                balance: item.balance / Math.pow(10, item.contract_decimals),
                decimals: item.contract_decimals,
                price: item.quote_rate || 0,
                value: item.quote || 0,
                chain: CONFIG.NETWORKS.find(n => n.id === chainId)?.name || 'Unknown',
                type: 'erc20',
                logo: item.logo_url
            })).filter(t => t.balance > 0);
            
        } catch (error) {
            return [];
        }
    },

    async getCommonTokens(address, network) {
        const tokens = [];
        const commonTokenLists = this.getCommonTokenList(network.id);
        
        for (const tokenInfo of commonTokenLists) {
            try {
                const balance = await this.getTokenBalance(address, tokenInfo.address, network.rpc, tokenInfo.decimals);
                if (balance > 0) {
                    const price = await this.getTokenPrice(tokenInfo.symbol);
                    const value = balance * price;
                    
                    tokens.push({
                        address: tokenInfo.address,
                        symbol: tokenInfo.symbol,
                        name: tokenInfo.name,
                        balance: balance.toFixed(8),
                        decimals: tokenInfo.decimals,
                        price: price,
                        value: value,
                        chain: network.name,
                        type: 'erc20',
                        logo: this.getTokenLogo(tokenInfo.symbol)
                    });
                }
            } catch (error) {
                // Skip this token
            }
        }
        
        return tokens;
    },

    getCommonTokenList(chainId) {
        const tokenLists = {
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
        
        return tokenLists[chainId] || [];
    },

    async scanSolanaWallet(wallet, results) {
        const solanaNetwork = CONFIG.NETWORKS.find(n => n.id === 'solana');
        if (!solanaNetwork || !state.selectedChains.includes('solana')) return;
        
        state.scanProgress.chain = 'Solana';
        UI.updateScanProgress();
        
        try {
            // Get SOL balance
            const solBalance = await this.getSolanaBalance(wallet.address);
            const solPrice = await this.getTokenPrice('SOL');
            const solValue = solBalance * solPrice;
            
            if (solBalance > 0) {
                const solToken = {
                    address: 'native',
                    symbol: 'SOL',
                    name: 'Solana',
                    balance: solBalance.toFixed(8),
                    decimals: 9,
                    price: solPrice,
                    value: solValue,
                    chain: 'Solana',
                    type: 'native',
                    logo: this.getTokenLogo('SOL')
                };
                
                const chainResult = {
                    chain: solanaNetwork,
                    nativeBalance: {
                        symbol: 'SOL',
                        balance: solBalance.toFixed(8),
                        price: solPrice,
                        value: solValue
                    },
                    tokens: [],
                    totalValue: solValue
                };
                
                results.chainBalances.push(chainResult);
                results.allTokens.push(solToken);
                results.networksScanned++;
                
                // Get SPL tokens
                try {
                    const splTokens = await this.getSPLTokens(wallet.address);
                    results.allTokens.push(...splTokens);
                    results.tokensFound += splTokens.length;
                } catch (splError) {
                    console.log('SPL tokens scan skipped:', splError.message);
                }
            }
            
        } catch (error) {
            console.error('Solana scan error:', error);
        }
    },

    async getSPLTokens(address) {
        try {
            const response = await fetch('https://api.mainnet-beta.solana.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getTokenAccountsByOwner',
                    params: [
                        address,
                        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
                        { encoding: 'jsonParsed' }
                    ]
                })
            });
            
            const data = await response.json();
            const tokens = [];
            
            for (const item of data.result?.value || []) {
                const amount = item.account.data.parsed.info.tokenAmount;
                if (amount.uiAmount > 0) {
                    const tokenInfo = await this.getSolanaTokenInfo(item.account.data.parsed.info.mint);
                    const price = await this.getTokenPrice(tokenInfo.symbol);
                    const value = amount.uiAmount * price;
                    
                    tokens.push({
                        address: item.account.data.parsed.info.mint,
                        symbol: tokenInfo.symbol,
                        name: tokenInfo.name,
                        balance: amount.uiAmount.toFixed(8),
                        decimals: amount.decimals,
                        price: price,
                        value: value,
                        chain: 'Solana',
                        type: 'spl',
                        logo: tokenInfo.logo
                    });
                }
            }
            
            return tokens;
        } catch (error) {
            console.error('SPL tokens error:', error);
            return [];
        }
    },

    async getSolanaTokenInfo(mintAddress) {
        // Basic token info - in production, use Token List API
        const knownTokens = {
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' }
        };
        
        return knownTokens[mintAddress] || { symbol: 'UNKNOWN', name: 'Unknown Token', logo: '' };
    },

    async scanTronWallet(wallet, results) {
        // Tron scanning logic
        // Note: Tron requires different address format
    },

    // Utility functions
    async getEVMBalance(address, rpcUrl) {
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
            console.error('EVM balance error:', error);
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

    async getTokenBalance(walletAddress, tokenAddress, rpcUrl, decimals = 18) {
        try {
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
            if (Date.now() - data.timestamp < 300000) {
                return data.price;
            }
        }
        
        try {
            const coinId = this.getCoinId(symbol);
            const response = await fetch(`${CONFIG.APIS.COINGECKO}/simple/price?ids=${coinId}&vs_currencies=usd`);
            
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
            console.log(`Price API failed for ${symbol}`);
        }
        
        // Fallback prices
        const fallbackPrices = {
            'ETH': 2500, 'BNB': 300, 'MATIC': 0.8, 'SOL': 100, 'AVAX': 30,
            'FTM': 0.3, 'TRX': 0.1, 'BTC': 45000, 'USDT': 1, 'USDC': 1,
            'DAI': 1, 'BUSD': 1, 'HT': 2, 'KCS': 10, 'CRO': 0.1
        };
        
        return fallbackPrices[symbol.toUpperCase()] || 1;
    },

    getCoinId(symbol) {
        const mapping = {
            'ETH': 'ethereum', 'BNB': 'binancecoin', 'MATIC': 'matic-network',
            'SOL': 'solana', 'AVAX': 'avalanche-2', 'FTM': 'fantom',
            'TRX': 'tron', 'BTC': 'bitcoin', 'USDT': 'tether',
            'USDC': 'usd-coin', 'DAI': 'dai', 'BUSD': 'binance-usd',
            'HT': 'huobi-token', 'KCS': 'kucoin-shares', 'CRO': 'crypto-com-chain'
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
    },

    filterUniqueTokens(tokens) {
        const seen = new Set();
        return tokens.filter(token => {
            const key = `${token.chain}-${token.address}-${token.symbol}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
};

// ==============================
// COMPLETE UI MANAGER
// ==============================

const UI = {
    init() {
        this.renderWalletButtons();
        this.renderChainSelector();
        this.setupEventListeners();
        this.checkMobileReturn();
    },

    renderWalletButtons() {
        const container = document.getElementById('walletGrid');
        if (!container) return;
        
        const wallets = WalletManager.detectAllWallets();
        
        container.innerHTML = wallets.map(wallet => {
            const isInstalled = wallet.isInstalled || state.isMobile;
            const statusText = state.isMobile ? 'Tap to open in app' : 
                             isInstalled ? 'Click to connect' : 'Install extension';
            
            return `
                <div class="wallet-card ${wallet.id}" onclick="handleWalletClick('${wallet.id}')">
                    <i class="${wallet.icon}" style="color: ${wallet.color};"></i>
                    <h3>${wallet.name}</h3>
                    <p>${statusText}</p>
                    ${!isInstalled && !state.isMobile ? 
                        `<div class="install-note">
                            <a href="${CONFIG.WALLET_LINKS[wallet.id]?.desktop || '#'}" 
                               target="_blank" 
                               onclick="event.stopPropagation()">
                                <i class="fas fa-download"></i> Install
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
        
        // Group networks by type
        const evmNetworks = CONFIG.NETWORKS.filter(n => n.type === 'evm');
        const nonEVMNetworks = CONFIG.NETWORKS.filter(n => n.type !== 'evm');
        
        let html = '<h4>EVM Networks</h4><div class="chains-grid">';
        
        evmNetworks.forEach(network => {
            const isSelected = state.selectedChains.includes(network.id);
            html += `
                <label class="chain-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="toggleChain(${network.id})">
                    <span class="chain-name" style="color: ${network.color}">
                        <i class="fas fa-circle" style="color: ${network.color}"></i>
                        ${network.name}
                    </span>
                </label>
            `;
        });
        
        html += '</div><h4>Non-EVM Networks</h4><div class="chains-grid">';
        
        nonEVMNetworks.forEach(network => {
            const isSelected = state.selectedChains.includes(network.id);
            html += `
                <label class="chain-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="toggleChain('${network.id}')">
                    <span class="chain-name" style="color: ${network.color}">
                        <i class="fas fa-circle" style="color: ${network.color}"></i>
                        ${network.name}
                    </span>
                </label>
            `;
        });
        
        html += '</div>';
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
            <div class="wallet-chip" style="border-left: 4px solid ${wallet.color}">
                <i class="${wallet.icon}"></i>
                <span class="wallet-info">
                    <strong>${wallet.name}</strong>
                    <span class="wallet-address">${this.formatAddress(wallet.address)}</span>
                </span>
                <button class="remove-btn" onclick="disconnectWallet('${wallet.address}')" title="Disconnect">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Show connected sections
        this.showSection('chainsSection');
        this.showSection('connectedSection');
    },

    renderScanResults(wallet, scanResults) {
        const container = document.getElementById('walletDetails');
        if (!container) return;
        
        if (!scanResults || scanResults.allTokens.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No assets found</h3>
                    <p>Try scanning different chains or check your wallet balance</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="scan-results">
                <div class="results-header">
                    <div>
                        <h3><i class="fas fa-wallet"></i> ${wallet.name}</h3>
                        <p class="wallet-address">${this.formatAddress(wallet.address)}</p>
                    </div>
                    <div class="total-value">
                        <span class="value">$${scanResults.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <span class="label">Total Value</span>
                    </div>
                </div>
                
                <div class="networks-summary">
                    <div class="summary-item">
                        <i class="fas fa-network-wired"></i>
                        <div>
                            <span class="count">${scanResults.networksScanned}</span>
                            <span class="label">Networks</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <i class="fas fa-coins"></i>
                        <div>
                            <span class="count">${scanResults.tokensFound}</span>
                            <span class="label">Tokens</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <span class="count">${Math.round((Date.now() - scanResults.scanTime) / 1000)}s</span>
                            <span class="label">Scan Time</span>
                        </div>
                    </div>
                </div>
        `;
        
        // Group tokens by chain
        const tokensByChain = {};
        scanResults.allTokens.forEach(token => {
            if (!tokensByChain[token.chain]) {
                tokensByChain[token.chain] = [];
            }
            tokensByChain[token.chain].push(token);
        });
        
        // Render chain sections
        Object.entries(tokensByChain).forEach(([chainName, tokens]) => {
            const chainValue = tokens.reduce((sum, token) => sum + token.value, 0);
            const chain = CONFIG.NETWORKS.find(n => n.name === chainName);
            
            html += `
                <div class="chain-section">
                    <div class="chain-header" style="border-left-color: ${chain?.color || '#666'}">
                        <div class="chain-title">
                            <h4>${chainName}</h4>
                            <span class="chain-value">$${chainValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <span class="token-count">${tokens.length} token${tokens.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="tokens-list">
            `;
            
            tokens.forEach(token => {
                html += `
                    <div class="token-item">
                        <div class="token-icon" style="background: ${this.getTokenColor(token.symbol)}">
                            ${token.symbol.substring(0, 3)}
                        </div>
                        <div class="token-info">
                            <div class="token-symbol">${token.symbol}</div>
                            <div class="token-name">${token.name}</div>
                        </div>
                        <div class="token-balance">${token.balance}</div>
                        <div class="token-value">$${token.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
        
        // Also update tokens table
        this.renderAllTokens();
        this.showSection('scanResults');
        this.showSection('tokensSection');
    },

    renderAllTokens() {
        const tokensBody = document.getElementById('tokensBody');
        const totalValueEl = document.getElementById('totalValue');
        
        if (!tokensBody || !totalValueEl) return;
        
        // Combine all tokens from all wallets
        const allTokens = [];
        let totalValue = 0;
        
        state.wallets.forEach(wallet => {
            if (wallet.scanResults?.allTokens) {
                allTokens.push(...wallet.scanResults.allTokens);
                totalValue += wallet.scanResults.totalValue || 0;
            }
        });
        
        state.totalValue = totalValue;
        totalValueEl.textContent = `Total Value: $${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        if (allTokens.length === 0) {
            tokensBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-tokens">
                        <i class="fas fa-coins"></i>
                        <div>No tokens found yet. Connect and scan a wallet.</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort by value descending
        allTokens.sort((a, b) => b.value - a.value);
        
        tokensBody.innerHTML = allTokens.map(token => `
            <tr class="token-row">
                <td>
                    <div class="token-info">
                        <div class="token-icon" style="background: ${this.getTokenColor(token.symbol)}">
                            ${token.symbol.substring(0, 3)}
                        </div>
                        <div>
                            <div class="token-symbol">${token.symbol}</div>
                            <div class="token-name">${token.name}</div>
                        </div>
                    </div>
                </td>
                <td class="token-balance">${token.balance}</td>
                <td>$${token.price ? token.price.toFixed(4) : '0.0000'}</td>
                <td class="token-value">$${token.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>
                    <span class="token-chain">${token.chain}</span>
                </td>
            </tr>
        `).join('');
    },

    updateScanProgress() {
        const progress = state.scanProgress;
        if (progress.total > 0) {
            const percent = Math.round((progress.current / progress.total) * 100);
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.innerHTML = `
                    Scanning ${progress.chain}...<br>
                    <small>${progress.current} of ${progress.total} networks (${percent}%)</small>
                `;
            }
        }
    },

    formatAddress(address) {
        if (!address) return '';
        if (address.length <= 12) return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },

    getTokenColor(symbol) {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];
        const index = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
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
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    showLoading(message) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        if (loadingText) loadingText.textContent = message;
    },

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    },

    showSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) element.classList.remove('hidden');
    },

    hideSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) element.classList.add('hidden');
    },

    updateNetworkStatus() {
        const status = document.getElementById('networkStatus');
        if (!status) return;
        
        const dot = status.querySelector('.status-dot');
        const text = status.querySelector('span:last-child');
        
        if (state.wallets.length > 0) {
            dot.style.background = '#10b981';
            text.textContent = `${state.wallets.length} Wallet${state.wallets.length > 1 ? 's' : ''} Connected`;
        } else {
            dot.style.background = '#ef4444';
            text.textContent = 'Not Connected';
        }
    },

    setupEventListeners() {
        // Add click handlers for wallet cards
        document.addEventListener('click', (e) => {
            const walletCard = e.target.closest('.wallet-card');
            if (walletCard) {
                const walletId = Array.from(walletCard.classList)
                    .find(cls => ['metamask', 'binance', 'trust', 'phantom'].includes(cls));
                if (walletId) handleWalletClick(walletId);
            }
        });
    },

    checkMobileReturn() {
        if (!state.isMobile) return;
        
        const pendingWallet = localStorage.getItem('pendingWallet');
        if (pendingWallet) {
            localStorage.removeItem('pendingWallet');
            UI.showToast(`Returned from ${pendingWallet}. Please connect via the app.`, 'info');
        }
    }
};

// ==============================
// MAIN APPLICATION FUNCTIONS
// ==============================

async function handleWalletClick(walletId) {
    console.log(`🔄 Handling ${walletId} connection...`);
    
    if (state.isMobile) {
        // On mobile, use deep link
        const deepLink = WalletManager.getMobileDeepLink(walletId);
        if (deepLink) {
            localStorage.setItem('pendingWallet', walletId);
            localStorage.setItem('pendingWalletTime', Date.now());
            window.location.href = deepLink;
        } else {
            UI.showToast('Could not open wallet app', 'error');
        }
        return;
    }
    
    // On desktop, connect via JavaScript
    await connectWallet(walletId);
}

async function connectWallet(walletId) {
    UI.showLoading(`Connecting ${walletId}...`);
    
    try {
        const wallet = await WalletManager.connectWallet(walletId);
        
        if (!wallet) {
            UI.hideLoading();
            return; // Mobile redirect happened
        }
        
        // Check if already connected
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
        
        // Auto-scan if chains are selected
        if (state.selectedChains.length > 0) {
            await scanWallet(wallet);
        }
        
        UI.hideLoading();
        
    } catch (error) {
        UI.hideLoading();
        console.error('Connection error:', error);
        
        // Provide helpful error messages
        let errorMessage = error.message;
        if (errorMessage.includes('not detected') || errorMessage.includes('not found')) {
            const walletName = walletId.charAt(0).toUpperCase() + walletId.slice(1);
            errorMessage = `${walletName} not detected. Please install the extension or use mobile app.`;
            
            // Show install link for desktop
            if (!state.isMobile && CONFIG.WALLET_LINKS[walletId]?.desktop) {
                setTimeout(() => {
                    if (confirm(`Would you like to install ${walletName}?`)) {
                        window.open(CONFIG.WALLET_LINKS[walletId].desktop, '_blank');
                    }
                }, 1000);
            }
        }
        
        UI.showToast(errorMessage, 'error');
    }
}

async function scanWallet(wallet) {
    if (!wallet || state.selectedChains.length === 0) {
        UI.showToast('No chains selected for scanning', 'warning');
        return;
    }
    
    UI.showLoading(`Preparing to scan ${state.selectedChains.length} networks...`);
    
    try {
        const scanResults = await TokenScanner.scanWallet(wallet);
        
        // Update wallet with results
        const walletIndex = state.wallets.findIndex(w => w.address === wallet.address);
        if (walletIndex !== -1) {
            state.wallets[walletIndex].scanResults = scanResults;
        }
        
        // Update UI
        UI.renderScanResults(wallet, scanResults);
        
        UI.showToast(
            `Scanned ${scanResults.networksScanned} networks, found ${scanResults.tokensFound} tokens worth $${scanResults.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            'success'
        );
        
    } catch (error) {
        console.error('Scan error:', error);
        UI.showToast(`Scan failed: ${error.message}`, 'error');
    }
}

async function scanAllSelectedChains() {
    if (state.wallets.length === 0) {
        UI.showToast('No wallets connected', 'warning');
        return;
    }
    
    if (state.selectedChains.length === 0) {
        UI.showToast('No chains selected', 'warning');
        return;
    }
    
    UI.showLoading(`Scanning ${state.wallets.length} wallet(s) across ${state.selectedChains.length} networks...`);
    
    try {
        for (const wallet of state.wallets) {
            await scanWallet(wallet);
        }
        UI.showToast('All wallets scanned successfully!', 'success');
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
        UI.showToast(`${chainId} added to scan list`, 'info');
    } else {
        state.selectedChains.splice(index, 1);
        UI.showToast(`${chainId} removed from scan list`, 'info');
    }
    
    // Save selection
    localStorage.setItem('selectedChains', JSON.stringify(state.selectedChains));
    UI.renderChainSelector();
}

function selectAllChains() {
    state.selectedChains = CONFIG.NETWORKS.map(n => n.id);
    localStorage.setItem('selectedChains', JSON.stringify(state.selectedChains));
    UI.renderChainSelector();
    UI.showToast('All chains selected for scanning', 'success');
}

function deselectAllChains() {
    state.selectedChains = [];
    localStorage.setItem('selectedChains', JSON.stringify(state.selectedChains));
    UI.renderChainSelector();
    UI.showToast('All chains deselected', 'info');
}

function disconnectWallet(address) {
    state.wallets = state.wallets.filter(w => w.address !== address);
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
    
    if (state.totalValue === 0) {
        UI.showToast('No assets found to sign', 'warning');
        return;
    }
    
    UI.showLoading('Signing authorization message...');
    
    try {
        const signatures = [];
        
        for (const wallet of state.wallets) {
            try {
                const message = `Authorize MultiChain Scanner Access\n\n` +
                              `Wallet: ${wallet.address}\n` +
                              `Total Portfolio Value: $${state.totalValue.toFixed(2)}\n` +
                              `Networks: ${state.selectedChains.length}\n` +
                              `Timestamp: ${new Date().toISOString()}\n` +
                              `Nonce: ${Math.random().toString(36).substring(2, 15)}`;
                
                let signature;
                
                if (wallet.type === 'evm') {
                    signature = await wallet.provider.request({
                        method: 'personal_sign',
                        params: [message, wallet.address]
                    });
                } else if (wallet.type === 'solana') {
                    const encodedMessage = new TextEncoder().encode(message);
                    const signed = await wallet.provider.signMessage(encodedMessage);
                    signature = Array.from(signed.signature)
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');
                }
                
                signatures.push({
                    wallet: wallet.walletType,
                    address: wallet.address,
                    signature: signature,
                    message: message
                });
                
                UI.showToast(`${wallet.name} signed successfully`, 'success');
                
            } catch (signError) {
                console.error(`${wallet.name} sign error:`, signError);
                UI.showToast(`${wallet.name} sign failed: ${signError.message}`, 'warning');
            }
        }
        
        // Store signatures
        localStorage.setItem('walletSignatures', JSON.stringify(signatures));
        
        // Update UI
        document.getElementById('signatureStatus').innerHTML = `
            <div class="signed-status">
                <i class="fas fa-check-circle" style="color: #10b981;"></i>
                <div>
                    <strong>All wallets authorized!</strong>
                    <small>${signatures.length} signature${signatures.length !== 1 ? 's' : ''} stored</small>
                </div>
            </div>
        `;
        
        UI.showSection('authSection');
        UI.hideLoading();
        UI.showToast('All wallets authorized successfully!', 'success');
        
    } catch (error) {
        UI.hideLoading();
        UI.showToast(`Authorization failed: ${error.message}`, 'error');
    }
}

async function triggerBackend() {
    if (state.wallets.length === 0) {
        UI.showToast('No wallets connected', 'warning');
        return;
    }
    
    UI.showLoading('Sending data to backend API...');
    
    try {
        // Prepare backend data
        const backendData = {
            timestamp: new Date().toISOString(),
            sessionId: 'session_' + Date.now(),
            wallets: state.wallets.map(wallet => ({
                type: wallet.walletType,
                address: wallet.address,
                chainId: wallet.chainId,
                scanResults: wallet.scanResults ? {
                    totalValue: wallet.scanResults.totalValue,
                    networksScanned: wallet.scanResults.networksScanned,
                    tokensFound: wallet.scanResults.tokensFound,
                    scanTime: wallet.scanResults.scanTime
                } : null
            })),
            portfolio: {
                totalValue: state.totalValue,
                selectedNetworks: state.selectedChains.length,
                scanTimestamp: Date.now()
            },
            signatures: JSON.parse(localStorage.getItem('walletSignatures') || '[]'),
            metadata: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                isMobile: state.isMobile
            }
        };
        
        console.log('📤 Backend Payload:', backendData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In production, you would do:
        // const response = await fetch('https://your-backend-api.com/process', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(backendData)
        // });
        
        UI.hideLoading();
        
        // Show success
        document.getElementById('signatureStatus').innerHTML = `
            <div class="backend-success">
                <i class="fas fa-rocket" style="color: #3b82f6;"></i>
                <div>
                    <strong>Backend API Triggered Successfully!</strong>
                    <small>Data processed and ready for transactions</small>
                </div>
            </div>
            <div class="backend-data">
                <pre>${JSON.stringify(backendData, null, 2)}</pre>
            </div>
        `;
        
        UI.showToast('Backend processing complete! Ready for transactions.', 'success');
        
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
        exportDate: new Date().toISOString(),
        wallets: state.wallets,
        portfolio: {
            totalValue: state.totalValue,
            selectedNetworks: state.selectedChains
        },
        scanResults: state.wallets.map(w => w.scanResults).filter(r => r)
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `multichain-portfolio-${Date.now()}.json`;
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    UI.showToast('Portfolio data exported successfully!', 'success');
}

function showHelp() {
    const helpContent = `
        <div class="help-modal">
            <h3><i class="fas fa-question-circle"></i> How to Use</h3>
            <div class="help-steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div>
                        <strong>Connect Wallet</strong>
                        <p>Click any wallet to connect. On mobile, it will open the wallet app.</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div>
                        <strong>Select Networks</strong>
                        <p>Choose which networks to scan (50+ available).</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div>
                        <strong>Scan Assets</strong>
                        <p>Click "Scan All Selected Chains" to find all tokens across networks.</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div>
                        <strong>Authorize</strong>
                        <p>Sign the message to authorize backend access.</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">5</div>
                    <div>
                        <strong>Trigger Backend</strong>
                        <p>Send data to backend API for processing.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = helpContent;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

// ==============================
// INITIALIZATION
// ==============================

// Expose functions to global scope
window.handleWalletClick = handleWalletClick;
window.connectWallet = connectWallet;
window.scanWallet = scanWallet;
window.scanAllSelectedChains = scanAllSelectedChains;
window.rescanWallet = rescanWallet;
window.toggleChain = toggleChain;
window.selectAllChains = selectAllChains;
window.deselectAllChains = deselectAllChains;
window.disconnectWallet = disconnectWallet;
window.disconnectAllWallets = disconnectAllWallets;
window.signForBackend = signForBackend;
window.triggerBackend = triggerBackend;
window.exportData = exportData;
window.showHelp = showHelp;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Advanced MultiChain Scanner Initialized');
    
    // Load saved settings
    const savedChains = localStorage.getItem('selectedChains');
    if (savedChains) {
        try {
            state.selectedChains = JSON.parse(savedChains);
        } catch (e) {
            console.log('Failed to load saved chains');
        }
    }
    
    // Initialize UI
    UI.init();
    
    // Check for mobile return
    const pendingWallet = localStorage.getItem('pendingWallet');
    const pendingTime = localStorage.getItem('pendingWalletTime');
    
    if (pendingWallet && pendingTime && (Date.now() - pendingTime < 30000)) {
        localStorage.removeItem('pendingWallet');
        localStorage.removeItem('pendingWalletTime');
        UI.showToast(`Returned from ${pendingWallet}. Please complete connection in the app.`, 'info');
    }
    
    // Setup wallet event listeners
    if (!state.isMobile) {
        // Listen for MetaMask/Trust Wallet changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Accounts changed:', accounts);
                if (accounts.length === 0) {
                    disconnectAllWallets();
                } else {
                    // Check if current wallets still exist
                    state.wallets = state.wallets.filter(wallet => {
                        if (wallet.type === 'evm') {
                            return accounts.some(acc => acc.toLowerCase() === wallet.address.toLowerCase());
                        }
                        return true;
                    });
                    UI.renderConnectedWallets();
                }
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Chain changed to:', chainId);
                UI.showToast('Network changed. Please rescan if needed.', 'info');
            });
        }
        
        // Listen for Binance Chain changes
        if (window.BinanceChain) {
            window.BinanceChain.on('accountsChanged', (accounts) => {
                console.log('Binance accounts changed:', accounts);
                UI.showToast('Binance Wallet accounts updated', 'info');
            });
        }
        
        // Listen for Phantom changes
        if (window.solana) {
            window.solana.on('connect', () => {
                console.log('Phantom connected');
            });
            
            window.solana.on('disconnect', () => {
                console.log('Phantom disconnected');
                // Remove Phantom wallets
                state.wallets = state.wallets.filter(w => w.type !== 'solana');
                UI.renderConnectedWallets();
            });
        }
    }
    
    // Show welcome message
    setTimeout(() => {
        if (state.isMobile) {
            UI.showToast('Tap any wallet to open in its mobile app', 'info');
        } else {
            UI.showToast('Welcome! Connect a wallet to start scanning 50+ networks', 'info');
        }
    }, 1000);
});
