"use client";
import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import { Logo } from "@/components/Logo";
import { ChannelCategory } from "../channels/types";

// Update mock earnings to zero and add a note
const MOCK_EARNINGS = {
  total: 0,
  lastMonth: 0,
  pending: 0,
  note: "(Data will be populated after smart contract integration)",
};

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
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]); // For transaction history
  const [newChannelData, setNewChannelData] = useState({
    title: '',
    description: '',
    broadcaster_price: 0,
    category: ChannelCategory.New, // Default to New
    thumbnail: '', 
    broadcaster_wallet_address: '', // Added broadcaster wallet address
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    totalSpent: 0,
    totalEarned: 0,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    console.log("[Dashboard] fetchTransactions called. publicKey:", publicKey?.toBase58());
    if (!publicKey) {
      console.log("[Dashboard] fetchTransactions: publicKey is null, returning.");
      setTransactions([]); // Clear transactions if no public key
      return;
    }
    
    try {
      const response = await fetch(`/api/transactions?userId=${publicKey.toBase58()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch transactions and parse error response.' }));
        throw new Error(errorData.message || 'Failed to fetch transactions');
      }
      const realTransactions: Transaction[] = await response.json();
      
      setTransactions(realTransactions);
      console.log("[Dashboard] fetchTransactions: realTransactions set:", realTransactions);
      
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
      setError(null); // Clear previous errors on successful fetch
      
    } catch (err: any) {
      console.error('[Dashboard] Error fetching transactions:', err);
      setError(`Failed to load transactions: ${err.message}`);
      setTransactions([]); // Clear transactions on error
    }
  }, [publicKey]);

  useEffect(() => {
    console.log("[Dashboard] Main useEffect triggered. publicKey:", publicKey?.toBase58());
    if (!publicKey) {
      console.log("[Dashboard] Main useEffect: publicKey is null, redirecting to /signin.");
      router.push("/signin");
      return;
    }
    setIsLoading(true); // Set loading true at the start of data fetching
    console.log("[Dashboard] Main useEffect: Fetching data...");
    fetchTransactions().finally(() => setIsLoading(false)); // Initial fetch, then set loading to false
  }, [publicKey, router, fetchTransactions]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewChannelData(prev => ({
      ...prev,
      [name]: name === 'broadcaster_price' ? parseFloat(value) || 0 : value,
    }));
  };

  // Add toast function
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  // Handle submitting the new channel form
  const handleAddChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
        setError('Wallet not connected.');
        return;
    }
    setError(null);

    try {
      const submissionData = {
        ...newChannelData,
        creator: publicKey.toBase58(),
        on_chain_id: `placeholder-${Date.now()}`,
        current_price: newChannelData.broadcaster_price,
        total_upvotes: 0,
        total_downvotes: 0,
        is_voting_active: true,
        voting_end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (submissionData.broadcaster_wallet_address) {
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(submissionData.broadcaster_wallet_address)) {
          throw new Error('Invalid Solana wallet address for broadcaster');
        }
      }

      const response = await fetch(`/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add channel');
      }

      await response.json();
      
      setIsAddChannelModalOpen(false);
      setNewChannelData({ 
        title: '', 
        description: '', 
        broadcaster_price: 0, 
        category: ChannelCategory.New,
        thumbnail: '',
        broadcaster_wallet_address: '',
      });

      // Add success toast
      addToast("🎉 Woohoo! Your channel has been created successfully! Time to start streaming!", 'success');

    } catch (err: any) {
      setError(err.message);
      addToast(err.message, 'error');
    }
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
                <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-[#FFFFFF] tracking-tight">Creator Dashboard</h1>
                <p className="text-2xl text-[#AAAAAA] max-w-2xl mb-2">Manage your channels and track your (upcoming) earnings on the decentralized streaming platform.</p>
                <div className="absolute left-0 bottom-0 w-16 h-1 bg-gradient-to-r from-transparent via-[#E50914]/30 to-transparent"></div>
              </motion.div>

              {/* Stats Overview */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16 relative"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Subtle connector lines between cards on desktop */}
                <div className="absolute top-1/2 left-[25%] right-[75%] h-px bg-gradient-to-r from-transparent via-[#E50914]/20 to-transparent hidden md:block"></div>
                <div className="absolute top-1/2 left-[50%] right-[50%] h-px bg-gradient-to-r from-transparent via-[#9945FF]/20 to-transparent hidden md:block"></div>
                <div className="absolute top-1/2 left-[75%] right-[25%] h-px bg-gradient-to-r from-transparent via-[#3C9FFF]/20 to-transparent hidden md:block"></div>
                
                {/* Total Earnings Card */}
                <motion.div variants={itemVariants} className="bg-[#1E1E1E] p-8 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.08)] hover:border-[#E50914]/30 transition-all duration-300 backdrop-filter backdrop-blur-sm bg-opacity-80 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E50914] to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <h3 className="text-base uppercase font-semibold text-[#AAAAAA] mb-2 tracking-wide">Total Earnings</h3>
                  <p className="text-4xl font-bold text-[#FFFFFF]">{userStats.totalEarned.toFixed(2)} <span className="text-[#E50914]">SOL</span></p>
                  <p className="text-sm text-[#AAAAAA] mt-3">From channel viewer payments</p>
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#E50914] rounded-full opacity-0 group-hover:opacity-5 transition-opacity -m-6"></div>
                </motion.div>
                
                {/* Update other cards similarly with different accent colors */}
                <motion.div variants={itemVariants} className="bg-[#1E1E1E] p-8 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.08)] hover:border-[#9945FF]/30 transition-all duration-300 backdrop-filter backdrop-blur-sm bg-opacity-80 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9945FF] to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <h3 className="text-base uppercase font-semibold text-[#AAAAAA] mb-2 tracking-wide">Total Spent</h3>
                  <p className="text-4xl font-bold text-[#FFFFFF]">{userStats.totalSpent.toFixed(2)} <span className="text-[#9945FF]">SOL</span></p>
                  <p className="text-sm text-[#AAAAAA] mt-3">On channel access fees</p>
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#9945FF] rounded-full opacity-0 group-hover:opacity-5 transition-opacity -m-6"></div>
                </motion.div>
                
                {/* Similar updates for other cards */}
                {/* ... */}
                
              </motion.div>

              {/* New "Become a Broadcaster" line */}
              <motion.div 
                className="my-20 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p 
                  className="text-2xl text-[#AAAAAA] hover:text-[#FFFFFF] cursor-pointer transition-colors duration-300 inline-block"
                  onClick={() => setIsAddChannelModalOpen(true)}
                >
                  <span className="font-bold text-[#E50914]">Want to become a broadcaster?</span> Add your own channels here.
                </p>
              </motion.div>

              {/* Transaction History Section with subtle divider */}
              <div className="relative mb-20">
                <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent"></div>
                
                <div className="pt-12">
                  <div className="flex justify-between items-center mb-12 relative">
                    <h2 className="text-4xl sm:text-5xl font-bold text-[#FFFFFF] tracking-tight">
                      Wallet Activity
                      <div className="absolute -bottom-2 left-0 w-12 h-[2px] bg-[#E50914]/80"></div>
                    </h2>
                  </div>

                  {error && <p className="text-center text-red-500 py-4 bg-red-900/20 rounded-md">Error loading transactions: {error}</p>}
                  {!error && transactions.length === 0 ? (
                    <motion.div 
                      className="text-center text-[#AAAAAA] py-20 bg-[#1E1E1E]/80 rounded-2xl p-12 border border-[rgba(255,255,255,0.08)] shadow-xl"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1}}
                      transition={{ duration: 0.5}}
                    >
                      <svg className="mx-auto h-16 w-16 text-[#AAAAAA] mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <h3 className="text-xl font-semibold mb-3 text-[#FFFFFF]">No transactions yet</h3>
                      <p className="mb-6">Your payment history will appear here when you make or receive payments.</p>
                    </motion.div>
                  ) : (
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
                                      tx.type === 'earning' ? 'bg-[#E50914]/10 text-[#E50914]' :  /* Changed earning to red for consistency pending further color decisions */
                                      'bg-[#B81D24]/10 text-[#B81D24]'}`}>
                                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-lg font-medium 
                                  ${tx.type === 'payment' ? 'text-[#E50914]' : 'text-[#E50914]'}`}> {/* Changed earning to red, Removed font-['Space_Grotesk'] */}
                                  {tx.type === 'payment' ? '- ' : '+ '}{tx.amount.toFixed(2)} SOL
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-lg">
                                  <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full 
                                    ${tx.status === 'completed' ? 'bg-[#E50914]/10 text-[#E50914]' : /* Changed completed to red */
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
                  )}
                </div>
              </div>

              {/* Add Channel Modal */}
              <AnimatePresence>
                {isAddChannelModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={() => setIsAddChannelModalOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-[#1E1E1E] p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-2xl relative border border-[rgba(255,255,255,0.05)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => setIsAddChannelModalOpen(false)} 
                        className="absolute top-4 right-4 text-[#AAAAAA] hover:text-[#FFFFFF] transition-colors p-1 rounded-full"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <h2 className="text-3xl font-semibold mb-8 text-center text-[#FFFFFF] tracking-tight">Add New Channel</h2>
                      {error && <p className="text-[#E50914] bg-[#E50914]/10 p-4 rounded-md mb-6 text-sm">Error: {error}</p>}
                      <form onSubmit={handleAddChannelSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label htmlFor="title" className="block text-base font-medium text-[#AAAAAA] mb-2">Channel Title</label>
                            <input
                              type="text"
                              name="title"
                              id="title"
                              value={newChannelData.title}
                              onChange={handleInputChange}
                              required
                              className="w-full bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white rounded-lg p-4 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] shadow-sm text-base"
                              placeholder="e.g., Live Crypto Analysis"
                            />
                          </div>
                          <div>
                            <label htmlFor="category" className="block text-base font-medium text-[#AAAAAA] mb-2">Category</label>
                            <select 
                              name="category" 
                              id="category" 
                              value={newChannelData.category} 
                              onChange={handleInputChange}
                              className="w-full bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white rounded-lg p-4 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] shadow-sm text-base"
                            >
                              {Object.values(ChannelCategory).map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-base font-medium text-[#AAAAAA] mb-2">Description</label>
                          <textarea
                            name="description"
                            id="description"
                            value={newChannelData.description}
                            onChange={handleInputChange}
                            rows={4}
                            required
                            className="w-full bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white rounded-lg p-4 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] shadow-sm text-base"
                            placeholder="Briefly describe your channel's content"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label htmlFor="broadcaster_price" className="block text-base font-medium text-[#AAAAAA] mb-2">Initial Price (SOL)</label>
                            <input
                              type="number"
                              name="broadcaster_price"
                              id="broadcaster_price"
                              value={newChannelData.broadcaster_price}
                              onChange={handleInputChange}
                              required
                              min="0"
                              step="0.01"
                              className="w-full bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white rounded-lg p-4 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] shadow-sm text-base"
                              placeholder="e.g., 0.5"
                            />
                          </div>
                          <div>
                            <label htmlFor="thumbnail" className="block text-base font-medium text-[#AAAAAA] mb-2">Thumbnail URL (Optional)</label>
                            <input
                              type="url"
                              name="thumbnail"
                              id="thumbnail"
                              value={newChannelData.thumbnail}
                              onChange={handleInputChange}
                              className="w-full bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white rounded-lg p-4 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] shadow-sm text-base"
                              placeholder="https://your-image-url.com/thumbnail.jpg"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="broadcaster_wallet_address" className="block text-base font-medium text-[#AAAAAA] mb-2">Broadcaster Wallet Address</label>
                          <div className="flex space-x-3">
                            <input
                              type="text"
                              name="broadcaster_wallet_address"
                              id="broadcaster_wallet_address"
                              value={newChannelData.broadcaster_wallet_address}
                              onChange={handleInputChange}
                              required
                              className="flex-1 bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white rounded-lg p-4 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] shadow-sm text-base"
                              placeholder="e.g., 4Z4H...K567"
                            />
                            <button
                              type="button"
                              onClick={() => setNewChannelData(prev => ({
                                ...prev,
                                broadcaster_wallet_address: publicKey ? publicKey.toBase58() : ''
                              }))}
                              className="bg-[#141414] hover:bg-[#2A2A2A] border border-[rgba(255,255,255,0.1)] text-white px-6 py-4 rounded-lg text-base transition-colors whitespace-nowrap"
                            >
                              Use My Wallet
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-[#AAAAAA]">This is where 70% of channel payments will be sent when viewers pay to watch.</p>
                        </div>

                        <motion.button
                          type="submit"
                          className="w-full bg-[#E50914] hover:bg-[#B81D24] text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all duration-150 disabled:opacity-50 text-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Adding...' : 'Add Channel'}
                        </motion.button>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 