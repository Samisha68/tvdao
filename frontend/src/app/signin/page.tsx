"use client";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignIn() {
  const { publicKey, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (publicKey) {
      router.push("/channels");
    }
  }, [publicKey, router]);

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
      {/* Hero Section */}
      <div className="relative h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black z-10" />
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center" />
        
        {/* Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center p-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-md w-full space-y-8"
          >
            <motion.div variants={itemVariants} className="text-center">
              <Link href="/">
                <motion.h1
                  className="text-5xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  TV DAO
                </motion.h1>
              </Link>
              <p className="text-gray-400">Connect your wallet to continue</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-black/60 backdrop-blur-md p-8 rounded-lg shadow-xl border border-red-900/10"
            >
              <motion.button
                onClick={() => connect()}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Connect Wallet</span>
              </motion.button>

              <motion.div
                variants={itemVariants}
                className="mt-6 text-center"
              >
                <p className="text-gray-400 mb-4">Don't have a wallet?</p>
                <motion.a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-500 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Phantom Wallet
                </motion.a>
              </motion.div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="text-center"
            >
              <Link href="/">
                <motion.button
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back to Home
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 