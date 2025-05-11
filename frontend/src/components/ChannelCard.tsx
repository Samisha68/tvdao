"use client";
import { FC, useState } from "react";
import { VotingTimer } from "./VotingTimer";
import { PayToWatchButton } from "./PayToWatchButton";
import { UnlockOverlay } from "./UnlockOverlay";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { RevenueDisplay } from "./RevenueDisplay";

export type Channel = {
  id: string;
  name: string;
  embedUrl: string;
  broadcaster: string;
  votingEndsAt: number; // timestamp
  votes: { [amount: number]: number };
  userVotes: { [userPublicKey: string]: number }; // Track votes per user
  finalPrice?: number;
  paidUsers?: string[];
  revenue?: number;
};

export const ChannelCard: FC<{ channel: Channel; userPublicKey?: string }> = ({ channel, userPublicKey }) => {
  const [votes, setVotes] = useState(channel.votes);
  const [userVotes, setUserVotes] = useState(channel.userVotes || {});
  const [finalPrice, setFinalPrice] = useState<number | undefined>(channel.finalPrice);
  const [paidUsers, setPaidUsers] = useState(channel.paidUsers || []);
  const [revenue, setRevenue] = useState(channel.revenue || 0);
  const [votingEnded, setVotingEnded] = useState(Date.now() > channel.votingEndsAt);

  const isBroadcaster = userPublicKey === channel.broadcaster;
  const isPaid = !!userPublicKey && paidUsers.includes(userPublicKey);
  const canVote = !finalPrice && !votingEnded && !!userPublicKey && !userVotes[userPublicKey];
  const canPay = !!finalPrice && !isPaid && !!userPublicKey;

  const handleVote = (amount: number) => {
    if (!canVote || !userPublicKey) return;
    setVotes((prev) => ({ ...prev, [amount]: (prev[amount] || 0) + 1 }));
    setUserVotes((prev) => ({ ...prev, [userPublicKey]: amount }));
  };

  const handleFinalize = () => {
    // Find the price with the most votes
    const maxVotes = Math.max(...[1, 2, 3].map((amt) => votes[amt] || 0));
    const winning = [1, 2, 3].find((amt) => votes[amt] === maxVotes) || 1;
    setFinalPrice(winning);
    setVotingEnded(true);
  };

  const handlePay = () => {
    if (!userPublicKey || !finalPrice) return;
    setPaidUsers((prev) => [...prev, userPublicKey]);
    setRevenue((prev) => prev + finalPrice);
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-zinc-900 shadow relative w-64 h-96 flex flex-col">
      <div className="font-bold text-lg mb-2">{channel.name}</div>
      <div className="text-xs text-zinc-500 mb-2">Broadcaster: {channel.broadcaster}</div>
      <div className="mb-2">
        {finalPrice ? (
          <span className="text-blue-700 font-semibold">Final Price: {finalPrice} USDC</span>
        ) : (
          <VotingTimer
            votingEndsAt={channel.votingEndsAt}
            onExpire={() => {
              setVotingEnded(true);
              handleFinalize();
            }}
          />
        )}
      </div>
      {!finalPrice && canVote && (
        <div className="flex gap-2 mb-2">
          {[1, 2, 3].map((amt) => (
            <button
              key={amt}
              className="bg-zinc-200 dark:bg-zinc-700 rounded px-3 py-1 font-mono hover:bg-blue-200 dark:hover:bg-blue-800"
              onClick={() => handleVote(amt)}
            >
              {amt} USDC ({votes[amt] || 0})
            </button>
          ))}
        </div>
      )}
      {finalPrice && !isPaid && (
        <PayToWatchButton price={finalPrice} onPay={handlePay} />
      )}
      <div className="relative mt-4 flex-grow">
        <YouTubeEmbed embedUrl={channel.embedUrl} />
        {!isPaid && <UnlockOverlay isLocked />}
      </div>
      {isPaid && <div className="text-green-600 font-bold mt-2">Unlocked!</div>}
      {isBroadcaster && <RevenueDisplay revenue={revenue} />}
    </div>
  );
}; 