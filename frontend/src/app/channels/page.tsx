"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Channel {
  id: string;
  name: string;
  embedUrl: string;
  broadcaster: string;
  votingEndsAt: number;
  votes: { [amount: number]: number };
  userVotes: { [userPublicKey: string]: number };
  finalPrice?: number;
  paidUsers: string[];
  revenue: number;
  category: string;
  thumbnail: string;
}

// Mock data for channels
const MOCK_CHANNELS: Channel[] = [
  {
    id: "1",
    name: "Crypto News Network",
    embedUrl: "https://www.youtube.com/embed/your-video-id",
    broadcaster: "0x1234...5678",
    votingEndsAt: Date.now() + 86400000,
    votes: { 1: 150 },
    userVotes: {},
    finalPrice: 0.5,
    paidUsers: [],
    revenue: 0,
    category: "News",
    thumbnail: "https://images.unsplash.com/photo-1639762681057-408e52192e55",
  },
  {
    id: "2",
    name: "Solana Live",
    embedUrl: "https://www.youtube.com/embed/your-video-id",
    broadcaster: "0x8765...4321",
    votingEndsAt: Date.now() + 43200000,
    votes: { 1: 200 },
    userVotes: {},
    finalPrice: 0.8,
    paidUsers: ["user1"],
    revenue: 160,
    category: "Live",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
  },
  {
    id: "3",
    name: "DeFi Daily",
    embedUrl: "https://www.youtube.com/embed/your-video-id",
    broadcaster: "0x2468...1357",
    votingEndsAt: Date.now() + 21600000,
    votes: { 1: 180 },
    userVotes: {},
    finalPrice: 0.6,
    paidUsers: ["user1", "user2"],
    revenue: 120,
    category: "Education",
    thumbnail: "https://images.unsplash.com/photo-1639762681057-408e52192e55",
  },
  {
    id: "4",
    name: "NFT Showcase",
    embedUrl: "https://www.youtube.com/embed/your-video-id",
    broadcaster: "0x1357...2468",
    votingEndsAt: Date.now() + 172800000,
    votes: { 1: 250 },
    userVotes: {},
    finalPrice: 1.0,
    paidUsers: ["user1", "user2", "user3"],
    revenue: 300,
    category: "Art",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
  },
  {
    id: "5",
    name: "Web3 Gaming",
    embedUrl: "https://www.youtube.com/embed/your-video-id",
    broadcaster: "0x9876...5432",
    votingEndsAt: Date.now() + 259200000,
    votes: { 1: 300 },
    userVotes: {},
    finalPrice: 0.7,
    paidUsers: ["user1", "user2"],
    revenue: 210,
    category: "Gaming",
    thumbnail: "https://images.unsplash.com/photo-1639762681057-408e52192e55",
  },
  {
    id: "6",
    name: "Crypto Trading",
    embedUrl: "https://www.youtube.com/embed/your-video-id",
    broadcaster: "0x5432...9876",
    votingEndsAt: Date.now() + 345600000,
    votes: { 1: 220 },
    userVotes: {},
    finalPrice: 0.9,
    paidUsers: ["user1", "user2", "user3", "user4"],
    revenue: 360,
    category: "Trading",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
  },
  {
    id: "7",
    name: "Blockchain Tech",
    embedUrl: "https://www.youtube.com/embed/your-video-id",
    broadcaster: "0x7890...1234",
    votingEndsAt: Date.now() + 432000000,
    votes: { 1: 170 },
    userVotes: {},
    finalPrice: 0.5,
    paidUsers: ["user1"],
    revenue: 85,
    category: "Technology",
    thumbnail: "https://images.unsplash.com/photo-1639762681057-408e52192e55",
  },
  {
    id: "8",
    name: "Crypto Comedy",
    embedUrl: "https://www.youtube.com/embed/your-video-id",
    broadcaster: "0x3456...7890",
    votingEndsAt: Date.now() + 518400000,
    votes: { 1: 190 },
    userVotes: {},
    finalPrice: 0.6,
    paidUsers: ["user1", "user2"],
    revenue: 114,
    category: "Entertainment",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
  },
];

