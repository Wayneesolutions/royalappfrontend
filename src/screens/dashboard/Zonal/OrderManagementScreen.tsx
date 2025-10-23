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
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  status: string;
  priority: string;
  totalAmount: number;
  finalAmount: number;
  orderDate: string;
  deliveryDate: string;
  paymentStatus: string;
  paymentMethod: string;
  createdBy: {
    _id: string;
    name: string;
    role: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  approvalHistory: Array<{
    approverId: string;
    approverName: string;
    approverRole: string;
    action: string;
    notes: string;
    timestamp: string;
  }>;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalAmount: number;
}

const OrderManagementScreen = () => {
  const { user, getOrders } = useAuth();
  const navigation = useNavigation();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const statusOptions = [
    { key: '', label: 'All Status', color: '#6B7280' },
    { key: 'draft', label: 'Draft', color: '#9CA3AF' },
    { key: 'pending', label: 'Pending', color: '#F59E0B' },
    { key: 'confirmed', label: 'Confirmed', color: '#3B82F6' },
    { key: 'processing', label: 'Processing', color: '#8B5CF6' },
    { key: 'shipped', label: 'Shipped', color: '#06B6D4' },
    { key: 'delivered', label: 'Delivered', color: '#10B981' },
    { key: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  ];

  const priorityOptions = [
    { key: '', label: 'All Priority', color: '#6B7280' },
    { key: 'low', label: 'Low', color: '#10B981' },
    { key: 'medium', label: 'Medium', color: '#F59E0B' },
    { key: 'high', label: 'High', color: '#EF4444' },
  ];

  const fetchOrders = async (page = 1, reset = false) => {
    if (!user?.defaultCompany) {
      setLoading(false);
      return;
    }

    try {
      if (page === 1) setLoading(true);
      
      const params: any = {
        page,
        limit: 20,
        companyId: user.defaultCompany._id || user.defaultCompany,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;

      const result = await getOrders(params);
      
      if (result?.success) {
        const newOrders = result.orders || [];
        
        if (reset || page === 1) {
          setOrders(newOrders);
        } else {
          setOrders(prev => [...prev, ...newOrders]);
        }
        
        setHasMore(result.pagination?.hasNext || false);
        
        // Update stats from the result
        if (result.stats) {
          setOrderStats({
            totalOrders: result.stats.totalOrders || 0,
            pendingOrders: result.stats.pendingOrders || 0,
            confirmedOrders: result.stats.confirmedOrders || 0,
            processingOrders: result.stats.processingOrders || 0,
            shippedOrders: result.stats.shippedOrders || 0,
            deliveredOrders: result.stats.deliveredOrders || 0,
            cancelledOrders: result.stats.cancelledOrders || 0,
            totalAmount: result.stats.totalAmount || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, true);
  }, [user?.defaultCompany, selectedStatus, selectedPriority, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchOrders(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchOrders(nextPage, false);
    }
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const handlePriorityFilter = (priority: string) => {
    setSelectedPriority(priority);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = statusOptions.find(s => s.key === status);
    return statusConfig?.color || '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = priorityOptions.find(p => p.key === priority);
    return priorityConfig?.color || '#6B7280';
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleViewOrderDetails(item)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.customerContact}>{item.customerMobile}</Text>
        </View>
        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderAmount}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.finalAmount)}</Text>
        </View>
        <View style={styles.orderDate}>
          <Text style={styles.dateLabel}>Order Date</Text>
          <Text style={styles.dateValue}>{formatDate(item.orderDate)}</Text>
        </View>
        <View style={styles.orderCreator}>
          <Text style={styles.creatorLabel}>Created By</Text>
          <View style={styles.creatorInfo}>
            <View style={[styles.creatorAvatar, { backgroundColor: getRoleColor(item.createdBy.role) }]}>
              <Text style={styles.creatorInitial}>{item.createdBy.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.creatorName}>{item.createdBy.name}</Text>
              <Text style={styles.creatorRole}>{item.createdBy.role}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.orderFooter}>
        <View style={styles.orderItems}>
          <Ionicons name="cube-outline" size={16} color="#6B7280" />
          <Text style={styles.orderItemsText}>{item.items.length} items</Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsBtn}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderOrderDetails = () => (
    <Modal
      visible={showOrderDetails}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Order Details</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowOrderDetails(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {selectedOrder && (
          <ScrollView style={styles.modalContent}>
            {/* Order Header */}
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailOrderNumber}>{selectedOrder.orderNumber}</Text>
                <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                  <Text style={styles.detailStatusText}>{selectedOrder.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.detailAmount}>{formatCurrency(selectedOrder.finalAmount)}</Text>
            </View>

            {/* Customer Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Customer Information</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Name</Text>
                <Text style={styles.detailInfoValue}>{selectedOrder.customerName}</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Email</Text>
                <Text style={styles.detailInfoValue}>{selectedOrder.customerEmail}</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Mobile</Text>
                <Text style={styles.detailInfoValue}>{selectedOrder.customerMobile}</Text>
              </View>
            </View>

            {/* Order Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Order Information</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Order Date</Text>
                <Text style={styles.detailInfoValue}>{formatDate(selectedOrder.orderDate)}</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Delivery Date</Text>
                <Text style={styles.detailInfoValue}>{formatDate(selectedOrder.deliveryDate)}</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Priority</Text>
                <Text style={[styles.detailInfoValue, { color: getPriorityColor(selectedOrder.priority) }]}>
                  {selectedOrder.priority.toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Payment Status</Text>
                <Text style={styles.detailInfoValue}>{selectedOrder.paymentStatus}</Text>
              </View>
            </View>

            {/* Items */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Order Items</Text>
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemCode}>{item.productCode}</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.totalPrice)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Created By */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Created By</Text>
              <View style={styles.creatorCard}>
                <View style={[styles.creatorAvatar, { backgroundColor: getRoleColor(selectedOrder.createdBy.role) }]}>
                  <Text style={styles.creatorInitial}>{selectedOrder.createdBy.name.charAt(0)}</Text>
                </View>
                <View style={styles.creatorDetails}>
                  <Text style={styles.creatorName}>{selectedOrder.createdBy.name}</Text>
                  <Text style={styles.creatorRole}>{selectedOrder.createdBy.role}</Text>
                </View>
              </View>
            </View>

            {/* Approval History */}
            {selectedOrder.approvalHistory && selectedOrder.approvalHistory.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Approval History</Text>
                {selectedOrder.approvalHistory.map((approval, index) => (
                  <View key={index} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalApprover}>{approval.approverName}</Text>
                      <Text style={styles.approvalAction}>{approval.action}</Text>
                    </View>
                    <Text style={styles.approvalRole}>{approval.approverRole}</Text>
                    <Text style={styles.approvalNotes}>{approval.notes}</Text>
                    <Text style={styles.approvalTime}>{formatDate(approval.timestamp)}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  if (loading && orders.length === 0) {
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
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Order Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Order Overview</Text>
        <View style={styles.statsGrid}>
          {renderStatCard('Total Orders', orderStats.totalOrders, 'list', '#3B82F6')}
          {renderStatCard('Total Amount', formatCurrency(orderStats.totalAmount), 'trending-up', '#10B981')}
          {renderStatCard('Pending', orderStats.pendingOrders, 'time', '#F59E0B')}
          {renderStatCard('Delivered', orderStats.deliveredOrders, 'checkmark-circle', '#10B981')}
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#3B82F6" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Status:</Text>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.filterChip,
                    { borderColor: selectedStatus === status.key ? status.color : '#E5E7EB' }
                  ]}
                  onPress={() => handleStatusFilter(status.key)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedStatus === status.key ? status.color : '#6B7280' }
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Priority:</Text>
              {priorityOptions.map((priority) => (
                <TouchableOpacity
                  key={priority.key}
                  style={[
                    styles.filterChip,
                    { borderColor: selectedPriority === priority.key ? priority.color : '#E5E7EB' }
                  ]}
                  onPress={() => handlePriorityFilter(priority.key)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedPriority === priority.key ? priority.color : '#6B7280' }
                  ]}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Orders List */}
      <View style={styles.ordersSection}>
        <View style={styles.ordersHeader}>
          <Text style={styles.sectionTitle}>
            Orders ({orders.length})
          </Text>
          {(selectedStatus || selectedPriority) && (
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setSelectedStatus('');
                setSelectedPriority('');
              }}
            >
              <Text style={styles.clearFilterText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item._id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No orders found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedStatus || selectedPriority ? 'Try adjusting your search or filters' : 'No orders available'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loading && orders.length > 0 ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>

      {renderOrderDetails()}
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
  statsSection: {
    padding: 20,
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
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ordersSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  customerContact: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderAmount: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  orderDate: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  orderCreator: {
    flex: 1,
    alignItems: 'flex-end',
  },
  creatorLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  creatorInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  creatorRole: {
    fontSize: 10,
    color: '#6B7280',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemsText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#3B82F6',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailOrderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  detailAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemCode: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorDetails: {
    marginLeft: 12,
  },
  approvalCard: {
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
  approvalApprover: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  approvalAction: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  approvalRole: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  approvalNotes: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  approvalTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});

export default OrderManagementScreen;
