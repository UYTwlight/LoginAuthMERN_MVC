import axios from 'axios';

const testCreateFaceLogSession = async () => {
    try {
        console.log('Testing Face Log Session Creation API...\n');

        const sessionData = {
            sessionId: 'test_camera_' + Date.now(),
            source: 'Camera_0',
            sourceType: 'camera',
            timestamp: new Date().toISOString(),
            directoryPath: 'face_logs/test_camera_' + Date.now()
        };

        console.log('Sending data:', JSON.stringify(sessionData, null, 2));

        const response = await axios.post(
            'http://localhost:3001/api/emotions/face-logs/sessions',
            sessionData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        // Test update
        console.log('\n\nTesting Update Face Log Session...\n');
        
        const updateData = {
            faceIds: ['ID0', 'ID1', 'ID2'],
            faceCount: 3,
            status: 'running'
        };

        const updateResponse = await axios.patch(
            `http://localhost:3001/api/emotions/face-logs/sessions/${sessionData.sessionId}`,
            updateData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ UPDATE SUCCESS!');
        console.log('Status:', updateResponse.status);
        console.log('Response:', JSON.stringify(updateResponse.data, null, 2));

    } catch (error) {
        console.error('❌ ERROR:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
};

testCreateFaceLogSession();
