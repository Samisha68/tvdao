import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Channel } from '@/lib/db/models';
import mongoose from 'mongoose';

// Removed RouteContext interface for this test

// GET a specific channel by ID
export async function GET(request: NextRequest, context: any) {
  const { id } = context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new NextResponse("Invalid channel ID", { status: 400 });
  }

  try {
    await dbConnect();
    const channel = await Channel.findById(id);

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    // Note: Vote counts are directly on the channel model now, no need for separate query
    return NextResponse.json(channel);

  } catch (error: any) {
    console.error("[API_CHANNELS_ID_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH a channel (e.g., update title, description)
export async function PATCH(request: NextRequest, context: any) {
    const { id } = context.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return new NextResponse("Invalid channel ID", { status: 400 });
    }

    try {
        await dbConnect();
        const body = await request.json();
        const { title, description, requestingUserWallet } = body; // Assuming frontend sends wallet for auth check

        const channel = await Channel.findById(id);
        if (!channel) {
            return new NextResponse("Channel not found", { status: 404 });
        }

        // Authorization check: Ensure the requesting user is the creator
        // TODO: Implement proper auth (e.g., JWT validation)
        if (!requestingUserWallet || channel.creator !== requestingUserWallet) {
           return new NextResponse("Unauthorized: Only the creator can update", { status: 403 });
        }

        // Only allow updating specific fields
        const updateData: Partial<typeof body> = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        updateData.updated_at = new Date(); // Update timestamp

        const updatedChannel = await Channel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true } // Return the updated document
        );

        if (!updatedChannel) {
             return new NextResponse("Channel not found after update attempt", { status: 404 });
        }

        return NextResponse.json(updatedChannel);

    } catch (error: any) {
        console.error("[API_CHANNELS_ID_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// Add DELETE later if needed 