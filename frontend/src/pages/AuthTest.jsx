import { useState } from 'react';
import { useUserStore } from '../stores/useUserStore';

const AuthTest = () => {
    const { user, login, logout, checkAuth, checkingAuth } = useUserStore();
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('password123');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await login(email, password);
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleCheckAuth = async () => {
        try {
            await checkAuth();
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
                
                {/* Auth Status */}
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold mb-2">Status</h2>
                    <p>User: {user ? `${user.name} (${user.email})` : 'Not logged in'}</p>
                    <p>Checking Auth: {checkingAuth ? 'Yes' : 'No'}</p>
                    <p>Role: {user?.role || 'N/A'}</p>
                </div>

                {/* Login Form */}
                {!user && (
                    <div className="bg-gray-800 p-4 rounded-lg mb-6">
                        <h2 className="text-lg font-semibold mb-4">Login</h2>
                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 bg-gray-700 rounded"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 bg-gray-700 rounded"
                            />
                            <button
                                onClick={handleLogin}
                                disabled={isLoggingIn}
                                className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded disabled:bg-gray-600"
                            >
                                {isLoggingIn ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                    <button
                        onClick={handleCheckAuth}
                        className="w-full bg-green-600 hover:bg-green-700 p-2 rounded"
                    >
                        Check Authentication
                    </button>
                    
                    {user && (
                        <button
                            onClick={handleLogout}
                            className="w-full bg-red-600 hover:bg-red-700 p-2 rounded"
                        >
                            Logout
                        </button>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-6 text-sm text-gray-400">
                    <p>To test automatic login:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Login using the form above</li>
                        <li>Open a new tab and go to the homepage</li>
                        <li>You should be automatically logged in</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default AuthTest;
