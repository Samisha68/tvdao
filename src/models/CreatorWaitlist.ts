import mongoose from 'mongoose';

const creatorWaitlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  channel: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['News', 'Music', 'Gaming', 'Education'],
  },
  link: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.CreatorWaitlist || mongoose.model('CreatorWaitlist', creatorWaitlistSchema); 