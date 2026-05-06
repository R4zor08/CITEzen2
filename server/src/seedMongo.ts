import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectMongo } from './db/mongo.js';
import { UserModel } from './models/UserModel.js';

dotenv.config();

async function main() {
  await connectMongo();

  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin3msu';
  const hash = await bcrypt.hash(password, 10);

  // Create or update the default admin user.
  await UserModel.updateOne(
    { email: 'admin@nemsu.edu.ph' },
    {
      $set: {
        email: 'admin@nemsu.edu.ph',
        name: 'System Administrator',
        passwordHash: hash,
        role: 'admin',
        department: 'Administration'
      }
    },
    { upsert: true }
  );

  console.log('Seeded admin user (Mongo): admin@nemsu.edu.ph');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // mongoose will close automatically on exit
  });

