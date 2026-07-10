import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import apiService from '../../../services/api';

type DispatchStatus = 'all' | 'pending' | 'fully_dispatched';

interface DispatchItem {
  _id: string;
  orderguid: string;
  orderNumber: string;
  orderDate: string;
  partyName: string;
  totalAmount: number;
  dispatchStatus: string;
  items: Array<{ itemName: string; orderedQty: number; dispatchedQty: number; pendingQty: number }>;
  tallySyncAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending:          '#F59E0B',
  fully_dispatched: '#10B981',
};

const STATUS_LABEL: Record<string, string> = {
  pending:          'Pending',
  fully_dispatched: 'Fully Dispatched',
};

const FILTERS: { key: DispatchStatus; label: string }[] = [
  { key: 'all',              label: 'All' },
  { key: 'pending',          label: 'Pending' },
  { key: 'fully_dispatched', label: 'Fully Dispatched' },
];

const PendingOrdersManagementScreen = () => {
  const authUser = useSelector((state: any) => state.auth.user);
  const cmpcode = authUser?.defaultCompany?.companyCode || '';

  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [filter, setFilter] = useState<DispatchStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchDispatches(true);
  }, [filter, cmpcode]);

  useEffect(() => {
    const t = setTimeout(() => fetchDispatches(true), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchDispatches = async (reset = false) => {
    if (!cmpcode) return;
    try {
      if (reset) setLoading(true);
      const currentPage = reset ? 1 : page;

      const result = await apiService.getTallyDispatchAdmin({
        cmpcode,
        dispatchStatus: filter === 'all' ? undefined : filter,
        page: currentPage,
        limit: 50,
      });

      const list: DispatchItem[] = result?.success ? (result.data?.dispatches || []) : [];

      // Client-side search filter
      const filtered = searchQuery.trim()
        ? list.filter(d =>
            d.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : list;

      if (reset) {
        setDispatches(filtered);
        setPage(2);
      } else {
        setDispatches(prev => [...prev, ...filtered]);
        setPage(p => p + 1);
      }
      setHasMore(list.length === 50);
    } catch {
      if (reset) setDispatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDispatches(true);
  };

  const totalAmount = dispatches.reduce((s, d) => s + (d.totalAmount || 0), 0);
  const pendingCount = dispatches.filter(d => d.dispatchStatus === 'pending').length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: '2-digit',
    });
  };

  const renderCard = ({ item }: { item: DispatchItem }) => {
    const color = STATUS_COLOR[item.dispatchStatus] || '#6B7280';
    const label = STATUS_LABEL[item.dispatchStatus] || item.dispatchStatus;
    const firstItem = item.items?.[0];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumber}>
              #{item.orderNumber || item.orderguid?.slice(-8).toUpperCase() || '—'}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.orderDate || item.tallySyncAt)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Ionicons name="person-outline" size={13} color="#6B7280" />
          <Text style={styles.partyName} numberOfLines={1}>{item.partyName || '—'}</Text>
        </View>

        {firstItem && (
          <View style={styles.row}>
            <Ionicons name="cube-outline" size={13} color="#6B7280" />
            <Text style={styles.itemText} numberOfLines={1}>
              {firstItem.itemName}
              {item.items.length > 1 ? ` +${item.items.length - 1} more` : ''}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amtLabel}>Order Value</Text>
            <Text style={styles.amtValue}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.itemsCountBox}>
            <Text style={styles.itemsCount}>{item.items?.length || 0} item{item.items?.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#077BC3" />
        <Text style={styles.loadingText}>Loading dispatch orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Orders</Text>
        <Text style={styles.headerSubtitle}>
          {dispatches.length} orders · ₹{totalAmount.toLocaleString('en-IN')} total
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryVal}>{dispatches.length}</Text>
          <Text style={styles.summaryLab}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={styles.summaryLab}>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryVal, { color: '#10B981' }]}>{dispatches.length - pendingCount}</Text>
          <Text style={styles.summaryLab}>Dispatched</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by party or order number..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={dispatches}
        keyExtractor={item => item._id || item.orderguid}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => hasMore && !loading && fetchDispatches(false)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>No dispatch orders found</Text>
            <Text style={styles.emptySubText}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F9FAFB' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },

  header: {
    backgroundColor: '#fff', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle:    { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  summaryRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12,
  },
  summaryCard: {
    flex: 1, backgroundColor: '#F9FAFB',
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  summaryVal: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  summaryLab: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  filterRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F3F4F6',
  },
  filterPillActive: { backgroundColor: '#077BC3' },
  filterText:       { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 10,
    paddingHorizontal: 12, height: 44,
    borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },

  list: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    elevation: 2,
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumber: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  dateText:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  partyName: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },
  itemText:  { fontSize: 12, color: '#6B7280', flex: 1 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  amtLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  amtValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  itemsCountBox: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
  },
  itemsCount: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

  empty:        { alignItems: 'center', marginTop: 80 },
  emptyText:    { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#9CA3AF', marginTop: 6 },
});

export default PendingOrdersManagementScreen;
