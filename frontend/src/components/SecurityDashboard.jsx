import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Eye, Ban, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import useAdminStore from '../stores/useAdminStore';
import toast from 'react-hot-toast';

const SecurityDashboard = () => {
    const [securityHealth, setSecurityHealth] = useState(null);
    const [securityEvents, setSecurityEvents] = useState([]);
    const [blacklist, setBlacklist] = useState([]);
    const [newBlacklistIP, setNewBlacklistIP] = useState('');
    const [blacklistReason, setBlacklistReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('health');

    const { axiosInstance } = useAdminStore();

    // Fetch security health status
    const fetchSecurityHealth = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/admin/security/health');
            setSecurityHealth(response.data.health);
        } catch (error) {
            console.error('Error fetching security health:', error);
            toast.error('Failed to fetch security health status');
        } finally {
            setLoading(false);
        }
    };

    // Fetch security events
    const fetchSecurityEvents = async () => {
        try {
            const response = await axiosInstance.get('/admin/security/events?limit=100');
            setSecurityEvents(response.data.events);
        } catch (error) {
            console.error('Error fetching security events:', error);
            toast.error('Failed to fetch security events');
        }
    };

    // Fetch IP blacklist
    const fetchBlacklist = async () => {
        try {
            const response = await axiosInstance.get('/admin/security/blacklist');
            setBlacklist(response.data.blacklist);
        } catch (error) {
            console.error('Error fetching blacklist:', error);
            toast.error('Failed to fetch IP blacklist');
        }
    };

    // Add IP to blacklist
    const addToBlacklist = async () => {
        if (!newBlacklistIP) {
            toast.error('Please enter an IP address');
            return;
        }

        try {
            await axiosInstance.post('/admin/security/blacklist', {
                ip: newBlacklistIP,
                reason: blacklistReason || 'Manual addition'
            });
            
            toast.success('IP added to blacklist successfully');
            setNewBlacklistIP('');
            setBlacklistReason('');
            fetchBlacklist();
        } catch (error) {
            console.error('Error adding IP to blacklist:', error);
            toast.error(error.response?.data?.message || 'Failed to add IP to blacklist');
        }
    };

    // Remove IP from blacklist
    const removeFromBlacklist = async (ip) => {
        try {
            await axiosInstance.delete(`/admin/security/blacklist/${ip}`);
            toast.success('IP removed from blacklist successfully');
            fetchBlacklist();
        } catch (error) {
            console.error('Error removing IP from blacklist:', error);
            toast.error('Failed to remove IP from blacklist');
        }
    };

    useEffect(() => {
        fetchSecurityHealth();
        fetchSecurityEvents();
        fetchBlacklist();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'HEALTHY': return 'text-green-500';
            case 'WARNING': return 'text-yellow-500';
            case 'ERROR': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getEventTypeColor = (eventType) => {
        const colors = {
            UNAUTHORIZED_ACCESS: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            RATE_LIMIT_EXCEEDED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            INVALID_ORIGIN: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            SUSPICIOUS_ACTIVITY: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            LOGIN_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            LOGIN_FAILURE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
        return colors[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <Shield className="h-8 w-8 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Dashboard</h2>
                <button
                    onClick={() => {
                        fetchSecurityHealth();
                        fetchSecurityEvents();
                        fetchBlacklist();
                    }}
                    className="ml-auto flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'health', label: 'Health Status', icon: Shield },
                        { id: 'events', label: 'Security Events', icon: Eye },
                        { id: 'blacklist', label: 'IP Blacklist', icon: Ban }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Health Status Tab */}
            {activeTab === 'health' && (
                <div className="space-y-6">
                    {securityHealth && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Health Status</h3>
                                <span className={`text-lg font-bold ${getStatusColor(securityHealth.status)}`}>
                                    {securityHealth.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(securityHealth.checks).map(([check, status]) => (
                                    <div key={check} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                                            {check.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        {status ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                Last checked: {new Date(securityHealth.timestamp).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Security Events Tab */}
            {activeTab === 'events' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Security Events</h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {securityEvents.map((event, index) => (
                            <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                                            {event.eventType.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-900 dark:text-white">
                                        IP: {event.ip} | User: {event.userEmail || 'Anonymous'}
                                    </div>
                                    {event.details && (
                                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                            {JSON.stringify(event.details, null, 2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {securityEvents.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No security events found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* IP Blacklist Tab */}
            {activeTab === 'blacklist' && (
                <div className="space-y-6">
                    {/* Add to Blacklist */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add IP to Blacklist</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    IP Address
                                </label>
                                <input
                                    type="text"
                                    value={newBlacklistIP}
                                    onChange={(e) => setNewBlacklistIP(e.target.value)}
                                    placeholder="192.168.1.1"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={blacklistReason}
                                    onChange={(e) => setBlacklistReason(e.target.value)}
                                    placeholder="Suspicious activity"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div className="flex items-end">
                                <button
                                    onClick={addToBlacklist}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Add to Blacklist
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Blacklist Display */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Blacklisted IPs ({blacklist.length})
                        </h3>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {blacklist.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{item.ip}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{item.reason}</div>
                                        {item.timestamp && (
                                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                                Added: {new Date(item.timestamp).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeFromBlacklist(item.ip)}
                                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            
                            {blacklist.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No IPs in blacklist
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityDashboard;
