import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongo() {
  if (isConnected) return;
  const uri =
    process.env.MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/citezen';

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  isConnected = true;
}

