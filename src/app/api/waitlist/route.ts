import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import CreatorWaitlist from '@/models/CreatorWaitlist';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { name, email, channel, category, link, description } = body;

    // Validate required fields
    if (!name || !email || !channel || !category || !link || !description) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Save the waitlist entry to the database
    const newEntry = new CreatorWaitlist({
      name,
      email,
      channel,
      category,
      link,
      description,
    });
    await newEntry.save();

    // Send confirmation email using a third-party email service
    /*
    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_USER_ID,
        template_params: {
          to_email: email,
          to_name: name,
          channel_name: channel,
          category: category,
          content_link: link,
          description: description,
        },
      }),
    });

    if (!emailResponse.ok) {
      console.error('Failed to send email:', await emailResponse.text());
      // Continue with the response even if email fails
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!',
    });
  } catch (error) {
    console.error('Error processing waitlist submission:', error);
    const errorCode = (error as any).code;
    if (errorCode === 11000) {
      return NextResponse.json(
        { error: 'This email is already on the waitlist.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process waitlist submission' },
      { status: 500 }
    );
  }
} 