// src/screens/dashboard/RSM/OrderManagementScreen.tsx
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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    role: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

const OrderManagementScreen = () => {
  const { user, getRSMDashboardData } = useAuth();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const statuses = [
    { key: 'all', label: 'All Orders', color: '#6B7280' },
    { key: 'pending', label: 'Pending', color: '#F59E0B' },
    { key: 'approved', label: 'Approved', color: '#10B981' },
    { key: 'rejected', label: 'Rejected', color: '#EF4444' },
    { key: 'completed', label: 'Completed', color: '#3B82F6' },
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await getRSMDashboardData();
      if (result?.success && result?.data?.recentOrders) {
        setOrders(result.data.recentOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': '#F59E0B',
      'approved': '#10B981',
      'rejected': '#EF4444',
      'completed': '#3B82F6',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      'pending': 'time-outline',
      'approved': 'checkmark-circle-outline',
      'rejected': 'close-circle-outline',
      'completed': 'checkmark-done-outline',
    };
    return icons[status] || 'help-outline';
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.createdBy.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity key={order._id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderCreator}>
            by {order.createdBy.name} ({getRoleDisplayName(order.createdBy.role)})
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Ionicons 
            name={getStatusIcon(order.status) as any} 
            size={12} 
            color="white" 
          />
          <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.orderAmount}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{order.totalAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.orderTime}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.timeText}>{formatTimeAgo(order.createdAt)}</Text>
        </View>
      </View>

      {order.items && order.items.length > 0 && (
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>Items ({order.items.length})</Text>
          {order.items.slice(0, 2).map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>
            </View>
          ))}
          {order.items.length > 2 && (
            <Text style={styles.moreItems}>+{order.items.length - 2} more items</Text>
          )}
        </View>
      )}

      <View style={styles.orderActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={16} color="#3B82F6" />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>
        {order.status === 'pending' && (
          <>
            <TouchableOpacity style={[styles.actionButton, styles.approveButton]}>
              <Ionicons name="checkmark-outline" size={16} color="#10B981" />
              <Text style={[styles.actionText, styles.approveText]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.rejectButton]}>
              <Ionicons name="close-outline" size={16} color="#EF4444" />
              <Text style={[styles.actionText, styles.rejectText]}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
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
        <Text style={styles.headerTitle}>Order Management</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {orders.filter(o => o.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {orders.filter(o => o.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            ₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No orders available'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {statuses.map((status) => (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.statusOption,
                  selectedStatus === status.key && styles.selectedStatusOption
                ]}
                onPress={() => {
                  setSelectedStatus(status.key);
                  setShowFilterModal(false);
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[
                  styles.statusLabel,
                  selectedStatus === status.key && styles.selectedStatusLabel
                ]}>
                  {status.label}
                </Text>
                {selectedStatus === status.key && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
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
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  },
  orderCreator: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderAmount: {
    alignItems: 'flex-start',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  orderTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  itemsContainer: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  moreItems: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  approveButton: {
    backgroundColor: '#F0FDF4',
  },
  approveText: {
    color: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
  },
  rejectText: {
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedStatusOption: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  selectedStatusLabel: {
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default OrderManagementScreen;
