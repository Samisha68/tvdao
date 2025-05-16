"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Define animation variants for typewriter effect
const h1TypewriterVariants = {
  initial: { opacity: 1 }, // Container is visible
  animate: { // Changed from animateLetters to a more generic name
    transition: {
      delayChildren: 0.2,   // Optional: delay before typing starts
      staggerChildren: 0.12, // Speed of the typewriter effect (time between letters)
    },
  },
};

const letterTypewriterVariants = {
  initial: { opacity: 0 },
  animate: { // Changed from animateLetters
    opacity: 1,
    transition: { duration: 0.01 }, // Letters appear almost instantly once their stagger time hits
  },
};

export default function Home() {
  const siteTitle = "TV DAO";
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Logo Top Left */}
      <div className="absolute top-0 left-0 z-30 p-6">
        <Image 
          src="/tvdao-logo.png" 
          alt="TV DAO Logo" 
          width={120}
          height={120}
          priority
        />
      </div>
      {/* Hero Section */}
      <div className="relative h-screen flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/30 z-10" />
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-60" />
        <motion.div 
          className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* TV DAO Title - much bigger, centered, no hover glitter */}
          <motion.h1 
            className="font-bebas text-8xl md:text-[12rem] lg:text-[15rem] font-bold mb-6 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"
            variants={h1TypewriterVariants}
            initial="initial"
            animate="animate"
          >
            {siteTitle.split('').map((char, index) => (
              <motion.span 
                key={`${char}-${index}`} 
                variants={letterTypewriterVariants}
                className="inline-block"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p 
            className="text-3xl md:text-4xl lg:text-5xl mb-8 max-w-3xl text-gray-300"
            initial={{ y: 30, opacity: 0 }}
            animate={{
              opacity: 1,
              y: [null, 0, "3px", "-3px", "0px"],
            }}
            transition={{
              opacity: { delay: 0.4, duration: 0.8 },
              y: {
                delay: 0.4,
                duration: 4.5,
                repeat: Infinity,
                times: [0, 0.178, 0.452, 0.726, 1],
                ease: ["easeOut", "easeInOut", "easeInOut", "easeInOut"],
              },
            }}
          >
            EARN WHILE YOU WATCH.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link href="/signin">
              <motion.button 
                className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-4 rounded-lg transition-all duration-300"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 8px #ff0000, 0 0 12px #ff0000, 0 0 15px #ff0000",
                  transition: { duration: 0.3 }
                }}
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
          className="text-5xl font-extrabold text-center mb-16 text-[#E50914] drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Why You'll Love TV DAO
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-16 max-w-6xl mx-auto">
          <motion.div 
            className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/10 hover:scale-105 hover:shadow-red-500/30 transition-all duration-300 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            whileHover={{ scale: 1.07 }}
          >
            <h3 className="text-2xl font-bold mb-3 transition-colors duration-200 group-hover:text-red-400">You Call the Shots</h3>
            <p className="text-gray-200 text-lg transition-colors duration-200 group-hover:text-white">No more yelling at your TV! Vote on what gets aired and set the price. (Remote not included.)</p>
          </motion.div>
          <motion.div 
            className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/10 hover:scale-105 hover:shadow-red-500/30 transition-all duration-300 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            whileHover={{ scale: 1.07 }}
          >
            <h3 className="text-2xl font-bold mb-3 transition-colors duration-200 group-hover:text-red-400">Earn While You Chill</h3>
            <p className="text-gray-200 text-lg transition-colors duration-200 group-hover:text-white">Get rewarded for supporting creators and being part of the DAO. Yes, you can finally say you made money watching TV.</p>
          </motion.div>
          <motion.div 
            className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/10 hover:scale-105 hover:shadow-red-500/30 transition-all duration-300 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
            whileHover={{ scale: 1.07 }}
          >
            <h3 className="text-2xl font-bold mb-3 transition-colors duration-200 group-hover:text-red-400">Premium Content, Zero Gatekeeping</h3>
            <p className="text-gray-200 text-lg transition-colors duration-200 group-hover:text-white">Access exclusive shows from top creators. Bring your own popcorn (BYOP)!</p>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-900/60 py-12 px-4 md:px-8">
        <motion.h2 
          className="text-5xl font-extrabold text-center mb-16 text-[#E50914] drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          How It Works (It's Easy, Promise!)
        </motion.h2>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border-2 border-dashed border-red-400/40 shadow-xl text-center hover:scale-105 transition-transform duration-300 cursor-pointer max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              whileHover={{ scale: 1.08 }}
            >
              <h3 className="text-lg font-bold mb-2 transition-colors duration-200 group-hover:text-red-400">Step 1: Connect Wallet</h3>
              <p className="text-gray-200 text-base transition-colors duration-200 group-hover:text-white">Just a click! No secret handshakes or blood oaths required. (We like you already.)</p>
            </motion.div>
            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border-2 border-dashed border-red-400/40 shadow-xl text-center hover:scale-105 transition-transform duration-300 cursor-pointer max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              whileHover={{ scale: 1.08 }}
            >
              <h3 className="text-lg font-bold mb-2 transition-colors duration-200 group-hover:text-red-400">Step 2: Vote & Decide</h3>
              <p className="text-gray-200 text-base transition-colors duration-200 group-hover:text-white">Pick your faves, set the price, and flex your TV taste. (No judgment. Okay, maybe a little.)</p>
            </motion.div>
            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border-2 border-dashed border-red-400/40 shadow-xl text-center hover:scale-105 transition-transform duration-300 cursor-pointer max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
              whileHover={{ scale: 1.08 }}
            >
              <h3 className="text-lg font-bold mb-2 transition-colors duration-200 group-hover:text-red-400">Step 3: Earn & Enjoy</h3>
              <p className="text-gray-200 text-base transition-colors duration-200 group-hover:text-white">Kick back, watch, and maybe brag to your friends. (We won't tell if you binge.)</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <motion.footer 
        className="py-10 px-4 md:px-8 text-center text-gray-500 border-t border-gray-700/50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <p>&copy; {new Date().getFullYear()} TV DAO. All rights reserved.</p>
        <p className="mt-2">
          Follow us on X: 
          <Link href="https://x.com/tvdao24640" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 transition-colors">
            @tvdao24640
          </Link>
        </p>
      </motion.footer>
    </div>
  );
}
