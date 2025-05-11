"use client";
import { FC } from "react";

export const PayToWatchButton: FC<{
  price: number;
  onPay: () => void;
  disabled?: boolean;
}> = ({ price, onPay, disabled }) => (
  <button
    className="bg-blue-600 text-white rounded px-4 py-2 mt-2 disabled:opacity-50"
    onClick={onPay}
    disabled={disabled}
  >
    Pay {price} USDC to Unlock
  </button>
); 