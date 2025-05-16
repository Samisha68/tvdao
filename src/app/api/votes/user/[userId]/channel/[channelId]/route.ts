import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Vote } from '@/lib/db/models';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: any
) {
  const { userId, channelId } = params;

  if (!userId || !channelId) {
    return new NextResponse("Missing userId or channelId", { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(channelId)) {
    return new NextResponse("Invalid userId or channelId format", { status: 400 });
  }

  try {
    await dbConnect();

    const vote = await Vote.findOne({ user_id: userId, channel_id: channelId });

    if (!vote) {
      return new NextResponse("Vote not found", { status: 404 });
    }

    return NextResponse.json(vote);
  } catch (error: any) {
    console.error("[API_VOTES_USER_CHANNEL_GET]", error);
    return new NextResponse("Internal error fetching vote", { status: 500 });
  }
} 