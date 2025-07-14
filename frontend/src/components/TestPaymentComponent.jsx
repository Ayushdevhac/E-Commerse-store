import { useState } from 'react';
import axios from '../lib/axios';

const TestPaymentComponent = () => {
    const [testResult, setTestResult] = useState('');
    const [loading, setLoading] = useState(false);

    const testCheckoutSuccess = async () => {
        setLoading(true);
        setTestResult('');
        
        try {
            // Test with a fake session ID
            const response = await axios.post('/payments/checkout-success', {
                sessionId: 'cs_test_fake_session_id_for_testing'
            });
            
            setTestResult(`✅ Success: ${JSON.stringify(response.data)}`);
        } catch (error) {
            setTestResult(`❌ Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testHealthCheck = async () => {
        setLoading(true);
        setTestResult('');
        
        try {
            const response = await axios.get('/health');
            setTestResult(`✅ Health Check: ${JSON.stringify(response.data)}`);
        } catch (error) {
            setTestResult(`❌ Health Check Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
            <h2 className="text-white text-xl font-bold mb-4">API Test Component</h2>
            
            <div className="space-y-4">
                <button
                    onClick={testHealthCheck}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    {loading ? 'Testing...' : 'Test Health Check'}
                </button>
                
                <button
                    onClick={testCheckoutSuccess}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    {loading ? 'Testing...' : 'Test Checkout Success'}
                </button>
                
                {testResult && (
                    <div className="mt-4 p-4 bg-gray-700 rounded text-white text-sm">
                        <pre className="whitespace-pre-wrap">{testResult}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestPaymentComponent;
