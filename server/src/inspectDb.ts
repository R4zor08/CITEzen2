import dotenv from 'dotenv';
import { connectMongo, closeMongo } from './db/mongo.js';
import { UserModel } from './models/UserModel.js';
import { ConcernModel } from './models/ConcernModel.js';

dotenv.config();

async function main() {
  console.log('Connecting to database...');
  await connectMongo();

  console.log('\n============================================================');
  console.log('              CITEZEN DATABASE RECORDS SUMMARY              ');
  console.log('============================================================\n');

  // 1. Users
  const users = await UserModel.find().sort({ createdAt: -1 }).lean();
  console.log(`[+] Total Registered Users: ${users.length}`);
  console.log('------------------------------------------------------------');
  users.forEach((u, i) => {
    const identifier = u.role === 'student' ? `Student ID: ${u.studentId || 'N/A'}` : `Email: ${u.email}`;
    console.log(
      `${i + 1}. [${u.role.toUpperCase().padEnd(7)}] ${u.name.padEnd(22)} | ${identifier.padEnd(30)} | Dept: ${u.department || u.course || 'N/A'}`
    );
  });

  // 2. Concerns
  const concerns = await ConcernModel.find().sort({ createdAt: -1 }).lean();
  console.log('\n------------------------------------------------------------');
  console.log(`[+] Total Concerns Submitted: ${concerns.length}`);
  console.log('------------------------------------------------------------');
  if (concerns.length === 0) {
    console.log('  No concerns submitted yet.');
  } else {
    concerns.slice(0, 15).forEach((c, i) => {
      const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A';
      console.log(
        `${i + 1}. [${(c.status || 'pending').toUpperCase().padEnd(11)}] [${(c.category || 'General').padEnd(12)}] ${c.title.padEnd(30)} | Date: ${date}`
      );
    });
    if (concerns.length > 15) {
      console.log(`  ... and ${concerns.length - 15} more records.`);
    }
  }

  console.log('\n============================================================\n');
}

main()
  .catch((err) => {
    console.error('Error querying database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closeMongo();
  });
