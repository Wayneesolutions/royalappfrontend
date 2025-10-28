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

interface DashboardStats {
  totalCustomers: number;
  totalSales: number;
  pendingOrders: number;
  completedOrders: number;
  targetAchievement: number;
  monthlyTarget: number;
  dailyVisits: number;
  newLeads: number;
}

const DashboardHome = () => {
  const { user, logout, getOrderStats, getProducts, getMyOrders } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalSales: 0,
    pendingOrders: 0,
    completedOrders: 0,
    targetAchievement: 0,
    monthlyTarget: 0,
    dailyVisits: 0,
    newLeads: 0,
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
      
      // Fetch real order statistics and recent orders
      const [orderStatsResult, productsResult, recentOrdersResult] = await Promise.all([
        getOrderStats(),
        getProducts({ page: 1, limit: 1 }), // Just to get count
        getMyOrders({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      console.log('Dashboard - Order stats result:', orderStatsResult);
      console.log('Dashboard - Products result:', productsResult);
      console.log('Dashboard - Recent orders result:', recentOrdersResult);

      const orderStats = orderStatsResult?.success ? orderStatsResult.stats : {
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        totalAmount: 0
      };

      const productCount = productsResult?.success ? productsResult.pagination?.totalProducts || 0 : 0;
      const orders = recentOrdersResult?.success ? recentOrdersResult.orders || [] : [];

      setStats({
        totalCustomers: 45, // Keep mock for now - would need customer API
        totalSales: orderStats.totalAmount || 0,
        pendingOrders: orderStats.pendingOrders || 0,
        completedOrders: (orderStats.deliveredOrders || 0) + (orderStats.shippedOrders || 0),
        targetAchievement: 92, // Keep mock for now
        monthlyTarget: 50000, // Keep mock for now
        dailyVisits: 8, // Keep mock for now
        newLeads: 5, // Keep mock for now
      });

      setRecentOrders(orders);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
      // Set default values on error
      setStats({
        totalCustomers: 0,
        totalSales: 0,
        pendingOrders: 0,
        completedOrders: 0,
        targetAchievement: 0,
        monthlyTarget: 0,
        dailyVisits: 0,
        newLeads: 0,
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

  // Helper functions for order status formatting
  const getOrderStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'draft': '#6B7280',
      'pending': '#F59E0B',
      'confirmed': '#3B82F6',
      'approved': '#10B981',
      'processing': '#8B5CF6',
      'shipped': '#059669',
      'delivered': '#10B981',
      'cancelled': '#EF4444',
      'rejected': '#DC2626'
    };
    return colorMap[status] || '#6B7280';
  };

  const getOrderStatusIcon = (status: string) => {
    const iconMap: { [key: string]: string } = {
      'draft': 'create-outline',
      'pending': 'time-outline',
      'confirmed': 'checkmark-circle-outline',
      'approved': 'checkmark-circle',
      'processing': 'refresh-outline',
      'shipped': 'car-outline',
      'delivered': 'checkmark-done-outline',
      'cancelled': 'close-circle-outline',
      'rejected': 'close-circle'
    };
    return iconMap[status] || 'help-outline';
  };

  const getOrderStatusTitle = (status: string) => {
    const titleMap: { [key: string]: string } = {
      'draft': 'Order Draft',
      'pending': 'Order Pending',
      'confirmed': 'Order Confirmed',
      'approved': 'Order Approved',
      'processing': 'Order Processing',
      'shipped': 'Order Shipped',
      'delivered': 'Order Delivered',
      'cancelled': 'Order Cancelled',
      'rejected': 'Order Rejected'
    };
    return titleMap[status] || 'Order Updated';
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
        <ActivityIndicator size="large" color="#EF4444" />
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
            <Text style={styles.userName}>{user?.name || 'Salesman'}</Text>
            <Text style={styles.userRole}>Sales Executive</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
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
        <Text style={styles.sectionTitle}>Sales Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon="people"
            color="#3B82F6"
          />
          <StatCard
            title="Total Sales"
            value={`₹${stats.totalSales.toLocaleString()}`}
            icon="trending-up"
            color="#10B981"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon="time"
            color="#F59E0B"
          />
          <StatCard
            title="Completed Orders"
            value={stats.completedOrders}
            icon="checkmark-circle"
            color="#059669"
          />
          <StatCard
            title="Target Achievement"
            value={`${stats.targetAchievement}%`}
            icon="flag-outline"
            color="#DC2626"
          />
          <StatCard
            title="Daily Visits"
            value={stats.dailyVisits}
            icon="walk"
            color="#8B5CF6"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard
            title="New Order"
            description="Create a new sales order"
            icon="add-circle-outline"
            color="#EF4444"
            onPress={() => navigation.navigate('CreateOrder')}
          />
          <QuickActionCard
            title="Product Catalog"
            description="Browse products"
            icon="cube-outline"
            color="#F59E0B"
            onPress={() => navigation.navigate('ProductCatalog')}
          />
          <QuickActionCard
            title="My Orders"
            description="View order status"
            icon="list-outline"
            color="#8B5CF6"
            onPress={() => navigation.navigate('OrderList')}
          />
          <QuickActionCard
            title="Product Management"
            description="Manage products"
            icon="settings-outline"
            color="#3B82F6"
            onPress={() => navigation.navigate('ProductManagement')}
          />
          <QuickActionCard
            title="My Targets"
            description="View your targets"
            icon="flag-outline"
            color="#10B981"
            onPress={() => navigation.navigate('MyTargetsScreen')}
          />
          <QuickActionCard
            title="Pending Approvals"
            description="Approve orders"
            icon="checkmark-circle-outline"
            color="#8B5CF6"
            onPress={() => navigation.navigate('PendingApprovalsScreen')}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {recentOrders.length > 0 ? (
            recentOrders.map((order, index) => (
              <View key={order._id || index} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: getOrderStatusColor(order.status) }]}>
                  <Ionicons name={getOrderStatusIcon(order.status) as any} size={16} color="white" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{getOrderStatusTitle(order.status)}</Text>
                  <Text style={styles.activityDescription}>Order #{order.orderNumber} - ₹{order.finalAmount?.toLocaleString() || '0'}</Text>
                  <Text style={styles.activityTime}>{formatTimeAgo(order.createdAt)}</Text>
                </View>
              </View>
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
            <Ionicons name="log-out-outline" size={32} color="#EF4444" />
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
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginLeft: 16,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    color: '#EF4444',
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
    backgroundColor: '#EF4444',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default DashboardHome;
