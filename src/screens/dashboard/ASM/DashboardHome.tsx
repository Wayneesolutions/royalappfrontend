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
import type { StackNavigationProp } from '@react-navigation/stack';
import { ASMStackParamList } from '../../../navigation/types';
import GlobalFAB from './GlobalFAB';

interface DashboardStats {
  totalSalesmen: number;
  totalDealers: number;
  totalDistributors: number;
  totalSales: number;
  pendingOrders: number;
  completedOrders: number;
  targetAchievement: number;
  activeCustomers: number;
}

const DashboardHome = () => {
  const { user, getUsersByCompany, logout, getASMDashboardData, getASMRecentActivity } = useAuth();
  const navigation = useNavigation<StackNavigationProp<ASMStackParamList>>();
  const [stats, setStats] = useState<DashboardStats>({
    totalSalesmen: 0,
    totalDealers: 0,
    totalDistributors: 0,
    totalSales: 0,
    pendingOrders: 0,
    completedOrders: 0,
    targetAchievement: 0,
    activeCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!user?.defaultCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch ASM dashboard data
      const result = await getASMDashboardData();
      
      if (result?.success && result?.data) {
        const data = result.data;
        setDashboardData(data);
        
        // Update stats with real data
        const teamOverview = data.teamOverview || {};
        const salesSummary = data.salesSummary || {};
        const roleCounts = teamOverview.roleCounts || {};
        
        setStats({
          totalSalesmen: roleCounts.salesman || 0,
          totalDealers: roleCounts.dealers || 0,
          totalDistributors: roleCounts.distibutors || 0,
          totalSales: salesSummary.totalSales || 0,
          pendingOrders: salesSummary.pendingOrders || 0,
          completedOrders: salesSummary.completedOrders || 0,
          targetAchievement: 78, // TODO: Calculate from actual target data
          activeCustomers: teamOverview.activeMembers || 0,
        });
      } else {
        // Fallback to basic stats if API fails
        setStats({
          totalSalesmen: 0,
          totalDealers: 0,
          totalDistributors: 0,
          totalSales: 0,
          pendingOrders: 0,
          completedOrders: 0,
          targetAchievement: 0,
          activeCustomers: 0,
        });
      }

      // Fetch recent activity
      try {
        const activityResult = await getASMRecentActivity({ limit: 10, days: 7 });
        if (activityResult?.success && activityResult?.data?.activities) {
          setRecentActivity(activityResult.data.activities);
        }
      } catch (activityError) {
        console.error('Failed to fetch recent activity:', activityError);
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      
      // Set fallback stats on error
      setStats({
        totalSalesmen: 0,
        totalDealers: 0,
        totalDistributors: 0,
        totalSales: 0,
        pendingOrders: 0,
        completedOrders: 0,
        targetAchievement: 0,
        activeCustomers: 0,
      });
      
      Alert.alert('Error', 'Failed to load dashboard data. Please check your connection and try again.');
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
        <ActivityIndicator size="large" color="#F59E0B" />
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
              <Text style={styles.userName}>{user?.name || 'ASM'}</Text>
              <Text style={styles.userRole}>Area Sales Manager</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{user?.defaultCompany?.companyName || 'Company'}</Text>
            <Text style={styles.companyCode}>{user?.defaultCompany?.companyCode || 'CODE'}</Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Area Overview</Text>
          
          {/* Show message if no team members */}
          {stats.totalSalesmen === 0 && stats.totalDealers === 0 && stats.totalDistributors === 0 && (
            <View style={styles.emptyTeamContainer}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTeamTitle}>No Team Members Assigned</Text>
              <Text style={styles.emptyTeamSubtitle}>
                Contact your administrator to assign team members to your area, or check if team members are properly linked to your account.
              </Text>
              <TouchableOpacity 
                style={styles.contactAdminButton}
                onPress={() => Alert.alert(
                  'Contact Administrator', 
                  'Please contact your system administrator to:\n\n1. Assign team members to your area\n2. Set up proper reporting relationships\n3. Configure user roles and permissions',
                  [{ text: 'OK' }]
                )}
              >
                <Ionicons name="mail-outline" size={16} color="#F59E0B" />
                <Text style={styles.contactAdminText}>Contact Administrator</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Salesmen"
              value={stats.totalSalesmen}
              icon="person-add"
              color="#EF4444"
            />
            <StatCard
              title="Dealers"
              value={stats.totalDealers}
              icon="business"
              color="#8B5CF6"
            />
            <StatCard
              title="Distributors"
              value={stats.totalDistributors}
              icon="storefront"
              color="#06B6D4"
            />
            <StatCard
              title="Active Customers"
              value={stats.activeCustomers}
              icon="people"
              color="#3B82F6"
            />
            <StatCard
              title="Total Sales"
              value={`₹${stats.totalSales.toLocaleString()}`}
              icon="trending-up"
              color="#059669"
            />
            <StatCard
              title="Target Achievement"
              value={`${stats.targetAchievement}%`}
              icon="target"
              color="#DC2626"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title="View Team"
              description="Manage your team members"
              icon="people-outline"
              color="#F59E0B"
              onPress={() => navigation.navigate('TeamManagementScreen')}
            />
            <QuickActionCard
              title="Sales Report"
              description="View sales performance"
              icon="bar-chart-outline"
              color="#3B82F6"
              onPress={() => navigation.navigate('SalesReportScreen')}
            />
            <QuickActionCard
              title="Orders"
              description="Manage orders"
              icon="list-outline"
              color="#EF4444"
              onPress={() => navigation.navigate('OrderManagementScreen')}
            />
            <QuickActionCard
              title="Pending Approvals"
              description="Approve orders"
              icon="checkmark-circle-outline"
              color="#8B5CF6"
              onPress={() => navigation.navigate('PendingApprovalsScreen')}
            />
            <QuickActionCard
              title="Targets"
              description="Set and track targets"
              icon="target-outline"
              color="#10B981"
              onPress={() => navigation.navigate('TargetManagementScreen')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                    <Ionicons name={activity.icon as any} size={16} color="white" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>
                      {formatTimeAgo(activity.timestamp)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noActivityContainer}>
                <Ionicons name="time-outline" size={32} color="#9CA3AF" />
                <Text style={styles.noActivityText}>No recent activity</Text>
                <Text style={styles.noActivitySubtext}>Activity from your team will appear here</Text>
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
              <Ionicons name="log-out-outline" size={32} color="#F59E0B" />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    color: '#F59E0B',
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
  emptyTeamContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyTeamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyTeamSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  contactAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  contactAdminText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 6,
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
  noActivityContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  noActivitySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
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
    backgroundColor: '#F59E0B',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default DashboardHome;