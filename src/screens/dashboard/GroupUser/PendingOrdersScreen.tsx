import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import apiService from '../../../services/api';
import OrderDetailsModal from '../../../components/OrderDetailsModal';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:              '#6B7280',
  pending:            '#F59E0B',
  pending_approval:   '#F59E0B',
  confirmed:          '#3B82F6',
  processing:         '#3B82F6',
  approved:           '#10B981',
  sent_to_tally:      '#8B5CF6',
  dispatched:         '#8B5CF6',
  fully_dispatched:   '#059669',
  shipped:            '#8B5CF6',
  delivered:          '#059669',
  cancelled:          '#EF4444',
  returned:           '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  draft:              'Draft',
  pending:            'Pending',
  pending_approval:   'Pending Approval',
  confirmed:          'Confirmed',
  processing:         'Processing',
  approved:           'Approved',
  sent_to_tally:      'Sent to Tally',
  dispatched:         'Dispatched',
  fully_dispatched:   'Fully Dispatched',
  shipped:            'In Transit',
  delivered:          'Delivered',
  cancelled:          'Cancelled',
  returned:           'Returned',
};

// Role display labels for hierarchy
const ROLE_LABELS: Record<string, string> = {
  superadmin:  'Super Admin',
  admin:       'Admin',
  groupuser:   'Group User',
  zonal:       'Zonal',
  rsm:         'RSM',
  asm:         'ASM',
  salesman:    'Salesman',
  dealers:     'Dealer',
  dealer:      'Dealer',
  distibutors: 'Distributor',
  distributor: 'Distributor',
  subdealer:   'Sub-Dealer',
};

const ROLE_COLORS: Record<string, string> = {
  superadmin:  '#7C3AED',
  admin:       '#2563EB',
  groupuser:   '#0891B2',
  zonal:       '#0D9488',
  rsm:         '#059669',
  asm:         '#16A34A',
  salesman:    '#65A30D',
  dealers:     '#D97706',
  dealer:      '#D97706',
  distibutors: '#B45309',
  distributor: '#B45309',
  subdealer:   '#92400E',
};

