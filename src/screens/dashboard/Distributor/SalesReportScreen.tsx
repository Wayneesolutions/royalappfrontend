import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';

interface SalesData {
  month: string;
  sales: number;
  orders: number;
  growth: number;
}

interface SalesStats {
  totalSales: number;
  totalOrders: number;
  averageGrowth: number;
  monthlyData: SalesData[];
}

const SalesReportScreen = () => {
  const navigation = useNavigation();
  const { user, getOrders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalSales: 0,
    totalOrders: 0,
    averageGrowth: 0,
    monthlyData: []
  });

  const fetchSalesData = async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch orders created by this distributor
      const ordersResult = await getOrders({ 
        createdBy: user._id, 
        page: 1, 
        limit: 1000 // Get all orders for accurate monthly calculation
      });
      
      if (ordersResult?.success) {
        const orders = ordersResult.orders || [];
        const stats = ordersResult.stats || {};
        
        // Group orders by month
        const monthlyMap: { [key: string]: { sales: number; orders: number } } = {};
        
        orders.forEach((order: any) => {
          const orderDate = new Date(order.orderDate || order.createdAt);
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { sales: 0, orders: 0 };
          }
          
          monthlyMap[monthKey].sales += order.finalAmount || 0;
          monthlyMap[monthKey].orders += 1;
        });
        
        // Generate monthly data for last 6 months
        const currentDate = new Date();
        const monthlyData: SalesData[] = [];
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('en-US', { month: 'long' });
          
          const monthData = monthlyMap[monthKey] || { sales: 0, orders: 0 };
          
          // Calculate growth compared to previous month
          let growth = 0;
          if (i > 0) {
            const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (i - 1), 1);
            const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
            const prevMonthData = monthlyMap[prevMonthKey] || { sales: 0, orders: 0 };
            
            if (prevMonthData.sales > 0) {
              growth = Math.round(((monthData.sales - prevMonthData.sales) / prevMonthData.sales) * 100);
            }
          }
          
          monthlyData.push({
            month: monthName,
            sales: monthData.sales,
            orders: monthData.orders,
            growth
          });
        }
        
        // Calculate totals
        const totalSales = monthlyData.reduce((sum, month) => sum + month.sales, 0);
        const totalOrders = monthlyData.reduce((sum, month) => sum + month.orders, 0);
        const averageGrowth = monthlyData.length > 1 
          ? Math.round(monthlyData.slice(1).reduce((sum, month) => sum + month.growth, 0) / (monthlyData.length - 1))
          : 0;
        
        setSalesStats({
          totalSales,
          totalOrders,
          averageGrowth,
          monthlyData
        });
      } else {
        Alert.alert('Error', 'Failed to fetch sales data');
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      Alert.alert('Error', 'Failed to load sales report');
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
  }, [user?._id]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth}%`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={styles.loadingText}>Loading sales report...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Report</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#06B6D4" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={styles.summaryValue}>{formatCurrency(salesStats.totalSales)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Orders</Text>
          <Text style={styles.summaryValue}>{salesStats.totalOrders}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Avg Growth</Text>
          <Text style={[styles.summaryValue, { 
            color: salesStats.averageGrowth >= 0 ? '#10B981' : '#EF4444' 
          }]}>
            {formatGrowth(salesStats.averageGrowth)}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {salesStats.monthlyData.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.salesHeader}>
              <Text style={styles.monthText}>{item.month}</Text>
              <View style={[styles.growthBadge, {
                backgroundColor: item.growth >= 0 ? '#D1FAE5' : '#FEE2E2'
              }]}>
                <Ionicons 
                  name={item.growth >= 0 ? 'trending-up' : 'trending-down'} 
                  size={14} 
                  color={item.growth >= 0 ? '#059669' : '#DC2626'} 
                />
                <Text style={[styles.growthText, {
                  color: item.growth >= 0 ? '#059669' : '#DC2626'
                }]}>{formatGrowth(item.growth)}</Text>
              </View>
            </View>
            <View style={styles.salesDetails}>
              <View style={styles.salesItem}>
                <Ionicons name="trending-up" size={18} color="#06B6D4" />
                <View style={styles.salesItemInfo}>
                  <Text style={styles.salesItemLabel}>Sales</Text>
                  <Text style={styles.salesItemValue}>{formatCurrency(item.sales)}</Text>
                </View>
              </View>
              <View style={styles.salesItem}>
                <Ionicons name="cart-outline" size={18} color="#10B981" />
                <View style={styles.salesItemInfo}>
                  <Text style={styles.salesItemLabel}>Orders</Text>
                  <Text style={styles.salesItemValue}>{item.orders}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        
        {/* Performance Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Performance Insights</Text>
          <View style={styles.insightItem}>
            <Ionicons name="analytics-outline" size={20} color="#06B6D4" />
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Best Performing Month</Text>
              <Text style={styles.insightValue}>
                {salesStats.monthlyData.length > 0 
                  ? salesStats.monthlyData.reduce((best, current) => 
                      current.sales > best.sales ? current : best
                    ).month
                  : 'N/A'
                }
              </Text>
            </View>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up-outline" size={20} color="#10B981" />
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Average Order Value</Text>
              <Text style={styles.insightValue}>
                {salesStats.totalOrders > 0 
                  ? formatCurrency(Math.round(salesStats.totalSales / salesStats.totalOrders))
                  : 'N/A'
                }
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  card: {
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
  salesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
  salesDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  salesItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  salesItemInfo: {
    marginLeft: 10,
  },
  salesItemLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  salesItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightContent: {
    marginLeft: 12,
    flex: 1,
  },
  insightLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default SalesReportScreen;

