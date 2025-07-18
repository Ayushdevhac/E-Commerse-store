import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/useUserStore';
import axios from '../lib/axios';

const AuthDebug = () => {
    const { user, checkingAuth, checkAuth } = useUserStore();
    const [debugInfo, setDebugInfo] = useState({});
    const [cookies, setCookies] = useState('');
    const [cookieDetails, setCookieDetails] = useState([]);

    useEffect(() => {
        // Get cookie information
        const cookieString = document.cookie;
        setCookies(cookieString);
        
        // Parse cookies for better display
        const cookieArray = cookieString.split('; ').filter(c => c.length > 0).map(cookie => {
            const [name, value] = cookie.split('=');
            return { name, value: value ? value.substring(0, 20) + '...' : 'empty' };
        });
        setCookieDetails(cookieArray);
        
        // Get debug info
        const info = {
            hasUser: !!user,
            isCheckingAuth: checkingAuth,
            userEmail: user?.email || 'No user',
            userRole: user?.role || 'No role',
            timestamp: new Date().toISOString(),
            cookieCount: cookieArray.length
        };
        setDebugInfo(info);
    }, [user, checkingAuth]);

    const testAuth = async () => {
        try {
            console.log('🧪 Testing authentication...');
            await checkAuth();
        } catch (error) {
            console.error('Auth test failed:', error);
        }
    };

    const testProfileDirect = async () => {
        try {
            console.log('🧪 Testing direct profile request...');
            const response = await axios.get('/auth/profile');
            console.log('Profile response:', response.data);
        } catch (error) {
            console.error('Direct profile test failed:', error);
        }
    };

    const testRefreshDirect = async () => {
        try {
            console.log('🧪 Testing direct refresh request...');
            const response = await axios.post('/auth/refresh-token');
            console.log('Refresh response:', response.data);
        } catch (error) {
            console.error('Direct refresh test failed:', error);
        }
    };

    const testLoginDirect = async () => {
        try {
            console.log('🧪 Testing direct login request...');
            const response = await axios.post('/auth/login', {
                email: 'test@example.com',
                password: 'password123'
            });
            console.log('Login response:', response.data);
            
            // Force reload cookie info after login
            setTimeout(() => {
                const newCookieString = document.cookie;
                setCookies(newCookieString);
                const newCookieArray = newCookieString.split('; ').filter(c => c.length > 0).map(cookie => {
                    const [name, value] = cookie.split('=');
                    return { name, value: value ? value.substring(0, 20) + '...' : 'empty' };
                });
                setCookieDetails(newCookieArray);
            }, 1000);
        } catch (error) {
            console.error('Direct login test failed:', error);
        }
    };

    return (
        <div className="fixed top-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2">Auth Debug</h3>
            
            <div className="mb-2 text-xs">
                <strong>User Status:</strong>
                <ul className="text-xs">
                    <li>Has User: {debugInfo.hasUser ? '✅' : '❌'}</li>
                    <li>Checking Auth: {debugInfo.isCheckingAuth ? '🔄' : '✅'}</li>
                    <li>Email: {debugInfo.userEmail}</li>
                    <li>Role: {debugInfo.userRole}</li>
                    <li>Cookies: {debugInfo.cookieCount}</li>
                </ul>
            </div>

            <div className="mb-2">
                <strong className="text-xs">Cookie Details:</strong>
                <div className="text-xs bg-gray-700 p-1 rounded max-h-20 overflow-y-auto">
                    {cookieDetails.length > 0 ? (
                        cookieDetails.map((cookie, index) => (
                            <div key={index}>
                                <strong>{cookie.name}:</strong> {cookie.value}
                            </div>
                        ))
                    ) : (
                        'No cookies found'
                    )}
                </div>
            </div>

            <div className="space-y-1">
                <button 
                    onClick={testLoginDirect}
                    className="w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
                >
                    Test Direct Login
                </button>
                <button 
                    onClick={testAuth}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                >
                    Test Auth Check
                </button>
                <button 
                    onClick={testProfileDirect}
                    className="w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                >
                    Test Profile Direct
                </button>
                <button 
                    onClick={testRefreshDirect}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
                >
                    Test Refresh Direct
                </button>
            </div>
        </div>
    );
};

export default AuthDebug;
