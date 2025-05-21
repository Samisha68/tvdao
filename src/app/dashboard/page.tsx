"use client";
import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import { Logo } from "@/components/Logo";
import { ChannelCategory } from "../channels/types";
import CreatorForm from "@/components/CreatorForm";

// Interface for Channel data (should match backend schema)
interface Channel {
  _id?: string; 
  on_chain_id: string; 
  creator: string; 
  title: string;
  description: string;
  broadcaster_price: number;
  current_price: number; // Will be set by voting
  total_upvotes: number;
  total_downvotes: number;
  status?: string; 
  views?: number; 
  revenue?: number; 
  category?: ChannelCategory; // Updated to use the enum
  thumbnail?: string; // Added for consistency
  voting_end_time?: string; // Added for consistency
  is_voting_active?: boolean; // Added for consistency
  broadcaster_wallet_address?: string; // Added to store broadcaster's wallet for payments
}

// Define interface for watched channel history
interface WatchedChannel extends Channel {
  last_watched: string; // ISO date string
  watch_duration?: number; // In seconds
}

// Transaction interface for wallet activity
interface Transaction {
  _id: string;
  user_id: string;
  channel_id?: string;
  channel_title?: string;
  amount: number;
  type: 'payment' | 'earning' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  tx_signature?: string;
}

// REMOVE API_URL
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Updated color palette based on SendAI.fun
const colors = {
  background: '#141414', // Netflix dark background
  card: '#1E1E1E',      // Slightly lighter dark for cards
  primary: '#E50914',   // Netflix red
  secondary: '#B81D24', // Darker Netflix red
  tertiary: '#F5F5F1',  // Netflix off-white
  text: '#FFFFFF',      // White text
  subtext: '#AAAAAA',   // Subdued text
  border: 'rgba(255,255,255,0.1)', // Subtle borders
  hover: '#2A2A2A',     // Hover state
};

// Update typography
const typography = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '16px',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
  },
};

// Apply typography to the styles
// Example: Update heading styles
const headingStyles = `
  font-family: ${typography.headings.fontFamily};
  font-weight: ${typography.headings.fontWeight};
  color: ${colors.text};
`;

// Add animations
const animations = {
  buttonHover: `
    transition: transform 0.2s ease-in-out;
    &:hover {
      transform: scale(1.05);
    }
  `,
};

// Apply animations to the styles
// Example: Update button hover animation
const buttonHoverAnimation = animations.buttonHover;

