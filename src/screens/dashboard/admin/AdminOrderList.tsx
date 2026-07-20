import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';

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
  subDealerName?: string;
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
  totalValue: number;
  orders: Order[];
  children: UserNode[];
}

const AdminOrderList = () => {
  const { getOrders, approveRejectOrder, submitOrderForApproval, deleteOrder, user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'myOrders' | 'hierarchy'>('myOrders');

  // ── Shared modal / action state ────────────────────────────────────────────
  const [expandedUsers, setExpandedUsers] = useState<{ [key: string]: boolean }>({});
  const [selectedUser, setSelectedUser] = useState<UserNode | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── My Orders tab state ────────────────────────────────────────────────────
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(true);

  // ── Hierarchy tab state ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userHierarchy, setUserHierarchy] = useState<UserNode[]>([]);

  // ── Day filters (separate per tab) ───────────────────────────────────────
  const [myOrdersDayFilter, setMyOrdersDayFilter] = useState<'5' | '10' | '15' | '25' | '30'>('5');
  const [hierDayFilter, setHierDayFilter] = useState<'all' | '5' | '10' | '15' | '25' | '30'>('all');

  const mapOrder = (order: any): Order => ({
    _id: order._id,
    orderNumber: order.orderNumber || order._id,
    customerName: order.customerName || 'N/A',
    shippingName: order.shippingAddress?.city || order.shippingAddress?.street || 'N/A',
    subDealerName: order.subDealerName || order.shippingAddress?.name || undefined,
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
    _raw: order,
  });

  const buildUserHierarchy = (orders: any[]): UserNode[] => {
    // Pass 1: build flat userMap. Also track parentId, grandparentId (from nested populate).
    const userMap = new Map<string, UserNode>();
    const parentIdMap = new Map<string, string>();        // childId → parentId
    const parentNameMap = new Map<string, string>();      // parentId → parentName
    const parentRoleMap = new Map<string, string>();      // parentId → parentRole
    const grandparentOfMap = new Map<string, string>();   // parentId → grandparentId

    orders.forEach((order: any) => {
      const creator = order.createdBy || {};
      const userId = creator._id ? String(creator._id) : 'unknown';
      const grpName = (creator.groups || []).find((g: any) => g.isActive)?.groupName || '';

      // parentUserId may be a nested-populated object (has ._id) or a plain ID string
      const parentRef = creator.hierarchy?.parentUserId;
      const parentId = parentRef
        ? String((parentRef as any)._id || parentRef)
        : null;

      const mappedOrder = mapOrder(order);

      if (userMap.has(userId)) {
        userMap.get(userId)!.orders.push(mappedOrder);
      } else {
        userMap.set(userId, {
          id: userId,
          name: creator.name || 'Unknown User',
          role: creator.role || 'Unknown',
          groupName: grpName,
          email: creator.email || '',
          mobile: creator.mobile || '',
          totalOrders: 0,
          totalValue: 0,
          orders: [mappedOrder],
          children: [],
        });
      }

      if (parentId && !parentIdMap.has(userId)) {
        parentIdMap.set(userId, parentId);

        if (creator.hierarchy?.parentUserName && !parentNameMap.has(parentId))
          parentNameMap.set(parentId, creator.hierarchy.parentUserName);
        if (creator.hierarchy?.parentUserRole && !parentRoleMap.has(parentId))
          parentRoleMap.set(parentId, creator.hierarchy.parentUserRole);

        // Grandparent — available when backend nested-populated parentUserId as an object
        if (parentRef && typeof parentRef === 'object' && !grandparentOfMap.has(parentId)) {
          const gpRef = (parentRef as any).hierarchy?.parentUserId;
          if (gpRef) {
            grandparentOfMap.set(parentId, String((gpRef as any)._id || gpRef));
          }
        }
      }
    });

    // Pass 2: link children to their real parents
    const childIds = new Set<string>();
    parentIdMap.forEach((parentId, childId) => {
      if (userMap.has(parentId)) {
        userMap.get(parentId)!.children.push(userMap.get(childId)!);
        childIds.add(childId);
      }
    });

    // Pass 2.5: create virtual nodes for intermediate users who placed no orders
    // (e.g. ASM Kapurthala exists in hierarchy but has no orders of their own).
    // Then link each virtual node under its real grandparent if that grandparent is in userMap.
    const virtualMap = new Map<string, UserNode>(); // parentId → virtual UserNode
    parentIdMap.forEach((parentId, childId) => {
      if (!userMap.has(parentId) && !childIds.has(childId) && parentNameMap.has(parentId)) {
        if (!virtualMap.has(parentId)) {
          virtualMap.set(parentId, {
            id: `virtual__${parentId}`,
            name: parentNameMap.get(parentId)!,
            role: parentRoleMap.get(parentId) || 'Unknown',
            groupName: '',
            email: '',
            mobile: '',
            totalOrders: 0,
            totalValue: 0,
            orders: [],
            children: [],
          });
        }
        virtualMap.get(parentId)!.children.push(userMap.get(childId)!);
        childIds.add(childId);
      }
    });

    // Add virtual nodes to userMap first so grandparent linking can find them
    virtualMap.forEach(vNode => userMap.set(vNode.id, vNode));

    // Link each virtual node under its grandparent (if the grandparent placed orders → in userMap)
    virtualMap.forEach((vNode, parentId) => {
      const grandparentId = grandparentOfMap.get(parentId);
      if (grandparentId && userMap.has(grandparentId)) {
        userMap.get(grandparentId)!.children.push(vNode);
        childIds.add(vNode.id);
      }
    });

    // Pass 3: group all-leaf siblings by groupName (inserts location group nodes)
    const groupifyLeaves = (nodes: UserNode[]): UserNode[] => {
      if (nodes.length === 0 || !nodes.every(n => n.children.length === 0)) return nodes;
      const gMap = new Map<string, UserNode>();
      nodes.forEach(node => {
        const key = node.groupName || 'Unknown Group';
        if (!gMap.has(key)) {
          gMap.set(key, {
            id: `grp__${key}`,
            name: key,
            role: 'Group',
            groupName: '',
            email: '',
            mobile: '',
            totalOrders: 0,
            totalValue: 0,
            orders: [],
            children: [],
          });
        }
        gMap.get(key)!.children.push(node);
      });
      return Array.from(gMap.values());
    };

    const applyGroupify = (node: UserNode): void => {
      node.children.forEach(applyGroupify);
      node.children = groupifyLeaves(node.children);
    };

    const roots = Array.from(userMap.values()).filter(n => !childIds.has(n.id));
    roots.forEach(applyGroupify);
    const processedRoots = groupifyLeaves(roots);

    // Pass 4: for leaf user nodes with orders across multiple dealers,
    // insert dealer sub-nodes so each dealer's orders are grouped separately.
    const addDealerSubNodes = (node: UserNode): void => {
      if (node.children.length > 0) {
        node.children.forEach(addDealerSubNodes);
        return;
      }
      // Only split when this is a real user (not a group/virtual placeholder) with 2+ dealers
      if (node.role === 'Group' || node.orders.length === 0) return;

      const dealerMap = new Map<string, UserNode>();
      node.orders.forEach(order => {
        const key = order.customerName || 'Unknown Dealer';
        if (!dealerMap.has(key)) {
          dealerMap.set(key, {
            id: `dlr__${node.id}__${key}`,
            name: key,
            role: 'Dealer',
            groupName: '',
            email: '',
            mobile: '',
            totalOrders: 0,
            totalValue: 0,
            orders: [],
            children: [],
          });
        }
        dealerMap.get(key)!.orders.push(order);
      });

      if (dealerMap.size > 1) {
        node.children = Array.from(dealerMap.values());
        node.orders = [];
      }
    };

    processedRoots.forEach(addDealerSubNodes);

    // Pass 5: compute totals bottom-up
    const computeTotals = (node: UserNode): void => {
      node.children.forEach(computeTotals);
      const ownValue = node.orders.reduce((s, o) => s + o.totalAmount, 0);
      node.totalOrders = node.orders.length + node.children.reduce((s, c) => s + c.totalOrders, 0);
      node.totalValue = ownValue + node.children.reduce((s, c) => s + c.totalValue, 0);
    };

    processedRoots.forEach(computeTotals);
    return processedRoots;
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrders({ limit: 0, page: 1 });
      if (response?.success) {
        const orders = response.orders || [];
        setUserHierarchy(buildUserHierarchy(orders));
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

  const fetchMyOrders = useCallback(async () => {
    try {
      setMyOrdersLoading(true);
      const response = await getOrders({ limit: 100, page: 1, createdBy: user?._id });
      if (response?.success) {
        const raw = response.orders || [];
        setMyOrders(raw.map(mapOrder));
      } else {
        Alert.alert('Error', 'Failed to load your orders');
      }
    } catch (error) {
      console.error('Error fetching my orders:', error);
      Alert.alert('Error', 'Failed to load your orders');
    } finally {
      setMyOrdersLoading(false);
    }
  }, [getOrders, user?._id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'myOrders') {
      await fetchMyOrders();
    } else {
      await fetchOrders();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
    fetchMyOrders();
  }, [fetchOrders, fetchMyOrders]);

  // Refresh + notify when returning from AdminEditOrder
  useEffect(() => {
    if (route.params?.refreshOrders) {
      fetchMyOrders();
      fetchOrders();
      setTimeout(() => Alert.alert('Success', 'Order updated successfully!'), 300);
      navigation.setParams({ refreshOrders: undefined });
    }
  }, [route.params?.refreshOrders]);

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleUserClick = (user: UserNode) => {
    setSelectedUser(selectedUser?.id === user.id ? null : user);
  };

  // My Orders tab: full action sheet (view + edit + approve)
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowActionSheet(true);
  };

  // Hierarchy tab: view details only
  const handleHierarchyOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
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

  const openApproveModal = () => {
    setApproveNotes('');
    setShowActionSheet(false);
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    try {
      setApproving(true);

      let approved = false;

      // If order is still draft, submit it for approval first.
      // For admin orders this triggers self-approval (isSelfApproved: true)
      // and the order moves straight to 'approved' without a second call.
      if (selectedOrder.status === 'draft') {
        const submitResult = await submitOrderForApproval(selectedOrder._id);
        if (!submitResult?.success) {
          // Close modal first so the error alert is visible
          setShowApproveModal(false);
          setTimeout(() => Alert.alert('Error', submitResult?.message || 'Failed to submit order for approval'), 300);
          return;
        }
        if (submitResult?.isSelfApproved) {
          approved = true;
        }
        // Not self-approved — fall through to approveRejectOrder below
      }

      if (!approved) {
        const response = await approveRejectOrder(selectedOrder._id, 'approved', approveNotes);
        if (response?.success) {
          approved = true;
        } else {
          setShowApproveModal(false);
          setTimeout(() => Alert.alert('Error', response?.message || 'Failed to approve order'), 300);
          return;
        }
      }

      if (approved) {
        // Close modal first, then show success alert so it isn't hidden behind the modal
        setShowApproveModal(false);
        setApproveNotes('');
        fetchMyOrders();
        fetchOrders();
        setTimeout(() => Alert.alert('Success', 'Order approved successfully!'), 300);
      }
    } catch {
      setShowApproveModal(false);
      setTimeout(() => Alert.alert('Error', 'Failed to approve order'), 300);
    } finally {
      setApproving(false);
    }
  };

  // canEdit: only allow editing while order is still in draft or pending_approval
  const canEdit = (status: string) =>
    ['draft', 'pending_approval'].includes(status);

  // canApprove: only pending_approval or draft orders can be approved
  const canApprove = (status: string) =>
    ['draft', 'pending_approval'].includes(status);

  // canDelete: only draft orders can be deleted
  const canDelete = (status: string) => status === 'draft';

  const handleDeleteOrder = () => {
    if (!selectedOrder) return;
    setShowActionSheet(false);
    setShowOrderDetails(false);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteOrder = async () => {
    if (!selectedOrder) return;
    try {
      setDeleting(true);
      setShowDeleteConfirm(false);
      await deleteOrder(selectedOrder._id);
      fetchMyOrders();
      fetchOrders();
      Alert.alert('Deleted', 'Order deleted successfully.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

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

  const formatCompactCurrency = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  const MY_ORDER_FILTERS = [
    { key: '5',  label: 'Last 5 Days' },
    { key: '10', label: 'Last 10 Days' },
    { key: '15', label: 'Last 15 Days' },
    { key: '25', label: 'Last 25 Days' },
    { key: '30', label: '1 Month' },
  ] as const;

  const HIER_FILTERS = [
    { key: 'all', label: 'All' },
    { key: '5',  label: 'Last 5 Days' },
    { key: '10', label: 'Last 10 Days' },
    { key: '15', label: 'Last 15 Days' },
    { key: '25', label: 'Last 25 Days' },
    { key: '30', label: '1 Month' },
  ] as const;

  const applyDayRange = (dateStr: string, filter: string): boolean => {
    if (filter === 'all') return true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(filter));
    return new Date(dateStr) >= cutoff;
  };

  const filteredMyOrders = myOrders.filter(o => applyDayRange(o.createdAt, myOrdersDayFilter));

  const filterNode = (node: UserNode, filter: string): UserNode | null => {
    const filteredOrders = node.orders.filter(o => applyDayRange(o.createdAt, filter));
    const filteredChildren = node.children
      .map(c => filterNode(c, filter))
      .filter((c): c is UserNode => c !== null);
    if (filteredOrders.length === 0 && filteredChildren.length === 0) return null;
    const totalOrders = filteredOrders.length + filteredChildren.reduce((s, c) => s + c.totalOrders, 0);
    const totalValue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0)
      + filteredChildren.reduce((s, c) => s + c.totalValue, 0);
    return { ...node, orders: filteredOrders, children: filteredChildren, totalOrders, totalValue };
  };

  const filteredHierarchy: UserNode[] = hierDayFilter === 'all'
    ? userHierarchy
    : userHierarchy
        .map(n => filterNode(n, hierDayFilter))
        .filter((n): n is UserNode => n !== null);

  const renderMyOrdersFilter = () => (
    <View style={styles.dayFilterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayFilterScroll}>
        {MY_ORDER_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.dayFilterPill, myOrdersDayFilter === f.key && styles.dayFilterPillActive]}
            onPress={() => setMyOrdersDayFilter(f.key as any)}
          >
            <Text style={[styles.dayFilterText, myOrdersDayFilter === f.key && styles.dayFilterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderHierFilter = () => (
    <View style={styles.dayFilterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayFilterScroll}>
        {HIER_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.dayFilterPill, hierDayFilter === f.key && styles.dayFilterPillActive]}
            onPress={() => setHierDayFilter(f.key as any)}
          >
            <Text style={[styles.dayFilterText, hierDayFilter === f.key && styles.dayFilterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOrderCard = (order: Order, viewOnly = false) => (
    <TouchableOpacity
      key={order._id}
      style={styles.orderCard}
      onPress={() => viewOnly ? handleHierarchyOrderClick(order) : handleOrderClick(order)}
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
        {order.subDealerName ? (
          <View style={styles.orderInfoRow}>
            <Ionicons name="storefront-outline" size={14} color="#6B7280" />
            <Text style={styles.orderInfoText}>{order.subDealerName}</Text>
          </View>
        ) : null}
        <View style={styles.orderInfoRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.shippingName}</Text>
        </View>
        <View style={styles.orderInfoRow}>
          <Ionicons name="cube-outline" size={14} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.totalQuantity} quantity</Text>
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
    const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avatarColor = level === 0 ? '#3B82F6' : level === 1 ? '#10B981' : '#F59E0B';

    const handleCardPress = () => {
      if (hasChildren) {
        toggleUserExpansion(user.id);
      } else {
        handleUserClick(user);
      }
    };

    return (
      <View key={user.id} style={[styles.userNodeContainer, { marginLeft: Math.min(level * 10, 30) }]}>
        {/* User Card */}
        <TouchableOpacity
          style={[
            styles.userCard,
            isSelected && styles.userCardSelected,
            level === 0 && styles.userCardTopLevel
          ]}
          onPress={handleCardPress}
          activeOpacity={0.85}
        >
          {/* Left: avatar + info */}
          <View style={styles.userCardLeft}>
            {hasChildren && (
              <TouchableOpacity
                onPress={() => toggleUserExpansion(user.id)}
                style={styles.expandButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            )}

            <View style={[styles.userAvatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.userAvatarText}>{initials}</Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
              <Text style={styles.userRole} numberOfLines={1}>{user.role}</Text>
              {!!user.groupName && user.groupName !== user.role && (
                <View style={styles.groupBadge}>
                  <Ionicons name="people-outline" size={10} color="#6B7280" />
                  <Text style={styles.groupName} numberOfLines={1}>{user.groupName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right: stats */}
          <View style={styles.userCardRight}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalOrders}</Text>
              <Text style={styles.statLabel}>ORDERS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatCompactCurrency(user.totalValue)}
              </Text>
              <Text style={styles.statLabel}>VALUE</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Show own orders: on expand (parent nodes) or on select (leaf nodes) */}
        {hasOrders && (isExpanded || isSelected) && (
          <View style={styles.ordersContainer}>
            <View style={styles.ordersHeader}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.ordersHeaderText}>
                Orders ({user.orders.length})
              </Text>
            </View>
            {user.orders.map((order) => renderOrderCard(order, true))}
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
              {selectedOrder.subDealerName ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sub Dealer</Text>
                  <Text style={styles.detailValue}>{selectedOrder.subDealerName}</Text>
                </View>
              ) : null}
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
              <Text style={styles.detailsCardTitle}>Order Quantity ({selectedOrder.items.length})</Text>
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
                    onPress={() => { setShowOrderDetails(false); openApproveModal(); }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                    <Text style={[styles.detailActionText, { color: '#10B981' }]}>Approve</Text>
                  </TouchableOpacity>
                )}
                {canDelete(selectedOrder.status) && (
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}
                    onPress={handleDeleteOrder}
                    disabled={deleting}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.detailActionText, { color: '#EF4444' }]}>Delete</Text>
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
            <TouchableOpacity style={styles.sheetAction} onPress={openApproveModal}>
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

          {canDelete(selectedOrder.status) && (
            <TouchableOpacity style={styles.sheetAction} onPress={handleDeleteOrder} disabled={deleting}>
              <View style={[styles.sheetActionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.sheetActionInfo}>
                <Text style={[styles.sheetActionTitle, { color: '#EF4444' }]}>Delete Order</Text>
                <Text style={styles.sheetActionSub}>Permanently remove this draft</Text>
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

  // ─── Approve Confirmation Modal ──────────────────────────────────────────────
  const renderApproveModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showApproveModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View style={styles.approveOverlay}>
          <View style={styles.approveCard}>
            <View style={styles.approveIconCircle}>
              <Ionicons name="checkmark-circle" size={44} color="#10B981" />
            </View>

            <Text style={styles.approveTitle}>Approve Order</Text>
            <Text style={styles.approveSub}>
              #{selectedOrder.orderNumber} • {selectedOrder.customerName}
            </Text>
            <Text style={styles.approveAmount}>
              ₹ {selectedOrder.totalAmount.toLocaleString()}
            </Text>

            <TextInput
              style={styles.approveNotes}
              placeholder="Approval notes (optional)"
              placeholderTextColor="#9CA3AF"
              value={approveNotes}
              onChangeText={setApproveNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.approveButtons}>
              <TouchableOpacity
                style={styles.approveCancelBtn}
                onPress={() => setShowApproveModal(false)}
                disabled={approving}
              >
                <Text style={styles.approveCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveConfirmBtn}
                onPress={handleApprove}
                disabled={approving}
              >
                {approving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.approveConfirmText}>Approve</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDeleteConfirmModal = () => {
    if (!selectedOrder) return null;
    return (
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.approveOverlay}>
          <View style={styles.approveCard}>
            <View style={[styles.approveIconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash" size={44} color="#EF4444" />
            </View>
            <Text style={styles.approveTitle}>Delete Order</Text>
            <Text style={styles.approveSub}>#{selectedOrder.orderNumber}</Text>
            <Text style={[styles.approveSub, { marginTop: 8, color: '#374151' }]}>
              This action cannot be undone. Are you sure?
            </Text>
            <View style={[styles.approveButtons, { marginTop: 24 }]}>
              <TouchableOpacity
                style={styles.approveCancelBtn}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                <Text style={styles.approveCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveConfirmBtn, { backgroundColor: '#EF4444' }]}
                onPress={confirmDeleteOrder}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.approveConfirmText}>Delete</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderMyOrdersTab = () => {
    if (myOrdersLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      );
    }

    const filteredValue = filteredMyOrders.reduce((s, o) => s + o.totalAmount, 0);

    return (
      <>
        {renderMyOrdersFilter()}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* My Orders Summary */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.summaryVal}>{filteredMyOrders.length}</Text>
              <Text style={styles.summaryLab}>My Orders</Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryDivider]}>
              <Ionicons name="cash" size={20} color="#fff" />
              <Text style={styles.summaryVal}>₹{(filteredValue / 100000).toFixed(1)}L</Text>
              <Text style={styles.summaryLab}>Total Value</Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryDivider]}>
              <Ionicons name="time" size={20} color="#fff" />
              <Text style={styles.summaryVal}>
                {filteredMyOrders.filter(o => o.status === 'pending_approval').length}
              </Text>
              <Text style={styles.summaryLab}>Pending</Text>
            </View>
          </View>

          {filteredMyOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {`No orders in the last ${myOrdersDayFilter === '30' ? '1 month' : myOrdersDayFilter + ' days'}`}
              </Text>
            </View>
          ) : (
            filteredMyOrders.map((order) => renderOrderCard(order, false))
          )}
        </ScrollView>
      </>
    );
  };

  const renderHierarchyTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      );
    }

    const hierTotalOrders = filteredHierarchy.reduce((s, g) => s + g.totalOrders, 0);
    const hierTotalValue = filteredHierarchy.reduce((s, g) => s + g.totalValue, 0);
    const countNodes = (nodes: UserNode[]): number =>
      nodes.reduce((s, n) => s + 1 + countNodes(n.children), 0);
    const hierTotalMembers = countNodes(filteredHierarchy);

    return (
      <>
        {renderHierFilter()}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Hierarchy Summary */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.summaryVal}>{hierTotalOrders}</Text>
              <Text style={styles.summaryLab}>Total Orders</Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryDivider]}>
              <Ionicons name="people" size={20} color="#fff" />
              <Text style={styles.summaryVal}>{hierTotalMembers}</Text>
              <Text style={styles.summaryLab}>Members</Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryDivider]}>
              <Ionicons name="cash" size={20} color="#fff" />
              <Text style={styles.summaryVal}>{formatCompactCurrency(hierTotalValue)}</Text>
              <Text style={styles.summaryLab}>Total Value</Text>
            </View>
          </View>

          {filteredHierarchy.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="git-network-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {hierDayFilter === 'all' ? 'No orders found' : `No orders in the last ${hierDayFilter === '30' ? '1 month' : hierDayFilter + ' days'}`}
              </Text>
            </View>
          ) : (
            filteredHierarchy.map((groupNode: UserNode) => renderUserNode(groupNode, 0))
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderOrderDetailsModal()}
      {renderActionSheet()}
      {renderApproveModal()}
      {renderDeleteConfirmModal()}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders Hierarchy</Text>
        <Text style={styles.subtitle}>Manage and view orders</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'myOrders' && styles.tabItemActive]}
          onPress={() => setActiveTab('myOrders')}
        >
          <Ionicons
            name="person-circle-outline"
            size={18}
            color={activeTab === 'myOrders' ? '#3B82F6' : '#9CA3AF'}
          />
          <Text style={[styles.tabLabel, activeTab === 'myOrders' && styles.tabLabelActive]}>
            My Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'hierarchy' && styles.tabItemActive]}
          onPress={() => setActiveTab('hierarchy')}
        >
          <Ionicons
            name="git-network-outline"
            size={18}
            color={activeTab === 'hierarchy' ? '#3B82F6' : '#9CA3AF'}
          />
          <Text style={[styles.tabLabel, activeTab === 'hierarchy' && styles.tabLabelActive]}>
            Hierarchy
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'myOrders' ? renderMyOrdersTab() : renderHierarchyTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 1,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
    backgroundColor: '#3B82F6',
    marginHorizontal: 15,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 10,
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
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  expandButton: { marginRight: 4, padding: 2 },

  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  userRole: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  groupName: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 3,
    fontWeight: '600',
  },

  userCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  statItem: {
    alignItems: 'center',
    width: 48,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 7,
    color: '#9CA3AF',
    marginTop: 1,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 2,
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
    backgroundColor: '#F0FDF4',
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
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Day Filter Pills ─────────────────────────────────────────────────────
  dayFilterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayFilterScroll: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  dayFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayFilterPillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dayFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayFilterTextActive: {
    color: '#fff',
  },

  // ── Tab Bar ──────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#3B82F6',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#3B82F6',
  },
});

export default AdminOrderList;