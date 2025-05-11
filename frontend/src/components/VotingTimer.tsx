"use client";
import { FC, useEffect, useState } from "react";

export const VotingTimer: FC<{
  votingEndsAt: number;
  onExpire?: () => void;
}> = ({ votingEndsAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(votingEndsAt - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(votingEndsAt - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [votingEndsAt, timeLeft, onExpire]);

  if (timeLeft <= 0) return <span className="text-red-500">Voting ended</span>;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <span className="text-green-600">
      Voting ends in: {minutes}m {seconds}s
    </span>
  );
}; 