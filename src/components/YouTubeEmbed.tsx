"use client";
import { FC } from "react";

export const YouTubeEmbed: FC<{ embedUrl: string }> = ({ embedUrl }) => (
  <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-lg">
    <iframe
      className="absolute top-0 left-0 w-full h-full"
      src={embedUrl}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
); 