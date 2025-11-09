import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FaceLogSession } from './src/models/Emotion.js';

dotenv.config();

async function checkFaceLogs() {
    try {
        console.log('Connecting to:', process.env.MONGO_URL);
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB\n');
        
        // Check collection name
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Available collections:');
        collections.forEach(col => console.log(`   - ${col.name}`));
        console.log('');
        
        // Try to find face log sessions
        const sessions = await FaceLogSession.find();
        
        console.log(`📊 Total FaceLogSessions: ${sessions.length}\n`);
        
        if (sessions.length === 0) {
            console.log('⚠️  No face log sessions found!');
            console.log('   This means data is in different database or not imported yet.');
        } else {
            console.log('✅ Face log sessions found:');
            sessions.forEach((session, index) => {
                console.log(`\n${index + 1}. ${session.sessionId}`);
                console.log(`   Source: ${session.source}`);
                console.log(`   Type: ${session.sourceType}`);
                console.log(`   Faces: ${session.faceCount}`);
            });
        }
        
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
    }
}

checkFaceLogs();
