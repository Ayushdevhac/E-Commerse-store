import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../lib/axios';
import showToast from '../lib/toast';
import { Crown, Users, Gift, Sparkles } from 'lucide-react';

const VipCouponManager = () => {
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);

    const createAllVipCoupons = async () => {
        setProcessing(true);
        try {
            const response = await axios.post('/vip/create-all');
            setResults(response.data);
            showToast.success(`Processed ${response.data.customersProcessed} customers`);
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to create VIP coupons');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div
            className="bg-gradient-to-br from-purple-900/20 to-yellow-900/20 border border-purple-700/30 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center space-x-3 mb-6">
                <Crown className="text-yellow-400" size={28} />
                <h2 className="text-2xl font-bold text-yellow-300">VIP Coupon Manager</h2>
                <Sparkles className="text-yellow-400" size={24} />
            </div>

            <div className="space-y-6">                <div className="bg-purple-900/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Ultra-Exclusive VIP Qualification Criteria</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-300">Ultra Premium ($2000+ OR $1500+ with 6+ orders):</span>
                            <span className="text-emerald-400">35% off (min $100)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Loyal VIP (8+ orders, $1200+, $200+ avg):</span>
                            <span className="text-emerald-400">30% off (min $150)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">High-Value ($500+ avg, 4+ orders, $1000+):</span>
                            <span className="text-emerald-400">25% off (min $200)</span>
                        </div>
                        <div className="text-xs text-yellow-300 mt-2 italic">
                            * VIP status is ultra-exclusive: only 70% of qualifying customers are selected
                        </div>
                        <div className="text-xs text-red-300 italic">
                            * 3-month cooldown period between VIP coupons
                        </div>
                    </div>
                </div>

                <motion.button
                    onClick={createAllVipCoupons}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-purple-600 to-yellow-600 hover:from-purple-500 hover:to-yellow-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}                >
                    {processing ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Processing Ultra-Selective VIP Generation...</span>
                        </>
                    ) : (
                        <>
                            <Users size={20} />
                            <span>Generate Ultra-Exclusive VIP Coupons</span>
                        </>
                    )}
                </motion.button>

            {results && (
                <motion.div
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                >
                    <h4 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center space-x-2">
                        <Gift size={20} />
                        <span>Ultra-Selective VIP Results</span>
                    </h4>
                    
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-emerald-900/30 rounded p-2 text-center">
                                <div className="text-emerald-400 font-bold text-lg">{results.vipCouponsCreated || 0}</div>
                                <div className="text-xs text-emerald-300">VIP Created</div>
                            </div>
                            <div className="bg-yellow-900/30 rounded p-2 text-center">
                                <div className="text-yellow-400 font-bold text-lg">{results.eligibleButNotSelected || 0}</div>
                                <div className="text-xs text-yellow-300">Not Selected</div>
                            </div>
                            <div className="bg-red-900/30 rounded p-2 text-center">
                                <div className="text-red-400 font-bold text-lg">{results.cooldownBlocked || 0}</div>
                                <div className="text-xs text-red-300">Cooldown</div>
                            </div>
                            <div className="bg-purple-900/30 rounded p-2 text-center">
                                <div className="text-purple-400 font-bold text-lg">{results.selectivityRate || '0%'}</div>
                                <div className="text-xs text-purple-300">Selectivity</div>
                            </div>
                        </div>
                        
                        <p className="text-gray-300">
                            <span className="font-medium">Customers processed:</span> {results.customersProcessed}
                        </p>
                            
                            {results.results.map((result, index) => (
                                <div key={index} className="bg-gray-900 rounded p-3 border border-gray-600">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-white font-medium">{result.user}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            result.status === 'coupon_created' 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-yellow-600 text-white'
                                        }`}>
                                            {result.status === 'coupon_created' ? 'New' : 'Existing'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        <p>Total spent: <span className="text-emerald-400">${result.totalSpent.toFixed(2)}</span></p>
                                        <p>Orders: <span className="text-emerald-400">{result.orderCount}</span></p>
                                        <p>Coupon: <span className="text-yellow-400 font-mono">{result.couponCode}</span></p>
                                        {result.discountPercentage && (
                                            <p>Discount: <span className="text-emerald-400">{result.discountPercentage}% off orders over ${result.minimumAmount}</span></p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default VipCouponManager;
