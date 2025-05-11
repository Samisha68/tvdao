"use client";
import { FC } from "react";

export const UnlockOverlay: FC<{ isLocked: boolean }> = ({ isLocked }) =>
  isLocked ? (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
      <span className="text-4xl mb-2">🔒</span>
      <span className="text-white font-bold">Pay to unlock this channel</span>
    </div>
  ) : null; 