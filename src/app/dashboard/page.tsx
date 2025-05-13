"use client";
import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  category?: string; // Added for consistency with main channels page
  thumbnail?: string; // Added for consistency
  voting_end_time?: string; // Added for consistency
  is_voting_active?: boolean; // Added for consistency
}

// REMOVE API_URL
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const { publicKey, disconnect } = useWallet();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]); // Initialize as empty
  const [newChannelData, setNewChannelData] = useState({
    title: '',
    description: '',
    broadcaster_price: 0,
    category: 'General', // Add category with a default
    thumbnail: '', // Add thumbnail field
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch channels created by the current user
  const fetchCreatorChannels = useCallback(async () => {
    if (!publicKey) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/channels?creator=${publicKey.toBase58()}`); // Use relative path and query param
      if (!response.ok) throw new Error('Failed to fetch channels');
      const creatorChannels: Channel[] = await response.json();
      setChannels(creatorChannels);
    } catch (err: any) {
      setError(err.message);
      setChannels([]); // Set to empty on error
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]); // Added publicKey to dependency array

  useEffect(() => {
    if (!publicKey) {
      router.push("/signin");
      return;
    }
    fetchCreatorChannels();
  }, [publicKey, router, fetchCreatorChannels]); // Added fetchCreatorChannels

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
        on_chain_id: `placeholder-${Date.now()}`, // Temporary placeholder
        // Ensure default values for fields not in form if required by backend
        current_price: newChannelData.broadcaster_price, // Initial current_price can be broadcaster_price
        total_upvotes: 0,
        total_downvotes: 0,
        is_voting_active: true, // Default to active for new channels
        voting_end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days voting
      };

      const response = await fetch(`/api/channels`, { // Use relative path
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

      // const createdChannel = await response.json(); // No need to use if re-fetching
      await response.json(); // Consume the response
      
      fetchCreatorChannels(); // Re-fetch channels to include the new one
      setIsAddChannelModalOpen(false);
      setNewChannelData({ title: '', description: '', broadcaster_price: 0, category: 'General', thumbnail: '' }); // Reset form

    } catch (err: any) {
      setError(err.message);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Navigation Bar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-black/90 backdrop-blur-md" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-red-600">
              TV DAO
            </Link>
            <div className="relative">
              <motion.button
                className="text-gray-300 hover:text-white transition-colors p-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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

      {/* Main Content */}
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Creator Dashboard</h1>
          <p className="text-lg text-gray-400">Manage your channels and track your (upcoming) earnings.</p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Total Earnings Card */}
          <motion.div variants={itemVariants} className="bg-gray-800/70 p-6 rounded-xl shadow-lg backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Total Earnings</h3>
            <p className="text-3xl font-bold text-green-400">{MOCK_EARNINGS.total.toFixed(2)} SOL</p>
            <p className="text-xs text-gray-500 mt-1">{MOCK_EARNINGS.note}</p>
          </motion.div>
          {/* Last Month Earnings Card */}
          <motion.div variants={itemVariants} className="bg-gray-800/70 p-6 rounded-xl shadow-lg backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Last Month</h3>
            <p className="text-3xl font-bold text-blue-400">{MOCK_EARNINGS.lastMonth.toFixed(2)} SOL</p>
            <p className="text-xs text-gray-500 mt-1">{MOCK_EARNINGS.note}</p>
          </motion.div>
          {/* Channels Created Card */}
          <motion.div variants={itemVariants} className="bg-gray-800/70 p-6 rounded-xl shadow-lg backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Channels Created</h3>
            <p className="text-3xl font-bold text-purple-400">{channels.length}</p>
            <p className="text-xs text-gray-500 mt-1">Your active and past channels.</p>
          </motion.div>
        </motion.div>

        {/* Channels Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold">Your Channels</h2>
            <motion.button
              onClick={() => setIsAddChannelModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-150"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add New Channel
            </motion.button>
          </div>

          {isLoading && <p className="text-center text-gray-400 py-8">Loading your channels...</p>}
          {!isLoading && error && <p className="text-center text-red-500 py-8">Error: {error}</p>}
          {!isLoading && !error && channels.length === 0 && (
            <motion.div 
              className="text-center text-gray-500 py-12 bg-gray-800/50 rounded-xl p-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1}}
              transition={{ duration: 0.5}}
            >
              <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <h3 className="text-xl font-semibold mb-2">No channels yet!</h3>
              <p className="mb-4">Click "Add New Channel" to get started.</p>
            </motion.div>
          )}

          {!isLoading && !error && channels.length > 0 && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {channels.map((channel) => (
                <motion.div 
                  key={channel._id || channel.on_chain_id}
                  variants={itemVariants}
                  className="bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-red-500/30 hover:scale-[1.02]"
                >
                  <div className="aspect-video bg-gray-700 relative">
                    <img 
                      src={channel.thumbnail || `https://picsum.photos/seed/${channel._id || channel.title}/400/225`}
                      alt={channel.title} 
                      className="w-full h-full object-cover"
                    />
                    {/* You can add an overlay or status badges here if needed */}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 truncate">{channel.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 h-10 overflow-hidden text-ellipsis">{channel.description}</p>
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="text-gray-500">Category: <span className="text-sky-400 font-medium">{channel.category}</span></span>
                      <span className="text-gray-500">Price: <span className="text-green-400 font-bold">{channel.broadcaster_price.toFixed(2)} SOL</span></span>
                    </div>
                    <div className="space-x-2">
                        <button className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">View</button>
                        {/* Add Edit/Delete later */}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Add any other sections if needed */}
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
              className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg relative"
              onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
              <button 
                onClick={() => setIsAddChannelModalOpen(false)} 
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-full bg-gray-700/50 hover:bg-gray-600/50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h2 className="text-2xl font-semibold mb-6 text-center text-red-500">Add New Channel</h2>
              {error && <p className="text-red-500 bg-red-900/30 p-3 rounded-md mb-4 text-sm">Error: {error}</p>}
              <form onSubmit={handleAddChannelSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Channel Title</label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={newChannelData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-3 focus:ring-red-500 focus:border-red-500 shadow-sm text-sm"
                    placeholder="e.g., Live Crypto Analysis"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    name="description"
                    id="description"
                    value={newChannelData.description}
                    onChange={handleInputChange}
                    rows={3}
                    required
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-3 focus:ring-red-500 focus:border-red-500 shadow-sm text-sm"
                    placeholder="Briefly describe your channel's content"
                  />
                </div>
                <div>
                  <label htmlFor="broadcaster_price" className="block text-sm font-medium text-gray-300 mb-1">Initial Price (SOL)</label>
                  <input
                    type="number"
                    name="broadcaster_price"
                    id="broadcaster_price"
                    value={newChannelData.broadcaster_price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-3 focus:ring-red-500 focus:border-red-500 shadow-sm text-sm"
                    placeholder="e.g., 0.5"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select 
                    name="category" 
                    id="category" 
                    value={newChannelData.category} 
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-3 focus:ring-red-500 focus:border-red-500 shadow-sm text-sm"
                  >
                    <option value="General">General</option>
                    <option value="News">News</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Education">Education</option>
                    <option value="Music">Music</option>
                    <option value="Live">Live Events</option>
                    <option value="Podcast">Podcast</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-300 mb-1">Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    name="thumbnail"
                    id="thumbnail"
                    value={newChannelData.thumbnail}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-3 focus:ring-red-500 focus:border-red-500 shadow-sm text-sm"
                    placeholder="https://your-image-url.com/thumbnail.jpg"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors duration-150 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading} // Disable button when form is submitting (isLoading might be true from fetchCreatorChannels)
                >
                  {isLoading ? 'Adding...' : 'Add Channel'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 