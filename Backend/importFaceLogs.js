import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { FaceLogSession } from './src/models/Emotion.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Import existing face_logs into MongoDB
const importFaceLogs = async () => {
    try {
        const faceLogsPath = path.join(__dirname, '..', 'Emotion-statistics', 'face_logs');
        
        if (!fs.existsSync(faceLogsPath)) {
            console.log('❌ face_logs directory not found');
            return;
        }

        const sessionDirs = fs.readdirSync(faceLogsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log(`📂 Found ${sessionDirs.length} session directories`);

        for (const sessionDir of sessionDirs) {
            const sessionPath = path.join(faceLogsPath, sessionDir);
            const stats = fs.statSync(sessionPath);
            
            // Parse tên session
            const parts = sessionDir.split('_');
            const timestamp = parts.slice(-2).join('_');
            const source = parts.slice(0, -2).join('_');
            
            // Skip nếu source rỗng hoặc không hợp lệ
            if (!source || source.trim() === '') {
                console.log(`⏭️  Skipping invalid session name: ${sessionDir}`);
                continue;
            }
            
            // Đếm số face IDs
            const faceIds = fs.readdirSync(sessionPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('ID'))
                .map(dirent => dirent.name)
                .sort((a, b) => {
                    const numA = parseInt(a.replace('ID', ''));
                    const numB = parseInt(b.replace('ID', ''));
                    return numA - numB;
                });

            // Xác định source type
            let sourceType = 'video';
            if (source.startsWith('Camera_')) {
                sourceType = 'camera';
            } else if (source.startsWith('file-')) {
                sourceType = 'video';
            }

            // Check xem session đã tồn tại chưa
            const existing = await FaceLogSession.findOne({ sessionId: sessionDir });
            if (existing) {
                console.log(`⏭️  Skipping existing session: ${sessionDir}`);
                continue;
            }

            // Tạo session mới
            const session = new FaceLogSession({
                sessionId: sessionDir,
                source: source,
                sourceType: sourceType,
                timestamp: timestamp,
                startTime: stats.birthtime,
                endTime: stats.mtime,
                status: 'completed',
                faceCount: faceIds.length,
                faceIds: faceIds,
                directoryPath: sessionPath,
                notes: 'Imported from existing face_logs'
            });

            await session.save();
            console.log(`✅ Imported session: ${sessionDir} (${faceIds.length} faces)`);
        }

        console.log('\n🎉 Import completed!');
    } catch (error) {
        console.error('❌ Import error:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    await importFaceLogs();
    await mongoose.connection.close();
    console.log('\n👋 Done!');
    process.exit(0);
};

main();
