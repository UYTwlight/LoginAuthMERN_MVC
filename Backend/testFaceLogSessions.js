import mongoose from 'mongoose';
import { FaceLogSession } from './src/models/Emotion.js';

const MONGODB_URI = 'mongodb://localhost:27017/emotion-detection';

async function testFaceLogSessions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Kiểm tra số lượng sessions
        const count = await FaceLogSession.countDocuments();
        console.log(`\n📊 Total Face Log Sessions: ${count}`);

        if (count === 0) {
            console.log('\n⚠️  Không có sessions nào trong database!');
            console.log('Hãy chạy C++ app để tạo sessions mới.\n');
        } else {
            // Hiển thị 5 sessions gần nhất
            const sessions = await FaceLogSession.find()
                .sort({ startTime: -1 })
                .limit(5)
                .lean();

            console.log('\n📋 5 Sessions gần nhất:');
            console.log('═'.repeat(80));
            
            sessions.forEach((session, index) => {
                console.log(`\n${index + 1}. Session ID: ${session.sessionId}`);
                console.log(`   Source: ${session.source}`);
                console.log(`   Type: ${session.sourceType}`);
                console.log(`   Status: ${session.status}`);
                console.log(`   Face Count: ${session.faceCount}`);
                console.log(`   Start Time: ${session.startTime}`);
                console.log(`   Face IDs: ${session.faceIds.join(', ')}`);
            });
            console.log('\n' + '═'.repeat(80));
        }

        // Test query như API
        console.log('\n🔍 Testing API query...');
        const apiResult = await FaceLogSession.find()
            .sort({ startTime: -1 })
            .limit(100)
            .lean();
        
        console.log(`✅ API query returned ${apiResult.length} sessions`);

        mongoose.disconnect();
        console.log('\n✅ Test completed!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
}

testFaceLogSessions();
