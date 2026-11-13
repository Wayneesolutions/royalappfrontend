import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  status: string;
  finalAmount: number;
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  createdBy: {
    _id: string;
    name: string;
    role: string;
    email: string;
  };
  nextApprover: {
    _id: string;
    name: string;
    role: string;
  };
  approvalHistory: Array<{
    approverName: string;
    approverRole: string;
    action: string;
    notes: string;
    timestamp: string;
  }>;
}

const PendingApprovalsScreen = () => {
  const { getPendingApprovals, approveRejectOrder, bulkApproveRejectOrders } = useAuth();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [action, setAction] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNotes, setBulkNotes] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approved' | 'rejected'>('approved');

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await getPendingApprovals({ page: 1, limit: 50 });
      if (response?.success) {
        setOrders(response.orders || []);
      } else {
        Alert.alert('Error', 'Failed to fetch pending approvals');
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      Alert.alert('Error', 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingApprovals();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // ── Single order approve/reject ──────────────────────────────────────────
  const handleApproveReject = async () => {
    if (!selectedOrder) return;
    try {
      setProcessing(true);
      const response = await approveRejectOrder(selectedOrder._id, action, notes);
      if (response?.success) {
        Alert.alert('Success', `Order ${action} successfully`, [
          { text: 'OK', onPress: () => { setShowActionModal(false); setSelectedOrder(null); setNotes(''); fetchPendingApprovals(); } }
        ]);
      } else {
        Alert.alert('Error', `Failed to ${action} order`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} order`);
    } finally {
      setProcessing(false);
    }
  };

  // ── Multi-select helpers ─────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(orders.map(o => o._id)));
  const clearAll = () => setSelectedIds(new Set());

  const openBulkModal = (act: 'approved' | 'rejected') => {
    if (selectedIds.size === 0) {
      Alert.alert('No orders selected', 'Tap the checkbox on orders you want to select.');
      return;
    }
    setBulkAction(act);
    setBulkNotes('');
    setShowBulkModal(true);
  };

  const handleBulkAction = async () => {
    try {
      setProcessing(true);
      const response = await bulkApproveRejectOrders([...selectedIds], bulkAction, bulkNotes || undefined);
      if (response?.success) {
        Alert.alert('Success', response.message || `${selectedIds.size} orders processed`);
        setSelectedIds(new Set());
        setShowBulkModal(false);
        setBulkNotes('');
        fetchPendingApprovals();
      } else {
        Alert.alert('Error', response?.message || `Failed to process orders`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process orders');
    } finally {
      setProcessing(false);
    }
  };

  // ── Colour helpers ───────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'partial': return '#F59E0B';
      case 'pending': return '#EF4444';
      case 'refunded': return '#6B7280';
      default: return '#6B7280';
    }
  };

  // ── Order card ───────────────────────────────────────────────────────────
  const renderOrderItem = ({ item }: { item: Order }) => {
    const isSelected = selectedIds.has(item._id);
    return (
      <TouchableOpacity
        style={[styles.orderCard, isSelected && styles.orderCardSelected]}
        onPress={() => {
          if (selectedIds.size > 0) {
            toggleSelect(item._id);
          } else {
            setSelectedOrder(item);
            setShowActionModal(true);
          }
        }}
        onLongPress={() => toggleSelect(item._id)}
      >
        {/* Checkbox */}
        <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelect(item._id)}>
          <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <Text style={styles.customerName}>{item.customerName}</Text>
            </View>
            <View style={styles.orderAmount}>
              <Text style={styles.amountText}>₹{item.finalAmount.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created by:</Text>
              <Text style={styles.detailValue}>{item.createdBy?.name} ({item.createdBy?.role})</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Items:</Text>
              <Text style={styles.detailValue}>{item.items?.length || 0} products</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{new Date(item.orderDate).toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
              {item.priority && (
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>

          {item.nextApprover?.name && (
            <View style={styles.approvalInfo}>
              <Text style={styles.approvalLabel}>Next Approver: </Text>
              <Text style={styles.approvalValue}>{item.nextApprover.name} ({item.nextApprover.role})</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => { setSelectedOrder(item); setAction('approved'); setShowActionModal(true); }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => { setSelectedOrder(item); setAction('rejected'); setShowActionModal(true); }}
            >
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-done-circle-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyStateTitle}>No Pending Approvals</Text>
      <Text style={styles.emptyStateText}>All orders have been processed.</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading pending approvals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bulk selection bar */}
      {orders.length > 0 && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={selectedIds.size === orders.length ? clearAll : selectAll}>
            <Text style={styles.selectAllText}>
              {selectedIds.size === orders.length ? 'Clear All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${orders.length} orders`}
          </Text>
          <View style={styles.bulkButtons}>
            <TouchableOpacity
              style={[styles.bulkBtn, styles.bulkApproveBtn, selectedIds.size === 0 && styles.bulkBtnDisabled]}
              onPress={() => openBulkModal('approved')}
            >
              <Ionicons name="checkmark-circle" size={14} color="#fff" />
              <Text style={styles.bulkBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkBtn, styles.bulkRejectBtn, selectedIds.size === 0 && styles.bulkBtnDisabled]}
              onPress={() => openBulkModal('rejected')}
            >
              <Ionicons name="close-circle" size={14} color="#fff" />
              <Text style={styles.bulkBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Single order action modal */}
      <Modal visible={showActionModal} transparent animationType="slide" onRequestClose={() => setShowActionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {action === 'approved' ? 'Approve Order' : 'Reject Order'}
            </Text>
            {selectedOrder && (
              <View style={styles.orderSummary}>
                <Text style={styles.orderSummaryTitle}>Order Details:</Text>
                <Text style={styles.orderSummaryText}>Order: {selectedOrder.orderNumber}</Text>
                <Text style={styles.orderSummaryText}>Customer: {selectedOrder.customerName}</Text>
                <Text style={styles.orderSummaryText}>Amount: ₹{selectedOrder.finalAmount.toLocaleString()}</Text>
                <Text style={styles.orderSummaryText}>Created by: {selectedOrder.createdBy?.name}</Text>
              </View>
            )}
            <TextInput
              style={styles.notesInput}
              placeholder={`Add ${action === 'approved' ? 'approval' : 'rejection'} notes (optional)`}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setShowActionModal(false); setSelectedOrder(null); setNotes(''); }}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, action === 'approved' ? styles.confirmApproveButton : styles.confirmRejectButton]}
                onPress={handleApproveReject}
                disabled={processing}
              >
                {processing ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={styles.confirmButtonText}>{action === 'approved' ? 'Approve' : 'Reject'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk action modal */}
      <Modal visible={showBulkModal} transparent animationType="slide" onRequestClose={() => setShowBulkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {bulkAction === 'approved' ? `Approve ${selectedIds.size} Orders` : `Reject ${selectedIds.size} Orders`}
            </Text>
            <Text style={styles.bulkModalSubtitle}>
              {bulkAction === 'approved'
                ? `All ${selectedIds.size} selected order(s) will be marked as approved.`
                : `All ${selectedIds.size} selected order(s) will be cancelled.`}
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes (optional)"
              value={bulkNotes}
              onChangeText={setBulkNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setShowBulkModal(false); setBulkNotes(''); }}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, bulkAction === 'approved' ? styles.confirmApproveButton : styles.confirmRejectButton]}
                onPress={handleBulkAction}
                disabled={processing}
              >
                {processing ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={styles.confirmButtonText}>
                    {bulkAction === 'approved' ? 'Approve All' : 'Reject All'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, backgroundColor: '#3B82F6',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  // Selection bar
  selectionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#EFF6FF', borderBottomWidth: 1, borderBottomColor: '#BFDBFE',
  },
  selectAllText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  selectedCount: { fontSize: 13, color: '#1F2937', fontWeight: '500' },
  bulkButtons: { flexDirection: 'row', gap: 8 },
  bulkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
  },
  bulkApproveBtn: { backgroundColor: '#10B981' },
  bulkRejectBtn: { backgroundColor: '#EF4444' },
  bulkBtnDisabled: { opacity: 0.4 },
  bulkBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  listContainer: { padding: 16 },
  orderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 16,
    flexDirection: 'row', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  orderCardSelected: {
    borderWidth: 2, borderColor: '#3B82F6', backgroundColor: '#EFF6FF',
  },
  checkbox: { paddingRight: 10, paddingTop: 2 },
  checkboxBox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  checkboxBoxSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },

  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderInfo: { flex: 1 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  customerName: { fontSize: 14, color: '#6B7280' },
  orderAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
  orderDetails: { marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 12, color: '#1F2937', flex: 1, textAlign: 'right' },
  statusRow: { marginBottom: 10 },
  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  approvalInfo: {
    backgroundColor: '#F3F4F6', padding: 8, borderRadius: 8, marginBottom: 10,
    flexDirection: 'row',
  },
  approvalLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  approvalValue: { fontSize: 12, color: '#1F2937', fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  approveButton: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#10B981' },
  approveButtonText: { color: '#10B981', fontWeight: '600', fontSize: 13 },
  rejectButton: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' },
  rejectButtonText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 8, textAlign: 'center' },
  bulkModalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16, textAlign: 'center' },
  orderSummary: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 16 },
  orderSummaryTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  orderSummaryText: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  notesInput: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#1F2937', marginBottom: 20, textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  cancelButtonText: { color: '#6B7280', fontWeight: '600' },
  confirmApproveButton: { backgroundColor: '#10B981' },
  confirmRejectButton: { backgroundColor: '#EF4444' },
  confirmButtonText: { color: '#FFFFFF', fontWeight: '600' },
});

export default PendingApprovalsScreen;
