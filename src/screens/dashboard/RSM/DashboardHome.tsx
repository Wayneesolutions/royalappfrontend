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
import { RSMStackParamList } from '../../../navigation/types';
import GlobalFAB from './GlobalFAB';

interface DashboardStats {
  totalASMs: number;
  totalSalesmen: number;
  totalDealers: number;
  totalDistributors: number;
  totalSales: number;
  pendingOrders: number;
  completedOrders: number;
  targetAchievement: number;
}

const DashboardHome = () => {
  const { user, getUsersByCompany, logout, getRSMDashboardData, getRSMTeamMembers, getRSMRecentActivity } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RSMStackParamList>>();
  const [stats, setStats] = useState<DashboardStats>({
    totalASMs: 0,
    totalSalesmen: 0,
    totalDealers: 0,
    totalDistributors: 0,
    totalSales: 0,
    pendingOrders: 0,
    completedOrders: 0,
    targetAchievement: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!user?.defaultCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch RSM dashboard data
      const result = await getRSMDashboardData();
      
      if (result?.success && result?.data) {
        const data = result.data;
        setDashboardData(data);
        
        // Update stats with real data
        setStats({
          totalASMs: data.teamOverview.roleCounts.asm || 0,
          totalSalesmen: data.teamOverview.roleCounts.salesman || 0,
          totalDealers: data.teamOverview.roleCounts.dealers || 0,
          totalDistributors: data.teamOverview.roleCounts.distibutors || 0,
          totalSales: data.salesSummary.totalSales || 0,
          pendingOrders: data.salesSummary.pendingOrders || 0,
          completedOrders: data.salesSummary.completedOrders || 0,
          targetAchievement: 78, // TODO: Calculate from actual target data
        });
        
        // Set additional data
        setTopPerformers(data.topPerformers || []);
        setRecentOrders(data.recentOrders || []);
        setTeamPerformance(data.teamPerformance || []);
      }

      // Fetch team members for detailed view
      try {
        const teamResult = await getRSMTeamMembers({ limit: 10 });
        if (teamResult?.success && teamResult?.data?.teamMembers) {
          setTeamMembers(teamResult.data.teamMembers);
        }
      } catch (teamError) {
        console.error('Failed to fetch team members:', teamError);
        setTeamMembers([]);
      }

      // Fetch recent activity
      try {
        const activityResult = await getRSMRecentActivity({ limit: 10, days: 7 });
        if (activityResult?.success && activityResult?.data?.activities) {
          setRecentActivity(activityResult.data.activities);
        }
      } catch (activityError) {
        console.error('Failed to fetch recent activity:', activityError);
        setRecentActivity([]);
      }
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

  // Helper functions for team overview
  const getRoleColor = (role: string) => {
    const colorMap = {
      'asm': '#F59E0B',
      'salesman': '#EF4444',
      'dealers': '#8B5CF6',
      'distibutors': '#06B6D4',
      'subdealer': '#10B981'
    };
    return colorMap[role] || '#6B7280';
  };

  const getRoleDisplayName = (role: string) => {
    const displayMap = {
      'asm': 'Area Sales Manager',
      'salesman': 'Salesman',
      'dealers': 'Dealer',
      'distibutors': 'Distributor',
      'subdealer': 'Sub Dealer'
    };
    return displayMap[role] || role;
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
        <ActivityIndicator size="large" color="#10B981" />
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
              <Text style={styles.userName}>{user?.name || 'RSM'}</Text>
              <Text style={styles.userRole}>Regional Sales Manager</Text>
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
          <Text style={styles.sectionTitle}>Team Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="ASMs"
              value={stats.totalASMs}
              icon="person"
              color="#F59E0B"
            />
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
              color="#10B981"
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
              title="Create Order"
              description="Create new order"
              icon="add-circle-outline"
              color="#3B82F6"
              onPress={() => (navigation as any).navigate('RSMCreateOrder')}
            />
            <QuickActionCard
              title="My Orders"
              description="View all orders"
              icon="list-outline"
              color="#F59E0B"
              onPress={() => (navigation as any).navigate('RSMOrderList')}
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
              icon="flag-outline"
              color="#EF4444"
              onPress={() => navigation.navigate('TargetManagementScreen')}
            />
          </View>
        </View>

        {/* Team Performance Overview */}
        {teamMembers.length > 0 && (
          <View style={styles.teamSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team Performance</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('TeamManagementScreen')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.teamCard}>
              {teamMembers.slice(0, 5).map((member, index) => (
                <View key={member._id} style={styles.teamMemberItem}>
                  <View style={styles.memberInfo}>
                    <View style={[styles.memberAvatar, { backgroundColor: getRoleColor(member.role) }]}>
                      <Text style={styles.memberInitial}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRole}>{getRoleDisplayName(member.role)}</Text>
                      <View style={styles.memberStatus}>
                        <View style={[
                          styles.statusDot, 
                          { backgroundColor: member.isActive ? '#10B981' : '#6B7280' }
                        ]} />
                        <Text style={styles.statusText}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.memberStats}>
                    <Text style={styles.memberSales}>
                      ₹{member.salesData?.totalSales?.toLocaleString() || '0'}
                    </Text>
                    <Text style={styles.memberOrders}>
                      {member.salesData?.orderCount || 0} orders
                    </Text>
                    <Text style={styles.memberMonthly}>
                      ₹{member.salesData?.monthlySales?.toLocaleString() || '0'} this month
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <View style={styles.performersSection}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            <View style={styles.performersCard}>
              {topPerformers.slice(0, 3).map((performer, index) => (
                <View key={performer.userId} style={styles.performerItem}>
                  <View style={styles.performerRank}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.performerInfo}>
                    <Text style={styles.performerName}>{performer.userName}</Text>
                    <Text style={styles.performerRole}>{getRoleDisplayName(performer.userRole)}</Text>
                  </View>
                  <View style={styles.performerStats}>
                    <Text style={styles.performerSales}>₹{performer.totalSales.toLocaleString()}</Text>
                    <Text style={styles.performerOrders}>{performer.orderCount} orders</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <View style={styles.ordersCard}>
              {recentOrders.slice(0, 3).map((order) => (
                <View key={order._id} style={styles.orderItem}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderCreator}>{order.createdBy.name}</Text>
                  </View>
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderAmount}>₹{order.finalAmount.toLocaleString()}</Text>
                    <Text style={styles.orderStatus}>{order.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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
              <Ionicons name="log-out-outline" size={32} color="#10B981" />
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
    color: '#10B981',
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
  // Team Performance styles
  teamSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
  },
  teamCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamMemberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  memberSales: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  memberOrders: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  memberMonthly: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  // Top Performers styles
  performersSection: {
    padding: 20,
    paddingTop: 0,
  },
  performersCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  performerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  performerRole: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  performerStats: {
    alignItems: 'flex-end',
  },
  performerSales: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  performerOrders: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Recent Orders styles
  ordersSection: {
    padding: 20,
    paddingTop: 0,
  },
  ordersCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  orderCreator: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderDetails: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
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
    backgroundColor: '#10B981',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default DashboardHome;