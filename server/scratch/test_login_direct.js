import User from '../src/models/User.js';
import { connectDatabase } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function testDirectLogin() {
  await connectDatabase();
  console.log('Finding admin user...');
  let user = await User.findOne({ email: 'adminlogistics@gmail.com' });
  console.log('Admin User found:', user);
  if (user) {
    console.log('passwordHash length:', user.passwordHash?.length);
    console.log('passwordHash starts with $:', user.passwordHash?.startsWith('$'));
    
    // Test direct compare
    try {
      const match = await user.comparePassword('zxcvbnm0987654321');
      console.log('bcrypt compare result:', match);
    } catch (e) {
      console.error('compare error:', e.message);
    }
  }
  process.exit(0);
}

testDirectLogin();
