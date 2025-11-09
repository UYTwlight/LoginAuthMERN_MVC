import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB\n');
        
        const users = await User.find().select('name email role');
        
        console.log(`📊 Total users: ${users.length}\n`);
        
        if (users.length === 0) {
            console.log('⚠️  No users found. Please register a user first.');
        } else {
            console.log('👥 Users list:');
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.name || 'No name'}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
            });
        }
        
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
    }
}

checkUsers();
