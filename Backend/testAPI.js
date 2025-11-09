import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function testAPI() {
    try {
        console.log('=== Testing Face Log Sessions API ===\n');
        
        // Test without authentication first to see the error
        console.log('1. Testing API without token (should fail with 401)...');
        try {
            const response = await axios.get(`${API_URL}/api/emotions/face-logs/sessions`);
            console.log('❌ Unexpected: API returned data without token');
        } catch (error) {
            console.log('✅ Expected: API returned', error.response?.status, error.response?.data?.message);
        }
        
        // Now you need to provide the token from browser
        console.log('\n2. To test with authentication:');
        console.log('   - Open browser Developer Console (F12)');
        console.log('   - Login to the app');
        console.log('   - In Console, type: localStorage.getItem("accessToken")');
        console.log('   - Copy the token value');
        console.log('   - Run this script again with the token\n');
        
        // Check if token is provided as command line argument
        const token = process.argv[2];
        if (token) {
            console.log('3. Testing with provided token...');
            const response = await axios.get(`${API_URL}/api/emotions/face-logs/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ API Response:');
            console.log('Success:', response.data.success);
            console.log('Number of sessions:', response.data.sessions?.length || 0);
            
            if (response.data.sessions && response.data.sessions.length > 0) {
                console.log('\n📋 Sessions:');
                response.data.sessions.forEach((session, index) => {
                    console.log(`${index + 1}. ${session.sessionId} - ${session.sourceType} - ${session.faceCount} faces`);
                });
            } else {
                console.log('⚠️  No sessions found in response');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testAPI();
