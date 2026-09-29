import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { closeMongo, connectMongo } from './db/mongo.js';
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

  // Create or update default student user for testing and demo
  const studentHash = await bcrypt.hash('StudentPass123!', 10);
  await UserModel.updateOne(
    { studentId: '2024-0001' },
    {
      $set: {
        studentId: '2024-0001',
        email: '2024-0001@student.local',
        name: 'Juan Dela Cruz',
        passwordHash: studentHash,
        role: 'student',
        course: 'BSIT',
        department: 'CITE'
      }
    },
    { upsert: true }
  );

  console.log('Seeded student user (Mongo): 2024-0001');

  // Create or update default staff user for testing and demo
  const staffHash = await bcrypt.hash('StaffPass123!', 10);
  await UserModel.updateOne(
    { email: 'staff@nemsu.edu.ph' },
    {
      $set: {
        email: 'staff@nemsu.edu.ph',
        name: 'Maria Santos',
        passwordHash: staffHash,
        role: 'staff',
        department: 'CITE'
      }
    },
    { upsert: true }
  );

  console.log('Seeded staff user (Mongo): staff@nemsu.edu.ph');

  // Legacy registrations stored studentId: null for staff/admin; MongoDB unique sparse indexes still
  // index null and block additional staff. Remove the field so only students carry studentId.
  const unset = await UserModel.updateMany(
    { role: { $in: ['staff', 'admin'] }, studentId: null },
    { $unset: { studentId: '' } }
  );
  if (unset.modifiedCount > 0) {
    console.log(`Unset null studentId on ${unset.modifiedCount} staff/admin user(s)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await closeMongo();
  });

