import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3001';

async function testSessionDetail() {
    try {
        console.log('Testing session detail API...\n');
        
        // Get sessions first
        const sessionsRes = await axios.get(`${API_URL}/api/emotions/face-logs/sessions`);
        
        if (!sessionsRes.data.sessions || sessionsRes.data.sessions.length === 0) {
            console.log('No sessions found');
            return;
        }
        
        const firstSession = sessionsRes.data.sessions[0];
        console.log('Testing with session:', firstSession.sessionId);
        console.log('');
        
        // Get session detail
        const detailRes = await axios.get(`${API_URL}/api/emotions/face-logs/sessions/${firstSession.sessionId}`);
        
        console.log('Response structure:');
        console.log('success:', detailRes.data.success);
        console.log('data keys:', Object.keys(detailRes.data.data || {}));
        console.log('');
        
        if (detailRes.data.data && detailRes.data.data.faces) {
            console.log('Number of faces:', detailRes.data.data.faces.length);
            
            if (detailRes.data.data.faces.length > 0) {
                const firstFace = detailRes.data.data.faces[0];
                console.log('\nFirst face structure:');
                console.log('faceId:', firstFace.faceId);
                console.log('totalFrames:', firstFace.totalFrames);
                console.log('firstFrameImage:', firstFace.firstFrameImage);
                console.log('Has emotionData:', !!firstFace.emotionData);
                console.log('emotionData length:', firstFace.emotionData?.length || 0);
                
                if (firstFace.emotionData && firstFace.emotionData.length > 0) {
                    console.log('\nFirst emotion data entry:');
                    console.log(JSON.stringify(firstFace.emotionData[0], null, 2));
                }
            }
        } else {
            console.log('No faces data in response');
            console.log('Full response:', JSON.stringify(detailRes.data, null, 2));
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testSessionDetail();
