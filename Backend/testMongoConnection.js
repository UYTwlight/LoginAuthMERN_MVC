import mongoose from 'mongoose';
import { EmotionSession, EmotionData, FaceStatistics } from './src/models/Emotion.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('='.repeat(50));
console.log('Testing MongoDB Connection & Models');
console.log('='.repeat(50));

const testConnection = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/emotion-detection';
        console.log('\n[1] Connecting to MongoDB...');
        console.log('URI:', mongoURI);
        
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB successfully!');

        // Test EmotionSession model
        console.log('\n[2] Testing EmotionSession model...');
        const testSession = new EmotionSession({
            sessionName: 'Test_Camera_0_' + Date.now(),
            sourceType: 'camera',
            sourceId: '0',
            status: 'running',
            totalFrames: 0,
            totalFaces: 0
        });
        await testSession.save();
        console.log('✅ Created test session:', testSession._id);

        // Test EmotionData model
        console.log('\n[3] Testing EmotionData model...');
        const testEmotionData = new EmotionData({
            sessionId: testSession._id,
            faceId: 'ID0',
            frameNumber: 1,
            emotions: {
                happy: 0.8,
                sad: 0.05,
                surprise: 0.05,
                angry: 0.05,
                disgust: 0.05
            },
            dominantEmotion: 'happy',
            confidence: 0.8
        });
        await testEmotionData.save();
        console.log('✅ Created test emotion data:', testEmotionData._id);

        // Test FaceStatistics model
        console.log('\n[4] Testing FaceStatistics model...');
        const testStats = new FaceStatistics({
            sessionId: testSession._id,
            faceId: 'ID0',
            totalFrames: 100,
            averageEmotions: {
                happy: 0.7,
                sad: 0.1,
                surprise: 0.1,
                angry: 0.05,
                disgust: 0.05
            },
            dominantEmotion: 'happy',
            emotionDistribution: {
                happy: 70,
                sad: 10,
                surprise: 10,
                angry: 5,
                disgust: 5
            }
        });
        await testStats.save();
        console.log('✅ Created test statistics:', testStats._id);

        // Query data
        console.log('\n[5] Querying data...');
        const sessions = await EmotionSession.find().limit(5);
        console.log(`✅ Found ${sessions.length} sessions in database`);

        const emotionData = await EmotionData.find({ sessionId: testSession._id });
        console.log(`✅ Found ${emotionData.length} emotion records for test session`);

        const statistics = await FaceStatistics.find({ sessionId: testSession._id });
        console.log(`✅ Found ${statistics.length} statistics for test session`);

        // Cleanup test data
        console.log('\n[6] Cleaning up test data...');
        await EmotionSession.deleteOne({ _id: testSession._id });
        await EmotionData.deleteMany({ sessionId: testSession._id });
        await FaceStatistics.deleteMany({ sessionId: testSession._id });
        console.log('✅ Cleaned up test data');

        console.log('\n' + '='.repeat(50));
        console.log('✅ All tests passed!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n[7] Closed MongoDB connection');
        process.exit(0);
    }
};

testConnection();
