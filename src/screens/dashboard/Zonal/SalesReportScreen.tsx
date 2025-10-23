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
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface SalesData {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    userRole: string;
    totalSales: number;
    orderCount: number;
  }>;
  monthlySales: Array<{
    _id: {
      year: number;
      month: number;
    };
    totalSales: number;
    orderCount: number;
  }>;
  salesByRole: {
    [key: string]: {
      totalSales: number;
      orderCount: number;
      memberCount: number;
    };
  };
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  salesData: {
    totalSales: number;
    orderCount: number;
  };
}

const SalesReportScreen = () => {
  const { user, getZonalDashboardData, getZonalTeamMembers } = useAuth();
  const navigation = useNavigation();
  
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
  ];

  const views = [
    { key: 'overview', label: 'Overview', icon: 'bar-chart' },
    { key: 'team', label: 'Team Performance', icon: 'people' },
    { key: 'trends', label: 'Sales Trends', icon: 'trending-up' },
  ];

  const fetchSalesData = async () => {
    if (!user?.defaultCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch dashboard data for sales analytics
      const dashboardResult = await getZonalDashboardData();
      
      if (dashboardResult?.success && dashboardResult?.data) {
        const data = dashboardResult.data;
        
        // Calculate average order value
        const avgOrderValue = data.salesSummary.totalOrders > 0 
          ? data.salesSummary.totalSales / data.salesSummary.totalOrders 
          : 0;

        // Process sales by role
        const salesByRole: { [key: string]: any } = {};
        if (data.teamOverview.teamUsers) {
          data.teamOverview.teamUsers.forEach((member: any) => {
            if (!salesByRole[member.role]) {
              salesByRole[member.role] = {
                totalSales: 0,
                orderCount: 0,
                memberCount: 0,
              };
            }
            salesByRole[member.role].memberCount++;
          });
        }

        // Add sales data to roles (this would need to be calculated from orders)
        Object.keys(salesByRole).forEach(role => {
          // For now, we'll distribute total sales proportionally
          // In a real implementation, this would come from actual order data
          const roleMembers = salesByRole[role].memberCount;
          const totalMembers = Object.values(salesByRole).reduce((sum: number, roleData: any) => sum + roleData.memberCount, 0);
          salesByRole[role].totalSales = (data.salesSummary.totalSales * roleMembers) / totalMembers;
          salesByRole[role].orderCount = Math.round((data.salesSummary.totalOrders * roleMembers) / totalMembers);
        });

        setSalesData({
          totalSales: data.salesSummary.totalSales || 0,
          totalOrders: data.salesSummary.totalOrders || 0,
          pendingOrders: data.salesSummary.pendingOrders || 0,
          completedOrders: data.salesSummary.completedOrders || 0,
          averageOrderValue: avgOrderValue,
          topPerformers: data.topPerformers || [],
          monthlySales: data.monthlySales || [],
          salesByRole,
        });
      }

      // Fetch team members for detailed view
      const teamResult = await getZonalTeamMembers({ limit: 50 });
      if (teamResult?.success && teamResult?.data) {
        setTeamMembers(teamResult.data.teamMembers || []);
      }
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      Alert.alert('Error', 'Failed to load sales data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [user?.defaultCompany, selectedPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSalesData();
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      rsm: '#3B82F6',
      asm: '#10B981',
      salesman: '#F59E0B',
      dealers: '#8B5CF6',
      distibutors: '#06B6D4',
      subdealer: '#EF4444',
    };
    return colors[role] || '#6B7280';
  };

  const getRoleIcon = (role: string) => {
    const icons: { [key: string]: string } = {
      rsm: 'person',
      asm: 'person-add',
      salesman: 'person-circle',
      dealers: 'business',
      distibutors: 'storefront',
      subdealer: 'store',
    };
    return icons[role] || 'person';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string, subtitle?: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={20} color="white" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );

  const renderOverviewView = () => (
    <View style={styles.viewContainer}>
      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Sales',
            formatCurrency(salesData?.totalSales || 0),
            'trending-up',
            '#10B981'
          )}
          {renderStatCard(
            'Total Orders',
            salesData?.totalOrders || 0,
            'list',
            '#3B82F6'
          )}
          {renderStatCard(
            'Avg Order Value',
            formatCurrency(salesData?.averageOrderValue || 0),
            'calculator',
            '#F59E0B'
          )}
          {renderStatCard(
            'Completion Rate',
            formatPercentage(salesData?.completedOrders || 0, salesData?.totalOrders || 1),
            'checkmark-circle',
            '#8B5CF6'
          )}
        </View>
      </View>

      {/* Order Status Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.statusGrid}>
          {renderStatCard(
            'Completed',
            salesData?.completedOrders || 0,
            'checkmark-circle',
            '#10B981',
            formatPercentage(salesData?.completedOrders || 0, salesData?.totalOrders || 1)
          )}
          {renderStatCard(
            'Pending',
            salesData?.pendingOrders || 0,
            'time',
            '#F59E0B',
            formatPercentage(salesData?.pendingOrders || 0, salesData?.totalOrders || 1)
          )}
        </View>
      </View>

      {/* Top Performers */}
      {salesData?.topPerformers && salesData.topPerformers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          <View style={styles.performersList}>
            {salesData.topPerformers.slice(0, 5).map((performer, index) => (
              <View key={performer.userId} style={styles.performerCard}>
                <View style={styles.performerRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{performer.userName}</Text>
                  <Text style={styles.performerRole}>{performer.userRole}</Text>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.performerSales}>{formatCurrency(performer.totalSales)}</Text>
                  <Text style={styles.performerOrders}>{performer.orderCount} orders</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderTeamView = () => (
    <View style={styles.viewContainer}>
      {/* Sales by Role */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales by Role</Text>
        <View style={styles.roleSalesList}>
          {Object.entries(salesData?.salesByRole || {}).map(([role, data]) => (
            <View key={role} style={styles.roleSalesCard}>
              <View style={styles.roleSalesHeader}>
                <View style={[styles.roleIcon, { backgroundColor: getRoleColor(role) }]}>
                  <Ionicons name={getRoleIcon(role) as any} size={20} color="white" />
                </View>
                <View style={styles.roleSalesInfo}>
                  <Text style={styles.roleSalesName}>{role.toUpperCase()}</Text>
                  <Text style={styles.roleSalesMembers}>{data.memberCount} members</Text>
                </View>
                <View style={styles.roleSalesStats}>
                  <Text style={styles.roleSalesAmount}>{formatCurrency(data.totalSales)}</Text>
                  <Text style={styles.roleSalesOrders}>{data.orderCount} orders</Text>
                </View>
              </View>
              <View style={styles.roleSalesBar}>
                <View 
                  style={[
                    styles.roleSalesProgress, 
                    { 
                      width: `${(data.totalSales / (salesData?.totalSales || 1)) * 100}%`,
                      backgroundColor: getRoleColor(role)
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Individual Team Members */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Members Performance</Text>
        <View style={styles.membersList}>
          {teamMembers.map((member) => (
            <View key={member._id} style={styles.memberCard}>
              <View style={[styles.memberAvatar, { backgroundColor: getRoleColor(member.role) }]}>
                <Ionicons name={getRoleIcon(member.role) as any} size={20} color="white" />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role.toUpperCase()}</Text>
              </View>
              <View style={styles.memberStats}>
                <Text style={styles.memberSales}>{formatCurrency(member.salesData.totalSales)}</Text>
                <Text style={styles.memberOrders}>{member.salesData.orderCount} orders</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTrendsView = () => (
    <View style={styles.viewContainer}>
      {/* Monthly Sales Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Sales Trend</Text>
        {salesData?.monthlySales && salesData.monthlySales.length > 0 ? (
          <View style={styles.trendsContainer}>
            {salesData.monthlySales.slice(-6).map((month, index) => {
              const maxSales = Math.max(...salesData.monthlySales.map(m => m.totalSales));
              const height = (month.totalSales / maxSales) * 100;
              const monthName = new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { month: 'short' });
              
              return (
                <View key={index} style={styles.trendBar}>
                  <View style={styles.trendBarContainer}>
                    <View 
                      style={[
                        styles.trendBarFill, 
                        { height: `${height}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.trendBarLabel}>{monthName}</Text>
                  <Text style={styles.trendBarValue}>{formatCurrency(month.totalSales)}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyTrends}>
            <Ionicons name="trending-up-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTrendsText}>No sales data available</Text>
          </View>
        )}
      </View>

      {/* Performance Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        <View style={styles.insightsList}>
          <View style={styles.insightCard}>
            <Ionicons name="trending-up" size={24} color="#10B981" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Best Performing Role</Text>
              <Text style={styles.insightValue}>
                {Object.entries(salesData?.salesByRole || {})
                  .sort(([,a], [,b]) => b.totalSales - a.totalSales)[0]?.[0]?.toUpperCase() || 'N/A'}
              </Text>
            </View>
          </View>
          
          <View style={styles.insightCard}>
            <Ionicons name="people" size={24} color="#3B82F6" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Total Team Members</Text>
              <Text style={styles.insightValue}>{teamMembers.length}</Text>
            </View>
          </View>
          
          <View style={styles.insightCard}>
            <Ionicons name="calculator" size={24} color="#F59E0B" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Average Order Value</Text>
              <Text style={styles.insightValue}>{formatCurrency(salesData?.averageOrderValue || 0)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading && !salesData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading sales report...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Report</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodBtn,
                selectedPeriod === period.key && styles.periodBtnActive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodBtnText,
                selectedPeriod === period.key && styles.periodBtnTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* View Selector */}
      <View style={styles.viewSelector}>
        {views.map((view) => (
          <TouchableOpacity
            key={view.key}
            style={[
              styles.viewBtn,
              selectedView === view.key && styles.viewBtnActive
            ]}
            onPress={() => setSelectedView(view.key)}
          >
            <Ionicons 
              name={view.icon as any} 
              size={20} 
              color={selectedView === view.key ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[
              styles.viewBtnText,
              selectedView === view.key && styles.viewBtnTextActive
            ]}>
              {view.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedView === 'overview' && renderOverviewView()}
        {selectedView === 'team' && renderTeamView()}
        {selectedView === 'trends' && renderTrendsView()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  periodSelector: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  periodBtnActive: {
    backgroundColor: '#3B82F6',
  },
  periodBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  periodBtnTextActive: {
    color: 'white',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtnActive: {
    backgroundColor: '#EBF4FF',
  },
  viewBtnText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewBtnTextActive: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  viewContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  performersList: {
    gap: 12,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  roleSalesList: {
    gap: 12,
  },
  roleSalesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleSalesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleSalesInfo: {
    flex: 1,
  },
  roleSalesName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  roleSalesMembers: {
    fontSize: 12,
    color: '#6B7280',
  },
  roleSalesStats: {
    alignItems: 'flex-end',
  },
  roleSalesAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  roleSalesOrders: {
    fontSize: 12,
    color: '#6B7280',
  },
  roleSalesBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  roleSalesProgress: {
    height: '100%',
    borderRadius: 2,
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
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
  },
  trendsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendBar: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarContainer: {
    height: 120,
    width: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  trendBarFill: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minHeight: 4,
  },
  trendBarLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  trendBarValue: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyTrends: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyTrendsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightContent: {
    marginLeft: 12,
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default SalesReportScreen;
