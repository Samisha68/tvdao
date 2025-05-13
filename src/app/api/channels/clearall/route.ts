import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Channel } from '@/lib/db/models'; // Assuming your Channel model is exported as Channel

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(
      JSON.stringify({ message: 'This endpoint is only available in development mode for safety.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await dbConnect();
    console.log('[API_CHANNELS_CLEARALL] Connected to DB. Attempting to delete all channels...');
    
    const deleteResult = await Channel.deleteMany({}); // An empty filter object deletes all documents
    
    console.log(`[API_CHANNELS_CLEARALL] Channels deleted: ${deleteResult.deletedCount}`);
    
    return new NextResponse(
      JSON.stringify({ message: 'All channels deleted successfully.', deletedCount: deleteResult.deletedCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API_CHANNELS_CLEARALL] Error deleting channels:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error deleting channels', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 