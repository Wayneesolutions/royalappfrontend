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
  totalOrders: number;
  pendingOrders: number; // Draft orders
  approvedOrders: number; // Approved orders
}

const DashboardHome = () => {
  const { user, logout, getOrderStats, getMyOrders } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0, // Draft orders
    approvedOrders: 0, // Approved orders
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchDashboardData = async () => {
    if (!user?.defaultCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch order statistics and draft orders
      const [orderStatsResult, draftOrdersResult] = await Promise.all([
        getOrderStats(),
        getMyOrders({ status: 'draft', page: 1, limit: 1 }).catch(() => null) // Get draft orders count
      ]);

      console.log('Dashboard - Order stats result:', orderStatsResult);
      console.log('Dashboard - Draft orders result:', draftOrdersResult);

      const orderStats = orderStatsResult?.success ? orderStatsResult.stats : {
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        approvedOrders: 0,
      };

      // Get draft orders count (pending/draft orders)
      const draftOrdersCount = draftOrdersResult?.success 
        ? (draftOrdersResult.pagination?.totalOrders || draftOrdersResult.stats?.totalOrders || 0)
        : 0;

      // Approved orders (confirmedOrders from backend)
      const approvedOrders = orderStats.confirmedOrders || orderStats.approvedOrders || 0;

      // Total orders that dealer can create (all orders created by this dealer)
      const totalOrders = orderStats.totalOrders || 0;

      setStats({
        totalOrders: totalOrders,
        pendingOrders: draftOrdersCount, // Draft orders
        approvedOrders: approvedOrders, // Approved orders
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
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

  const StatCard = ({ title, value, icon, color, subtitle, onPress }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    subtitle?: string;
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
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
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
            <Text style={styles.userName}>{user?.name || 'SubDealer'}</Text>
            <Text style={styles.userRole}>Sub Dealer</Text>
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
        <Text style={styles.sectionTitle}>Business Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="list"
            color="#8B5CF6"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon="time"
            color="#F59E0B"
            subtitle="Draft Orders"
          />
          <StatCard
            title="Approved Orders"
            value={stats.approvedOrders}
            icon="checkmark-circle"
            color="#10B981"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard
            title="Place Order"
            description="Create new order"
            icon="add-circle-outline"
            color="#8B5CF6"
            onPress={() => navigation.navigate('CreateOrderScreen' as any)}
          />
          <QuickActionCard
            title="Order History"
            description="View all orders"
            icon="list-outline"
            color="#3B82F6"
            onPress={() => navigation.navigate('OrderListScreen' as any)}
          />
          <QuickActionCard
            title="Pending Approvals"
            description="Approve orders"
            icon="checkmark-circle-outline"
            color="#10B981"
            onPress={() => navigation.navigate('PendingApprovalsScreen' as any)}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark-circle" size={16} color="white" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Order Approved</Text>
              <Text style={styles.activityDescription}>Order has been approved</Text>
              <Text style={styles.activityTime}>Recently</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="add" size={16} color="white" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New Order Created</Text>
              <Text style={styles.activityDescription}>Draft order created successfully</Text>
              <Text style={styles.activityTime}>Recently</Text>
            </View>
          </View>
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
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
