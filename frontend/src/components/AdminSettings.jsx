import { useState, useEffect } from 'react';
import { 
    Database, 
    HardDrive, 
    Shield, 
    Trash2, 
    RefreshCw, 
    Activity,
    BarChart3,
    Settings,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';
import useAdminStore from '../stores/useAdminStore';
import SecurityManagement from './SecurityManagement';
import SecurityDashboard from './SecurityDashboard';
import LoadingSpinner from './LoadingSpinner';

const AdminSettings = () => {
    const {
        cacheStats,
        databaseStats,
        isClearing,
        statsLoading,
        dbStatsLoading,
        clearAllCaches,
        clearSpecificCache,
        getCacheStats,
        getDatabaseStats
    } = useAdminStore();

    const [activeSection, setActiveSection] = useState('overview');

    useEffect(() => {
        getCacheStats();
        getDatabaseStats();
    }, []);

    const handleRefreshStats = () => {
        getCacheStats();
        getDatabaseStats();
    };

    const handleClearCache = async (cacheType = null) => {
        try {
            if (cacheType) {
                await clearSpecificCache(cacheType);
            } else {
                await clearAllCaches();
            }
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    };

    const renderOverview = () => {
        const isLoading = statsLoading || dbStatsLoading;
        
        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner variant="dots" size="lg" />
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Cache Status */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cache Status</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {cacheStats?.redisConnected ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${
                                cacheStats?.redisConnected 
                                    ? 'bg-green-100 dark:bg-green-900' 
                                    : 'bg-red-100 dark:bg-red-900'
                            }`}>
                                {cacheStats?.redisConnected ? (
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                ) : (
                                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {cacheStats?.totalKeys || 0} keys stored
                        </p>
                    </div>                    {/* Database Health */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Database</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {databaseStats?.stats?.connection?.status || 'Loading...'}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${
                                databaseStats?.stats?.connection?.status === 'Connected' 
                                    ? 'bg-green-100 dark:bg-green-900' 
                                    : 'bg-yellow-100 dark:bg-yellow-900'
                            }`}>
                                <Database className={`h-6 w-6 ${
                                    databaseStats?.stats?.connection?.status === 'Connected'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-yellow-600 dark:text-yellow-400'
                                }`} />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            DB: {databaseStats?.stats?.connection?.database || 'N/A'}
                        </p>
                    </div>

                    {/* Total Collections */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {databaseStats?.stats?.collections?.total || 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {Object.keys(databaseStats?.stats?.collections || {}).length - 1} collections
                        </p>
                    </div>

                    {/* System Activity */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Activity</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {databaseStats?.stats?.activity?.recentOrders || 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Orders (30 days)
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
                            onClick={() => handleClearCache()}
                            disabled={isClearing}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isClearing ? 'Clearing...' : 'Clear All Cache'}
                        </button>
                        <button
                            onClick={() => setActiveSection('cache')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                        >
                            <HardDrive className="h-4 w-4 mr-2" />
                            Manage Cache
                        </button>
                        <button
                            onClick={() => setActiveSection('security')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Security Panel
                        </button>
                        <button
                            onClick={() => setActiveSection('security-dashboard')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
                        >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Security Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCacheManagement = () => {
        if (statsLoading) {
            return <LoadingSpinner variant="pulse" size="lg" className="mx-auto" />;
        }

        const cacheTypes = ['products', 'users', 'categories', 'orders', 'analytics'];

        return (
            <div className="space-y-6">                {/* Cache Statistics */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <HardDrive className="h-5 w-5 mr-2" />
                        Cache Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {cacheStats?.stats?.totalKeys || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Keys</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {cacheStats?.stats?.memoryUsage || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className={`text-2xl font-bold ${
                                cacheStats?.redisConnected 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {cacheStats?.redisConnected ? 'Connected' : 'Disconnected'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Redis Status</p>
                        </div>
                    </div>
                </div>

                {/* Cache Type Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cache Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Products</span>
                                <span className="text-xl font-bold text-blue-800 dark:text-blue-200">
                                    {cacheStats?.stats?.productCacheKeys || 0}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                                <span className="text-green-700 dark:text-green-300 font-medium">Categories</span>
                                <span className="text-xl font-bold text-green-800 dark:text-green-200">
                                    {cacheStats?.stats?.categoryCacheKeys || 0}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between">
                                <span className="text-purple-700 dark:text-purple-300 font-medium">Featured</span>
                                <span className="text-xl font-bold text-purple-800 dark:text-purple-200">
                                    {cacheStats?.stats?.featuredProductKeys || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cache Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cache Management</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Clear All Caches</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Remove all cached data across the system</p>
                            </div>
                            <button
                                onClick={() => handleClearCache()}
                                disabled={isClearing}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {isClearing ? 'Clearing...' : 'Clear All'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cacheTypes.map(cacheType => (
                                <div key={cacheType} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <h4 className="font-medium text-gray-900 dark:text-white capitalize mb-2">
                                        {cacheType} Cache
                                    </h4>
                                    <button
                                        onClick={() => handleClearCache(cacheType)}
                                        disabled={isClearing}
                                        className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 text-sm"
                                    >
                                        Clear {cacheType}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };    const renderDatabaseManagement = () => {
        if (dbStatsLoading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner variant="dots" size="lg" />
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Database Connection Status */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Database className="h-5 w-5 mr-2" />
                        Database Connection
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className={`text-2xl font-bold ${
                                databaseStats?.stats?.connection?.status === 'Connected'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {databaseStats?.stats?.connection?.status || 'Loading...'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Connection Status</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {databaseStats?.stats?.connection?.database || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Database Name</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {databaseStats?.stats?.connection?.host || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Host</p>
                        </div>
                    </div>
                </div>

                {/* Collection Statistics */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collection Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                                    {databaseStats?.stats?.collections?.products || 0}
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">Products</p>
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                                    {databaseStats?.stats?.collections?.users || 0}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">Users</p>
                            </div>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                                    {databaseStats?.stats?.collections?.orders || 0}
                                </p>
                                <p className="text-sm text-purple-600 dark:text-purple-400">Orders</p>
                            </div>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                                    {databaseStats?.stats?.collections?.categories || 0}
                                </p>
                                <p className="text-sm text-orange-600 dark:text-orange-400">Categories</p>
                            </div>
                        </div>
                        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-pink-800 dark:text-pink-200">
                                    {databaseStats?.stats?.collections?.coupons || 0}
                                </p>
                                <p className="text-sm text-pink-600 dark:text-pink-400">Coupons</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Recent Activity (30 Days)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                                    {databaseStats?.stats?.activity?.recentOrders || 0}
                                </p>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">New Orders</p>
                            </div>
                        </div>
                        <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-cyan-800 dark:text-cyan-200">
                                    {databaseStats?.stats?.activity?.recentUsers || 0}
                                </p>
                                <p className="text-sm text-cyan-600 dark:text-cyan-400">New Users</p>                            </div>
                        </div>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                                    ${databaseStats?.stats?.activity?.totalSales?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-sm text-indigo-600 dark:text-indigo-400">Total Sales</p>
                            </div>
                        </div>
                    </div>                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Section Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'cache', label: 'Cache Management', icon: HardDrive },
                        { id: 'database', label: 'Database', icon: Database },
                        { id: 'security', label: 'Security', icon: Shield }
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveSection(id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                                activeSection === id
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

            {/* Section Content */}
            <div>
                {activeSection === 'overview' && renderOverview()}
                {activeSection === 'cache' && renderCacheManagement()}
                {activeSection === 'database' && renderDatabaseManagement()}
                {activeSection === 'security' && <SecurityManagement />}
                {activeSection === 'security-dashboard' && <SecurityDashboard />}
            </div>
        </div>
    );
};

export default AdminSettings;
