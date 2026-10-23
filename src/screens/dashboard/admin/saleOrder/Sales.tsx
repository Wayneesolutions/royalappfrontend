import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import GlobalFAB from '../GlobalFAB';

interface OrderStats {
  totalOrders: number;
  totalAmount: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'pending_approval' | 'draft' | 'approved' | 'sent_to_tally' | 'dispatched';
  finalAmount: number;
  orderDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const Sales = () => {
  const { getOrders, getOrderStats } = useAuth();
  const navigation = useNavigation();
  const [filter, setFilter] = useState<'All' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersParams: any = { page: 1, limit: 20 };
      if (filter !== 'All') {
        ordersParams.status = filter;
      }
      
      const ordersResponse = await getOrders(ordersParams);
      if (ordersResponse?.success) {
        setOrders(ordersResponse.orders || []);
      }

      // Fetch stats
      const statsResponse = await getOrderStats();
      if (statsResponse?.success) {
        setStats(statsResponse.stats);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      Alert.alert('Error', 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
      case 'delivered':
        return <MaterialIcons name="check-box" size={18} color="#10B981" />;
      case 'cancelled':
      case 'returned':
        return <MaterialIcons name="cancel" size={18} color="#EF4444" />;
      case 'pending_approval':
      case 'draft':
      case 'pending':
        return <MaterialIcons name="schedule" size={18} color="#F59E0B" />;
      case 'sent_to_tally':
      case 'processing':
        return <MaterialIcons name="settings" size={18} color="#3B82F6" />;
      case 'dispatched':
      case 'shipped':
        return <MaterialIcons name="local-shipping" size={18} color="#8B5CF6" />;
      default:
        return <MaterialIcons name="check-box-outline-blank" size={18} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
      case 'delivered':
        return '#10B981';
      case 'cancelled':
      case 'returned':
        return '#EF4444';
      case 'pending_approval':
      case 'draft':
      case 'pending':
        return '#F59E0B';
      case 'sent_to_tally':
      case 'processing':
        return '#3B82F6';
      case 'dispatched':
      case 'shipped':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_approval: 'Pending',
      draft: 'Draft',
      approved: 'Confirmed',
      sent_to_tally: 'Processing',
      dispatched: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned',
    };
    return labels[status] || status.toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const statusFilterMap: Record<string, string[]> = {
    pending: ['pending_approval', 'draft'],
    confirmed: ['approved'],
    processing: ['sent_to_tally'],
    shipped: ['dispatched'],
    delivered: ['delivered'],
    cancelled: ['cancelled'],
  };
  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter((order) => (statusFilterMap[filter] || [filter]).includes(order.status));

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading sales data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales Overview</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Navigate to create order
              console.log('Navigate to create order');
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Sales Statistics</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Orders"
                value={stats.totalOrders}
                icon="document-text"
                color="#3B82F6"
                onPress={() => setFilter('All')}
              />
              <StatCard
                title="Total Revenue"
                value={`₹${stats.totalAmount.toLocaleString()}`}
                icon="trending-up"
                color="#10B981"
              />
              <StatCard
                title="Pending"
                value={stats.pendingOrders}
                icon="time"
                color="#F59E0B"
                onPress={() => setFilter('pending')}
              />
              <StatCard
                title="Delivered"
                value={stats.deliveredOrders}
                icon="checkmark-circle"
                color="#059669"
                onPress={() => setFilter('delivered')}
              />
            </View>
          </View>
        )}

        {/* Filter Buttons */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filter Orders</Text>
          <View style={styles.filterButtons}>
            {['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filter === status && styles.activeFilterButton
                ]}
                onPress={() => setFilter(status as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === status && styles.activeFilterButtonText
                ]}>
                  {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.ordersSection}>
          <View style={styles.ordersHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                // Navigate to all orders
                console.log('Navigate to all orders');
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {filteredOrders.length > 0 ? (
            <View style={styles.ordersList}>
              {filteredOrders.map((order, index) => (
                <TouchableOpacity
                  key={order._id}
                  style={[styles.orderRow, index % 2 === 1 && styles.altRow]}
                  onPress={() => {
                    // Navigate to order details
                    console.log('Navigate to order details:', order._id);
                  }}
                >
                  <View style={styles.orderCell}>
                    {getStatusIcon(order.status)}
                  </View>
                  <View style={styles.orderCell}>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  </View>
                  <View style={styles.orderCell}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                    </View>
                    {order.priority !== 'medium' && (
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(order.priority) }]}>
                        <Text style={styles.priorityText}>{order.priority.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.orderCell}>
                    <Text style={styles.amountText}>₹{order.finalAmount.toLocaleString()}</Text>
                    <Text style={styles.dateText}>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {filter === 'All' ? 'No orders found' : `No ${filter} orders found`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingBottom: 100,
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
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filtersSection: {
    padding: 20,
    paddingTop: 0,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  ordersSection: {
    padding: 20,
    paddingTop: 0,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  ordersList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  altRow: {
    backgroundColor: '#F9FAFB',
  },
  orderCell: {
    flex: 1,
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default Sales;