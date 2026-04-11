import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../../services/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#3B82F6',
  approved: '#10B981',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  approved: 'Approved',
  shipped: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const PendingOrdersScreen = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalValue: 0 });

  useEffect(() => {
    fetchOrders(true);
  }, [activeTab, filterStatus]);

  const fetchOrders = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      const currentPage = reset ? 1 : page;

      const params: any = {
        page: currentPage,
        limit: 20,
        orderType: activeTab === 'sales' ? 'sale' : 'purchase',
      };

      // Status filter
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      } else {
        // For "all" tab show non-delivered/non-cancelled
        params.status = 'pending,confirmed,processing,approved,shipped';
      }

      if (searchQuery) params.search = searchQuery;

      const result = await apiService.getOrders(params);
      if (result?.success && result?.data) {
        const newOrders = result.data?.orders || result.data?.data || result.data || [];
        const total = result.data?.total || result.data?.pagination?.total || newOrders.length;

        if (reset) {
          setOrders(Array.isArray(newOrders) ? newOrders : []);
          setPage(2);
        } else {
          setOrders(prev => [...prev, ...(Array.isArray(newOrders) ? newOrders : [])]);
          setPage(p => p + 1);
        }
        setHasMore(newOrders.length === 20);

        // Compute stats
        const totalValue = (Array.isArray(newOrders) ? newOrders : [])
          .reduce((s: number, o: any) => s + (o.totalAmount || o.amount || o.total || 0), 0);
        setStats({ total, totalValue });
      } else {
        if (reset) setOrders([]);
      }
    } catch (e) {
      if (reset) setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const onSearch = (q: string) => {
    setSearchQuery(q);
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchOrders(true), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Helpers
  const getOrderId = (o: any) => o.orderNo || o.orderId || o._id?.slice(-6).toUpperCase() || '—';
  const getPartyName = (o: any) => o.customerName || o.partyName || o.ledgerName || o.customer?.name || '—';
  const getItemName = (o: any) => {
    if (o.items?.length > 0) return o.items[0].productName || o.items[0].name || 'Multiple items';
    return o.productName || o.itemName || '—';
  };
  const getQty = (o: any) => {
    if (o.items?.length > 0) return o.items.reduce((s: number, i: any) => s + (i.quantity || i.qty || 0), 0);
    return o.quantity || o.qty || 0;
  };
  const getAmount = (o: any) => o.totalAmount || o.amount || o.total || 0;
  const getStatus = (o: any) => (o.status || 'pending').toLowerCase();
  const getDate = (o: any) => {
    const d = o.orderDate || o.date || o.createdAt;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };
  const getCreatedBy = (o: any) => o.createdBy?.name || o.userName || o.salesman?.name || '';

  const filteredOrders = orders; // Already filtered by API

  const renderOrderCard = ({ item }: any) => {
    const status = getStatus(item);
    const color = STATUS_COLORS[status] || '#6B7280';
    const label = STATUS_LABELS[status] || status;
    const amount = getAmount(item);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderIdText}>#{getOrderId(item)}</Text>
            <Text style={styles.dateText}>{getDate(item)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.statusText, { color }]}>{label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderCardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.nameLabel}>Party:</Text>
            <Text style={styles.partyName} numberOfLines={1}>{getPartyName(item)}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.nameLabel}>Item:</Text>
            <Text style={styles.itemName} numberOfLines={1}>{getItemName(item)}</Text>
          </View>
          {getCreatedBy(item) ? (
            <View style={styles.nameRow}>
              <Text style={styles.nameLabel}>By:</Text>
              <Text style={styles.itemName} numberOfLines={1}>{getCreatedBy(item)}</Text>
            </View>
          ) : null}
          <View style={styles.qtyRow}>
            <Ionicons name="cube-outline" size={14} color="#6B7280" />
            <Text style={styles.qtyText}>{getQty(item)} units</Text>
          </View>
        </View>

        <View style={styles.orderCardFooter}>
          <Text style={styles.amountLabel}>Order Value</Text>
          <Text style={styles.amountValue}>₹ {amount.toLocaleString('en-IN')}</Text>
        </View>
      </View>
    );
  };

  const FILTER_PILLS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending', color: '#F59E0B' },
    { key: 'processing', label: 'Processing', color: '#3B82F6' },
    { key: 'approved', label: 'Approved', color: '#10B981' },
    { key: 'shipped', label: 'Shipped', color: '#8B5CF6' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pending Orders</Text>
        <Text style={styles.subtitle}>Track and manage all pending orders</Text>
      </View>

      {/* Summary Strip */}
      {!loading && orders.length > 0 && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{stats.total || orders.length}</Text>
            <Text style={styles.summaryLab}>Total Orders</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryDivider]}>
            <Text style={styles.summaryVal}>₹{stats.totalValue.toLocaleString('en-IN')}</Text>
            <Text style={styles.summaryLab}>Total Value</Text>
          </View>
        </View>
      )}

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
          onPress={() => { setActiveTab('sales'); setOrders([]); }}
        >
          <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>SALES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchase' && styles.activeTab]}
          onPress={() => { setActiveTab('purchase'); setOrders([]); }}
        >
          <Text style={[styles.tabText, activeTab === 'purchase' && styles.activeTabText]}>PURCHASE</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search by order ID, party, or item..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearch}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchOrders(true); }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        {FILTER_PILLS.map(({ key, label, color }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterPill, filterStatus === key && styles.filterPillActive]}
            onPress={() => setFilterStatus(key)}
          >
            {color && <View style={[styles.filterDot, { backgroundColor: color }]} />}
            <Text style={[styles.filterPillText, filterStatus === key && styles.filterPillTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, i) => item._id || item.id || String(i)}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={() => hasMore && fetchOrders(false)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>No {filterStatus === 'all' ? '' : filterStatus} orders found</Text>
              <Text style={styles.emptySubText}>Pull down to refresh</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  summaryStrip: { flexDirection: 'row', backgroundColor: '#2563EB', marginHorizontal: 20, marginTop: 14, borderRadius: 14, paddingVertical: 14 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' },
  summaryVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  summaryLab: { color: '#BFDBFE', fontSize: 10, marginTop: 2, fontWeight: '600' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', marginHorizontal: 20, marginTop: 14, marginBottom: 10, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  activeTabText: { color: '#2563EB' },

  searchSection: { paddingHorizontal: 20, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, borderRadius: 12, height: 48, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },

  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, gap: 8, flexWrap: 'wrap' },
  filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', gap: 6 },
  filterPillActive: { backgroundColor: '#2563EB' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterPillTextActive: { color: '#fff' },
  filterDot: { width: 8, height: 8, borderRadius: 4 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },

  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderIdText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  dateText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  orderCardBody: { marginBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  nameLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', minWidth: 42 },
  partyName: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  qtyText: { fontSize: 11, color: '#6B7280', marginLeft: 4 },
  orderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F9FAFB' },
  amountLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  amountValue: { fontSize: 15, fontWeight: '800', color: '#111827' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#6B7280', marginTop: 12, fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#9CA3AF', marginTop: 6, fontSize: 13 },
});

export default PendingOrdersScreen;
