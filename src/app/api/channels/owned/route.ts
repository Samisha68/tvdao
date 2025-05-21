import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Channel } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    await dbConnect();
    
    // Find channels where the creator matches the userId
    const channels = await Channel.find({ creator: userId });
    
    return NextResponse.json(channels);
  } catch (error: any) {
    console.error("[API_CHANNELS_OWNED_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 