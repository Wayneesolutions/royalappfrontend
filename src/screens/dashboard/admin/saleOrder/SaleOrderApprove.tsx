import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthContext';

const SaleOrderApprove = ({ navigation, route }: any) => {
  const orderId = route?.params?.orderId;
  const { getOrderById, bulkApproveRejectOrders } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (orderId) fetchOrder();
    else setLoading(false);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await getOrderById(orderId);
      if (res?.success && res?.order) setOrder(res.order);
      else Alert.alert('Error', 'Failed to load order details');
    } catch (e) {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approved' | 'rejected') => {
    if (!orderId) return;
    Alert.alert(
      action === 'approved' ? 'Approve Order' : 'Reject Order',
      `Are you sure you want to ${action === 'approved' ? 'approve' : 'reject'} this order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approved' ? 'Approve' : 'Reject',
          style: action === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setProcessing(true);
              const res = await bulkApproveRejectOrders([orderId], action, notes || undefined);
              if (res?.success) {
                Alert.alert('Success', `Order ${action} successfully`, [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', res?.message || `Failed to ${action} order`);
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || `Failed to ${action} order`);
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatAmount = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'approved': return '#10B981';
      case 'pending_approval': return '#F59E0B';
      case 'draft': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Loading order...</Text>
    </View>
  );

  if (!orderId) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>No order ID provided</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (!order) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Order not found</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const canApprove = order.status === 'pending_approval' || order.status === 'draft';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Approval</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Order number & status */}
        <View style={styles.card}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status?.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.meta}>Date: {formatDate(order.orderDate)}</Text>
          <Text style={styles.meta}>Customer: {order.customerName || '—'}</Text>
          {order.dealerName && <Text style={styles.meta}>Dealer: {order.dealerName}</Text>}
          {order.createdBy?.name && <Text style={styles.meta}>Created by: {order.createdBy.name} ({order.createdBy.role})</Text>}
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Value</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{formatAmount(order.finalAmount)}</Text>
          </View>
          {order.taxAmount > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Tax</Text>
              <Text style={styles.amountValue}>{formatAmount(order.taxAmount)}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        {order.items?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
            {order.items.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.productName || item.productCode}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity} × {formatAmount(item.unitPrice)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Approval History */}
        {order.approvalHistory?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Approval History</Text>
            {order.approvalHistory.map((h: any, i: number) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyAction}>{h.action?.toUpperCase()}</Text>
                <Text style={styles.historyMeta}>{h.approverName} · {formatDate(h.timestamp)}</Text>
                {h.notes ? <Text style={styles.historyNotes}>{h.notes}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Notes input */}
        {canApprove && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes for approval/rejection..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {canApprove && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleAction('rejected')}
            disabled={processing}
          >
            {processing ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleAction('approved')}
            disabled={processing}
          >
            {processing ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!canApprove && (
        <View style={styles.actionBar}>
          <Text style={styles.alreadyProcessed}>
            Order already {order.status?.replace(/_/g, ' ')} — cannot approve/reject
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 16, marginBottom: 16 },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  orderNumber: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  meta: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 10 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  amountLabel: { fontSize: 14, color: '#6B7280' },
  amountValue: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  itemRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemName: { fontSize: 13, fontWeight: '500', color: '#1F2937' },
  itemQty: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  historyRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyAction: { fontSize: 12, fontWeight: 'bold', color: '#3B82F6' },
  historyMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  historyNotes: { fontSize: 12, color: '#4B5563', marginTop: 2, fontStyle: 'italic' },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  alreadyProcessed: { flex: 1, textAlign: 'center', color: '#6B7280', fontSize: 14 },
  backBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default SaleOrderApprove;
