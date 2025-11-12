// Test script to simulate member task status update
// Run this after starting the backend server

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testMemberTaskUpdate() {
    try {
        console.log('🧪 Testing member task status update...\n');

        // Step 1: Login as an employee
        console.log('1️⃣ Logging in as employee (manv: NV002)...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            manv: 'NV002',
            password: 'password123'
        });

        const token = loginRes.data.token;
        const userId = loginRes.data.user.id;
        console.log('✅ Logged in successfully');
        console.log('   User ID:', userId);
        console.log('   User:', loginRes.data.user.hoten);
        console.log('   Role:', loginRes.data.user.role);
        console.log('   Token:', token.substring(0, 20) + '...\n');

        // Step 2: Get member's tasks
        console.log('2️⃣ Fetching member tasks...');
        const tasksRes = await axios.get(`${API_URL}/members/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const tasks = tasksRes.data.tasks || [];
        console.log(`✅ Found ${tasks.length} tasks\n`);

        if (tasks.length === 0) {
            console.log('❌ No tasks found for this user. Cannot test status update.');
            return;
        }

        // Find a task with status "Chưa bắt đầu"
        const testTask = tasks.find(t => t.trangThai === 'Chưa bắt đầu');
        
        if (!testTask) {
            console.log('⚠️ No task with status "Chưa bắt đầu" found.');
            console.log('Using first available task:', tasks[0].tentask);
            console.log('Current status:', tasks[0].trangThai);
            console.log('\n📋 Task details:');
            console.log('   ID:', tasks[0].id);
            console.log('   Name:', tasks[0].tentask);
            console.log('   Status:', tasks[0].trangThai);
            console.log('   nguoiDuocGiaoId:', tasks[0].nguoiDuocGiaoId);
            console.log('   nguoiGiaoId:', tasks[0].nguoiGiaoId);
        } else {
            console.log('📋 Selected task for testing:');
            console.log('   ID:', testTask.id);
            console.log('   Name:', testTask.tentask);
            console.log('   Current Status:', testTask.trangThai);
            console.log('   nguoiDuocGiaoId:', testTask.nguoiDuocGiaoId);
            console.log('   nguoiGiaoId:', testTask.nguoiGiaoId);
            console.log('');

            // Step 3: Update task status to "Đang chạy"
            console.log('3️⃣ Updating task status to "Đang chạy"...');
            const updateRes = await axios.patch(
                `${API_URL}/members/tasks/${testTask.id}/status`,
                { trangThai: 'Đang chạy' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✅ Update response:', updateRes.data.message);
            console.log('   New status:', updateRes.data.task?.trangThai);
            console.log('   ngayBatDau:', updateRes.data.task?.ngayBatDau);
            console.log('\n✅ TEST PASSED: Member can update task status to "Đang chạy"');
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data?.message || error.response.data);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testMemberTaskUpdate();
