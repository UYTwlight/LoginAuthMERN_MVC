import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// List all users
const listUsers = async () => {
  try {
    const users = await User.find().select('-password');
    console.log('\n=== All Users ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - Role: ${user.role} - ID: ${user._id}`);
    });
    console.log(`\nTotal users: ${users.length}\n`);
  } catch (error) {
    console.error('Error listing users:', error);
  }
};

// Delete user by email
const deleteUserByEmail = async (email) => {
  try {
    const user = await User.findOneAndDelete({ email });
    if (user) {
      console.log(`✅ User ${email} deleted successfully`);
    } else {
      console.log(`❌ User ${email} not found`);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

// Update user role
const updateUserRole = async (email, newRole) => {
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role: newRole },
      { new: true }
    ).select('-password');
    
    if (user) {
      console.log(`✅ User ${email} role updated to ${newRole}`);
    } else {
      console.log(`❌ User ${email} not found`);
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];
  
  switch (command) {
    case 'list':
      await listUsers();
      break;
    case 'delete':
      if (!arg1) {
        console.log('Usage: npm run manage-users delete <email>');
      } else {
        await deleteUserByEmail(arg1);
      }
      break;
    case 'update-role':
      if (!arg1 || !arg2) {
        console.log('Usage: npm run manage-users update-role <email> <role>');
        console.log('Roles: user, admin');
      } else {
        await updateUserRole(arg1, arg2);
      }
      break;
    default:
      console.log('Available commands:');
      console.log('  npm run manage-users list');
      console.log('  npm run manage-users delete <email>');
      console.log('  npm run manage-users update-role <email> <role>');
  }
  
  await mongoose.connection.close();
  process.exit(0);
};

main();
