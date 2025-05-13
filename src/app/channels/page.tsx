"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Update Channel interface to match backend schema + _id
interface Channel {
  _id: string; // MongoDB ID
  on_chain_id: string;
  creator: string;
  title: string;
  description: string;
  broadcaster_price: number;
  current_price: number;
  total_upvotes: number;
  total_downvotes: number;
  is_voting_active: boolean;
  voting_end_time: string; // Date string from backend
  category?: string; // Optional category
  thumbnail?: string; // Optional thumbnail
  embedUrl?: string; // Optional embed URL
}

// User Vote Status Interface
interface UserVote {
  _id: string;
  channel_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  timestamp: string;
}

// --- MOCK DATA --- 
const MOCK_CHANNELS: Channel[] = [
  {
    _id: "mock1",
    on_chain_id: "mock_onchain_1",
    creator: "MockCreator1",
    title: "Crypto News Mock",
    description: "Your daily dose of crypto news, mock style.",
    broadcaster_price: 1.0,
    current_price: 1.1,
    total_upvotes: 150,
    total_downvotes: 20,
    is_voting_active: true,
    voting_end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: "News",
    thumbnail: "https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
  },
  {
    _id: "mock2",
    on_chain_id: "mock_onchain_2",
    creator: "MockCreator2",
    title: "Solana Live Mock",
    description: "Live updates from the Solana ecosystem, simulated.",
    broadcaster_price: 0.8,
    current_price: 0.7,
    total_upvotes: 100,
    total_downvotes: 30,
    is_voting_active: true,
    voting_end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Live",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
  },
   {
    _id: "mock3",
    on_chain_id: "mock_onchain_3",
    creator: "MockCreator3",
    title: "Ended Voting Mock",
    description: "This channel's voting period has finished.",
    broadcaster_price: 0.5,
    current_price: 0.6,
    total_upvotes: 200,
    total_downvotes: 50,
    is_voting_active: false,
    voting_end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Ended yesterday
    category: "Education",
    thumbnail: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
  },
];
// --- END MOCK DATA --- 

// Define animation variants
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

