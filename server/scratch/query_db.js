import 'dotenv/config';
import mongoose from 'mongoose';
import ShipmentJourney from '../src/models/ShipmentJourney.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const data = await ShipmentJourney.find().lean();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
run();
