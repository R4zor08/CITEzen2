import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import net from 'net';

const DB_PORT = 27017;
const DB_PATH = path.resolve(process.cwd(), '.mongo-data');

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function startLocalMongo() {
  const inUse = await isPortInUse(DB_PORT);
  if (inUse) {
    console.log(`[Mongo] Port ${DB_PORT} is already in use. Assuming MongoDB is already active.`);
    return;
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }

  console.log(`[Mongo] Starting local persistent MongoDB instance on port ${DB_PORT}...`);
  console.log(`[Mongo] Data directory: ${DB_PATH}`);

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: DB_PORT,
      dbPath: DB_PATH,
      storageEngine: 'wiredTiger',
    },
  });

  const uri = mongod.getUri();
  console.log(`[Mongo] Persistent MongoDB running at: ${uri}`);

  const shutdown = async () => {
    console.log('\n[Mongo] Stopping MongoDB instance...');
    await mongod.stop();
    console.log('[Mongo] Stopped cleanly.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startLocalMongo().catch((err) => {
  console.error('[Mongo] Failed to start local MongoDB:', err);
  process.exit(1);
});