export default function Channels() {
  const { publicKey, disconnect } = useWallet();
  const router = useRouter();
  // Initialize state with MOCK_CHANNELS
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Keep isLoading true initially until API call finishes or fails
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [userVote, setUserVote] = useState<UserVote | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // Store MongoDB user ID

  // --- Fetch User ID ---
  // Fetch user data from backend based on wallet address
  const fetchUser = async (walletAddress: string) => {
    console.log(`[fetchUser] Attempting to fetch/create user for wallet: ${walletAddress}`);
    try {
      // Check if user exists
      console.log(`[fetchUser] GET /api/users?wallet_address=${walletAddress}`);
      let response = await fetch(`/api/users?wallet_address=${walletAddress}`);
      let userData;

      if (response.status === 404) {
        console.log(`[fetchUser] User not found (404), attempting to create.`);
        // User not found, create user
        response = await fetch(`/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: walletAddress, username: walletAddress.substring(0, 6) }), // Simple username for now
        });
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[fetchUser] Failed to create user. Status: ${response.status}, Body: ${errorBody}`);
          throw new Error(`Failed to create user. Status: ${response.status}`);
        }
        userData = await response.json();
        console.log(`[fetchUser] User created successfully: `, userData);
      } else if (response.ok) {
        userData = await response.json(); // This assumes the response is a single user object, not an array
        console.log(`[fetchUser] User fetched successfully: `, userData);
      } else {
        const errorBody = await response.text();
        console.error(`[fetchUser] Failed to fetch user. Status: ${response.status}, Body: ${errorBody}`);
        throw new Error(`Failed to fetch user. Status: ${response.status}`);
      }

      if (userData && userData._id) {
        setUserId(userData._id); // Store the MongoDB user ID
        console.log(`[fetchUser] User ID set: ${userData._id}`);
      } else {
        console.error(`[fetchUser] Received user data but no _id: `, userData);
        setError('Failed to process user data.');
      }
    } catch (err: any) {
      console.error("[fetchUser] Overall error:", err);
      setError(err.message || 'Failed to get user data. Voting might not work.');
    }
  };

  // --- Fetch Channels --- 
  const fetchChannels = async () => {
    // setIsLoading(true); // Keep initial mock data visible
    setError(null);
    console.log("[fetchChannels] Attempting to fetch channels from API...");
    try {
      const response = await fetch(`/api/channels`); // Use relative path
      if (!response.ok) {
        console.error(`[fetchChannels] API error! Status: ${response.status}`);
        throw new Error(`Failed to fetch channels from API. Status: ${response.status}`);
      }
      const data: Channel[] = await response.json();
      console.log("[fetchChannels] Fetched channels from API:", data);

      // Process fetched data to add placeholder thumbnails if missing
      const processedData = data.map(channel => {
        if (!channel.thumbnail) {
          // Use the last 8 characters of the _id as a seed for a unique-ish image
          const seed = channel._id.substring(channel._id.length - 8);
          return {
            ...channel,
            thumbnail: `https://picsum.photos/seed/${seed}/300/170`
          };
        }
        return channel;
      });

      // Combine MOCK_CHANNELS with processed fetched channels
      setChannels(prevChannels => {
        const existingMockChannels = MOCK_CHANNELS;
        const fetchedChannelIds = new Set(processedData.map(c => c._id));
        const uniqueMockChannels = existingMockChannels.filter(mc => !fetchedChannelIds.has(mc._id));
        const combined = [...uniqueMockChannels, ...processedData];
        console.log("[fetchChannels] Combined channels for display:", combined);
        return combined;
      });
    } catch (err: any) {
      console.error("[fetchChannels] Error during fetch:", err.message);
      // If API fails, MOCK_CHANNELS will remain as set by useState initial value.
      // We could set an error here if we don't want to fall back to only mock data.
      // setError(`Failed to load channels from API: ${err.message}`);
    } finally {
      setIsLoading(false); // Set loading false after attempt
      console.log("[fetchChannels] Finished fetch attempt, isLoading: false");
    }
  };

  // --- Fetch User Vote for Selected Channel --- 
  const fetchUserVote = async (channelId: string) => {
    if (!userId) {
      console.log("[fetchUserVote] No userId, skipping fetch.");
      return;
    }
    setIsModalLoading(true);
    console.log(`[fetchUserVote] Fetching vote for user ${userId} on channel ${channelId}`);
    try {
      const response = await fetch(`/api/votes/user/${userId}/channel/${channelId}`); // Use relative path
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[fetchUserVote] No vote found for user ${userId} on channel ${channelId}.`);
          setUserVote(null); // Explicitly set to null if no vote found
        } else {
          throw new Error(`Failed to fetch user vote. Status: ${response.status}`);
        }
      } else {
        const voteData = await response.json();
        if (voteData && voteData._id) { // Check if a vote exists
            setUserVote(voteData);
            console.log(`[fetchUserVote] Vote found: `, voteData);
        } else {
            setUserVote(null); // No vote found or empty response
            console.log(`[fetchUserVote] Vote data received but no _id or empty: `, voteData);
        }
      }
    } catch (err: any) {
      console.error("[fetchUserVote] Error:", err);
      // Don't set main error, just log
    } finally {
      setIsModalLoading(false);
    }
  };

  // --- Handle Vote Submission --- 
  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!publicKey || !selectedChannel || !userId) {
      console.error('Cannot vote: Missing publicKey, selectedChannel, or userId.', { publicKey, selectedChannel, userId });
      setError('Cannot vote: Missing user, channel, or user ID.');
      return;
    }

    // Prevent voting if voting is inactive
    if (!selectedChannel.is_voting_active || new Date() > new Date(selectedChannel.voting_end_time)) {
        setError('Voting period has ended.');
        return;
    }

    // Prevent voting again with the same type
    if (userVote?.vote_type === voteType) {
        setError(`You have already ${voteType}d.`);
        return;
    }

    setIsModalLoading(true);
    setError(null);
    console.log(`[handleVote] Submitting ${voteType} for channel ${selectedChannel._id} by user ${userId}`);

    try {
      const response = await fetch(`/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Authorization header if needed
        },
        body: JSON.stringify({
          channel_id: selectedChannel._id,
          user_id: userId,
          vote_type: voteType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit vote');
      }

      const result = await response.json();

      // Update the selected channel state locally
      setSelectedChannel(result.channel);
      // Update the main channels list as well
      setChannels(prevChannels =>
        prevChannels.map(ch => (ch._id === result.channel._id ? result.channel : ch))
      );
      // Update user vote status
      fetchUserVote(selectedChannel._id);
      console.log(`[handleVote] Vote submitted successfully. New channel data: `, result.channel);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsModalLoading(false);
    }
  };

  // --- Effects --- 
  useEffect(() => {
    fetchChannels(); // Fetch channels on mount
  }, []);

  useEffect(() => {
    if (!publicKey) {
      router.push('/signin');
    } else {
        // Fetch user ID once wallet is connected
        fetchUser(publicKey.toBase58());
    }
  }, [publicKey, router]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch user vote when modal opens
  useEffect(() => {
    if (selectedChannel && userId) {
      fetchUserVote(selectedChannel._id);
    } else {
      setUserVote(null); // Clear vote status if no channel or user ID
    }
  }, [selectedChannel, userId]);

  // --- Rendering Helpers --- 
  const formatTimeLeft = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}d ${hours}h left`;
  };

  // --- Main Render --- 
  return (
    <div className="min-h-screen bg-black text-white">
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
                      <Link href="/dashboard">
                        <motion.button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                          whileHover={{ x: 5 }}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
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
      <div className="pt-20">
        {/* Featured Channel */}
        {channels.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative h-[70vh]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black z-10" />
            <div className="absolute inset-0 bg-[url('/channel-bg.jpg')] bg-cover bg-center" />
            <div className="relative z-20 h-full flex flex-col items-start justify-end p-8 md:p-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="max-w-2xl"
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  Featured Channel
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8">
                  Watch the most popular content on TV DAO
                </p>
                <div className="flex space-x-4">
                  <motion.button
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Watch Now
                  </motion.button>
                  <motion.button
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedChannel(channels[0])}
                  >
                    More Info
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Channel Categories */}
        <div className="px-4 md:px-16 py-8 space-y-8">
          {/* Show loading only if API call is in progress AND no mock data was shown */}
          {isLoading && channels.length === 0 && <p>Loading channels...</p>}
          {/* Show error only if API failed AND no mock data */}
          {error && channels.length === 0 && <p className="text-red-500">Error: {error}</p>}

          {/* Render channel sections using the current channels state (mock or real) */}
          {channels.length > 0 && (
              <>
                {/* Trending Now */}
                <motion.section
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h2 className="text-xl font-semibold mb-4">Trending Now</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {channels.map((channel) => (
                      <motion.div
                        key={channel._id}
                        variants={itemVariants}
                        className="flex-none w-64 relative group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onHoverStart={() => setHoveredChannel(channel._id)}
                        onHoverEnd={() => setHoveredChannel(null)}
                      >
                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                          <div className="aspect-video bg-gray-700 relative">
                            <img
                              src={channel.thumbnail || 'https://via.placeholder.com/300x170'}
                              alt={channel.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <motion.button
                                className="bg-red-600 text-white px-4 py-2 rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedChannel(channel)}
                              >
                                More Info
                              </motion.button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold mb-2">{channel.title}</h3>
                            <p className="text-sm text-gray-400">
                              {channel.total_upvotes} upvotes • {channel.category}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>

                {/* New Channels */}
                <motion.section
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h2 className="text-xl font-semibold mb-4">New Channels</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {channels.filter(c => !MOCK_CHANNELS.some(mc => mc._id === c._id)).map((channel) => (
                      <motion.div
                        key={channel._id}
                        variants={itemVariants}
                        className="flex-none w-64 relative group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onHoverStart={() => setHoveredChannel(channel._id)}
                        onHoverEnd={() => setHoveredChannel(null)}
                      >
                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                          <div className="aspect-video bg-gray-700 relative">
                            <img
                              src={channel.thumbnail || 'https://via.placeholder.com/300x170'}
                              alt={channel.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <motion.button
                                className="bg-red-600 text-white px-4 py-2 rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedChannel(channel)}
                              >
                                More Info
                              </motion.button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold mb-2">{channel.title}</h3>
                            <p className="text-sm text-gray-400">
                              {channel.total_upvotes} upvotes • {channel.category}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>

                {/* Popular Channels */}
                <motion.section
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h2 className="text-xl font-semibold mb-4">Popular Channels</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {channels.filter(c => c.total_upvotes > 0).map((channel) => (
                      <motion.div
                        key={channel._id}
                        variants={itemVariants}
                        className="flex-none w-64 relative group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onHoverStart={() => setHoveredChannel(channel._id)}
                        onHoverEnd={() => setHoveredChannel(null)}
                      >
                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                          <div className="aspect-video bg-gray-700 relative">
                            <img
                              src={channel.thumbnail || 'https://via.placeholder.com/300x170'}
                              alt={channel.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <motion.button
                                className="bg-red-600 text-white px-4 py-2 rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedChannel(channel)}
                              >
                                More Info
                              </motion.button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold mb-2">{channel.title}</h3>
                            <p className="text-sm text-gray-400">
                              {channel.total_upvotes} upvotes • {channel.category}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              </>
          )}
        </div>
      </div>

      {/* Channel Modal */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            layoutId={selectedChannel._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center overflow-y-auto p-4"
            onClick={() => setSelectedChannel(null)}
          >
            <motion.div
              className="bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Image */}
              <div className="relative h-64 md:h-96 bg-cover bg-center" style={{ backgroundImage: `url(${selectedChannel.thumbnail || 'https://via.placeholder.com/800x450'})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                 <button onClick={() => setSelectedChannel(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2">&times;</button>
                <div className="absolute bottom-0 left-0 p-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{selectedChannel.title}</h1>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                 {isModalLoading && <p className="text-center">Loading vote status...</p>}
                 {error && <p className="text-red-500 text-center mb-4">Error: {error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Details */}
                  <div className="md:col-span-2 space-y-4">
                    <p className="text-gray-300">{selectedChannel.description}</p>
                    <div>
                      <h3 className="font-semibold text-gray-400">Broadcaster:</h3>
                      <p className="text-sm text-white truncate">{selectedChannel.creator}</p>
                    </div>
                    <div>
                       <h3 className="font-semibold text-gray-400">Current Price:</h3>
                       <p className="text-lg text-white font-bold">{selectedChannel.current_price.toFixed(2)} SOL</p>
                    </div>
                     <div>
                       <h3 className="font-semibold text-gray-400">Voting Ends:</h3>
                       <p className="text-sm text-white">{formatTimeLeft(selectedChannel.voting_end_time)}</p>
                    </div>
                  </div>

                  {/* Right Column: Voting */}
                  <div className="space-y-4">
                     <h3 className="text-xl font-bold text-center">Vote on Price</h3>
                      <div className="flex justify-around items-center bg-gray-800 p-4 rounded-lg">
                         <div className="text-center">
                            <p className="text-2xl font-bold text-green-500">{selectedChannel.total_upvotes}</p>
                            <p className="text-sm text-gray-400">Upvotes</p>
                         </div>
                         <div className="text-center">
                            <p className="text-2xl font-bold text-red-500">{selectedChannel.total_downvotes}</p>
                            <p className="text-sm text-gray-400">Downvotes</p>
                         </div>
                      </div>

                     {selectedChannel.is_voting_active && new Date() < new Date(selectedChannel.voting_end_time) ? (
                        <div className="flex space-x-4">
                           <motion.button
                             onClick={() => handleVote('upvote')}
                             disabled={isModalLoading || userVote?.vote_type === 'upvote'}
                             className={`flex-1 py-2 rounded-lg transition-colors ${userVote?.vote_type === 'upvote' ? 'bg-green-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-600'}`}
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                           >
                              Upvote
                           </motion.button>
                           <motion.button
                             onClick={() => handleVote('downvote')}
                             disabled={isModalLoading || userVote?.vote_type === 'downvote'}
                             className={`flex-1 py-2 rounded-lg transition-colors ${userVote?.vote_type === 'downvote' ? 'bg-red-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600'}`}
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                           >
                              Downvote
                           </motion.button>
                        </div>
                     ) : (
                         <p className="text-center text-gray-400">Voting has ended.</p>
                     )}
                      {userVote && <p className="text-center text-sm text-gray-400 mt-2">You voted: {userVote.vote_type}</p>}

                     {/* Add Watch Now / Payment button later */}
                      <motion.button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Watch Now (Pay {selectedChannel.current_price.toFixed(2)} SOL)</motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 