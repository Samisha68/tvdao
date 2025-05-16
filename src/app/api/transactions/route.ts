import { NextRequest, NextResponse } from 'next/server';

// Define the Transaction interface (should match the frontend's definition)
interface Transaction {
  _id: string;
  user_id: string;
  channel_id?: string;
  channel_title?: string;
  amount: number;
  type: 'payment' | 'earning' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  timestamp: string; // ISO date string
  tx_signature?: string;
}

// Mock transaction data - REPLACE WITH YOUR ACTUAL DATA FETCHING LOGIC
const MOCK_TRANSACTIONS_DB: Transaction[] = [
  {
    _id: 'tx_mock_1',
    user_id: 'EzbQPEFUoGUURQweafrFNXKkePip5dYUgByGJDA1QVQA', // Using your publicKey
    channel_id: 'chan_mock_abc',
    channel_title: 'Solana Explained',
    amount: 1.2,
    type: 'payment',
    status: 'completed',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    tx_signature: 'mock_sig_1a2b3c4d5e6f7g8h9i0j'
  },
  {
    _id: 'tx_mock_2',
    user_id: 'EzbQPEFUoGUURQweafrFNXKkePip5dYUgByGJDA1QVQA', // Using your publicKey
    channel_id: 'chan_mock_def',
    channel_title: 'Advanced DeFi Strategies',
    amount: 0.5,
    type: 'payment',
    status: 'completed',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    tx_signature: 'mock_sig_k1l2m3n4o5p6q7r8s9t0'
  },
  {
    _id: 'tx_mock_3',
    user_id: 'EzbQPEFUoGUURQweafrFNXKkePip5dYUgByGJDA1QVQA', // Using your publicKey
    channel_id: 'chan_my_xyz',
    channel_title: 'My Streaming Channel',
    amount: 3.75,
    type: 'earning',
    status: 'completed',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    tx_signature: 'mock_sig_u1v2w3x4y5z6a7b8c9d0'
  },
  {
    _id: 'tx_mock_4',
    user_id: 'USER_PUBLIC_KEY_2', // Another user for testing
    channel_id: 'chan_mock_abc',
    channel_title: 'Solana Explained',
    amount: 1.2,
    type: 'payment',
    status: 'pending',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    tx_signature: 'mock_sig_e1f2g3h4i5j6k7l8m9n0'
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'userId query parameter is required' }, { status: 400 });
    }

    // --- BEGIN MOCK LOGIC ---
    // In a real application, you would query your database or blockchain indexer here
    // using the userId to fetch actual transactions.
    console.log(`[API/Transactions] Fetching transactions for userId: ${userId}`);
    const userTransactions = MOCK_TRANSACTIONS_DB.filter(tx => tx.user_id === userId);
    
    if (userTransactions.length === 0) {
      console.log(`[API/Transactions] No mock transactions found for userId: ${userId}, returning empty array.`);
    }
    // --- END MOCK LOGIC ---

    return NextResponse.json(userTransactions, { status: 200 });

  } catch (error) {
    console.error('[API/Transactions] Error fetching transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
} 