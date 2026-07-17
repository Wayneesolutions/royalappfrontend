import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';

const DealerOutstandingScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    fetchOutstanding();
  }, []);

  const fetchOutstanding = async () => {
    try {
      setLoading(true);
      const result = await apiService.getOutstandingList();
      if (result?.success && result?.data) {
        const allItems: any[] = result.data?.outstandingList || [];
        const myName = (user?.name || '').toLowerCase().trim();
        const myBills = myName
          ? allItems.filter((item: any) =>
              (item.partyName || '').toLowerCase().trim() === myName
            )
          : allItems;
        setBills(myBills);
        setTotalOutstanding(myBills.reduce((s: number, b: any) => s + (b.outstandingAmount || 0), 0));
      }
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOutstanding();
  };

  const getBillVoucher = (bill: any) =>
    bill.voucherNumber || bill.billRef || bill.BillName || 'N/A';

  const getBillDate = (bill: any) => {
    const d = bill.billDate || bill.date || bill.updatedAt;
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getBillAmount = (bill: any) =>
    parseFloat(bill.outstandingAmount || bill.amount || '0') || 0;

  const getBillOverdue = (bill: any) =>
    parseInt(bill.daysOverdue || bill.overdueDays || '0') || 0;

  const filteredBills = bills.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.voucherNumber || b.billRef || b.BillName || '').toLowerCase().includes(q) ||
      (b.voucherType || '').toLowerCase().includes(q)
    );
  });

  const overdueCount = bills.filter(b => getBillOverdue(b) > 0).length;

  const renderBill = ({ item }: { item: any }) => {
    const overdue = getBillOverdue(item);
    const amount = getBillAmount(item);
    return (
      <View style={styles.billCard}>
        <View style={[styles.billIconWrap, { backgroundColor: overdue > 0 ? '#FEF2F2' : '#F0FDF4' }]}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={overdue > 0 ? '#EF4444' : '#10B981'}
          />
        </View>
        <View style={styles.billInfo}>
          <Text style={styles.billVoucher}>{getBillVoucher(item)}</Text>
          <Text style={styles.billDate}>{getBillDate(item)}</Text>
        </View>
        <View style={styles.billRight}>
          <Text style={styles.billAmount}>
            ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <View style={[styles.billBadge, { backgroundColor: overdue > 0 ? '#FEF2F2' : '#F0FDF4' }]}>
            <Text style={[styles.billBadgeText, { color: overdue > 0 ? '#EF4444' : '#10B981' }]}>
              {overdue > 0 ? `${overdue}d overdue` : 'Current'}
            </Text>
          </View>
        </View>
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
        <Text style={styles.headerTitle}>My Outstanding</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={[styles.summaryItem, { borderRightWidth: 1, borderRightColor: '#E5E7EB' }]}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={styles.summaryAmount}>
            ₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Bills</Text>
          <Text style={[styles.summaryAmount, { fontSize: 22 }]}>{bills.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Overdue</Text>
          <Text style={[styles.summaryAmount, { fontSize: 22, color: overdueCount > 0 ? '#EF4444' : '#10B981' }]}>
            {overdueCount}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by bill number..."
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
          <Text style={styles.loadingText}>Loading outstanding bills...</Text>
        </View>
      ) : filteredBills.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-circle-outline" size={56} color="#10B981" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching bills' : 'No outstanding bills'}
          </Text>
          <Text style={styles.emptySub}>
            {searchQuery ? 'Try a different search term' : 'All your bills are settled'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderBill}
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
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
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
  billCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  billIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billInfo: {
    flex: 1,
  },
  billVoucher: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  billDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  billBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  billBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
  },
});

export default DealerOutstandingScreen;
