"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black z-10" />
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center" />
        <motion.div 
          className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            TV DAO
          </motion.h1>
          <motion.p 
            className="text-2xl md:text-3xl mb-8 max-w-3xl text-gray-300"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Decentralized TV channels powered by Solana. Vote, earn, and watch content you love.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link href="/signin">
              <motion.button 
                className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-4 rounded-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Watch Now
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 md:px-8">
        <motion.h2 
          className="text-4xl font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Why TV DAO?
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-4">Vote on Content</h3>
            <p className="text-gray-400">Have a say in what content gets broadcasted and at what price.</p>
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-2xl font-bold mb-4">Earn Rewards</h3>
            <p className="text-gray-400">Get rewarded for participating in the DAO and supporting content creators.</p>
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="text-5xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold mb-4">Premium Content</h3>
            <p className="text-gray-400">Access exclusive content from top creators in the crypto space.</p>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-900 py-20 px-4 md:px-8">
        <motion.h2 
          className="text-4xl font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          How It Works
        </motion.h2>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-gray-800 p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="text-3xl font-bold text-red-600 mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
              <p className="text-gray-400">Connect your Solana wallet to get started</p>
            </motion.div>
            <motion.div 
              className="bg-gray-800 p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="text-3xl font-bold text-red-600 mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Vote on Content</h3>
              <p className="text-gray-400">Vote on your favorite channels and content</p>
            </motion.div>
            <motion.div 
              className="bg-gray-800 p-6 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <div className="text-3xl font-bold text-red-600 mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Earn & Watch</h3>
              <p className="text-gray-400">Earn rewards and watch premium content</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 md:px-8 text-center">
        <motion.h2 
          className="text-4xl font-bold mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Ready to Start?
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <Link href="/signin">
            <motion.button 
              className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-4 rounded-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