export default function Channels() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect to sign-in if not connected
  useEffect(() => {
    if (!publicKey) {
      router.push('/signin');
    }
  }, [publicKey, router]);

  const userPublicKeyString = publicKey?.toBase58() || '';

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

  const handleVote = (amount: number) => {
    if (!publicKey) return;
    const userPublicKeyString = publicKey.toBase58();
    setChannels(channels.map(channel => {
      if (channel.id === selectedChannel?.id) {
        return {
          ...channel,
          votes: {
            ...channel.votes,
            [amount]: (channel.votes[amount] || 0) + 1
          },
          userVotes: {
            ...channel.userVotes,
            [userPublicKeyString]: amount
          }
        };
      }
      return channel;
    }));
  };

  const getVotingProgress = (channel: Channel) => {
    const totalVotes = Object.values(channel.votes).reduce((a, b) => a + b, 0);
    const maxVotes = Math.max(...Object.values(channel.votes));
    return (maxVotes / totalVotes) * 100;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Bar */}
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-transparent'
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
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <motion.button
                  className="text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dashboard
                </motion.button>
              </Link>
              <Link href="/">
                <motion.button
                  className="text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Home
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="pt-20">
        {/* Featured Channel */}
        <motion.div
          className="relative h-[70vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
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

        {/* Channel Categories */}
        <div className="py-12 px-4 md:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            {/* Trending Now */}
            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                {channels.map((channel) => (
                  <motion.div
                    key={channel.id}
                    className="flex-none w-64 relative group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredChannel(channel.id)}
                    onHoverEnd={() => setHoveredChannel(null)}
                  >
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-700 relative">
                        <img
                          src={channel.thumbnail}
                          alt={channel.name}
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
                        <h3 className="font-bold mb-2">{channel.name}</h3>
                        <p className="text-sm text-gray-400">
                          {channel.votes[1]} votes • {channel.category}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* New Channels */}
            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-6">New Channels</h2>
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                {channels.filter(c => !c.finalPrice).map((channel) => (
                  <motion.div
                    key={channel.id}
                    className="flex-none w-64 relative group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredChannel(channel.id)}
                    onHoverEnd={() => setHoveredChannel(null)}
                  >
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-700 relative">
                        <img
                          src={channel.thumbnail}
                          alt={channel.name}
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
                        <h3 className="font-bold mb-2">{channel.name}</h3>
                        <p className="text-sm text-gray-400">
                          {channel.votes[1]} votes • {channel.category}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Popular Channels */}
            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-6">Popular Channels</h2>
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                {channels.filter(c => c.paidUsers?.length > 0).map((channel) => (
                  <motion.div
                    key={channel.id}
                    className="flex-none w-64 relative group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredChannel(channel.id)}
                    onHoverEnd={() => setHoveredChannel(null)}
                  >
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-700 relative">
                        <img
                          src={channel.thumbnail}
                          alt={channel.name}
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
                        <h3 className="font-bold mb-2">{channel.name}</h3>
                        <p className="text-sm text-gray-400">
                          {channel.votes[1]} votes • {channel.category}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>

      {/* Channel Modal */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedChannel(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900/95 rounded-lg max-w-4xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Background */}
              <div className="relative h-64">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/95 z-10" />
                <img
                  src={selectedChannel.thumbnail}
                  alt={selectedChannel.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                  <h2 className="text-3xl font-bold mb-2">{selectedChannel.name}</h2>
                  <p className="text-gray-300">{selectedChannel.category}</p>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Channel Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Channel Details</h3>
                    <div className="space-y-2 text-gray-300">
                      <p>Broadcaster: {selectedChannel.broadcaster}</p>
                      <p>Total Revenue: {selectedChannel.revenue} SOL</p>
                      <p>Paid Users: {selectedChannel.paidUsers.length}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Voting Status</h3>
                    <div className="space-y-2 text-gray-300">
                      <p>Voting Ends: {new Date(selectedChannel.votingEndsAt).toLocaleDateString()}</p>
                      <p>Total Votes: {Object.values(selectedChannel.votes).reduce((a, b) => a + b, 0)}</p>
                      {selectedChannel.finalPrice && (
                        <p>Final Price: {selectedChannel.finalPrice} SOL</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Voting Section */}
                {!selectedChannel.finalPrice && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vote for Price</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[0.5, 1, 2].map((amount) => (
                        <motion.button
                          key={amount}
                          className={`p-4 rounded-lg text-center ${
                            selectedChannel.userVotes[publicKey?.toBase58() || ''] === amount
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleVote(amount)}
                        >
                          <div className="text-xl font-bold">{amount} SOL</div>
                          <div className="text-sm">
                            {selectedChannel.votes[amount] || 0} votes
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    {/* Voting Progress */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="bg-red-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${getVotingProgress(selectedChannel)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <motion.button
                    className="px-6 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedChannel(null)}
                  >
                    Close
                  </motion.button>
                  {selectedChannel.finalPrice && (
                    <motion.button
                      className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Watch Now
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 