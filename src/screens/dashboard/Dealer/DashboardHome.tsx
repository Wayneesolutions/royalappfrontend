import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import GlobalFAB from './GlobalFAB';

interface DashboardStats {
  totalOrders: number;
  draftOrders: number;
  approvedOrders: number;
  totalSales: number;
  targetAchievement: number;
  monthlyTarget: number;
  availableProducts: number;
  newOrders: number;
}

const DashboardHome = () => {
  const { user, logout, getOrderStats, getMyOrders } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    draftOrders: 0,
    approvedOrders: 0,
    totalSales: 0,
    targetAchievement: 0,
    monthlyTarget: 0,
    availableProducts: 0,
    newOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!user?.defaultCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch order statistics, draft orders count, approved orders count, and recent orders
      const [orderStatsResult, draftOrdersResult, approvedOrdersResult, recentOrdersResult] = await Promise.all([
        getOrderStats(),
        getMyOrders({ status: 'draft', page: 1, limit: 1 }), // Fetch draft orders to get count
        getMyOrders({ status: 'approved', page: 1, limit: 1 }), // Fetch approved orders to get count
        getMyOrders({ page: 1, limit: 5 }) // Fetch recent orders for activity feed
      ]);

      console.log('Dashboard - Order stats result:', orderStatsResult);
      console.log('Dashboard - Draft orders result:', draftOrdersResult);
      console.log('Dashboard - Approved orders result:', approvedOrdersResult);

      const orderStats = orderStatsResult?.success ? orderStatsResult.stats : {
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        totalAmount: 0
      };

      // Get draft orders count from pagination
      const draftOrdersCount = draftOrdersResult?.success 
        ? (draftOrdersResult.pagination?.totalOrders || 0) 
        : 0;

      // Get approved orders count from pagination (more accurate than confirmedOrders from stats)
      const approvedOrdersCount = approvedOrdersResult?.success 
        ? (approvedOrdersResult.pagination?.totalOrders || 0) 
        : (orderStats.confirmedOrders || 0); // Fallback to stats if pagination not available

      setStats({
        totalOrders: orderStats.totalOrders || 0,
        draftOrders: draftOrdersCount,
        approvedOrders: approvedOrdersCount,
        totalSales: orderStats.totalAmount || 0,
        targetAchievement: 0,
        monthlyTarget: 0,
        availableProducts: 0,
        newOrders: draftOrdersCount,
      });

      // Set recent orders for activity feed
      const orders = recentOrdersResult?.success ? recentOrdersResult.orders || [] : [];
      // Sort by createdAt descending (most recent first)
      const sortedOrders = orders.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return dateB - dateA;
      });
      setRecentOrders(sortedOrders.slice(0, 5)); // Limit to 5 most recent
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
      // Set default values on error
      setStats({
        totalOrders: 0,
        draftOrders: 0,
        approvedOrders: 0,
        totalSales: 0,
        targetAchievement: 0,
        monthlyTarget: 0,
        availableProducts: 0,
        newOrders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.defaultCompany]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
  };

  // Helper function to get order status icon
  const getOrderStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'document-text-outline';
      case 'pending_approval':
        return 'time-outline';
      case 'approved':
        return 'checkmark-circle-outline';
      case 'sent_to_tally':
        return 'sync-outline';
      case 'dispatched':
        return 'car-outline';
      case 'delivered':
        return 'checkmark-done-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'document-outline';
    }
  };

  // Helper function to get order status color
  const getOrderStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return '#6B7280';
      case 'pending_approval':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'sent_to_tally':
        return '#3B82F6';
      case 'dispatched':
        return '#8B5CF6';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Helper function to get order status title
  const getOrderStatusTitle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'Draft Order Created';
      case 'pending_approval':
        return 'Order Pending Approval';
      case 'approved':
        return 'Order Approved';
      case 'sent_to_tally':
        return 'Order Sent to Tally';
      case 'dispatched':
        return 'Order Dispatched';
      case 'delivered':
        return 'Order Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return 'Order Updated';
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      // Navigation will be handled automatically by AppNavigator based on auth state
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const StatCard = ({ title, value, icon, color, onPress }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="white" />
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, color, onPress }: {
    title: string;
    description: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress}>
      <View style={styles.actionContent}>
        <Ionicons name={icon as any} size={32} color="white" />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDescription}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Dealer'}</Text>
              <Text style={styles.userRole}>Dealer</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{user?.defaultCompany?.companyName || 'Company'}</Text>
            <Text style={styles.companyCode}>{user?.defaultCompany?.companyCode || 'CODE'}</Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon="list"
              color="#8B5CF6"
            />
            <StatCard
              title="Draft Orders"
              value={stats.draftOrders}
              icon="document-outline"
              color="#F59E0B"
              onPress={() => (navigation as any).navigate('DealerOrderList', { statusFilter: 'draft' })}
            />
            <StatCard
              title="Approved Orders"
              value={stats.approvedOrders}
              icon="checkmark-circle"
              color="#10B981"
              onPress={() => (navigation as any).navigate('DealerOrderList', { statusFilter: 'approved' })}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title="Create Order"
              description="Create new order"
              icon="add-circle-outline"
              color="#8B5CF6"
              onPress={() => navigation.navigate('DealerCreateOrder')}
            />
            <QuickActionCard
              title="My Orders"
              description="View order status"
              icon="list-outline"
              color="#3B82F6"
              onPress={() => navigation.navigate('DealerOrderList')}
            />
            <QuickActionCard
              title="Received Orders"
              description="Orders from others"
              icon="download-outline"
              color="#10B981"
              onPress={() => navigation.navigate('DealerReceivedOrders')}
            />
            <QuickActionCard
              title="Sales Report"
              description="View performance"
              icon="bar-chart-outline"
              color="#10B981"
              onPress={() => navigation.navigate('SalesReportScreen')}
            />
            <QuickActionCard
              title="Team Management"
              description="Manage sub-dealers"
              icon="people-outline"
              color="#EF4444"
              onPress={() => navigation.navigate('TeamManagement')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentOrders.length > 0 ? (
              recentOrders.map((order, index) => (
                <TouchableOpacity
                  key={order._id || index}
                  style={styles.activityItem}
                  onPress={() => {
                    // Navigate to order details or edit screen
                    if (order.status === 'draft') {
                      navigation.navigate('DealerEditOrder' as any, { order });
                    } else {
                      navigation.navigate('DealerOrderList' as any);
                    }
                  }}
                >
                  <View style={[styles.activityIcon, { backgroundColor: getOrderStatusColor(order.status) }]}>
                    <Ionicons name={getOrderStatusIcon(order.status) as any} size={16} color="white" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{getOrderStatusTitle(order.status)}</Text>
                    <Text style={styles.activityDescription}>
                      Order #{order.orderNumber} - ₹{order.finalAmount?.toLocaleString() || '0'}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatTimeAgo(order.updatedAt || order.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyActivity}>
                <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyActivityText}>No recent activity</Text>
                <Text style={styles.emptyActivitySubtext}>Your recent orders will appear here</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <GlobalFAB />

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="log-out-outline" size={32} color="#8B5CF6" />
              <Text style={styles.modalTitle}>Logout</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Are you sure you want to logout? You will need to sign in again to access your account.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelLogout}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButtonModal]}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  welcomeSection: {
    flex: 1,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginLeft: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  companyCode: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activitySection: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  logoutButtonModal: {
    backgroundColor: '#8B5CF6',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default DashboardHome;
