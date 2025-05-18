import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/dbConnect';
import CreatorWaitlist from '@/models/CreatorWaitlist';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { name, email, channel, category, link, description } = req.body;

    // Validate required fields
    if (!name || !email || !channel || !category || !link || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create new waitlist entry
    const waitlistEntry = await CreatorWaitlist.create({
      name,
      email,
      channel,
      category,
      link,
      description,
    });

    return res.status(200).json({ success: true, data: waitlistEntry });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
} 