
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

interface SalesData {
  month: string;
  sales: number;
  orders: number;
  growth: number;
  previousMonthSales: number;
}

interface CompanySalesData {
  companyId: string;
  companyName: string;
  totalSales: number;
  totalOrders: number;
  monthlyData: SalesData[];
}

export const SalesReportScreen = () => {
  const navigation = useNavigation();
  const { superadminGetSalesReport, superadminExportSalesReport } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [salesData, setSalesData] = useState<any>(null);
  const [companySalesData, setCompanySalesData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const params = {
        period: selectedPeriod,
        ...(selectedCompany !== 'all' && { companyId: selectedCompany })
      };
      
      const result = await superadminGetSalesReport(params);
      if (result?.success && result?.data) {
        const data = result.data;
        setSummary(data.summary);
        setMonthlyData(data.monthlyData || []);
        setCompanySalesData(data.companyPerformance || []);
        setInsights(data.insights);
        setSalesData(data);
      }
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
      Alert.alert('Error', 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, [selectedPeriod, selectedCompany]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSalesReport();
    setRefreshing(false);
  };

  // Calculate totals from real data
  const totalSales = summary?.totalSales || 0;
  const totalOrders = summary?.totalOrders || 0;
  const avgGrowth = summary?.avgGrowth || 0;

  // Helper functions
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const formatGrowth = (growth: number) => {
    return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? '#10B981' : '#EF4444';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? 'trending-up' : 'trending-down';
  };

  const handleExportReport = async () => {
    try {
      const result = await superadminExportSalesReport({
        format: 'pdf',
        period: selectedPeriod
      });
      
      if (result?.success) {
        Alert.alert(
          'Export Report',
          'Choose export format',
          [
            { text: 'PDF', onPress: () => console.log('Export PDF') },
            { text: 'Excel', onPress: () => console.log('Export Excel') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const handleShareReport = async () => {
    try {
      const result = await superadminExportSalesReport({
        format: 'pdf',
        period: selectedPeriod
      });
      
      if (result?.success) {
        Alert.alert('Share Report', 'Report sharing functionality will be implemented');
      }
    } catch (error) {
      console.error('Failed to share report:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

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
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sales Report</Text>
          <Text style={styles.headerSubtitle}>System-wide Analytics</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShareReport}
          >
            <Ionicons name="share-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleExportReport}
          >
            <Ionicons name="download-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Enhanced Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Overall Performance</Text>
            <Text style={styles.summaryPeriod}>Last 6 Months</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="trending-up" size={24} color="#10B981" />
              </View>
              <Text style={styles.summaryValue}>{formatCurrency(totalSales)}</Text>
              <Text style={styles.summaryLabel}>Total Sales</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="cube-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.summaryValue}>{totalOrders.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Orders</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="analytics" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.summaryValue, { color: getGrowthColor(avgGrowth) }]}>
                {formatGrowth(avgGrowth)}
              </Text>
              <Text style={styles.summaryLabel}>Avg Growth</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="business" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.summaryValue}>{summary?.totalCompanies || 0}</Text>
              <Text style={styles.summaryLabel}>Companies</Text>
            </View>
          </View>
        </View>

        {/* Company Performance Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Company Performance</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.companyScroll}>
            {companySalesData.map((company) => (
              <View key={company.companyId} style={styles.companyCard}>
                <View style={styles.companyHeader}>
                  <Text style={styles.companyName}>{company.companyName}</Text>
                  <View style={styles.companyStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
                <View style={styles.companyMetrics}>
                  <View style={styles.companyMetric}>
                    <Text style={styles.companyMetricValue}>{formatCurrency(company.totalSales)}</Text>
                    <Text style={styles.companyMetricLabel}>Total Sales</Text>
                  </View>
                  <View style={styles.companyMetric}>
                    <Text style={styles.companyMetricValue}>{company.totalOrders}</Text>
                    <Text style={styles.companyMetricLabel}>Orders</Text>
                  </View>
                </View>
                <View style={styles.companyTrend}>
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                  <Text style={styles.trendText}>+12.5% vs last period</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Monthly Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          {monthlyData.map((item, index) => (
            <View key={index} style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <View style={styles.monthInfo}>
                  <Text style={styles.monthText}>{item.month}</Text>
                  <Text style={styles.monthYear}>2024</Text>
                </View>
                <View style={[styles.growthBadge, {
                  backgroundColor: item.growth >= 0 ? '#D1FAE5' : '#FEE2E2'
                }]}>
                  <Ionicons 
                    name={getGrowthIcon(item.growth)} 
                    size={14} 
                    color={getGrowthColor(item.growth)} 
                  />
                  <Text style={[styles.growthText, {
                    color: getGrowthColor(item.growth)
                  }]}>{formatGrowth(item.growth)}</Text>
                </View>
              </View>
              
              <View style={styles.monthMetrics}>
                <View style={styles.monthMetric}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="trending-up" size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricLabel}>Sales</Text>
                    <Text style={styles.metricValue}>{formatCurrency(item.sales)}</Text>
                    <Text style={styles.metricSubtext}>
                      vs {formatCurrency(item.previousMonthSales)} last month
                    </Text>
                  </View>
                </View>
                
                <View style={styles.monthMetric}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="cart-outline" size={18} color="#10B981" />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricLabel}>Orders</Text>
                    <Text style={styles.metricValue}>{item.orders}</Text>
                    <Text style={styles.metricSubtext}>
                      {item.orders > 150 ? 'High volume' : 'Normal volume'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, monthlyData.length > 0 ? (item.sales / Math.max(...monthlyData.map((d: any) => d.sales))) * 100 : 0)}%`,
                      backgroundColor: item.growth >= 0 ? '#10B981' : '#EF4444'
                    }
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(monthlyData.length > 0 ? (item.sales / Math.max(...monthlyData.map((d: any) => d.sales))) * 100 : 0)}% of peak
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
              <Text style={styles.insightTitle}>Best Month</Text>
              <Text style={styles.insightValue}>{insights?.bestMonth || 'N/A'}</Text>
              <Text style={styles.insightSubtext}>
                {monthlyData.length > 0 ? formatCurrency(Math.max(...monthlyData.map(d => d.sales))) : 'N/A'}
              </Text>
            </View>
            <View style={styles.insightCard}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
              <Text style={styles.insightTitle}>Growth Rate</Text>
              <Text style={styles.insightValue}>{formatGrowth(avgGrowth)}</Text>
              <Text style={styles.insightSubtext}>Average monthly</Text>
            </View>
            <View style={styles.insightCard}>
              <Ionicons name="business" size={24} color="#3B82F6" />
              <Text style={styles.insightTitle}>Top Company</Text>
              <Text style={styles.insightValue}>{insights?.topCompany || 'N/A'}</Text>
              <Text style={styles.insightSubtext}>
                {companySalesData.length > 0 ? formatCurrency(Math.max(...companySalesData.map(c => c.totalSales))) : 'N/A'}
              </Text>
            </View>
            <View style={styles.insightCard}>
              <Ionicons name="calendar" size={24} color="#8B5CF6" />
              <Text style={styles.insightTitle}>Peak Season</Text>
              <Text style={styles.insightValue}>{insights?.peakSeason || 'N/A'}</Text>
              <Text style={styles.insightSubtext}>Best performing quarter</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Report</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Time Period</Text>
              <View style={styles.filterOptions}>
                {['3months', '6months', '1year', 'custom'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.filterOption,
                      selectedPeriod === period && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedPeriod === period && styles.filterOptionTextActive
                    ]}>
                      {period === '3months' ? '3 Months' : 
                       period === '6months' ? '6 Months' :
                       period === '1year' ? '1 Year' : 'Custom'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Company</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedCompany === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedCompany('all')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedCompany === 'all' && styles.filterOptionTextActive
                  ]}>
                    All Companies
                  </Text>
                </TouchableOpacity>
                {companySalesData.map((company) => (
                  <TouchableOpacity
                    key={company.companyId}
                    style={[
                      styles.filterOption,
                      selectedCompany === company.companyId && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedCompany(company.companyId)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCompany === company.companyId && styles.filterOptionTextActive
                    ]}>
                      {company.companyName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalButtonText}>Apply Filters</Text>
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
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced styles
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
  // Enhanced Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryPeriod: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: (width - 80) / 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Company Performance
  companyScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  companyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  companyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  companyMetric: {
    alignItems: 'center',
  },
  companyMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  companyMetricLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  companyTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: 10,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  // Monthly Breakdown
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  monthYear: {
    fontSize: 12,
    color: '#6B7280',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  monthMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  // Progress Bar
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Quick Insights
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    textAlign: 'center',
  },
  insightSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});