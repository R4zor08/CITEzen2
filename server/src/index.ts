import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectMongo } from './db/mongo.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;
const app = createApp();

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`citezen API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed', err);
    process.exit(1);
  });
