import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from '../lib/axios';
import showToast from '../lib/toast';
import { Crown, Gift, Sparkles } from 'lucide-react';

const VipCouponCard = () => {
    const [vipData, setVipData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        checkVipEligibility();
    }, []);

    const checkVipEligibility = async () => {
        try {
            const response = await axios.get('/vip/eligibility');
            setVipData(response.data);
        } catch (error) {
            console.error('Error checking VIP eligibility:', error);
        } finally {
            setLoading(false);
        }
    };

    const claimVipCoupon = async () => {
        setClaiming(true);
        try {
            const response = await axios.post('/vip/create-mine');
            setVipData(prev => ({
                ...prev,
                hasVipCoupon: true,
                vipCoupon: response.data.coupon
            }));
            showToast.success('VIP Coupon claimed successfully!');
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to claim VIP coupon');
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-800 rounded-lg p-4">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
        );
    }

    if (!vipData || !vipData.isEligible) {
        return (
            <motion.div
                className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >                <div className="flex items-center space-x-2 mb-2">
                    <Crown className="text-purple-400" size={20} />
                    <h3 className="text-lg font-medium text-purple-300">Ultra-Exclusive VIP Program</h3>
                </div>
                <p className="text-gray-300 text-sm mb-2">
                    Total spent: <span className="text-emerald-400 font-medium">${vipData?.totalSpent?.toFixed(2) || '0.00'}</span>
                </p>
                <p className="text-gray-300 text-sm mb-1">
                    Orders: <span className="text-blue-400 font-medium">{vipData?.orderCount || 0}</span> | 
                    Avg: <span className="text-yellow-400 font-medium">${vipData?.avgOrderValue?.toFixed(2) || '0.00'}</span>
                </p>
                <p className="text-gray-400 text-sm">
                    {vipData?.eligibilityReason || 'Ultra-exclusive VIP program with strict criteria and limited availability!'}
                </p>
                
                {vipData?.hasRecentVip && (
                    <div className="mt-2 text-xs text-orange-300 bg-orange-900/20 rounded p-2">
                        ⏰ VIP cooldown active - exclusive benefits limited to once every 3 months
                    </div>
                )}
                
                {vipData?.meetsBasicCriteria && !vipData?.isEligible && (
                    <div className="mt-2 text-xs text-purple-300 bg-purple-900/20 rounded p-2">
                        ✨ You meet VIP criteria! Our ultra-selective program has limited spots.
                    </div>
                )}
                
                <div className="mt-3 bg-purple-900/30 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((vipData?.totalSpent / 2000) * 100, 100)}%` }}
                    ></div>
                    <div className="text-xs text-purple-300 mt-1">
                        Progress to Ultra Premium: ${((vipData?.totalSpent || 0) / 2000 * 100).toFixed(1)}%
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-600/40 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >            <div className="flex items-center space-x-2 mb-3">
                <Crown className="text-yellow-400" size={24} />
                <h3 className="text-xl font-bold text-yellow-300">Ultra-Exclusive VIP</h3>
                <Sparkles className="text-yellow-400" size={20} />
            </div>

            <div className="space-y-2 mb-4">
                <p className="text-gray-300 text-sm">
                    Total spent: <span className="text-emerald-400 font-medium">${vipData.totalSpent.toFixed(2)}</span>
                </p>
                <p className="text-gray-300 text-sm">
                    Orders: <span className="text-blue-400 font-medium">{vipData.orderCount}</span> | 
                    Avg: <span className="text-yellow-400 font-medium">${vipData.avgOrderValue?.toFixed(2) || '0.00'}</span>
                </p>
                <p className="text-yellow-300 text-sm font-medium">
                    Tier: <span className="uppercase">{vipData.tier}</span>
                </p>
            </div>

            {vipData.hasVipCoupon ? (
                <div className="bg-yellow-900/40 rounded-lg p-3 border border-yellow-600/30">
                    <div className="flex items-center space-x-2 mb-2">
                        <Gift className="text-yellow-400" size={20} />
                        <h4 className="text-yellow-300 font-medium">Your VIP Coupon</h4>
                    </div>
                    <div className="space-y-1">
                        <p className="text-white font-mono text-lg">{vipData.vipCoupon.code}</p>
                        <p className="text-yellow-300 text-sm">
                            {vipData.vipCoupon.discountPercentage}% off orders over ${vipData.vipCoupon.minimumAmount}
                        </p>
                        <p className="text-gray-400 text-xs">
                            Expires: {new Date(vipData.vipCoupon.expirationDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">                    <p className="text-yellow-300 text-sm font-medium">
                        🎉 You've been selected for our ultra-exclusive VIP program!
                    </p>
                    <div className="text-xs text-yellow-200 bg-yellow-900/20 rounded p-2 mb-3">
                        Only 70% of qualifying customers are chosen. You're among the elite!
                    </div>
                    <motion.button
                        onClick={claimVipCoupon}
                        disabled={claiming}
                        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {claiming ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Claiming...</span>
                            </>
                        ) : (
                            <>
                                <Gift size={16} />
                                <span>Claim VIP Coupon</span>
                            </>
                        )}
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
};

export default VipCouponCard;
