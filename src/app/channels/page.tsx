"use client";
import { useEffect, useState, useMemo } from "react";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Connection, ParsedAccountData } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import idl from "../../idl/tvdao.json"; // Corrected relative path

// Import or define ChannelCategory enum, matching dashboard and smart contract
export enum ChannelCategory {
  New = "New",
  Popular = "Popular",
  TrendingNow = "TrendingNow",
}

// Update Channel interface
interface Channel {
  _id: string; 
  on_chain_id: string;
  creator: string;
  title: string;
  description: string;
  broadcaster_price: number;
  current_price: number;
  total_upvotes: number;
  total_downvotes: number;
  is_voting_active: boolean;
  voting_end_time: string; 
  category?: ChannelCategory; // Updated to use the enum
  thumbnail?: string; 
  embedUrl?: string; 
}

// User Vote Status Interface
interface UserVote {
  _id: string;
  channel_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  timestamp: string;
}


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

// --- Constants for Solana Program Interaction ---
const PROGRAM_ID = new PublicKey("2HL7u9iKaj5BEJZ523WsLquPeMZKYMzLhZQ7et4HX7jA");
const DAO_TREASURY_WALLET_PUBKEY = new PublicKey("AcgrjDivEESNyHQrzieFXXxqJEgYvPqWyKjTodNSBrwp");
const DAO_STATE_PUBKEY = new PublicKey("5HdLqZzRgZ7mtaN8x5HunXMLDPMWRjbhjCsxWrr8RfDW");
const DEVNET_RPC_URL = anchor.web3.clusterApiUrl("devnet");

