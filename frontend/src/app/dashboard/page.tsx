"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

// Mock data for earnings and channels
const MOCK_EARNINGS = {
  total: 25.5,
  lastMonth: 8.2,
  pending: 3.1,
};

const MOCK_CHANNELS = [
  {
    id: "1",
    name: "Crypto News Network",
    views: 1500,
    revenue: 12.5,
    status: "active",
  },
  {
    id: "2",
    name: "Solana Live",
    views: 2800,
    revenue: 18.2,
    status: "active",
  },
  {
    id: "3",
    name: "DeFi Daily",
    views: 950,
    revenue: 6.8,
    status: "pending",
  },
];

export default function Dashboard() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      router.push("/signin");
    }
  }, [publicKey, router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            <div className="flex items-center space-x-4">
              <Link href="/channels">
                <motion.button
                  className="text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Channels
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
        {/* Hero Section */}
        <motion.div
          className="relative h-[40vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black z-10" />
          <div className="absolute inset-0 bg-[url('/dashboard-bg.jpg')] bg-cover bg-center" />
          <div className="relative z-20 h-full flex flex-col items-start justify-end p-8 md:p-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="max-w-2xl"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Creator Dashboard
              </h1>
              <p className="text-lg md:text-xl text-gray-300">
                Manage your channels and track your earnings
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Earnings Overview */}
            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-6">Earnings Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-gray-400 mb-2">Total Earnings</h3>
                  <p className="text-3xl font-bold text-red-500">
                    {MOCK_EARNINGS.total} SOL
                  </p>
                </motion.div>
                <motion.div
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-gray-400 mb-2">Last Month</h3>
                  <p className="text-3xl font-bold text-green-500">
                    {MOCK_EARNINGS.lastMonth} SOL
                  </p>
                </motion.div>
                <motion.div
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-gray-400 mb-2">Pending</h3>
                  <p className="text-3xl font-bold text-yellow-500">
                    {MOCK_EARNINGS.pending} SOL
                  </p>
                </motion.div>
              </div>
            </motion.section>

            {/* Channel Management */}
            <motion.section variants={itemVariants}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Channels</h2>
                <motion.button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add New Channel
                </motion.button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_CHANNELS.map((channel) => (
                  <motion.div
                    key={channel.id}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold">{channel.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            channel.status === "active"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {channel.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400">
                          Views: {channel.views.toLocaleString()}
                        </p>
                        <p className="text-gray-400">
                          Revenue: {channel.revenue} SOL
                        </p>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <motion.button
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Analytics
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 