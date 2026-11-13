import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { apiService } from '../../../services/api';

interface Voucher {
  _id: string;
  vchnumber: string;
  vchdate: string;
  vchtype: string;
  vchpartyname: string;
  vchamount: number;
  vchguid?: string;
  ledgerId?: { LedgerName?: string; LedgerMobile?: string; LedgerGSTIN?: string };
  companyId?: { companyName?: string };
}

type FilterType = 'Sales' | 'Purchase' | 'Receipt' | 'Payment' | 'Journal' | 'All';

const FILTER_TABS: { label: string; value: FilterType }[] = [
  { label: 'Sales', value: 'Sales' },
  { label: 'Purchase', value: 'Purchase' },
  { label: 'Receipt', value: 'Receipt' },
  { label: 'Payment', value: 'Payment' },
  { label: 'Journal', value: 'Journal' },
  { label: 'All', value: 'All' },
];

const SalesScreen = () => {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Sales');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const cmpcode = user?.defaultCompany?.companyCode;

  const fetchVouchers = useCallback(async (vchtype: FilterType, sd: string, ed: string) => {
    if (!cmpcode) {
      setLoading(false);
      setErrorMsg('Company code not configured');
      return;
    }
    setErrorMsg('');
    try {
      const params: Record<string, string> = { cmpcode };
      if (vchtype !== 'All') params.vchtype = vchtype;
      if (sd) params.startDate = sd;
      if (ed) params.endDate = ed;

      const result = await apiService.getTallyVoucherList(params);
      if (result?.success) {
        setVouchers((result as any).data || []);
      } else {
        setErrorMsg(result?.message || 'Failed to load vouchers');
        setVouchers([]);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Network error');
      setVouchers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cmpcode]);

  useEffect(() => {
    setLoading(true);
    fetchVouchers(activeFilter, appliedStartDate, appliedEndDate);
  }, [activeFilter, appliedStartDate, appliedEndDate, fetchVouchers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVouchers(activeFilter, appliedStartDate, appliedEndDate);
  };

  const handleApplyDateFilter = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setShowDateFilter(false);
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setShowDateFilter(false);
  };

  const filtered = vouchers.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.vchnumber || '').toLowerCase().includes(q) ||
      (v.vchpartyname || '').toLowerCase().includes(q) ||
      ((v.ledgerId as any)?.LedgerName || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (d: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const formatAmount = (n: number) => {
    try {
      return '₹' + Math.abs(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    } catch {
      return '₹' + Math.abs(n || 0).toFixed(2);
    }
  };

  const totalAmount = filtered.reduce((s, v) => s + Math.abs(v.vchamount || 0), 0);

  const getVchtypeColor = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'sales': return '#10B981';
      case 'purchase': return '#F59E0B';
      case 'receipt': return '#3B82F6';
      case 'payment': return '#EF4444';
      case 'journal': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const renderVoucher = ({ item }: { item: Voucher }) => {
    const partyName = item.vchpartyname || (item.ledgerId as any)?.LedgerName || '-';
    const color = getVchtypeColor(item.vchtype);
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={styles.voucherNo} numberOfLines={1}>{item.vchnumber || '-'}</Text>
            <Text style={styles.partyName} numberOfLines={1}>{partyName}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.amount}>{formatAmount(item.vchamount)}</Text>
            <Text style={styles.date}>{formatDate(item.vchdate)}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: color + '1A', borderColor: color + '44' }]}>
          <Text style={[styles.typeText, { color }]}>{item.vchtype || '-'}</Text>
        </View>
      </View>
    );
  };

  const hasDateFilter = !!(appliedStartDate || appliedEndDate);

  return (
    <View style={styles.container}>
      {/* Summary bar */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Invoices</Text>
          <Text style={styles.summaryValue}>{filtered.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>{formatAmount(totalAmount)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.dateBtn, hasDateFilter && styles.dateBtnActive]}
          onPress={() => setShowDateFilter(true)}
        >
          <Ionicons name="calendar-outline" size={16} color={hasDateFilter ? '#6C5CE7' : '#6B7280'} />
          <Text style={[styles.dateBtnText, hasDateFilter && { color: '#6C5CE7' }]}>
            {hasDateFilter ? 'Filtered' : 'Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          keyExtractor={t => t.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              style={[styles.tab, activeFilter === tab.value && styles.tabActive]}
              onPress={() => setActiveFilter(tab.value)}
            >
              <Text style={[styles.tabText, activeFilter === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoice or party..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Error */}
      {!!errorMsg && (
        <View style={styles.errorBar}>
          <Ionicons name="warning-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading vouchers...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id || item.vchguid || item.vchnumber}
          renderItem={renderVoucher}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C5CE7']} />
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Vouchers Found</Text>
              <Text style={styles.emptySubText}>
                {!cmpcode
                  ? 'Company code not configured in your profile.'
                  : `No ${activeFilter === 'All' ? '' : activeFilter + ' '}vouchers found${hasDateFilter ? ' for selected period' : ''}.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Date filter modal */}
      <Modal visible={showDateFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Date Filter</Text>

            <Text style={styles.inputLabel}>From Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 2026-04-01"
              value={startDate}
              onChangeText={setStartDate}
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.inputLabel}>To Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. 2026-03-31"
              value={endDate}
              onChangeText={setEndDate}
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearDateFilter}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyDateFilter}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelRow} onPress={() => setShowDateFilter(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  dateBtnActive: {
    borderColor: '#6C5CE7',
    backgroundColor: '#EDE9FE',
  },
  dateBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
  },
  tabActive: {
    backgroundColor: '#6C5CE7',
  },
  tabText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLeft: {
    flex: 1,
    paddingRight: 8,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  voucherNo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  partyName: {
    fontSize: 13,
    color: '#4B5563',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 3,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#111827',
    marginBottom: 14,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  cancelText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default SalesScreen;
