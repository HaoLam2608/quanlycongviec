import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG } from '../src/config/api';

export default function TestAPI() {
    const router = useRouter();
    const [testResults, setTestResults] = useState<string[]>([]);

    const addResult = (result: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
    };

    const testConnection = async () => {
        addResult('🔄 Đang kiểm tra kết nối...');
        addResult(`🌐 Testing URL: ${API_CONFIG.BASE_URL}`);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/health`, { timeout: 5000 });
            addResult(`✅ Kết nối thành công: ${response.status} - ${JSON.stringify(response.data)}`);
        } catch (error: any) {
            addResult(`❌ Lỗi kết nối: ${error.message}`);
            if (error.code === 'ECONNREFUSED') {
                addResult('💡 Backend có thể chưa chạy hoặc URL sai');
                addResult('🔧 Đang test Android Emulator URL: 10.0.2.2:5000');
            }
        }
    };

    const testLoginEndpoint = async () => {
        addResult('🔄 Đang kiểm tra endpoint login...');
        addResult(`🌐 Testing URL: ${API_CONFIG.BASE_URL}/auth/login`);
        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/login`, {
                manv: 'test123',
                password: 'test123'
            }, { timeout: 5000 });

            addResult(`✅ Login endpoint phản hồi: ${response.status}`);
            addResult(`📥 Response: ${JSON.stringify(response.data)}`);
        } catch (error: any) {
            addResult(`❌ Lỗi login endpoint: ${error.response?.status || error.message}`);
            addResult(`📥 Error data: ${JSON.stringify(error.response?.data || error.message)}`);
        }
    };

    const testDifferentUrls = async () => {
        const urlsToTest = [
            'http://10.0.2.2:5000',    // Android Emulator
            'http://localhost:5000',   // iOS Simulator
            'http://127.0.0.1:5000',   // Alternative localhost
            ...API_CONFIG.ALTERNATIVE_URLS
        ];

        addResult('🔄 Đang test các URLs khác nhau...');

        for (const url of urlsToTest) {
            try {
                addResult(`🌐 Testing: ${url}`);
                const response = await axios.get(`${url}/health`, { timeout: 3000 });
                addResult(`✅ Tìm thấy server tại ${url}: ${response.status}`);
                addResult(`💡 Hãy cập nhật BASE_URL trong config/api.ts thành: ${url}`);
                return;
            } catch (error: any) {
                addResult(`❌ ${url}: ${error.message}`);
            }
        }
        addResult('🔍 Không tìm thấy server trên các URLs đã test');
    }; const clearResults = () => {
        setTestResults([]);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 p-4">
                <Text className="text-2xl font-bold text-center mb-6">Test API Connection</Text>

                <View className="space-y-4 mb-6">
                    <TouchableOpacity
                        className="bg-blue-500 p-4 rounded-lg"
                        onPress={testConnection}
                    >
                        <Text className="text-white text-center font-medium">Test Connection</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-green-500 p-4 rounded-lg"
                        onPress={testLoginEndpoint}
                    >
                        <Text className="text-white text-center font-medium">Test Login Endpoint</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-orange-500 p-4 rounded-lg"
                        onPress={testDifferentUrls}
                    >
                        <Text className="text-white text-center font-medium">Test Different URLs</Text>
                    </TouchableOpacity>

                    <View className="flex-row space-x-2">
                        <TouchableOpacity
                            className="flex-1 bg-gray-500 p-4 rounded-lg"
                            onPress={clearResults}
                        >
                            <Text className="text-white text-center font-medium">Clear</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 bg-red-500 p-4 rounded-lg"
                            onPress={() => router.back()}
                        >
                            <Text className="text-white text-center font-medium">Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1 bg-gray-100 rounded-lg p-3">
                    <Text className="font-bold mb-2">Test Results:</Text>
                    {testResults.map((result, index) => (
                        <Text key={index} className="text-sm mb-1 font-mono">{result}</Text>
                    ))}
                    {testResults.length === 0 && (
                        <Text className="text-gray-500 italic">Chưa có kết quả test...</Text>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}