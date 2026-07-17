import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  fully_dispatched: '#10B981',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'PENDING',
  fully_dispatched: 'FULLY DISPATCHED',
};

const PendingOrderDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const order = route.params?.order;

  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[order.dispatchStatus] || '#6B7280';
  const statusLabel = STATUS_LABEL[order.dispatchStatus] || (order.dispatchStatus || '').toUpperCase();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: '2-digit',
    });
  };

  const items: any[] = order.items || [];
  const totalOrdered = items.reduce((s: number, i: any) => s + (i.orderedQty || 0), 0);
  const totalDispatched = items.reduce((s: number, i: any) => s + (i.dispatchedQty || 0), 0);
  const totalPending = items.reduce((s: number, i: any) => s + (i.pendingQty || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            #{order.orderNumber || order.orderguid?.slice(-8).toUpperCase() || '—'}
          </Text>
          <Text style={styles.headerSub}>{formatDate(order.orderDate)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Party */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Party</Text>
          <View style={styles.row}>
            <Ionicons name="person-circle-outline" size={18} color="#077BC3" />
            <Text style={styles.rowText}>{order.partyName || '—'}</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{totalOrdered}</Text>
              <Text style={styles.summaryLab}>Ordered</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: '#10B981' }]}>{totalDispatched}</Text>
              <Text style={styles.summaryLab}>Dispatched</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>{totalPending}</Text>
              <Text style={styles.summaryLab}>Pending</Text>
            </View>
          </View>
          <View style={styles.amtRow}>
            <Text style={styles.amtLabel}>Order Value</Text>
            <Text style={styles.amtValue}>₹{(order.totalAmount || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>
          {items.map((item: any, idx: number) => (
            <View key={idx} style={[styles.itemRow, idx < items.length - 1 && styles.itemBorder]}>
              {/* Item name + unit/rate */}
              <View style={styles.itemHeader}>
                <View style={[styles.itemIndex, { backgroundColor: '#077BC3' }]}>
                  <Text style={styles.itemIndexText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.itemName || '—'}</Text>
                  <Text style={styles.itemMeta}>
                    {item.unit ? `${item.unit}` : ''}
                    {item.rate ? ` · ₹${item.rate}/unit` : ''}
                    {item.hsnCode && item.hsnCode !== '--' ? ` · HSN: ${item.hsnCode}` : ''}
                  </Text>
                </View>
                {item.amount != null && (
                  <Text style={styles.itemAmt}>₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
                )}
              </View>

              {/* Qty grid */}
              <View style={styles.qtyGrid}>
                <View style={styles.qtyItem}>
                  <Text style={styles.qtyVal}>{item.orderedQty ?? '—'}</Text>
                  <Text style={styles.qtyLab}>Ordered</Text>
                </View>
                <View style={styles.qtyDivider} />
                <View style={styles.qtyItem}>
                  <Text style={[styles.qtyVal, { color: '#10B981' }]}>{item.dispatchedQty ?? '—'}</Text>
                  <Text style={styles.qtyLab}>Dispatched</Text>
                </View>
                <View style={styles.qtyDivider} />
                <View style={styles.qtyItem}>
                  <Text style={[styles.qtyVal, { color: '#F59E0B' }]}>{item.pendingQty ?? '—'}</Text>
                  <Text style={styles.qtyLab}>Pending</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Reference */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reference</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Order ID</Text>
            <Text style={styles.metaVal}>{order.orderguid || '—'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Last Synced</Text>
            <Text style={styles.metaVal}>{formatDate(order.tallySyncAt)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { color: '#6B7280', fontSize: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  scroll: { padding: 16, paddingBottom: 48 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 15, fontWeight: '600', color: '#374151', flex: 1 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 38, backgroundColor: '#E5E7EB' },
  summaryVal: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  summaryLab: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },

  amtRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  amtLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  amtValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

  itemRow: { paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  itemIndex: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  itemIndexText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  itemMeta: { fontSize: 12, color: '#9CA3AF' },
  itemAmt: { fontSize: 14, fontWeight: '700', color: '#374151' },

  qtyGrid: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12,
  },
  qtyItem: { flex: 1, alignItems: 'center' },
  qtyDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },
  qtyVal: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  qtyLab: { fontSize: 10, color: '#9CA3AF', marginTop: 3, fontWeight: '600' },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  metaLabel: { fontSize: 13, color: '#9CA3AF' },
  metaVal: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1, textAlign: 'right', marginLeft: 12 },
});

export default PendingOrderDetailScreen;