const FILTER_PILLS = [
  { key: 'all',             label: 'All' },
  { key: 'pending_approval',label: 'Pending', color: '#F59E0B' },
  { key: 'approved',        label: 'Approved', color: '#10B981' },
  { key: 'processing',      label: 'Processing', color: '#3B82F6' },
  { key: 'dispatched',      label: 'Shipped', color: '#8B5CF6' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Order {
  _id: string;
  orderNumber: string;
  orderDate: string;
  finalAmount: number;
  status: string;
  priority: string;
  customerName: string;
  dealerName?: string;
  items: Array<{ productName?: string; name?: string; quantity?: number }>;
  createdBy?: { name?: string; role?: string } | null;
  orderCategory?: 'sale' | 'purchase'; // set directly on Tally dispatch orders
}

// ─── Component ───────────────────────────────────────────────────────────────

const PendingOrdersScreen = () => {
  const authUser = useSelector((state: any) => state.auth.user);
  const cmpcode = authUser?.defaultCompany?.companyCode || '';
  const userId = authUser?._id || '';

  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  // allOrders holds the full raw list from API; filtered view is derived below
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  // Roles that represent company-side creators (Sales orders)
  const SALE_ROLES = new Set([
    'superadmin', 'admin', 'groupuser', 'zonal', 'rsm', 'asm', 'salesman',
  ]);

  // Classify an order as sale or purchase based on who created it.
  // Tally dispatch orders have orderCategory set directly → always 'sale'.
  // Orders created by admin/groupuser/etc = sale (company selling to dealer).
  // Orders created by dealer/distributor = purchase (dealer buying from company).
  // Legacy orders with no createdBy default to 'sale'.
  const getOrderCategory = (o: Order): 'sale' | 'purchase' => {
    if (o.orderCategory) return o.orderCategory;
    const role = o.createdBy?.role?.toLowerCase() || '';
    if (!role) return 'sale';
    return SALE_ROLES.has(role) ? 'sale' : 'purchase';
  };

  // Re-fetch when status filter changes (tab switch only re-filters the cached list)
  useEffect(() => {
    fetchOrders(true);
  }, [filterStatus]);

  // Debounced search re-fetch
  useEffect(() => {
    const t = setTimeout(() => fetchOrders(true), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Map a TallyDispatch record into the Order shape used by this screen
  const mapDispatchToOrder = (d: any): Order => ({
    _id: d._id,
    orderNumber: d.orderNumber || d.orderguid?.slice(-6).toUpperCase() || '',
    orderDate: d.orderDate || d.tallySyncAt || '',
    finalAmount: d.totalAmount || 0,
    status: d.dispatchStatus === 'fully_dispatched' ? 'fully_dispatched' : 'pending',
    priority: '',
    customerName: d.partyName || '',
    dealerName: d.partyName || '',
    items: (d.items || []).map((it: any) => ({ productName: it.itemName, quantity: it.pendingQty || it.orderedQty })),
    createdBy: null, // Tally orders → classified as 'sale'
    orderCategory: 'sale',
  });

  const fetchOrders = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      const currentPage = reset ? 1 : page;

      const params: any = {
        page: currentPage,
        limit: 50,
        sortBy: 'orderDate',
      };

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Fetch regular orders and Tally dispatches in parallel
      const [ordersResult, dispatchResult] = await Promise.all([
        apiService.getOrders(params),
        cmpcode && userId
          ? apiService.getTallyDispatch({ cmpcode, userId, page: currentPage, limit: 50 })
          : Promise.resolve(null),
      ]);

      const newOrders: Order[] = ordersResult?.success ? (ordersResult.orders || []) : [];
      const tallyOrders: Order[] = dispatchResult?.success
        ? (dispatchResult.data?.dispatches || []).map(mapDispatchToOrder)
        : [];

      // Merge: Tally orders first, then regular orders
      const merged = [...tallyOrders, ...newOrders];

      if (reset) {
        setAllOrders(merged);
        setPage(2);
      } else {
        setAllOrders(prev => [...prev, ...merged]);
        setPage(p => p + 1);
      }

      setHasMore(newOrders.length === 50 || tallyOrders.length === 50);
    } catch {
      if (reset) setAllOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Derive the visible list for the active tab
  const orders = allOrders.filter(o => getOrderCategory(o) === (activeTab === 'sales' ? 'sale' : 'purchase'));

  // Stats computed from the filtered view
  const stats = {
    total: orders.length,
    totalValue: orders.reduce((s, o) => s + (o.finalAmount || 0), 0),
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const onLoadMore = () => {
    if (hasMore && !loading) fetchOrders(false);
  };

  const handleViewDetails = async (order: Order) => {
    try {
      setLoadingDetail(order._id);
      const result = await apiService.getOrderById(order._id);
      if (result?.success && result?.order) {
        setSelectedOrder(result.order);
        setShowDetails(true);
      } else {
        // Fallback: show the list-level data we already have
        setSelectedOrder(order);
        setShowDetails(true);
      }
    } catch {
      setSelectedOrder(order);
      setShowDetails(true);
    } finally {
      setLoadingDetail(null);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getOrderId = (o: Order) =>
    o.orderNumber || o._id?.slice(-6).toUpperCase() || '—';

  const getPartyName = (o: Order) =>
    o.dealerName || o.customerName || '—';

  const getFirstItem = (o: Order) => {
    if (o.items?.length > 0) {
      return o.items[0].productName || o.items[0].name || 'Multiple items';
    }
    return '—';
  };

  const getItemCount = (o: Order) => o.items?.length ?? 0;

  const getDate = (o: Order) => {
    const d = o.orderDate;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: '2-digit',
    });
  };

  const getCreatorRole = (o: Order): string =>
    o.createdBy?.role?.toLowerCase() || '';

  const getCreatorName = (o: Order): string =>
    o.createdBy?.name || 'Unknown';

  // Build hierarchy chain: Admin → GroupUser → Dealer
  const getHierarchyChain = (o: Order): Array<{ label: string; role: string }> => {
    const chain: Array<{ label: string; role: string }> = [];
    const role = getCreatorRole(o);
    const name = getCreatorName(o);

    // For sales orders: creator is admin/groupuser → recipient is dealer
    // For purchase orders: creator is dealer → recipient is company
    if (activeTab === 'sales') {
      // Show: [Creator role] [Creator name] → Dealer/Customer
      if (role) chain.push({ label: name, role });
      const party = getPartyName(o);
      if (party && party !== '—') chain.push({ label: party, role: 'dealers' });
    } else {
      // Purchase: dealer placed this order
      const party = getPartyName(o);
      if (party && party !== '—') chain.push({ label: party, role: 'dealers' });
      if (role) chain.push({ label: name, role });
    }

    return chain;
  };

  // ─── Render card ──────────────────────────────────────────────────────────

  const renderOrderCard = ({ item }: { item: Order }) => {
    const status = (item.status || 'pending').toLowerCase();
    const statusColor = STATUS_COLORS[status] || '#6B7280';
    const statusLabel = STATUS_LABELS[status] || status;
    const chain = getHierarchyChain(item);

    const isLoadingThis = loadingDetail === item._id;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.85}
        onPress={() => handleViewDetails(item)}
      >
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderIdText}>#{getOrderId(item)}</Text>
            <Text style={styles.dateText}>{getDate(item)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Hierarchy chain */}
        {chain.length > 0 && (
          <View style={styles.hierarchyRow}>
            {chain.map((node, idx) => {
              const nodeColor = ROLE_COLORS[node.role] || '#6B7280';
              const nodeLabel = ROLE_LABELS[node.role] || node.role;
              return (
                <React.Fragment key={idx}>
                  <View style={[styles.hierarchyNode, { borderColor: nodeColor + '44', backgroundColor: nodeColor + '11' }]}>
                    <Text style={[styles.hierarchyRole, { color: nodeColor }]}>{nodeLabel}</Text>
                    <Text style={[styles.hierarchyName, { color: nodeColor }]} numberOfLines={1}>{node.label}</Text>
                  </View>
                  {idx < chain.length - 1 && (
                    <Ionicons name="chevron-forward" size={14} color="#9CA3AF" style={{ marginHorizontal: 2 }} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        )}

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.nameLabel}>Item:</Text>
            <Text style={styles.itemName} numberOfLines={1}>{getFirstItem(item)}</Text>
            {getItemCount(item) > 1 && (
              <Text style={styles.moreItems}>+{getItemCount(item) - 1} more</Text>
            )}
          </View>
          {item.priority && (
            <View style={styles.nameRow}>
              <Text style={styles.nameLabel}>Priority:</Text>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Order Value</Text>
            <Text style={styles.amountValue}>
              ₹ {(item.finalAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.viewDetailBtn}>
            {isLoadingThis ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                <Ionicons name="eye-outline" size={14} color="#2563EB" />
                <Text style={styles.viewDetailText}>View Details</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#EF4444';
      case 'high':   return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low':    return '#10B981';
      default:       return '#6B7280';
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pending Orders</Text>
        <Text style={styles.subtitle}>Track and manage all pending orders</Text>
      </View>

      {/* Summary strip */}
      {!loading && orders.length > 0 && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{stats.total || orders.length}</Text>
            <Text style={styles.summaryLab}>Total Orders</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryDivider]}>
            <Text style={styles.summaryVal}>
              ₹{stats.totalValue.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summaryLab}>Total Value</Text>
          </View>
        </View>
      )}

      {/* Sales / Purchase tab */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
          onPress={() => { setActiveTab('sales'); setFilterStatus('all'); }}
        >
          <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>SALES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchase' && styles.activeTab]}
          onPress={() => { setActiveTab('purchase'); setFilterStatus('all'); }}
        >
          <Text style={[styles.tabText, activeTab === 'purchase' && styles.activeTabText]}>PURCHASE</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search by order ID, party, or item..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filters */}
      <View style={styles.filterContainer}>
        {FILTER_PILLS.map(({ key, label, color }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterPill, filterStatus === key && styles.filterPillActive]}
            onPress={() => setFilterStatus(key)}
          >
            {color && <View style={[styles.filterDot, { backgroundColor: color }]} />}
            <Text style={[styles.filterPillText, filterStatus === key && styles.filterPillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hierarchy legend */}
      <View style={styles.legendRow}>
        <Ionicons name="git-branch-outline" size={13} color="#9CA3AF" />
        <Text style={styles.legendText}>
          {activeTab === 'sales'
            ? 'Creator → Dealer  (sorted by order date)'
            : 'Dealer → Handler  (sorted by order date)'}
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                No {activeTab === 'sales' ? 'sales' : 'purchase'} orders found
              </Text>
              <Text style={styles.emptySubText}>Pull down to refresh</Text>
            </View>
          }
        />
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={showDetails}
        order={selectedOrder}
        onClose={() => {
          setShowDetails(false);
          setSelectedOrder(null);
        }}
        canUpdateStatus={false}
      />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    padding: 20, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  title:    { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  summaryStrip: {
    flexDirection: 'row', backgroundColor: '#2563EB',
    marginHorizontal: 20, marginTop: 14, borderRadius: 14, paddingVertical: 14,
  },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' },
  summaryVal:     { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  summaryLab:     { color: '#BFDBFE', fontSize: 10, marginTop: 2, fontWeight: '600' },

  tabContainer: {
    flexDirection: 'row', backgroundColor: '#E5E7EB',
    marginHorizontal: 20, marginTop: 14, marginBottom: 10,
    borderRadius: 10, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: {
    backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  tabText:       { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  activeTabText: { color: '#2563EB' },

  searchSection: { paddingHorizontal: 20, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 14, borderRadius: 12, height: 48,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },

  filterContainer: {
    flexDirection: 'row', paddingHorizontal: 20,
    paddingBottom: 8, gap: 8, flexWrap: 'wrap',
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F3F4F6', gap: 6,
  },
  filterPillActive:     { backgroundColor: '#2563EB' },
  filterPillText:       { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterPillTextActive: { color: '#fff' },
  filterDot:            { width: 8, height: 8, borderRadius: 4 },

  legendRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 8, gap: 4,
  },
  legendText: { fontSize: 11, color: '#9CA3AF' },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },

  // Order card
  orderCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderIdText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  dateText:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText:  { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

  // Hierarchy chain
  hierarchyRow: {
    flexDirection: 'row', alignItems: 'center',
    flexWrap: 'wrap', marginBottom: 10, gap: 4,
  },
  hierarchyNode: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    maxWidth: 140,
  },
  hierarchyRole: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  hierarchyName: { fontSize: 12, fontWeight: '600', marginTop: 1 },

  // Card body
  cardBody: { marginBottom: 4 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  nameLabel:    { fontSize: 11, color: '#9CA3AF', fontWeight: '600', minWidth: 42 },
  itemName:     { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },
  moreItems:    { fontSize: 10, color: '#6B7280', marginLeft: 4 },
  priorityText: { fontSize: 12, fontWeight: '700' },

  // Footer
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  amountLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  amountValue: { fontSize: 15, fontWeight: '800', color: '#111827' },
  viewDetailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE',
  },
  viewDetailText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },

  // Empty state
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText:      { color: '#6B7280', marginTop: 12, fontSize: 16, fontWeight: '600' },
  emptySubText:   { color: '#9CA3AF', marginTop: 6, fontSize: 13 },
});

export default PendingOrdersScreen;
