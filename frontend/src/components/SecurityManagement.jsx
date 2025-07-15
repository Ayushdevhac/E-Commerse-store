import { useState, useEffect } from 'react';
import { Shield, Lock, Activity, Users, AlertTriangle, Settings, Eye, EyeOff, RefreshCw, CheckCircle } from 'lucide-react';
import useAdminStore from '../stores/useAdminStore';
import LoadingSpinner from './LoadingSpinner';

const SecurityManagement = () => {
    const {
        securityStats,
        systemLogs,
        securityStatsLoading,
        logsLoading,
        updatingSettings,
        getSecurityStats,
        getSystemLogs,
        updateSecuritySetting
    } = useAdminStore();

    const [selectedLogType, setSelectedLogType] = useState('all');
    const [logLimit, setLogLimit] = useState(50);
    const [activeTab, setActiveTab] = useState('overview');
    const [settingsForm, setSettingsForm] = useState({});

    useEffect(() => {
        getSecurityStats();
        getSystemLogs(logLimit, selectedLogType);
    }, []);

    useEffect(() => {
        if (securityStats?.stats?.security) {
            setSettingsForm(securityStats.stats.security);
        }
    }, [securityStats]);

    const handleRefreshStats = () => {
        getSecurityStats();
        getSystemLogs(logLimit, selectedLogType);
    };

    const handleLogTypeChange = (type) => {
        setSelectedLogType(type);
        getSystemLogs(logLimit, type);
    };

    const handleSettingUpdate = async (setting, value) => {
        try {
            await updateSecuritySetting(setting, value);
            getSecurityStats(); // Refresh stats
        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    };

    const renderSecurityOverview = () => {
        if (securityStatsLoading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner variant="dots" size="lg" />
                </div>
            );
        }

        if (!securityStats?.stats) {
            return (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No security data available</p>
                </div>
            );
        }

        const { users, activity, security, environment } = securityStats.stats;

        return (
            <div className="space-y-6">
                {/* Security Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.total}</p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {users.admins} admins
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Logins</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.recentLogins24h}</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Last 24 hours
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspicious Activity</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activity.suspiciousActivity}</p>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Potential threats
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Score</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {environment.httpsEnabled && environment.corsConfigured && security.jwtConfigured ? 'High' : 'Medium'}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Overall security rating
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Settings className="h-5 w-5 mr-2" />
                        Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleRefreshStats}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Stats
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                        >
                            <Lock className="h-4 w-4 mr-2" />
                            Security Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                        >
                            <Activity className="h-4 w-4 mr-2" />
                            View Logs
                        </button>
                    </div>
                </div>

                {/* Security Environment Status */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Lock className="h-5 w-5 mr-2" />
                        Security Environment
                    </h3>                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">HTTPS Enabled</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                environment.httpsEnabled
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {environment.httpsEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">CORS Configured</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                environment.corsConfigured
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {environment.corsConfigured ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">JWT Configured</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                security.jwtConfigured
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {security.jwtConfigured ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">Rate Limiting</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                security.rateLimitEnabled
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {security.rateLimitEnabled ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">Input Validation</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                security.inputValidation
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {security.inputValidation ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">Node Environment</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                environment.nodeEnv === 'production'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                                {environment.nodeEnv}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };    const renderSecuritySettings = () => {
        if (securityStatsLoading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner variant="dots" size="lg" />
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Security Configuration */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Settings className="h-5 w-5 mr-2" />
                        Security Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Rate Limit Window (minutes)
                                </label>                                <input
                                    type="number"
                                    value={settingsForm.rateLimitWindow || 15}
                                    onChange={(e) => setSettingsForm({...settingsForm, rateLimitWindow: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                                    min="1"
                                    max="60"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Rate Limit Requests
                                </label>
                                <input
                                    type="number"
                                    value={settingsForm.rateLimitRequests || 100}
                                    onChange={(e) => setSettingsForm({...settingsForm, rateLimitRequests: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                                    min="10"
                                    max="1000"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    JWT Expiry (hours)
                                </label>
                                <input
                                    type="number"
                                    value={settingsForm.jwtExpiry || 24}
                                    onChange={(e) => setSettingsForm({...settingsForm, jwtExpiry: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                                    min="1"
                                    max="168"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password Min Length
                                </label>
                                <input
                                    type="number"
                                    value={settingsForm.passwordMinLength || 6}
                                    onChange={(e) => setSettingsForm({...settingsForm, passwordMinLength: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                                    min="4"
                                    max="20"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button
                            onClick={() => handleSettingUpdate('rateLimitWindow', settingsForm.rateLimitWindow)}
                            disabled={updatingSettings}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            {updatingSettings ? 'Updating...' : 'Update Rate Limit'}
                        </button>
                        <button
                            onClick={() => handleSettingUpdate('jwtExpiry', settingsForm.jwtExpiry)}
                            disabled={updatingSettings}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                        >
                            <Lock className="h-4 w-4 mr-2" />
                            {updatingSettings ? 'Updating...' : 'Update JWT Settings'}
                        </button>
                        <button
                            onClick={() => handleSettingUpdate('passwordMinLength', settingsForm.passwordMinLength)}
                            disabled={updatingSettings}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 flex items-center"
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            {updatingSettings ? 'Updating...' : 'Update Password Policy'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSystemLogs = () => {
        if (logsLoading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner variant="dots" size="lg" />
                </div>
            );
        }

        const logTypeColors = {
            info: 'text-blue-600 dark:text-blue-400',
            warn: 'text-yellow-600 dark:text-yellow-400',
            error: 'text-red-600 dark:text-red-400',
            success: 'text-green-600 dark:text-green-400'
        };

        return (
            <div className="space-y-6">
                {/* Log Controls */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <Activity className="h-5 w-5 mr-2" />
                            System Logs
                        </h3>
                        <div className="flex items-center space-x-4">                            <select
                                value={selectedLogType}
                                onChange={(e) => handleLogTypeChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {systemLogs?.types?.map(type => (
                                    <option key={type} value={type} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleRefreshStats}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {systemLogs?.logs?.map((log, index) => (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${logTypeColors[log.level] || 'text-gray-600 dark:text-gray-400'}`}>
                                            {log.level.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            [{log.type}]
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>                                <p className="text-sm text-gray-700 dark:text-gray-300">{log.message}</p>
                                {log.ip && log.userAgent && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        IP: {log.ip} | {log.userAgent}
                                    </div>
                                )}
                            </div>
                        ))}
                        {(!systemLogs?.logs || systemLogs.logs.length === 0) && (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>No logs available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Security Overview', icon: Shield },
                        { id: 'settings', label: 'Settings', icon: Settings },
                        { id: 'logs', label: 'System Logs', icon: Activity }
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                                activeTab === id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <Icon className="h-4 w-4 mr-2" />
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'overview' && renderSecurityOverview()}
                {activeTab === 'settings' && renderSecuritySettings()}
                {activeTab === 'logs' && renderSystemLogs()}
            </div>
        </div>
    );
};

export default SecurityManagement;
