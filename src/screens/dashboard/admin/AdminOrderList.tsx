import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  shippingName: string;
  items: OrderItem[];
  totalQuantity: number;
  totalAmount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent_to_tally' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
  createdAt: string;
  paymentMethod?: string;
  // raw API order for edit/approve passthrough
  _raw?: any;
}

interface UserNode {
  id: string;
  name: string;
  role: string;
  groupName: string;
  email: string;
  mobile: string;
  totalOrders: number;
  totalValue: string;
  orders: Order[];
  children: UserNode[];
}

const AdminOrderList = () => {
  const { getOrders, approveRejectOrder } = useAuth();
  const navigation = useNavigation<any>();

  const [expandedUsers, setExpandedUsers] = useState<{ [key: string]: boolean }>({});
  const [selectedUser, setSelectedUser] = useState<UserNode | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveAction, setApproveAction] = useState<'approved' | 'rejected'>('approved');
  const [approveNotes, setApproveNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userHierarchy, setUserHierarchy] = useState<UserNode[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  const buildUserHierarchy = (orders: any[]): UserNode[] => {
    const userMap = new Map<string, UserNode>();

    orders.forEach((order: any) => {
      const creator = order.createdBy || {};
      const userId = creator._id || 'unknown';
      const userName = creator.name || 'Unknown User';
      const userRole = creator.role || 'Unknown';

      const mappedOrder: Order = {
        _id: order._id,
        orderNumber: order.orderNumber || order._id,
        customerName: order.customerName || 'N/A',
        shippingName: order.shippingAddress?.city || order.shippingAddress?.street || 'N/A',
        items: (order.items || []).map((item: any) => ({
          productId: item.productId || '',
          productCode: item.productCode || '',
          productName: item.productName || '',
          unit: item.unit || 'pcs',
          unitPrice: item.unitPrice || 0,
          quantity: item.quantity || 0,
          totalAmount: item.totalPrice || item.totalAmount || 0,
        })),
        totalQuantity: (order.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
        totalAmount: order.finalAmount || order.totalAmount || 0,
        status: order.status || 'draft',
        createdAt: order.orderDate || order.createdAt || new Date().toISOString(),
        paymentMethod: order.paymentMethod,
        _raw: order, // keep full API object for edit navigation
      };

      if (userMap.has(userId)) {
        const node = userMap.get(userId)!;
        node.orders.push(mappedOrder);
        node.totalOrders += 1;
        node.totalValue = `₹ ${(parseInt(node.totalValue.replace(/[^0-9]/g, '')) + mappedOrder.totalAmount).toLocaleString()}`;
      } else {
        userMap.set(userId, {
          id: userId,
          name: userName,
          role: userRole,
          groupName: creator.groupName || creator.companyName || userRole,
          email: creator.email || '',
          mobile: creator.mobile || '',
          totalOrders: 1,
          totalValue: `₹ ${mappedOrder.totalAmount.toLocaleString()}`,
          orders: [mappedOrder],
          children: [],
        });
      }
    });

    return Array.from(userMap.values());
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrders({ limit: 100, page: 1 });
      if (response?.success) {
        const orders = response.orders || [];
        const hierarchy = buildUserHierarchy(orders);
        setUserHierarchy(hierarchy);
        setTotalOrders(orders.length);
        setTotalValue(orders.reduce((sum: number, o: any) => sum + (o.finalAmount || o.totalAmount || 0), 0));
      } else {
        Alert.alert('Error', 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [getOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleUserClick = (user: UserNode) => {
    setSelectedUser(selectedUser?.id === user.id ? null : user);
  };

  // Open action sheet (not details modal directly)
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowActionSheet(true);
  };

  const handleViewDetails = () => {
    setShowActionSheet(false);
    setShowOrderDetails(true);
  };

  const handleEditOrder = () => {
    if (!selectedOrder) return;
    setShowActionSheet(false);
    navigation.navigate('AdminEditOrder', { order: selectedOrder._raw ?? selectedOrder });
  };

  const openApproveModal = (action: 'approved' | 'rejected') => {
    setApproveAction(action);
    setApproveNotes('');
    setShowActionSheet(false);
    setShowApproveModal(true);
  };

  const handleApproveReject = async () => {
    if (!selectedOrder) return;
    try {
      setApproving(true);
      const response = await approveRejectOrder(selectedOrder._id, approveAction, approveNotes);
      if (response?.success) {
        Alert.alert(
          'Success',
          `Order ${approveAction === 'approved' ? 'approved' : 'rejected'} successfully`,
          [{ text: 'OK', onPress: () => { setShowApproveModal(false); setApproveNotes(''); fetchOrders(); } }]
        );
      } else {
        Alert.alert('Error', response?.message || `Failed to ${approveAction} order`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${approveAction} order`);
    } finally {
      setApproving(false);
    }
  };

  // canEdit: admin can always edit; allow even after approval like tally flow
  const canEdit = (status: string) =>
    !['delivered', 'cancelled'].includes(status);

  // canApprove: only pending_approval or draft orders can be approved
  const canApprove = (status: string) =>
    ['draft', 'pending_approval'].includes(status);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#F59E0B';
      case 'pending_approval': return '#F97316';
      case 'approved': return '#10B981';
      case 'sent_to_tally': return '#7C3AED';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#059669';
      case 'cancelled': return '#EF4444';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return 'document-outline';
      case 'pending_approval': return 'time-outline';
      case 'approved': return 'checkmark-circle-outline';
      case 'sent_to_tally': return 'cloud-upload-outline';
      case 'processing': return 'reload-outline';
      case 'shipped': return 'car-outline';
      case 'delivered': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      case 'rejected': return 'ban-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'Pending Approval';
      case 'sent_to_tally': return 'Sent to Tally';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order._id}
      style={styles.orderCard}
      onPress={() => handleOrderClick(order)}
    >
      <View style={styles.orderCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.orderStatusBadge,
          { backgroundColor: getStatusColor(order.status) + '20' }
        ]}>
          <Ionicons
            name={getStatusIcon(order.status) as any}
            size={14}
            color={getStatusColor(order.status)}
          />
          <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderDivider} />

      <View style={styles.orderCardBody}>
        <View style={styles.orderInfoRow}>
          <Ionicons name="person-outline" size={14} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.customerName}</Text>
        </View>
        <View style={styles.orderInfoRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.shippingName}</Text>
        </View>
        <View style={styles.orderInfoRow}>
          <Ionicons name="cube-outline" size={14} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.totalQuantity} items</Text>
        </View>
      </View>

      <View style={styles.orderCardFooter}>
        <Text style={styles.orderAmountLabel}>Total Amount</Text>
        <Text style={styles.orderAmountValue}>₹ {order.totalAmount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderUserNode = (user: UserNode, level: number = 0): React.ReactNode => {
    const hasChildren = user.children && user.children.length > 0;
    const isExpanded = expandedUsers[user.id];
    const isSelected = selectedUser?.id === user.id;
    const hasOrders = user.orders && user.orders.length > 0;

    return (
      <View key={user.id} style={[styles.userNodeContainer, { marginLeft: level * 20 }]}>
        {/* User Card */}
        <TouchableOpacity
          style={[
            styles.userCard,
            isSelected && styles.userCardSelected,
            level === 0 && styles.userCardTopLevel
          ]}
          onPress={() => handleUserClick(user)}
        >
          <View style={styles.userCardLeft}>
            {/* Expand/Collapse Icon */}
            {hasChildren && (
              <TouchableOpacity
                onPress={() => toggleUserExpansion(user.id)}
                style={styles.expandButton}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            )}

            {/* User Avatar */}
            <View style={[
              styles.userAvatar,
              { backgroundColor: level === 0 ? '#3B82F6' : level === 1 ? '#10B981' : '#F59E0B' }
            ]}>
              <Text style={styles.userAvatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
              <View style={styles.groupBadge}>
                <Ionicons name="people-outline" size={10} color="#6B7280" />
                <Text style={styles.groupName}>{user.groupName}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.userCardRight}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalValue}</Text>
              <Text style={styles.statLabel}>Value</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Show Orders if User is Selected */}
        {isSelected && hasOrders && (
          <View style={styles.ordersContainer}>
            <View style={styles.ordersHeader}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.ordersHeaderText}>
                Orders ({user.orders.length})
              </Text>
            </View>
            {user.orders.map((order) => renderOrderCard(order))}
          </View>
        )}

        {/* Render Child Users if Expanded */}
        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {user.children.map((child) => renderUserNode(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  // ─── Order Details Modal ────────────────────────────────────────────────────
  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showOrderDetails}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowOrderDetails(false)} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <Text style={styles.modalSubtitle}>#{selectedOrder.orderNumber}</Text>
            </View>
            {/* Status pill */}
            <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
              <Ionicons name={getStatusIcon(selectedOrder.status) as any} size={12} color={getStatusColor(selectedOrder.status)} />
              <Text style={[styles.orderStatusText, { color: getStatusColor(selectedOrder.status) }]}>
                {getStatusLabel(selectedOrder.status)}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Order Info */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>Order Information</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Number</Text>
                <Text style={styles.detailValue}>#{selectedOrder.orderNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shipping To</Text>
                <Text style={styles.detailValue}>{selectedOrder.shippingName}</Text>
              </View>
              {selectedOrder.paymentMethod && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>{selectedOrder.paymentMethod}</Text>
                </View>
              )}
            </View>

            {/* Items */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>Order Items ({selectedOrder.items.length})</Text>
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemTotal}>₹ {item.totalAmount.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.itemCode}>{item.productCode}</Text>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemDetail}>₹ {item.unitPrice.toLocaleString()} / {item.unit}</Text>
                    <Text style={styles.itemDetail}>Qty: {item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>Order Summary</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Quantity</Text>
                <Text style={styles.detailValue}>{selectedOrder.totalQuantity}</Text>
              </View>
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹ {selectedOrder.totalAmount.toLocaleString()}</Text>
              </View>
            </View>

            {/* Quick Actions inside details */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>Actions</Text>
              <View style={styles.detailActionRow}>
                {canEdit(selectedOrder.status) && (
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}
                    onPress={handleEditOrder}
                  >
                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                    <Text style={[styles.detailActionText, { color: '#3B82F6' }]}>Edit Order</Text>
                  </TouchableOpacity>
                )}
                {canApprove(selectedOrder.status) && (
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: '#F0FDF4', borderColor: '#10B981' }]}
                    onPress={() => { setShowOrderDetails(false); openApproveModal('approved'); }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                    <Text style={[styles.detailActionText, { color: '#10B981' }]}>Approve</Text>
                  </TouchableOpacity>
                )}
                {canApprove(selectedOrder.status) && (
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: '#FFF1F2', borderColor: '#EF4444' }]}
                    onPress={() => { setShowOrderDetails(false); openApproveModal('rejected'); }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                    <Text style={[styles.detailActionText, { color: '#EF4444' }]}>Reject</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // ─── Action Sheet (on order card tap) ───────────────────────────────────────
  const renderActionSheet = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showActionSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        />
        <View style={styles.sheetContainer}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Order Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetOrderNum}>#{selectedOrder.orderNumber}</Text>
              <Text style={styles.sheetCustomer}>{selectedOrder.customerName}</Text>
            </View>
            <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
              <Ionicons name={getStatusIcon(selectedOrder.status) as any} size={12} color={getStatusColor(selectedOrder.status)} />
              <Text style={[styles.orderStatusText, { color: getStatusColor(selectedOrder.status) }]}>
                {getStatusLabel(selectedOrder.status)}
              </Text>
            </View>
          </View>

          <View style={styles.sheetAmountRow}>
            <Text style={styles.sheetAmountLabel}>Total Amount</Text>
            <Text style={styles.sheetAmount}>₹ {selectedOrder.totalAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.sheetDivider} />

          {/* Actions */}
          <TouchableOpacity style={styles.sheetAction} onPress={handleViewDetails}>
            <View style={[styles.sheetActionIcon, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="eye-outline" size={20} color="#0EA5E9" />
            </View>
            <View style={styles.sheetActionInfo}>
              <Text style={styles.sheetActionTitle}>View Details</Text>
              <Text style={styles.sheetActionSub}>See full order information</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {canEdit(selectedOrder.status) && (
            <TouchableOpacity style={styles.sheetAction} onPress={handleEditOrder}>
              <View style={[styles.sheetActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.sheetActionInfo}>
                <Text style={styles.sheetActionTitle}>Edit Order</Text>
                <Text style={styles.sheetActionSub}>Modify items, quantity or details</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {canApprove(selectedOrder.status) && (
            <TouchableOpacity style={styles.sheetAction} onPress={() => openApproveModal('approved')}>
              <View style={[styles.sheetActionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.sheetActionInfo}>
                <Text style={[styles.sheetActionTitle, { color: '#10B981' }]}>Approve Order</Text>
                <Text style={styles.sheetActionSub}>Move order to approved status</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {canApprove(selectedOrder.status) && (
            <TouchableOpacity style={styles.sheetAction} onPress={() => openApproveModal('rejected')}>
              <View style={[styles.sheetActionIcon, { backgroundColor: '#FFF1F2' }]}>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.sheetActionInfo}>
                <Text style={[styles.sheetActionTitle, { color: '#EF4444' }]}>Reject Order</Text>
                <Text style={styles.sheetActionSub}>Reject with a reason</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.sheetAction, styles.sheetCancelAction]}
            onPress={() => setShowActionSheet(false)}
          >
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  // ─── Approve / Reject Confirmation Modal ────────────────────────────────────
  const renderApproveModal = () => {
    if (!selectedOrder) return null;
    const isApprove = approveAction === 'approved';

    return (
      <Modal
        visible={showApproveModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View style={styles.approveOverlay}>
          <View style={styles.approveCard}>
            {/* Icon */}
            <View style={[styles.approveIconCircle, { backgroundColor: isApprove ? '#F0FDF4' : '#FFF1F2' }]}>
              <Ionicons
                name={isApprove ? 'checkmark-circle' : 'close-circle'}
                size={40}
                color={isApprove ? '#10B981' : '#EF4444'}
              />
            </View>

            <Text style={styles.approveTitle}>
              {isApprove ? 'Approve Order' : 'Reject Order'}
            </Text>
            <Text style={styles.approveSub}>
              Order #{selectedOrder.orderNumber} • {selectedOrder.customerName}
            </Text>
            <Text style={styles.approveAmount}>
              ₹ {selectedOrder.totalAmount.toLocaleString()}
            </Text>

            {/* Notes */}
            <TextInput
              style={styles.approveNotes}
              placeholder={isApprove ? 'Approval notes (optional)' : 'Reason for rejection (optional)'}
              placeholderTextColor="#9CA3AF"
              value={approveNotes}
              onChangeText={setApproveNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Buttons */}
            <View style={styles.approveButtons}>
              <TouchableOpacity
                style={styles.approveCancelBtn}
                onPress={() => setShowApproveModal(false)}
                disabled={approving}
              >
                <Text style={styles.approveCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveConfirmBtn, { backgroundColor: isApprove ? '#10B981' : '#EF4444' }]}
                onPress={handleApproveReject}
                disabled={approving}
              >
                {approving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.approveConfirmText}>
                    {isApprove ? 'Approve' : 'Reject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderOrderDetailsModal()}
      {renderActionSheet()}
      {renderApproveModal()}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders Hierarchy</Text>
        <Text style={styles.subtitle}>View orders by user hierarchy</Text>
      </View>

      {/* Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{totalOrders}</Text>
          <Text style={styles.summaryLab}>Total Orders</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="people" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{userHierarchy.length}</Text>
          <Text style={styles.summaryLab}>Active Users</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="cash" size={20} color="#fff" />
          <Text style={styles.summaryVal}>₹{(totalValue / 100000).toFixed(1)}L</Text>
          <Text style={styles.summaryLab}>Total Value</Text>
        </View>
      </View>

      {/* Hierarchical User List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {userHierarchy.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No orders found</Text>
            </View>
          ) : (
            userHierarchy.map((user: UserNode) => renderUserNode(user, 0))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
    backgroundColor: '#3B82F6',
    marginHorizontal: 15,
    borderRadius: 14,
    marginTop: 12,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)'
  },
  summaryVal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4
  },
  summaryLab: {
    color: '#DBEAFE',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase'
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: 15, paddingBottom: 40 },

  userNodeContainer: { marginBottom: 12 },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  userCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF'
  },
  userCardTopLevel: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },

  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  expandButton: { marginRight: 8, padding: 4 },

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },

  userInfo: { flex: 1 },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827'
  },
  userRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start'
  },
  groupName: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600'
  },

  userCardRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 8
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB'
  },

  childrenContainer: { marginTop: 8 },

  ordersContainer: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  ordersHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 6
  },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  orderDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2
  },
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4
  },
  orderStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },

  orderDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10
  },

  orderCardBody: {
    gap: 6,
    marginBottom: 10
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  orderInfoText: {
    fontSize: 12,
    color: '#6B7280'
  },

  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB'
  },
  orderAmountLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600'
  },
  orderAmountValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827'
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  closeButton: { padding: 4 },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2
  },

  modalContent: {
    flex: 1,
    padding: 15
  },

  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  detailsCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right'
  },
  detailStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  detailStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },

  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981'
  },
  itemCode: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  itemDetail: {
    fontSize: 12,
    color: '#4B5563'
  },

  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981'
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280'
  },

  // Detail action buttons inside details modal
  detailActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  detailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailActionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Action Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sheetOrderNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  sheetCustomer: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  sheetAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 14,
  },
  sheetAmountLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sheetAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 6,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  sheetActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetActionInfo: {
    flex: 1,
  },
  sheetActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  sheetActionSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sheetCancelAction: {
    justifyContent: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    flex: 1,
  },

  // Approve / Reject Modal
  approveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  approveCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  approveIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  approveTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  approveSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  approveAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },
  approveNotes: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
    marginBottom: 20,
  },
  approveButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  approveCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  approveCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  approveConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default AdminOrderList;