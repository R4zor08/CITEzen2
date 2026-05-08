import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectMongo } from './db/mongo.js';

dotenv.config();

if (!process.env.JWT_SECRET?.trim()) {
  console.error('Missing JWT_SECRET. Set JWT_SECRET in environment before starting server.');
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`citezen API listening on http://localhost:${PORT}`);
});

const MONGO_RETRY_MS = Number(process.env.MONGO_RETRY_MS) || 10_000;
let mongoConnecting = false;

async function connectMongoWithRetry() {
  if (mongoConnecting) return;
  mongoConnecting = true;
  try {
    await connectMongo();
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed (will retry)', err);
    setTimeout(() => {
      mongoConnecting = false;
      void connectMongoWithRetry();
    }, MONGO_RETRY_MS);
    return;
  }
  mongoConnecting = false;
}

void connectMongoWithRetry();
