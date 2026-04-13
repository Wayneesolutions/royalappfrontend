import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import OrderDetailsModal from '../../../components/OrderDetailsModal';

interface Order {
  _id: string;
  orderNumber: string;
  orderDate: string;
  finalAmount: number;
  status: string;
  priority: string;
  paymentMethod: string;
  deliveryDate: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  orderItems: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
    totalPrice: number;
  }>;
  items?: Array<{
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount: number;
    tax: number;
    _id: string;
  }>;
  approvalHistory: Array<{
    approverName: string;
    approverRole: string;
    action: string;
    notes: string;
    timestamp: string;
  }>;
  notes: string;
  shippingAddress: string;
}

interface OrderSummary {
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByPriority: Record<string, number>;
  ordersByPaymentMethod: Record<string, number>;
}

const ApprovedOrdersScreen = () => {
  const { getOrders, getOrderStats, getOrderById, updateOrderStatus } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'sent_to_tally'>('approved');
  const [sortBy, setSortBy] = useState<'orderDate' | 'finalAmount' | 'orderNumber'>('orderDate');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter, sortBy, searchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch approved orders
      const result = await getOrders({
        status: filter === 'all' ? undefined : filter,
        sortBy,
        search: searchQuery || undefined,
        limit: 50
      });
      
      if (result?.success) {
        // Map API response to expected format - using result.orders directly like Sales screen
        const mappedOrders = (result.orders || []).map((order: any) => ({
          ...order,
          orderItems: order.items?.map((item: any) => ({
            product: {
              _id: item.productId,
              name: item.productName,
              price: item.unitPrice
            },
            quantity: item.quantity,
            totalPrice: item.totalPrice
          })) || []
        }));
        setOrders(mappedOrders);
      }

      // Fetch order statistics
      const statsResult = await getOrderStats();
      if (statsResult?.success) {
        const stats = statsResult.stats;
        setSummary({
          totalOrders: stats.totalOrders || 0,
          totalAmount: stats.totalAmount || 0,
          averageOrderValue: stats.averageOrderValue || 0,
          ordersByStatus: stats.ordersByStatus || {},
          ordersByPriority: stats.ordersByPriority || {},
          ordersByPaymentMethod: stats.ordersByPaymentMethod || {}
        });
      }

    } catch (error) {
      console.error('Error fetching approved orders:', error);
      Alert.alert('Error', 'Failed to fetch approved orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleViewDetails = async (order: Order) => {
    try {
      setLoadingOrderDetails(order._id);
      const response = await getOrderById(order._id);
      if (response?.success && response?.order) {
        setSelectedOrder(response.order);
        setShowDetailsModal(true);
      } else {
        Alert.alert('Error', 'Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoadingOrderDetails(null);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await updateOrderStatus(orderId, {
        status: newStatus,
        notes: ''
      });
      if (response?.success) {
        Alert.alert('Success', 'Order status updated successfully');
        fetchOrders(); // Refresh orders
      } else {
        Alert.alert('Error', response?.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'sent_to_tally': return '#3B82F6';
      case 'pending_approval': return '#F59E0B';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'cash';
      case 'credit': return 'card';
      case 'cheque': return 'document-text';
      case 'online': return 'globe';
      case 'card': return 'card';
      default: return 'card';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => handleViewDetails(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.orderDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text style={styles.amountValue}>₹{item.finalAmount.toLocaleString()}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>{item.createdBy?.name ?? 'Unknown'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Role:</Text>
            <Text style={styles.detailValue}>{item.createdBy?.role ?? 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.paymentRow}>
          <Ionicons 
            name={getPaymentMethodIcon(item.paymentMethod)} 
            size={16} 
            color="#6B7280" 
          />
          <Text style={styles.paymentText}>{item.paymentMethod}</Text>
          {item.deliveryDate && (
            <>
              <Ionicons name="calendar" size={16} color="#6B7280" style={styles.paymentIcon} />
              <Text style={styles.paymentText}>
                {new Date(item.deliveryDate).toLocaleDateString()}
              </Text>
            </>
          )}
        </View>

        <View style={styles.itemsRow}>
          <Text style={styles.itemsLabel}>
            {item.orderItems.length} item{item.orderItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewDetails(item)}
          disabled={loadingOrderDetails === item._id}
        >
          {loadingOrderDetails === item._id ? (
            <ActivityIndicator size="small" color="#077BC3" />
          ) : (
            <Ionicons name="eye" size={16} color="#077BC3" />
          )}
          <Text style={styles.viewButtonText}>
            {loadingOrderDetails === item._id ? 'Loading...' : 'View Details'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: typeof filter, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.activeFilterButton]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[styles.filterButtonText, filter === filterType && styles.activeFilterButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#077BC3" />
        <Text style={styles.loadingText}>Loading approved orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Approved Orders</Text>
        <Text style={styles.headerSubtitle}>
          {orders.length} orders • ₹{summary?.totalAmount?.toLocaleString() || '0'} total value
        </Text>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
            <Text style={styles.summaryLabel}>Total Orders</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>₹{summary.totalAmount.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Value</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>₹{summary.averageOrderValue.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Avg. Value</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            {renderFilterButton('approved', 'Approved')}
            {renderFilterButton('sent_to_tally', 'Sent to Tally')}
            {renderFilterButton('all', 'All')}
          </View>
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order number or customer name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No approved orders found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' ? 'No orders found' : `No ${filter} orders found`}
            </Text>
          </View>
        }
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={showDetailsModal}
        order={selectedOrder}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={handleOrderStatusUpdate}
        canUpdateStatus={true}
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#077BC3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
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
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardContent: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  paymentIcon: {
    marginLeft: 12,
  },
  itemsRow: {
    marginBottom: 8,
  },
  itemsLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#077BC3',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  approvalItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  approverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  approvalDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  approvalAction: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  approvalNotes: {
    fontSize: 12,
    color: '#111827',
    fontStyle: 'italic',
  },
});

export default ApprovedOrdersScreen;
