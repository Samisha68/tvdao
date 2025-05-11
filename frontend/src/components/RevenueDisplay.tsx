"use client";
import { FC } from "react";

export const RevenueDisplay: FC<{ revenue: number }> = ({ revenue }) => (
  <div className="text-green-700 font-semibold mt-2">Total Revenue: {revenue} USDC</div>
); 