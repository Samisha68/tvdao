'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import CreatorForm from '@/components/CreatorForm';

export default function CreatorWaitlistPage() {
  return (
    <div className="min-h-screen w-full bg-black text-[#FFFFFF] font-sans relative overflow-x-hidden">
      {/* Background Overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 z-0" />
        <div className="absolute inset-0 bg-[url('/dashboard-bg.jpg')] bg-cover bg-center opacity-60 scale-110 z-0" />
      </div>

      {/* Nav Bar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Logo size={96} />
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="pt-28">
        <div className="relative z-10 flex justify-center">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-12 mx-auto max-w-2xl w-full mt-12 mb-12">
            <div className="pt-12 pb-16">
              {/* Header */}
              <motion.div 
                className="mb-16 text-center relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-1 bg-gradient-to-r from-transparent via-[#E50914]/30 to-transparent"></div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-[#FFFFFF] tracking-tight">Become a Creator</h1>
                <p className="text-xl text-[#AAAAAA] max-w-xl mx-auto mb-2">Join our waitlist to start your journey as a content creator on TV DAO.</p>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 h-1 bg-gradient-to-r from-transparent via-[#E50914]/30 to-transparent"></div>
              </motion.div>

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CreatorForm />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 