// Skeleton Loader for Channel Cards
const ChannelCardSkeleton = () => (
  <div className="bg-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden border border-[rgba(255,255,255,0.05)] animate-pulse">
    <div className="aspect-video bg-[#2A2A2A]"></div>
    <div className="p-6">
      <div className="h-6 bg-[#2A2A2A] rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-[#2A2A2A] rounded w-full mb-2"></div>
      <div className="h-4 bg-[#2A2A2A] rounded w-5/6 mb-4"></div>
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 bg-[#2A2A2A] rounded w-1/4"></div>
        <div className="h-5 bg-[#2A2A2A] rounded w-1/4"></div>
      </div>
      <div className="h-8 bg-[#2A2A2A] rounded w-1/3"></div>
    </div>
  </div>
);

// Add toast interface
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function Dashboard() {
  const { publicKey, disconnect } = useWallet();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ownedChannels, setOwnedChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    totalSpent: 0,
    totalEarned: 0,
    channelsOwned: 0,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch owned channels
  const fetchOwnedChannels = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      const response = await fetch(`/api/channels/owned?userId=${publicKey.toBase58()}`);
      if (!response.ok) {
        // If we get a 400 or other error, reset all stats to 0
        setOwnedChannels([]);
        setUserStats({
          totalSpent: 0,
          totalEarned: 0,
          channelsOwned: 0
        });
        return;
      }
      const channels = await response.json();
      setOwnedChannels(channels);
      
      // If no channels, reset all stats to 0
      if (!channels || channels.length === 0) {
        setUserStats({
          totalSpent: 0,
          totalEarned: 0,
          channelsOwned: 0
        });
      } else {
        setUserStats(prev => ({ ...prev, channelsOwned: channels.length }));
      }
    } catch (err: any) {
      console.error('Error fetching owned channels:', err);
      // On error, reset all stats to 0
      setOwnedChannels([]);
      setUserStats({
        totalSpent: 0,
        totalEarned: 0,
        channelsOwned: 0
      });
    }
  }, [publicKey]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!publicKey) {
      setTransactions([]); // Clear transactions if no public key
      setUserStats(prev => ({
        ...prev,
        totalSpent: 0,
        totalEarned: 0
      }));
      return;
    }
    
    try {
      const response = await fetch(`/api/transactions?userId=${publicKey.toBase58()}`);
      if (!response.ok) {
        // If we get a 400 or other error, reset transaction-related stats to 0
        setTransactions([]);
        setUserStats(prev => ({
          ...prev,
          totalSpent: 0,
          totalEarned: 0
        }));
        return;
      }
      const realTransactions: Transaction[] = await response.json();
      
      // Only set transactions if we have some
      if (realTransactions && realTransactions.length > 0) {
        setTransactions(realTransactions);
        
        // Calculate totals for stats
        const spent = realTransactions
          .filter(tx => tx.type === 'payment' && tx.status === 'completed')
          .reduce((sum, tx) => sum + tx.amount, 0);
          
        const earned = realTransactions
          .filter(tx => tx.type === 'earning' && tx.status === 'completed')
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        // Update stats
        setUserStats(prev => ({
          ...prev,
          totalSpent: spent,
          totalEarned: earned
        }));
      } else {
        // If no transactions, clear them and reset stats
        setTransactions([]);
        setUserStats(prev => ({
          ...prev,
          totalSpent: 0,
          totalEarned: 0
        }));
      }
      setError(null); // Clear previous errors on successful fetch
      
    } catch (err: any) {
      console.error('[Dashboard] Error fetching transactions:', err);
      setError(`Failed to load transactions: ${err.message}`);
      setTransactions([]); // Clear transactions on error
      // Reset transaction-related stats on error
      setUserStats(prev => ({
        ...prev,
        totalSpent: 0,
        totalEarned: 0
      }));
    }
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey) {
      router.push("/signin");
      return;
    }
    setIsLoading(true);
    Promise.all([
      fetchTransactions(),
      fetchOwnedChannels()
    ]).finally(() => setIsLoading(false));
  }, [publicKey, router, fetchTransactions, fetchOwnedChannels]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add toast function
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // useEffect for polling transactions
  useEffect(() => {
    if (!publicKey) return; // Don't poll if no publicKey

    const intervalId = setInterval(() => {
      console.log("[Dashboard] Polling for new transactions...");
      fetchTransactions();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [publicKey, fetchTransactions]); // Add publicKey to dependencies

  return (
    <div className="min-h-screen w-full bg-black text-[#FFFFFF] font-sans relative overflow-x-hidden">
      {/* Dashboard Background Overlay and Image */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 z-0" />
        <div className="absolute inset-0 bg-[url('/dashboard-bg.jpg')] bg-cover bg-center opacity-60 scale-110 z-0" />
      </div>
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`p-4 rounded-lg shadow-lg max-w-md ${
                toast.type === 'success' 
                  ? 'bg-[#E50914]/90 text-white' 
                  : 'bg-red-500/90 text-white'
              }`}
            >
              <p className="text-sm font-medium">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Background details */}
      <div className="fixed inset-0 z-0 opacity-40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E50914] rounded-full blur-[250px] opacity-[0.03]"></div>
        <div className="absolute bottom-0 left-[10%] w-[500px] h-[500px] bg-[#B81D24] rounded-full blur-[250px] opacity-[0.03]"></div>
        <div className="absolute top-[30%] left-[20%] w-2 h-2 bg-[#E50914] rounded-full shadow-[0_0_10px_5px_rgba(229,9,20,0.2)]"></div>
        <div className="absolute top-[50%] right-[15%] w-2 h-2 bg-[#B81D24] rounded-full shadow-[0_0_10px_5px_rgba(184,29,36,0.2)]"></div>
        <div className="absolute bottom-[20%] right-[30%] w-2 h-2 bg-[#F5F5F1] rounded-full shadow-[0_0_10px_5px_rgba(245,245,241,0.2)]"></div>
        <div className="absolute top-[20%] right-[40%] w-1 h-1 bg-[#FFFFFF] rounded-full shadow-[0_0_10px_5px_rgba(255,255,255,0.1)]"></div>
        <div className="absolute bottom-[40%] left-[35%] w-1 h-1 bg-[#FFFFFF] rounded-full shadow-[0_0_10px_5px_rgba(255,255,255,0.1)]"></div>
      </div>
      
      {/* Grid pattern background */}
      <div className="fixed inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAwdjQwSDBWMGg0MHpNMjAgMjBWMGgyMHYyMEgyMHptMCAyMFYyMGgyMHYyMEgyMHptLTIwIDBWMjBoMjB2MjBIMHptMC0yMFYwaDIwdjIwSDB6IiBmaWxsPSIjMjAyMDIwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-[0.05]"></div>
      
      {/* Transparent Nav Bar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Logo size={96} />
            <div className="relative">
              <motion.button
                className="text-gray-300 hover:text-white transition-colors p-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </motion.button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5"
                  >
                    <div className="py-1">
                      <Link href="/channels">
                        <motion.button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                          whileHover={{ x: 5 }}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Channels
                        </motion.button>
                      </Link>
                      <Link href="/">
                        <motion.button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                          whileHover={{ x: 5 }}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Home
                        </motion.button>
                      </Link>
                      <motion.button
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700 hover:text-red-400"
                        whileHover={{ x: 5 }}
                        onClick={() => {
                          disconnect();
                          setIsMenuOpen(false);
                          router.push("/signin");
                        }}
                      >
                        Sign Out
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>
      {/* Padding for nav bar */}
      <div className="pt-28">
        {/* Main Content with blurred card background for visibility */}
        <div className="relative z-10 flex justify-center">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-12 mx-auto max-w-6xl w-full mt-12 mb-12">
            {/* Main Content */}
            <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              {/* Header */}
              <motion.div 
                className="mb-16 text-left relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="absolute left-0 top-0 w-32 h-1 bg-gradient-to-r from-transparent via-[#E50914]/30 to-transparent"></div>
                <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-[#FFFFFF] tracking-tight">Viewer Dashboard</h1>
                <p className="text-2xl text-[#AAAAAA] max-w-2xl mb-2">Track your channel subscriptions and earnings on the decentralized streaming platform.</p>
                <div className="absolute left-0 bottom-0 w-16 h-1 bg-gradient-to-r from-transparent via-[#E50914]/30 to-transparent"></div>
              </motion.div>

              {/* Stats Overview */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 relative"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Total Spent Card */}
                <motion.div variants={itemVariants} className="bg-[#1E1E1E] p-8 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.08)] hover:border-[#E50914]/30 transition-all duration-300 backdrop-filter backdrop-blur-sm bg-opacity-80 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E50914] to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <h3 className="text-base uppercase font-semibold text-[#AAAAAA] mb-2 tracking-wide">Total Spent</h3>
                  <p className="text-4xl font-bold text-[#FFFFFF]">{userStats.totalSpent.toFixed(2)} <span className="text-[#E50914]">SOL</span></p>
                  <p className="text-sm text-[#AAAAAA] mt-3">On channel subscriptions</p>
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#E50914] rounded-full opacity-0 group-hover:opacity-5 transition-opacity -m-6"></div>
                </motion.div>

                {/* Channels Owned Card */}
                <motion.div variants={itemVariants} className="bg-[#1E1E1E] p-8 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.08)] hover:border-[#9945FF]/30 transition-all duration-300 backdrop-filter backdrop-blur-sm bg-opacity-80 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9945FF] to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <h3 className="text-base uppercase font-semibold text-[#AAAAAA] mb-2 tracking-wide">Channels Owned</h3>
                  <p className="text-4xl font-bold text-[#FFFFFF]">{userStats.channelsOwned} <span className="text-[#9945FF]">Channels</span></p>
                  <p className="text-sm text-[#AAAAAA] mt-3">Active subscriptions</p>
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#9945FF] rounded-full opacity-0 group-hover:opacity-5 transition-opacity -m-6"></div>
                </motion.div>

                {/* Total Earned Card */}
                <motion.div variants={itemVariants} className="bg-[#1E1E1E] p-8 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.08)] hover:border-[#3C9FFF]/30 transition-all duration-300 backdrop-filter backdrop-blur-sm bg-opacity-80 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3C9FFF] to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <h3 className="text-base uppercase font-semibold text-[#AAAAAA] mb-2 tracking-wide">Total Earned</h3>
                  <p className="text-4xl font-bold text-[#FFFFFF]">{userStats.totalEarned.toFixed(2)} <span className="text-[#3C9FFF]">SOL</span></p>
                  <p className="text-sm text-[#AAAAAA] mt-3">From content creation</p>
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#3C9FFF] rounded-full opacity-0 group-hover:opacity-5 transition-opacity -m-6"></div>
                </motion.div>
              </motion.div>

              {/* Owned Channels Section */}
              <div className="mb-20">
                <div className="flex justify-between items-center mb-12 relative">
                  <h2 className="text-4xl sm:text-5xl font-bold text-[#FFFFFF] tracking-tight">
                    Your Channels
                    <div className="absolute -bottom-2 left-0 w-12 h-[2px] bg-[#E50914]/80"></div>
                  </h2>
                </div>

                {error && <p className="text-center text-red-500 py-4 bg-red-900/20 rounded-md">Error loading channels: {error}</p>}
                {!error && ownedChannels.length === 0 ? (
                  <motion.div 
                    className="text-center text-[#AAAAAA] py-20 bg-[#1E1E1E]/80 rounded-2xl p-12 border border-[rgba(255,255,255,0.08)] shadow-xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1}}
                    transition={{ duration: 0.5}}
                  >
                    <svg className="mx-auto h-16 w-16 text-[#AAAAAA] mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-3 text-[#FFFFFF]">No channels yet</h3>
                    <p className="mb-6">Subscribe to channels to start watching content.</p>
                    <Link href="/channels" className="inline-block">
                      <button
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#E50914] hover:bg-[#B81D24] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E50914]"
                      >
                        Browse Channels
                      </button>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {ownedChannels.map((channel) => (
                      <motion.div
                        key={channel._id}
                        variants={itemVariants}
                        className="bg-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden border border-[rgba(255,255,255,0.05)] hover:border-[#E50914]/30 transition-all duration-300"
                      >
                        <div className="aspect-video bg-[#2A2A2A] relative">
                          {channel.thumbnail ? (
                            <img
                              src={channel.thumbnail}
                              alt={channel.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-[#AAAAAA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold text-[#FFFFFF] mb-2">{channel.title}</h3>
                          <p className="text-[#AAAAAA] text-sm mb-4 line-clamp-2">{channel.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[#E50914] font-semibold">{channel.current_price} SOL</span>
                            <Link href={`/channels/${channel._id}`} className="inline-block">
                              <button
                                className="px-4 py-2 bg-[#E50914] text-white rounded-lg hover:bg-[#B81D24] transition-colors"
                              >
                                Watch Now
                              </button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Transaction History Section - Only show if there are transactions */}
              {transactions.length > 0 && (
                <div className="relative mb-20">
                  <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent"></div>
                  
                  <div className="pt-12">
                    <div className="flex justify-between items-center mb-12 relative">
                      <h2 className="text-4xl sm:text-5xl font-bold text-[#FFFFFF] tracking-tight">
                        Wallet Activity
                        <div className="absolute -bottom-2 left-0 w-12 h-[2px] bg-[#E50914]/80"></div>
                      </h2>
                    </div>

                    <motion.div 
                      className="overflow-hidden bg-[#1E1E1E]/80 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.08)]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-lg divide-y divide-[rgba(255,255,255,0.08)]">
                          <thead className="bg-[#141414]">
                            <tr>
                              <th scope="col" className="px-6 py-4 text-left text-base font-semibold text-[#AAAAAA] uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-6 py-4 text-left text-base font-semibold text-[#AAAAAA] uppercase tracking-wider">Channel</th>
                              <th scope="col" className="px-6 py-4 text-left text-base font-semibold text-[#AAAAAA] uppercase tracking-wider">Type</th>
                              <th scope="col" className="px-6 py-4 text-left text-base font-semibold text-[#AAAAAA] uppercase tracking-wider">Amount</th>
                              <th scope="col" className="px-6 py-4 text-left text-base font-semibold text-[#AAAAAA] uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                            {transactions.map((tx) => (
                              <tr key={tx._id} className="hover:bg-[#2A2A2A] transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-lg text-[#FFFFFF]">
                                  {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-lg text-[#FFFFFF]">
                                  {tx.channel_title || "Unknown Channel"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-lg">
                                  <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full 
                                    ${tx.type === 'payment' ? 'bg-[#E50914]/10 text-[#E50914]' : 
                                      tx.type === 'earning' ? 'bg-[#E50914]/10 text-[#E50914]' : 
                                      'bg-[#B81D24]/10 text-[#B81D24]'}`}>
                                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-lg font-medium 
                                  ${tx.type === 'payment' ? 'text-[#E50914]' : 'text-[#E50914]'}`}>
                                  {tx.type === 'payment' ? '- ' : '+ '}{tx.amount.toFixed(2)} SOL
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-lg">
                                  <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full 
                                    ${tx.status === 'completed' ? 'bg-[#E50914]/10 text-[#E50914]' : 
                                      tx.status === 'pending' ? 'bg-[#B81D24]/10 text-[#B81D24]' : 
                                      'bg-[#E50914]/10 text-[#E50914]'}`}>
                                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Creator Form Section */}
              <div className="mt-20 mb-12">
                <div className="flex justify-between items-center mb-12 relative">
                  <h2 className="text-4xl sm:text-5xl font-bold text-[#FFFFFF] tracking-tight">
                    Become a Creator
                    <div className="absolute -bottom-2 left-0 w-12 h-[2px] bg-[#E50914]/80"></div>
                  </h2>
                </div>
                <div className="bg-[#1E1E1E]/80 rounded-2xl p-8 border border-[rgba(255,255,255,0.08)]">
                  <div className="text-center">
                    <p className="text-xl text-[#AAAAAA] mb-8">Want to start your own channel? Join our creator waitlist!</p>
                    <Link href="/creator-waitlist" className="inline-block">
                      <button
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-[#E50914] hover:bg-[#B81D24] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E50914]"
                      >
                        Join Creator Waitlist
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 