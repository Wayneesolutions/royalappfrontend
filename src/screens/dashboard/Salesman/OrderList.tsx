import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  finalAmount: number; // Changed from totalAmount to match API response
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded';
}

const OrderList = () => {
  const { getOrders } = useAuth();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered'>('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await getOrders({
        page: 1,
        limit: 100,
        status: filter === 'all' ? undefined : filter,
      });
      
      console.log('OrderList - fetchOrders result:', result);
      console.log('OrderList - result.success:', result?.success);
      console.log('OrderList - result.orders:', result?.orders);
      console.log('OrderList - orders count:', result?.orders?.length);
      
      if (result?.success && result.orders) {
        setOrders(result.orders);
        console.log('OrderList - Orders set successfully:', result.orders.length);
      } else {
        console.log('OrderList - No orders data received');
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Alert.alert('Error', 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [filter])
  );

  useEffect(() => {
    console.log('OrderList - orders state updated:', orders.length, 'orders');
  }, [orders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'processing': return '#8B5CF6';
      case 'shipped': return '#06B6D4';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'returned': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'processing': return 'cog-outline';
      case 'shipped': return 'car-outline';
      case 'delivered': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      case 'returned': return 'return-up-back-outline';
      default: return 'help-circle-outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'urgent': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.orderDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons 
              name={getStatusIcon(item.status)} 
              size={12} 
              color="#fff" 
            />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          {item.priority !== 'medium' && (
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>{item.items.length}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₹{item.finalAmount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment:</Text>
          <Text style={[styles.detailValue, { 
            color: item.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' 
          }]}>
            {item.paymentStatus.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {item.customerEmail && (
        <View style={styles.contactInfo}>
          <Ionicons name="mail-outline" size={14} color="#6B7280" />
          <Text style={styles.contactText}>{item.customerEmail}</Text>
        </View>
      )}
      {item.customerMobile && (
        <View style={styles.contactInfo}>
          <Ionicons name="call-outline" size={14} color="#6B7280" />
          <Text style={styles.contactText}>{item.customerMobile}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Orders Found</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? "You haven't created any orders yet" 
          : `No ${filter} orders found`
        }
      </Text>
      <TouchableOpacity 
        style={styles.createOrderButton}
        onPress={() => navigation.navigate('CreateOrder' as never)}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.createOrderButtonText}>Create Your First Order</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Loading orders...</Text>
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
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateOrder' as never)}
        >
          <Ionicons name="add" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'confirmed', 'delivered'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.activeFilterButton
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === filterType && styles.activeFilterButtonText
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EF4444']}
            tintColor="#EF4444"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
    backgroundColor: '#fff',
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
  createButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#EF4444',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#fff',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderList;
