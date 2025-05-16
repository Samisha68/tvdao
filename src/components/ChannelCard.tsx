"use client";
import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VotingTimer } from "./VotingTimer";
import { PayToWatchButton } from "./PayToWatchButton";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { RevenueDisplay } from "./RevenueDisplay";

// Heroicons
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export type Channel = {
  id: string;
  name: string;
  embedUrl: string;
  broadcaster: string;
  votingEndsAt: number;
  votes: { [amount: number]: number };
  userVotes: { [userPublicKey: string]: number };
  finalPrice?: number;
  paidUsers?: string[];
  revenue?: number;
};

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

export const ChannelCard: FC<{ channel: Channel; userPublicKey?: string }> = ({ channel, userPublicKey }) => {
  const [votes, setVotes] = useState(channel.votes);
  const [userVotes, setUserVotes] = useState(channel.userVotes || {});
  const [finalPrice, setFinalPrice] = useState<number | undefined>(channel.finalPrice);
  const [paidUsers, setPaidUsers] = useState(channel.paidUsers || []);
  const [revenue, setRevenue] = useState(channel.revenue || 0);
  const [votingEnded, setVotingEnded] = useState(Date.now() > channel.votingEndsAt);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const isBroadcaster = userPublicKey === channel.broadcaster;
  const isPaid = !!userPublicKey && paidUsers.includes(userPublicKey);
  const canVote = !finalPrice && !votingEnded && !!userPublicKey && !userVotes[userPublicKey];
  const canPay = !!finalPrice && !isPaid && !!userPublicKey;

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleVote = (amount: number) => {
    if (!canVote || !userPublicKey) return;
    setVotes((prev) => ({ ...prev, [amount]: (prev[amount] || 0) + 1 }));
    setUserVotes((prev) => ({ ...prev, [userPublicKey]: amount }));
  };

  const handleFinalize = () => {
    const currentVotes = votes;
    const maxVoteCount = Math.max(...[1, 2, 3].map((amt) => currentVotes[amt] || 0));
    const winningPrice = [1, 2, 3].find((amt) => currentVotes[amt] === maxVoteCount) || 1;
    setFinalPrice(winningPrice);
    setVotingEnded(true);
  };

  const handlePay = () => {
    if (!userPublicKey || !finalPrice) return;
    try {
      setPaidUsers((prev) => [...prev, userPublicKey]);
      setRevenue((prev) => prev + finalPrice);
      setStatusMessage({ type: 'success', text: 'Content Unlocked!' });
    } catch (error) {
      console.error("Payment simulation failed:", error);
      setStatusMessage({ type: 'error', text: 'Payment Failed. Try Again.' });
    }
  };

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-zinc-900 to-black shadow-xl w-full max-w-sm h-[460px] flex flex-col text-white transition-transform hover:scale-[1.01]">
      {/* Optional: Cinematic TVDAO logo effect */}
      {/* <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 10 }}
        className="text-center text-2xl font-bold tracking-widest font-bebas mb-2"
      >
        TVDAO
      </motion.div> */}

      <div className="font-extrabold text-xl tracking-wide mb-1 font-[NetflixSans, Bebas Neue, sans-serif]">
        {channel.name}
      </div>

      <div className="text-[0.7rem] text-zinc-400 mb-2 italic">
        by {channel.broadcaster}
      </div>

      <div className="mb-2">
        {finalPrice ? (
          <span className="text-blue-400 font-semibold">Final Price: {finalPrice} USDC</span>
        ) : (
          <VotingTimer votingEndsAt={channel.votingEndsAt} onExpire={() => { setVotingEnded(true); handleFinalize(); }} />
        )}
      </div>

      {!finalPrice && canVote && (
        <div className="flex gap-2 mb-3">
          {[1, 2, 3].map((amt) => (
            <button
              key={amt}
              className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
              onClick={() => handleVote(amt)}
            >
              {amt} USDC ({votes[amt] || 0})
            </button>
          ))}
        </div>
      )}

      {finalPrice && !isPaid && !isBroadcaster && (
        <PayToWatchButton price={finalPrice} onPay={handlePay} />
      )}

      <div className="relative mt-auto flex-grow overflow-hidden rounded-xl border border-white/10 shadow-md">
        <YouTubeEmbed embedUrl={channel.embedUrl} />

        {!isPaid && !statusMessage && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center text-white rounded-xl">
            <div className="text-center space-y-1">
              <p className="font-bebas text-2xl tracking-wider">LOCKED</p>
              <p className="text-xs text-gray-200">
                {canPay ? `Pay ${finalPrice} USDC to unlock` :
                  finalPrice && !canPay ? `Connect wallet to unlock` :
                  votingEnded ? `Voting ended, finalizing...` :
                  `Voting in progress`}
              </p>
            </div>
          </div>
        )}

        {statusMessage && (
          <motion.div
            className={`absolute inset-0 flex flex-col items-center justify-center p-4 rounded-xl z-10 shadow-xl
                        ${statusMessage.type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'} text-white`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {statusMessage.type === 'success' ? 
              <CheckCircleIcon className="w-10 h-10 mb-2" /> : 
              <XCircleIcon className="w-10 h-10 mb-2" />
            }
            <p className="font-bebas text-lg tracking-wider">{statusMessage.text}</p>
          </motion.div>
        )}
      </div>

      {isBroadcaster && (
        <div className="mt-4 space-y-2">
          <RevenueDisplay revenue={revenue} />
          {votingEnded && !finalPrice && (
            <button
              onClick={handleFinalize}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold"
            >
              Finalize Price
            </button>
          )}
        </div>
      )}
    </div>
  );
};
