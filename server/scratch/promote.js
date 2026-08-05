import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function promote() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const result = await User.updateMany(
    { role: 'VIEWER' },
    { $set: { role: 'ADMIN' } }
  );
  console.log(`Promoted ${result.modifiedCount} users to ADMIN`);
  process.exit(0);
}

promote().catch(console.error);
