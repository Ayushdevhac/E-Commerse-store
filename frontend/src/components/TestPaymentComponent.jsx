import { useState } from 'react';
import { useCartStore } from '../stores/useCartStore';
import { useUserStore } from '../stores/useUserStore';
import axios from '../lib/axios';

const TestPaymentComponent = () => {
    const [testResult, setTestResult] = useState('');
    const [loading, setLoading] = useState(false);
    const { cart } = useCartStore();
    const { user } = useUserStore();

    const testCreateCheckoutSession = async () => {
        setLoading(true);
        setTestResult('');
        
        try {
            // Create a test payload
            const testPayload = {
                products: [
                    {
                        id: 'test_product_id',
                        name: 'Test Product',
                        price: 29.99,
                        quantity: 1,
                        image: 'https://example.com/test.jpg'
                    }
                ],
                shippingAddressId: 'test_address_id'
            };

            console.log('Testing checkout session with payload:', testPayload);
            
            const response = await axios.post('/payment/create-checkout-session', testPayload);
            setTestResult(`✅ Checkout Session: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            console.error('Checkout session test error:', error);
            setTestResult(`❌ Checkout Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };    const testCheckoutSuccess = async () => {
        setLoading(true);
        setTestResult('');
        
        try {
            // Test with a fake session ID
            const response = await axios.post('/payment/checkout-success', {
                sessionId: 'cs_test_fake_session_id_for_testing'
            });
            
            setTestResult(`✅ Success: ${JSON.stringify(response.data, null, 2)}`);
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
            setTestResult(`✅ Health Check: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            setTestResult(`❌ Health Check Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };return (
        <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
            <h2 className="text-white text-xl font-bold mb-4">Payment Test Component</h2>
            
            <div className="mb-4 text-sm text-gray-300">
                <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
                <p><strong>Cart items:</strong> {cart?.length || 0}</p>
            </div>
            
            <div className="space-y-4">
                <button
                    onClick={testCreateCheckoutSession}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"
                >
                    {loading ? 'Testing...' : 'Test Create Checkout Session'}
                </button>                <button
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
