import mongoose, { Schema, Document, models, Model } from 'mongoose';

// --- Interfaces extending Document ---
export interface IUser extends Document {
  wallet_address: string;
  username: string;
  created_at: Date;
  updated_at: Date;
}

export interface IChannel extends Document {
  on_chain_id: string;
  creator: string; // Should reference IUser['wallet_address'] - Mongoose ref isn't directly typed here
  title: string;
  description: string;
  broadcaster_price: number;
  current_price: number;
  total_upvotes: number;
  total_downvotes: number;
  is_voting_active: boolean;
  voting_end_time?: Date;
  category?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IVote extends Document {
  channel_id: Schema.Types.ObjectId; // Ref 'Channel'
  user_id: Schema.Types.ObjectId; // Ref 'User'
  vote_type: 'upvote' | 'downvote';
  timestamp: Date;
}

export interface IPayment extends Document {
  channel_id: Schema.Types.ObjectId; // Ref 'Channel'
  user_id: Schema.Types.ObjectId; // Ref 'User'
  amount: number;
  timestamp: Date;
}

// --- Mongoose Schemas ---
const userSchema: Schema<IUser> = new Schema({
  wallet_address: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: false }, // Username might not be strictly required initially
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const channelSchema: Schema<IChannel> = new Schema({
  on_chain_id: { type: String, required: false, unique: true, sparse: true }, // Allow null initially?
  creator: { type: String, required: true, index: true }, // Ref 'User' wallet_address
  title: { type: String, required: true },
  description: { type: String, required: true },
  broadcaster_price: { type: Number, required: true },
  current_price: { type: Number, required: true },
  total_upvotes: { type: Number, default: 0 },
  total_downvotes: { type: Number, default: 0 },
  is_voting_active: { type: Boolean, default: true },
  voting_end_time: { type: Date },
  category: { type: String, enum: ['New', 'Popular', 'TrendingNow'], default: 'New' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const voteSchema: Schema<IVote> = new Schema({
  channel_id: { type: Schema.Types.ObjectId, required: true, ref: 'Channel' },
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  vote_type: { type: String, enum: ['upvote', 'downvote'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const paymentSchema: Schema<IPayment> = new Schema({
  channel_id: { type: Schema.Types.ObjectId, required: true, ref: 'Channel' },
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// --- Mongoose Models ---
// Check if models are already defined before defining them
const User: Model<IUser> = models.User || mongoose.model<IUser>('User', userSchema);
const Channel: Model<IChannel> = models.Channel || mongoose.model<IChannel>('Channel', channelSchema);
const Vote: Model<IVote> = models.Vote || mongoose.model<IVote>('Vote', voteSchema);
const Payment: Model<IPayment> = models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);

export { User, Channel, Vote, Payment }; 