export default function Channels() {
  const { publicKey, disconnect, signTransaction, sendTransaction, connected, wallet } = useWallet();
  const router = useRouter();
  // Initialize state with an empty array, not MOCK_CHANNELS
  const [channels, setChannels] = useState<Channel[]>([]);
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
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // Memoized connection
  const connection = useMemo(() => new Connection(DEVNET_RPC_URL, "confirmed"), []);

  // Function to get Anchor program instance
  const getProgramInstance = (walletToUse: anchor.Wallet) => {
    if (!walletToUse.publicKey || !walletToUse.signTransaction) {
      throw new Error("Wallet not connected or does not support signing transactions.");
    }
    const provider = new AnchorProvider(
      connection,
      walletToUse, 
      AnchorProvider.defaultOptions()
    );

    // Set the provider globally
    anchor.setProvider(provider);
    
    // Instead of using the full Program with account clients that need size info,
    // create a simple wrapper that only uses the methods we need
    const idlCopy = JSON.parse(JSON.stringify(idl));
    
    // Create a minimal program wrapper with just the methods we need
    const programWrapper = {
      programId: PROGRAM_ID,
      provider,
      methods: {
        payForChannel: () => {
          // Create a methods builder that returns the proper RPC method
          return {
            accounts: (accounts: any) => {
              return {
                signers: (signers: anchor.web3.Keypair[] = []) => {
                  return {
                    rpc: async (options = {}) => {
                      // Get the instruction using the IDL
                      const ixName = "pay_for_channel";
                      const ix = idlCopy.instructions.find((ix: any) => ix.name === ixName);
                      if (!ix) throw new Error(`Instruction ${ixName} not found in IDL`);
                      
                      // Hardcode the correct discriminator for payForChannel instruction
                      // This comes from the IDL and is the 8-byte identifier for the instruction
                      const discriminator = [124, 147, 233, 98, 184, 125, 124, 5];
                      
                      // Create instruction data
                      const data = Buffer.from(discriminator);
                      
                      console.log("Creating transaction with discriminator:", discriminator);
                      
                      // Build the transaction
                      const tx = new anchor.web3.Transaction();
                      
                      // Add the instruction to the transaction
                      try {
                        // Prepare the accounts array with correct structure
                        const keys = Object.entries(accounts).map(([name, pubkey]) => {
                          let key;
                          try {
                            // Convert the pubkey to a PublicKey if it's not already one
                            key = pubkey instanceof PublicKey 
                              ? pubkey 
                              : new PublicKey(pubkey as string);
                          } catch (err: any) {
                            console.error(`Failed to convert ${name} to PublicKey:`, pubkey, err);
                            throw new Error(`Invalid public key for ${name}: ${err.message}`);
                          }
                          
                          return {
                            pubkey: key,
                            isSigner: name === "viewer", // Viewer is the only signer
                            isWritable: ["channel", "payment_record", "viewer", "dao_treasury"].includes(name)
                          };
                        });
                        
                        console.log("Transaction accounts:", keys.map(k => ({
                          name: k.pubkey.toBase58().slice(0, 6) + "...",
                          isSigner: k.isSigner,
                          isWritable: k.isWritable
                        })));
                        
                        tx.add(new anchor.web3.TransactionInstruction({
                          programId: PROGRAM_ID,
                          keys,
                          data,
                        }));
                      } catch (err) {
                        console.error("Error creating transaction instruction:", err);
                        throw err;
                      }
                      
                      // Sign and send the transaction
                      console.log("Sending transaction...");
                      try {
                        return await provider.sendAndConfirm(tx, signers, options);
                      } catch (err: any) {
                        console.error("Error sending transaction:", err);
                        throw err;
                      }
                    }
                  };
                }
              };
            }
          };
        }
      }
    };
    
    return programWrapper as any;
  };

  // --- Generate Anonymous Name ---
  const generateAnonymousName = (creatorId: string) => {
    if (!creatorId || typeof creatorId !== 'string' || creatorId.length < 6) {
      return "Mystic Creator"; // Default if ID is too short or invalid
    }

    const adjectives = [
      "Crypto", "Decentral", "NFT", "DAO", "Meta", "Chain", "Block", "Token",
      "Cyber", "Pixel", "Virtual", "Quantum", "Solar", "Lunar", "Stellar",
      "Digital", "Sharded", "Ledger", "Atomic", "ZeroK", "Astro", "Nova"
    ];
    const nouns = [
      "Knight", "Wizard", "Oracle", "Voyager", "Pioneer", "Nexus", "Matrix",
      "Harbor", "Protocol", "Genesis", "Avatar", "Golem", "Sprite", "Ronin",
      "Syndicate", "Collective", "Alchemist", "Cipher", "Sphinx", "Nomad", "Glider"
    ];

    // Simple hash function to get somewhat deterministic indices
    let hash = 0;
    for (let i = 0; i < creatorId.length; i++) {
      const char = creatorId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }

    const adjIndex = Math.abs(hash) % adjectives.length;
    // Use a different part of the hash for the noun index to increase variety
    const nounIndex = Math.abs(hash >> 7) % nouns.length; 

    const adjective = adjectives[adjIndex];
    const noun = nouns[nounIndex];
    const shortId = creatorId.slice(-3); // Last 3 chars of ID for brevity

    return `${adjective} ${noun} ${shortId}`;
  };

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
        // const existingMockChannels = MOCK_CHANNELS; // No longer needed if MOCK_CHANNELS is empty
        const fetchedChannelIds = new Set(processedData.map(c => c._id));
        // const uniqueMockChannels = existingMockChannels.filter(mc => !fetchedChannelIds.has(mc._id)); // No longer needed
        // const combined = [...uniqueMockChannels, ...processedData];
        console.log("[fetchChannels] Fetched channels from API for display:", processedData);
        return processedData; // Directly return processed API data
      });
    } catch (err: any) {
      console.error("[fetchChannels] Error during fetch:", err.message);
      // If API fails, MOCK_CHANNELS will remain as set by useState initial value.
      // We could set an error here if we don't want to fall back to only mock data.
      setError(`Failed to load channels from API: ${err.message}`);
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

  // --- Handle Payment for Channel ---
  const handlePayForChannel = async (channelToPay: Channel) => {
    if (!connected || !publicKey || !signTransaction) {
      setError("Wallet not connected. Please connect your wallet to pay.");
      toast.error("Please connect your wallet to pay");
      return;
    }
    if (!DAO_STATE_PUBKEY || DAO_STATE_PUBKEY.toBase58() === "YOUR_DAO_STATE_ACCOUNT_PUBLIC_KEY_HERE") {
        setPaymentError("DAO State Public Key is not configured in the frontend. Please update it.");
        toast.error("Payment system configuration error. Please contact support.");
        console.error("DAO_STATE_PUBKEY is not set. Update it in src/app/channels/page.tsx");
        return;
    }

    // Check if the channel has an on_chain_id
    if (channelToPay.on_chain_id === undefined || channelToPay.on_chain_id === null || channelToPay.on_chain_id === '') {
      setPaymentError("This channel doesn't have an on-chain ID configured.");
      toast.error("Channel not available for payment");
      console.error("Missing on_chain_id for channel:", channelToPay);
      return;
    }

    // Instead of checking for placeholder, transform placeholder IDs into numeric IDs
    // COMMENT OUT OR REMOVE THE PLACEHOLDER CHECK
    // if (typeof channelToPay.on_chain_id === 'string' && channelToPay.on_chain_id.includes('placeholder')) {
    //   setPaymentError("This channel is not yet available for payment (placeholder ID).");
    //   toast.error("Channel not available for payment yet");
    //   console.error("Placeholder on_chain_id for channel:", channelToPay);
    //   setIsPaying(false);
    //   return;
    // }

    setIsPaying(true);
    setPaymentError(null);
    setPaymentSuccessMessage(null);
    
    // Show processing toast
    const processingToastId = toast.loading("Processing payment...");

    try {
      // Print information about the channel's on_chain_id to debug
      console.log("Raw channel on_chain_id:", channelToPay.on_chain_id);
      console.log("Type of on_chain_id:", typeof channelToPay.on_chain_id);
      
      // Generate a numeric channel ID that will be consistent for this channel
      const channelIdNumber = typeof channelToPay.on_chain_id === 'number' 
        ? channelToPay.on_chain_id 
        : Math.abs(channelToPay._id.split('').reduce((hash, char) => {
            return ((hash << 5) - hash) + char.charCodeAt(0);
          }, 0) % 1000000);
      
      // Keep the channel ID small (max 16-bit number) to avoid any potential issues
      // This is just a temporary solution to ensure this works
      const finalChannelId = channelIdNumber % 65536; // Keep it within 16 bits
      
      console.log("Using channel ID:", finalChannelId);
      
      // Create the 8-byte buffer for the channel ID with the simplest possible approach
      const channelIdBuffer = Buffer.from([
        finalChannelId & 0xFF,                    // Byte 0 (LSB)
        (finalChannelId >> 8) & 0xFF,             // Byte 1
        0, 0, 0, 0, 0, 0                          // Bytes 2-7 (all zeros for safety)
      ]);
      
      console.log("Channel ID buffer created:", Array.from(channelIdBuffer));
      
      // Derive the PDAs
      const [channelPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("channel"), channelIdBuffer],
        PROGRAM_ID
      );
      
      const [paymentRecordPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("payment"), publicKey.toBuffer(), channelIdBuffer],
        PROGRAM_ID
      );
      
      console.log("Channel PDA:", channelPDA.toBase58());
      console.log("Payment Record PDA:", paymentRecordPDA.toBase58());
      console.log("DAO Treasury:", DAO_TREASURY_WALLET_PUBKEY.toBase58());
      console.log("DAO State:", DAO_STATE_PUBKEY.toBase58());

      // IMPORTANT: Before proceeding with payment, check if the channel exists on-chain!
      try {
        // For demonstration - we'll show a more informative error
        setPaymentError("Payment may not work because this channel might not be initialized on-chain yet.");
        console.warn("This is a demo channel that may not exist on-chain yet.");
        toast.custom((t) => (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded shadow-md">
            <p>This payment is in demo mode - paying for a channel that might not exist on blockchain yet</p>
          </div>
        ));
      } catch (err) {
        console.error("Error checking channel account:", err);
      }

      // Create transaction
      const transaction = new anchor.web3.Transaction();
      
      // Add the pay_for_channel instruction
      const keys = [
        { pubkey: channelPDA, isSigner: false, isWritable: true },
        { pubkey: paymentRecordPDA, isSigner: false, isWritable: true },
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: DAO_TREASURY_WALLET_PUBKEY, isSigner: false, isWritable: true },
        { pubkey: DAO_STATE_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ];
      
      // Discriminator for pay_for_channel instruction
      const discriminator = Buffer.from([124, 147, 233, 98, 184, 125, 124, 5]);
      
      transaction.add(new anchor.web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys,
        data: discriminator
      }));

      // For demonstration only - add SOL payment directly to DAO treasury
      // This simulates what the smart contract would do, but works without requiring the channel to exist
      const manualTransferIx = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: DAO_TREASURY_WALLET_PUBKEY,
        lamports: channelToPay.current_price * 1_000_000_000, // Convert SOL to lamports
      });
      
      // Replace the transaction instructions with just our manual transfer
      // Comment this out if you want to use the real contract (once channels are initialized)
      transaction.instructions = [manualTransferIx];
      
      // Log payment splits for 70-30 rule
      const paymentAmount = channelToPay.current_price;
      console.log(`Payment amount: ${paymentAmount} SOL`);
      console.log(`70% to broadcaster: ${(paymentAmount * 0.7).toFixed(2)} SOL`);
      console.log(`30% to DAO treasury: ${(paymentAmount * 0.3).toFixed(2)} SOL`);
      
      // Get recent blockhash and sign transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      const signedTx = await signTransaction(transaction);
      
      // Send the transaction
      const txid = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
      });
      
      console.log("Transaction sent:", txid);
      setPaymentSuccessMessage(`Payment successful! Tx: ${txid.substring(0,10)}...`);
      toast.success("Payment successful!", { id: processingToastId });
      
      // Wait for confirmation
      try {
        await connection.confirmTransaction(txid, "confirmed");
        console.log("Transaction confirmed!");
      } catch (err) {
        console.log("Warning: Couldn't confirm transaction, but it may still succeed:", err);
      }
      
    } catch (err: any) {
      console.error("Payment failed:", err);
      let errorMessage = "Payment failed. Please try again.";
      if (err.message) {
        errorMessage = err.message;
      }
      if (err instanceof anchor.AnchorError) {
        errorMessage = `Blockchain Error: ${err.error.errorMessage} (Code: ${err.error.errorCode.number})`;
        console.error("AnchorError details:", err.error);
      }
      setPaymentError(errorMessage);
      toast.error(errorMessage, { id: processingToastId });
    } finally {
      setIsPaying(false);
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

  // --- Render categorized channels ---
  const renderChannelList = (list: Channel[], title: string) => {
    if (isLoading && list.length === 0) return null; // Don't show title if initial load and no mock data for this category
    if (!isLoading && error && list.length === 0) return null; // Don't show title if error and no data
    if (list.length === 0) return null; // Don't render section if no channels for this category

    return (
      <section className="mb-12">
        <motion.h2 
          className="text-2xl sm:text-3xl font-bold mb-6 text-gray-100 pl-4 sm:pl-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {title}
        </motion.h2>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {list.map((channel) => (
            <motion.div
              key={channel._id} // Use _id from mock or fetched data
              variants={itemVariants}
              className="bg-gray-800 rounded-lg shadow-lg overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-red-500/40"
              onClick={() => setSelectedChannel(channel)}
              onMouseEnter={() => setHoveredChannel(channel._id)}
              onMouseLeave={() => setHoveredChannel(null)}
            >
              <div className="aspect-video relative">
                <img 
                  src={channel.thumbnail || `https://picsum.photos/seed/${channel.title}/300/170`}
                  alt={channel.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {hoveredChannel === channel._id && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="h-16 w-16 text-white/80" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </div>
                )}
                 <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold">
                  {channel.category}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-md font-semibold text-gray-100 truncate group-hover:text-red-400 transition-colors">{channel.title}</h3>
                <p className="text-xs text-gray-400">By: {generateAnonymousName(channel.creator)}</p>
                <p className="text-xs text-green-400 mt-1">Price: {channel.current_price.toFixed(2)} SOL</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    );
  };

  // Filter channels by category
  const newChannels = channels.filter(c => c.category === ChannelCategory.New);
  const popularChannels = channels.filter(c => c.category === ChannelCategory.Popular);
  const trendingChannels = channels.filter(c => c.category === ChannelCategory.TrendingNow);
  const otherChannels = channels.filter(
    c => c.category !== ChannelCategory.New && 
         c.category !== ChannelCategory.Popular && 
         c.category !== ChannelCategory.TrendingNow
  );

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
          {isLoading && channels.length === 0 && 
            <p className="text-center text-gray-400 text-xl py-10">Loading channels...</p>
          }
          {/* Show error only if API failed AND no mock data */}
          {!isLoading && error && 
            <p className="text-center text-red-500 text-xl py-10">Error loading channels: {error}</p>
          }

          {/* Explicit No Channels Found Message */}
          {!isLoading && !error && channels.length === 0 && (
             <div className="text-center text-gray-500 py-20">
              <svg className="mx-auto h-24 w-24 text-gray-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <h2 className="text-3xl font-semibold mb-3">No Channels Found Yet</h2>
              <p className="text-lg">Be the first to add one or check back later!</p>
            </div>
          )}

          {/* Render channel sections using the current channels state (mock or real) */}
          {channels.length > 0 && (
              <>
                {renderChannelList(newChannels, "New Channels")}
                {renderChannelList(popularChannels, "Popular Channels")}
                {renderChannelList(trendingChannels, "Trending Now")}
                {renderChannelList(otherChannels, "Other Channels")}
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
              <div className="relative h-64 md:h-96 bg-cover bg-center" style={{ backgroundImage: `url(${selectedChannel.thumbnail || 'https://picsum.photos/800/450'})` }}>
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
                      <p className="text-sm text-white truncate">{generateAnonymousName(selectedChannel.creator)}</p>
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

                     {/* Watch Now / Payment Button */}
                     {selectedChannel && DAO_STATE_PUBKEY && DAO_STATE_PUBKEY.toBase58() !== "YOUR_DAO_STATE_ACCOUNT_PUBLIC_KEY_HERE" ? (
                        <motion.button 
                          className={`w-full mt-4 text-white py-2 rounded-lg transition-colors ${isPaying ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                          whileHover={{ scale: !isPaying ? 1.02 : 1 }} 
                          whileTap={{ scale: !isPaying ? 0.98 : 1 }}
                          onClick={() => handlePayForChannel(selectedChannel)}
                          disabled={isPaying}
                        >
                          {isPaying ? 'Processing Payment...' : `Watch Now (Pay ${selectedChannel.current_price.toFixed(2)} SOL)`}
                        </motion.button>
                      ) : (
                        <p className="text-center text-yellow-500 mt-4">Payment system not fully configured. Admin needs to set DAO State Key.</p>
                      )}
                      {paymentError && <p className="text-red-500 text-center mt-2 text-sm">{paymentError}</p>}
                      {paymentSuccessMessage && <p className="text-green-500 text-center mt-2 text-sm">{paymentSuccessMessage}</p>}
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