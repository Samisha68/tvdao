import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { User } from '@/lib/db/models';

// GET user by wallet_address or all users if no address provided
export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet_address');

  try {
    if (walletAddress) {
      console.log(`[API_USERS_GET] Searching for wallet: ${walletAddress}`);
      const user = await User.findOne({ wallet_address: walletAddress });
      if (!user) {
        console.log(`[API_USERS_GET] User not found: ${walletAddress}`);
        return new NextResponse('User not found', { status: 404 });
      }
      console.log(`[API_USERS_GET] User found: ${user._id}`);
      return NextResponse.json(user);
    } else {
      console.log('[API_USERS_GET] Wallet address not provided, returning 400.');
      return new NextResponse('Please provide a wallet_address query parameter', { status: 400 });
    }
  } catch (error: any) {
    console.error('[API_USERS_GET] Internal error:', error);
    return new NextResponse('Internal error fetching user(s)', { status: 500 });
  }
}

// POST a new user or return existing if found
export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const body = await request.json();
    const { wallet_address, username } = body;

    if (!wallet_address) {
      console.log('[API_USERS_POST] Wallet address is required');
      return new NextResponse('Wallet address is required', { status: 400 });
    }

    console.log(`[API_USERS_POST] Attempting to find or create user: ${wallet_address}`);
    let user = await User.findOne({ wallet_address });

    if (user) {
      console.log(`[API_USERS_POST] User already exists: ${user._id}`);
      return NextResponse.json(user, { status: 200 }); // User already exists, return existing user
    }

    console.log(`[API_USERS_POST] Creating new user: ${wallet_address}`);
    user = await User.create({ wallet_address, username });
    console.log(`[API_USERS_POST] New user created: ${user._id}`);
    return NextResponse.json(user, { status: 201 }); // New user created

  } catch (error: any) {
    console.error('[API_USERS_POST] Internal error:', error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.wallet_address) {
      return new NextResponse('User with this wallet address already exists.', { status: 409 });
    }
    return new NextResponse('Internal error creating or finding user', { status: 500 });
  }
} 