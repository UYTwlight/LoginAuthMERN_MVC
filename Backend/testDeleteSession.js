import axios from 'axios';

const testDeleteSession = async () => {
    try {
        console.log('=== Testing Delete Face Log Session API ===\n');

        // Step 1: Create a test session first
        console.log('Step 1: Creating a test session...');
        const createResponse = await axios.post(
            'http://localhost:3001/api/emotions/face-logs/sessions',
            {
                sessionId: 'test_delete_session_' + Date.now(),
                source: 'Test_Camera',
                sourceType: 'camera',
                timestamp: new Date().toISOString(),
                directoryPath: 'face_logs/test_delete_' + Date.now()
            }
        );

        const sessionId = createResponse.data.session.sessionId;
        console.log('✅ Test session created:', sessionId);
        console.log();

        // Step 2: Login as admin to get token
        console.log('Step 2: Logging in as admin...');
        const loginResponse = await axios.post(
            'http://localhost:3001/api/user/login',
            {
                email: 'sonhotboy82@gmail.com',
                password: 'your_password_here' // Change this!
            }
        );

        const token = loginResponse.data.accessToken;
        console.log('✅ Admin logged in, token received');
        console.log();

        // Step 3: Delete the session
        console.log('Step 3: Deleting session...');
        const deleteResponse = await axios.delete(
            `http://localhost:3001/api/emotions/face-logs/sessions/${sessionId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        console.log('✅ DELETE SUCCESS!');
        console.log('Response:', JSON.stringify(deleteResponse.data, null, 2));
        console.log();

        // Step 4: Verify session is deleted
        console.log('Step 4: Verifying deletion...');
        try {
            await axios.get(
                `http://localhost:3001/api/emotions/face-logs/sessions/${sessionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log('❌ Session still exists (should have been deleted)');
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log('✅ Confirmed: Session successfully deleted from database');
            } else {
                console.log('⚠️ Unexpected error:', err.message);
            }
        }

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('❌ TEST FAILED:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

// Run test
testDeleteSession();
