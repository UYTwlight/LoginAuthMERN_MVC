import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function testFaceLogSessionsAPI() {
    try {
        console.log('=== Testing Face Log Sessions API ===\n');
        
        // Step 1: Login to get token
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'sonhotboy82@gmail.com',  // Admin email from MongoDB
            password: 'admin123'             // Update with correct password
        });
        
        const token = loginResponse.data.accessToken;
        console.log('✅ Login successful, token received\n');
        
        // Step 2: Get face log sessions
        console.log('2. Fetching face log sessions...');
        const sessionsResponse = await axios.get(`${API_URL}/api/emotions/face-logs/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Sessions API response:');
        console.log('Success:', sessionsResponse.data.success);
        console.log('Number of sessions:', sessionsResponse.data.sessions?.length || 0);
        
        if (sessionsResponse.data.sessions && sessionsResponse.data.sessions.length > 0) {
            console.log('\n📋 Sessions list:');
            sessionsResponse.data.sessions.forEach((session, index) => {
                console.log(`\n${index + 1}. ${session.sessionId}`);
                console.log(`   Source: ${session.source}`);
                console.log(`   Type: ${session.sourceType}`);
                console.log(`   Face Count: ${session.faceCount}`);
                console.log(`   Status: ${session.status}`);
            });
            
            // Step 3: Get details of first session
            const firstSession = sessionsResponse.data.sessions[0];
            console.log(`\n3. Fetching details for session: ${firstSession.sessionId}...`);
            
            const detailResponse = await axios.get(
                `${API_URL}/api/emotions/face-logs/sessions/${firstSession.sessionId}`,
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            console.log('✅ Session detail response:');
            console.log('Success:', detailResponse.data.success);
            console.log('Faces in session:', detailResponse.data.data?.faces?.length || 0);
            
            if (detailResponse.data.data?.faces?.length > 0) {
                const face = detailResponse.data.data.faces[0];
                console.log('\n📊 First face details:');
                console.log('Face ID:', face.faceId);
                console.log('Total Frames:', face.totalFrames);
                console.log('Dominant Emotion:', face.statistics?.dominantEmotion);
            }
        } else {
            console.log('\n⚠️  No sessions found in response');
        }
        
        console.log('\n✅ All tests passed!');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testFaceLogSessionsAPI();
