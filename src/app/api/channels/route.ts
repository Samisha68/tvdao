import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Channel, Vote } from '@/lib/db/models';

// GET all channels
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const channels = await Channel.find({});
    return NextResponse.json(channels);
  } catch (error: any) {
    console.error("[API_CHANNELS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST a new channel
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      on_chain_id, // This will likely come from smart contract interaction later
      creator,
      title,
      description,
      broadcaster_price,
    } = body;

    if (!creator || !title || !description || broadcaster_price === undefined) {
        return new NextResponse("Missing required fields", { status: 400 });
    }

    const newChannel = await Channel.create({
      on_chain_id,
      creator,
      title,
      description,
      broadcaster_price,
      current_price: broadcaster_price, // Initial price
      voting_end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      is_voting_active: true,
      total_upvotes: 0,
      total_downvotes: 0,
    });

    return NextResponse.json(newChannel, { status: 201 });

  } catch (error: any) {
    console.error("[API_CHANNELS_POST]", error);
    // Handle potential duplicate key error for on_chain_id if it becomes required
    if (error.code === 11000) {
        return new NextResponse("Duplicate key error", { status: 409 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
} 