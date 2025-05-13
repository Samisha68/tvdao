import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Vote, Channel, User } from '@/lib/db/models';
import mongoose from 'mongoose';

// POST a new vote or update existing vote
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { channel_id, user_id, vote_type } = body;

    if (!channel_id || !user_id || !vote_type) {
        return new NextResponse("Missing channel_id, user_id, or vote_type", { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(channel_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
        return new NextResponse("Invalid channel ID or user ID", { status: 400 });
    }

    if (!['upvote', 'downvote'].includes(vote_type)) {
        return new NextResponse("Invalid vote_type", { status: 400 });
    }

    // Check if channel exists and voting is active
    const channel = await Channel.findById(channel_id);
    if (!channel) {
        return new NextResponse("Channel not found", { status: 404 });
    }

    if (!channel.is_voting_active) {
        return new NextResponse("Voting period has ended for this channel", { status: 400 });
    }

    // Check voting deadline
    if (channel.voting_end_time && new Date() > channel.voting_end_time) {
      channel.is_voting_active = false;
      await channel.save(); // Update channel status if deadline passed
      return new NextResponse("Voting period has ended for this channel", { status: 400 });
    }

    // Check if user exists (optional but good practice)
    const user = await User.findById(user_id);
    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    // Find existing vote or create new
    let updatedVoteCount = false;
    const existingVote = await Vote.findOne({ channel_id, user_id });

    if (existingVote) {
      // If trying to vote the same way again, do nothing (or return an error)
      if (existingVote.vote_type === vote_type) {
          // Return the current channel state without changes
          return NextResponse.json({ message: "Already voted this way", channel });
          // Or: return new NextResponse("Already voted this way", { status: 400 });
      }
      // If changing vote, update vote type and counts
      existingVote.vote_type = vote_type;
      await existingVote.save();
      updatedVoteCount = true;
      // Adjust counts: +1 for new type, -1 for old type
      if (vote_type === 'upvote') {
        channel.total_upvotes += 1;
        channel.total_downvotes -= 1;
      } else { // vote_type === 'downvote'
        channel.total_upvotes -= 1;
        channel.total_downvotes += 1;
      }
    } else {
      // Create new vote
      await Vote.create({ channel_id, user_id, vote_type });
      updatedVoteCount = true;
      // Increment count for the new vote type
      if (vote_type === 'upvote') {
        channel.total_upvotes += 1;
      } else { // vote_type === 'downvote'
        channel.total_downvotes += 1;
      }
    }

    // Recalculate price only if vote counts changed
    if (updatedVoteCount) {
        // Prevent division by zero
        const totalVotes = channel.total_upvotes + channel.total_downvotes;
        if (totalVotes > 0) {
            const voteRatio = channel.total_upvotes / totalVotes;
            // Simple linear adjustment example: ±10% based on ratio deviation from 0.5
            const priceAdjustment = (voteRatio - 0.5) * 0.2; // e.g., 100% upvotes = +10%, 0% upvotes = -10%
            channel.current_price = parseFloat((channel.broadcaster_price * (1 + priceAdjustment)).toFixed(2));
            // Ensure price doesn't go below zero (or some other floor)
            if (channel.current_price < 0) channel.current_price = 0;
        }
         // Ensure counts don't go below zero due to switching votes
         if (channel.total_upvotes < 0) channel.total_upvotes = 0;
         if (channel.total_downvotes < 0) channel.total_downvotes = 0;

        channel.updated_at = new Date();
        await channel.save();
    }

    return NextResponse.json({ message: "Vote recorded successfully", channel });

  } catch (error: any) {
    console.error("[API_VOTES_POST]", error);
    return new NextResponse("Internal error recording vote", { status: 500 });
  }
} 