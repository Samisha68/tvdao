import mongoose, { Mongoose } from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Augment the NodeJS global type first
declare global {
  var mongooseCache: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  }
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI!, opts).then((mongooseInstance) => {
      console.log("MongoDB Connected!")
      return mongooseInstance;
    });
  }
  try {
     cached.conn = await cached.promise;
  } catch (e) {
     cached.promise = null;
     console.error("MongoDB Connection Error:", e);
     throw e;
  }

  // Add a check here as cached.conn could potentially still be null
  // though theoretically it should be assigned after the await.
  if (!cached.conn) {
      throw new Error('MongoDB connection failed.');
  }

  return cached.conn;
}

export default dbConnect; 