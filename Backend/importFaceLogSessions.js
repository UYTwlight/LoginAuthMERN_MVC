import mongoose from 'mongoose';
import { FaceLogSession } from './src/models/Emotion.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MONGODB_URI = 'mongodb://localhost:27017/emotion-detection';

async function createSampleSessions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Đọc các thư mục có sẵn trong face_logs
        const faceLogsPath = path.join(__dirname, '..', 'Emotion-statistics', 'face_logs');
        
        if (!fs.existsSync(faceLogsPath)) {
            console.log('❌ face_logs folder not found!');
            mongoose.disconnect();
            return;
        }

        const sessionDirs = fs.readdirSync(faceLogsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log(`Found ${sessionDirs.length} session folders in face_logs/\n`);

        let created = 0;
        let skipped = 0;

        for (const sessionDir of sessionDirs) {
            const sessionPath = path.join(faceLogsPath, sessionDir);
            
            // Check if already exists in DB
            const existing = await FaceLogSession.findOne({ sessionId: sessionDir });
            if (existing) {
                console.log(`⏭️  Skipped: ${sessionDir} (already exists)`);
                skipped++;
                continue;
            }

            // Get face IDs
            const faceIds = fs.readdirSync(sessionPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('ID'))
                .map(dirent => dirent.name)
                .sort((a, b) => {
                    const numA = parseInt(a.replace('ID', ''));
                    const numB = parseInt(b.replace('ID', ''));
                    return numA - numB;
                });

            // Parse session name: Camera_0_20251109_101419
            const parts = sessionDir.split('_');
            const timestamp = parts.slice(-2).join('_');
            const source = parts.slice(0, -2).join('_');
            
            // Determine source type
            let sourceType = 'video';
            if (source.startsWith('Camera')) {
                sourceType = 'camera';
            } else if (source.startsWith('file-')) {
                sourceType = 'video';
            }

            // Get folder creation time
            const stats = fs.statSync(sessionPath);

            // Create session
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
            console.log(`✅ Created: ${sessionDir} (${faceIds.length} faces)`);
            created++;
        }

        console.log('\n' + '═'.repeat(80));
        console.log(`📊 Summary:`);
        console.log(`   Created: ${created}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total:   ${created + skipped}`);
        console.log('═'.repeat(80) + '\n');

        // Verify
        const totalCount = await FaceLogSession.countDocuments();
        console.log(`✅ Total sessions in MongoDB: ${totalCount}\n`);

        mongoose.disconnect();
        console.log('✅ Done!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
}

createSampleSessions();
