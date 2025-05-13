"use client";

import { FC } from "react";
import { ChannelCard, Channel } from "./ChannelCard";

export const ChannelList: FC<{ channels: Channel[]; userPublicKey?: string }> = ({ channels, userPublicKey }) => {
  return (
    <div className="flex overflow-x-auto gap-6 w-full max-w-full mx-auto">
      {channels.map((channel) => (
        <ChannelCard key={channel.id} channel={channel} userPublicKey={userPublicKey} />
      ))}
    </div>
  );
};
