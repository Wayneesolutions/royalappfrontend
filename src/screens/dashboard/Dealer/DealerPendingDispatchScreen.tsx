import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', icon: 'time-outline' },
  fully_dispatched: { label: 'Dispatched', color: '#10B981', bg: '#F0FDF4', icon: 'checkmark-circle-outline' },
};

const DealerPendingDispatchScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchDispatch();
  }, []);

  const fetchDispatch = async () => {
    try {
      setLoading(true);
      const cmpcode = user?.defaultCompany?.companyCode;
      if (!cmpcode) return;

      const result = await apiService.getTallyDispatchAdmin({ cmpcode, limit: 200 });
      if (result?.success && result?.data) {
        const allOrders: any[] = result.data?.dispatches || [];
        const myName = (user?.name || '').toLowerCase().trim();
        const myOrders = myName
          ? allOrders.filter((o: any) =>
              (o.partyName || '').toLowerCase().trim() === myName
            )
          : allOrders;
        setOrders(myOrders);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDispatch();
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter && o.dispatchStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.partyName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter(o => o.dispatchStatus === 'pending').length;
  const dispatchedCount = orders.filter(o => o.dispatchStatus === 'fully_dispatched').length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const id = item._id || item.orderguid || String(Math.random());
    const isExpanded = expandedOrder === id;
    const statusInfo = STATUS_LABELS[item.dispatchStatus] || STATUS_LABELS.pending;
    const items: any[] = item.items || [];

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => setExpandedOrder(isExpanded ? null : id)}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon} size={18} color={statusInfo.color} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              {item.orderNumber ? `Order #${item.orderNumber}` : 'Order'}
            </Text>
            <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderAmount}>
              ₹{(item.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9CA3AF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        {isExpanded && items.length > 0 && (
          <View style={styles.itemsWrap}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsHeaderText}>Items ({items.length})</Text>
            </View>
            {items.map((item: any, idx: number) => {
              const pendingQty = parseFloat(item.pendingQty) || 0;
              return (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.itemName || 'Item'}</Text>
                    {item.hsnCode ? (
                      <Text style={styles.itemHsn}>HSN: {item.hsnCode}</Text>
                    ) : null}
                  </View>
                  <View style={styles.itemQtyWrap}>
                    <View style={styles.itemQtyCol}>
                      <Text style={styles.itemQtyVal}>{item.orderedQty || 0}</Text>
                      <Text style={styles.itemQtyLabel}>{item.unit || 'Ordered'}</Text>
                    </View>
                    <View style={styles.itemQtyCol}>
                      <Text style={[styles.itemQtyVal, { color: '#10B981' }]}>
                        {item.dispatchedQty || 0}
                      </Text>
                      <Text style={styles.itemQtyLabel}>Dispatched</Text>
                    </View>
                    <View style={styles.itemQtyCol}>
                      <Text style={[styles.itemQtyVal, { color: pendingQty > 0 ? '#EF4444' : '#10B981' }]}>
                        {pendingQty}
                      </Text>
                      <Text style={styles.itemQtyLabel}>Pending</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Dispatch Status</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={[styles.summaryItem, { borderRightWidth: 1, borderRightColor: '#E5E7EB' }]}>
          <Text style={styles.summaryLabel}>Total Orders</Text>
          <Text style={styles.summaryValue}>{orders.length}</Text>
        </View>
        <TouchableOpacity
          style={[styles.summaryItem, { borderRightWidth: 1, borderRightColor: '#E5E7EB' }]}
          onPress={() => setStatusFilter(statusFilter === 'pending' ? null : 'pending')}
        >
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: '#D97706' }]}>{pendingCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.summaryItem}
          onPress={() => setStatusFilter(statusFilter === 'fully_dispatched' ? null : 'fully_dispatched')}
        >
          <Text style={styles.summaryLabel}>Dispatched</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{dispatchedCount}</Text>
        </TouchableOpacity>
      </View>

      {statusFilter && (
        <TouchableOpacity style={styles.filterBanner} onPress={() => setStatusFilter(null)}>
          <Text style={styles.filterBannerText}>
            Showing: {STATUS_LABELS[statusFilter]?.label}
          </Text>
          <Ionicons name="close-circle" size={16} color="#3B82F6" />
        </TouchableOpacity>
      )}

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order number..."
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

      {loading && !refreshing ? (
        <View style={styles.centerLoad}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading dispatch status...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cube-outline" size={56} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>
            {searchQuery || statusFilter ? 'No matching orders' : 'No dispatch records'}
          </Text>
          <Text style={styles.emptySub}>
            {searchQuery || statusFilter
              ? 'Try clearing the filter'
              : 'Your order dispatch status will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  refreshBtn: {
    padding: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterBannerText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statusDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderRight: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemsWrap: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  itemsHeader: {
    marginBottom: 8,
  },
  itemsHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  itemHsn: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  itemQtyWrap: {
    flexDirection: 'row',
    gap: 12,
  },
  itemQtyCol: {
    alignItems: 'center',
    minWidth: 52,
  },
  itemQtyVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemQtyLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  centerLoad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default DealerPendingDispatchScreen;
