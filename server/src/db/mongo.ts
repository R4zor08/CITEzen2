import mongoose from 'mongoose';
import net from 'net';
import path from 'path';
import fs from 'fs';
import dns from 'dns';

// Fix Windows Node.js querySrv ECONNREFUSED with MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom servers cannot be set
}

let isConnected = false;
let embeddedMongo: any = null;

function testPort(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function connectMongo() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/citezen';

  const isLocalUri = uri.includes('127.0.0.1:27017') || uri.includes('localhost:27017');

  if (isLocalUri) {
    const isPortOpen = await testPort(27017);
    if (!isPortOpen) {
      console.log('[Mongo] Local MongoDB not detected on port 27017. Starting persistent local database...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const dbPath = path.resolve(process.cwd(), '.mongo-data');
        if (!fs.existsSync(dbPath)) {
          fs.mkdirSync(dbPath, { recursive: true });
        }
        embeddedMongo = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbPath,
            storageEngine: 'wiredTiger'
          }
        });
        console.log('[Mongo] Persistent local database ready on port 27017.');
      } catch (err) {
        console.warn('[Mongo] Notice: Embedded local MongoDB could not be started, attempting direct connection:', err);
      }
    }
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  isConnected = true;
}

export async function closeMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (embeddedMongo) {
    await embeddedMongo.stop();
    embeddedMongo = null;
  }
  isConnected = false;
}
