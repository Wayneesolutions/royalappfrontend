// src/screens/dashboard/RSM/SalesReportScreen.tsx
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    userRole: string;
    totalSales: number;
    orderCount: number;
  }>;
  salesByRole: Array<{
    role: string;
    totalSales: number;
    orderCount: number;
    memberCount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    sales: number;
    orders: number;
  }>;
}

const SalesReportScreen = () => {
  const { user, getRSMTeamPerformance } = useAuth();
  const navigation = useNavigation();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
  ];

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const result = await getRSMTeamPerformance({ period: selectedPeriod });
      if (result?.success && result?.data) {
        setSalesData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      Alert.alert('Error', 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSalesData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSalesData();
  }, [selectedPeriod]);

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'asm': '#F59E0B',
      'salesman': '#EF4444',
      'dealers': '#8B5CF6',
      'distibutors': '#06B6D4',
      'subdealer': '#84CC16',
    };
    return colors[role] || '#6B7280';
  };

  const getRoleDisplayName = (role: string) => {
    const names: { [key: string]: string } = {
      'asm': 'Area Sales Manager',
      'salesman': 'Salesman',
      'dealers': 'Dealer',
      'distibutors': 'Distributor',
      'subdealer': 'Sub-dealer',
    };
    return names[role] || role;
  };

  const renderStatCard = (title: string, value: string, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderTopPerformer = (performer: any, index: number) => (
    <View key={performer.userId} style={styles.performerCard}>
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
  );

  const renderRolePerformance = (roleData: any) => (
    <View key={roleData.role} style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={[styles.roleDot, { backgroundColor: getRoleColor(roleData.role) }]} />
        <Text style={styles.roleName}>{getRoleDisplayName(roleData.role)}</Text>
        <Text style={styles.roleCount}>({roleData.memberCount})</Text>
      </View>
      <View style={styles.roleStats}>
        <View style={styles.roleStatItem}>
          <Text style={styles.roleStatValue}>₹{roleData.totalSales.toLocaleString()}</Text>
          <Text style={styles.roleStatLabel}>Sales</Text>
        </View>
        <View style={styles.roleStatItem}>
          <Text style={styles.roleStatValue}>{roleData.orderCount}</Text>
          <Text style={styles.roleStatLabel}>Orders</Text>
        </View>
        <View style={styles.roleStatItem}>
          <Text style={styles.roleStatValue}>
            ₹{Math.round(roleData.totalSales / roleData.memberCount).toLocaleString()}
          </Text>
          <Text style={styles.roleStatLabel}>Avg/Member</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
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
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Report</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodSelector}
        contentContainerStyle={styles.periodSelectorContent}
      >
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.selectedPeriodButton
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.selectedPeriodButtonText
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Sales',
              `₹${salesData?.totalSales?.toLocaleString() || '0'}`,
              'trending-up',
              '#10B981'
            )}
            {renderStatCard(
              'Total Orders',
              `${salesData?.totalOrders || 0}`,
              'list',
              '#3B82F6'
            )}
            {renderStatCard(
              'Avg Order Value',
              `₹${salesData?.averageOrderValue?.toLocaleString() || '0'}`,
              'calculator',
              '#F59E0B'
            )}
            {renderStatCard(
              'Conversion Rate',
              '78%',
              'checkmark-circle',
              '#8B5CF6'
            )}
          </View>
        </View>

        {/* Top Performers */}
        {salesData?.topPerformers && salesData.topPerformers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            <View style={styles.performersContainer}>
              {salesData.topPerformers.slice(0, 5).map(renderTopPerformer)}
            </View>
          </View>
        )}

        {/* Performance by Role */}
        {salesData?.salesByRole && salesData.salesByRole.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance by Role</Text>
            <View style={styles.rolesContainer}>
              {salesData.salesByRole.map(renderRolePerformance)}
            </View>
          </View>
        )}

        {/* Monthly Trend */}
        {salesData?.monthlyTrend && salesData.monthlyTrend.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Trend</Text>
            <View style={styles.trendContainer}>
              {salesData.monthlyTrend.map((month, index) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendMonth}>{month.month}</Text>
                  <View style={styles.trendBar}>
                    <View
                      style={[
                        styles.trendBarFill,
                        {
                          height: `${Math.min((month.sales / Math.max(...salesData.monthlyTrend.map(m => m.sales))) * 100, 100)}%`,
                          backgroundColor: '#3B82F6'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.trendValue}>₹{month.sales.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.summaryText}>
                Sales increased by 15% compared to last {selectedPeriod}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="people" size={20} color="#3B82F6" />
              <Text style={styles.summaryText}>
                {salesData?.topPerformers?.length || 0} top performers identified
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="flag-outline" size={20} color="#F59E0B" />
              <Text style={styles.summaryText}>
                Target achievement: 78% for current period
              </Text>
            </View>
          </View>
        </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  shareButton: {
    padding: 8,
  },
  periodSelector: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  periodSelectorContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedPeriodButton: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  performersContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  performerCard: {
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
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  performerRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  performerStats: {
    alignItems: 'flex-end',
  },
  performerSales: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  performerOrders: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rolesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  roleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roleStatItem: {
    alignItems: 'center',
  },
  roleStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendMonth: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  trendBar: {
    width: 20,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 4,
  },
  trendValue: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
});

export default SalesReportScreen;
