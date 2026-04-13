import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, TextInput, Modal, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const SalesSummaryScreen = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [viewAllTransactions, setViewAllTransactions] = useState(false);

  // --- API state ---
  const [salesSummary, setSalesSummary] = useState<any[]>([]);
  const [transactionRegister, setTransactionRegister] = useState<Record<string, any[]>>({});
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const getCmpCode = () => {
    return user?.defaultCompany?.companyCode || user?.companies?.[0]?.companyCode || '';
  };

  const getUserId = () => {
    return user?._id || user?.id || '';
  };

  const fetchSalesData = async () => {
    const cmpcode = getCmpCode();
    const userId = getUserId();
    if (!cmpcode || !userId) {
      console.log('No company code or userId available for sales fetch');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.getTallySalesForGroupUser(cmpcode, userId);

      if (result?.success && result?.data) {
        // API returns { SALES_SUMMARY: [...], TRANSACTION_REGISTER: {...}, summary: {...} }
        const items = result.data.SALES_SUMMARY || [];
        setSalesSummary(Array.isArray(items) ? items : []);
        setTransactionRegister(result.data.TRANSACTION_REGISTER || {});
        setSummaryData(result.data.summary || null);
      } else {
        setSalesSummary([]);
        setTransactionRegister({});
        setSummaryData(null);
      }
    } catch (e) {
      console.error('Error fetching sales data:', e);
      setSalesSummary([]);
      setTransactionRegister({});
      setSummaryData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchSalesData(); };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹ ${(amount / 100000).toFixed(2)} L`;
    }
    if (amount >= 1000) {
      return `₹ ${(amount / 1000).toFixed(0)}K`;
    }
    return `₹ ${amount.toLocaleString('en-IN')}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Top Seller':
        return { bg: '#D1FAE5', text: '#059669', icon: 'trophy' };
      case 'Slow Mover':
        return { bg: '#FEF3C7', text: '#D97706', icon: 'alert-circle' };
      case 'Good':
        return { bg: '#DBEAFE', text: '#2563EB', icon: 'checkmark-circle' };
      default:
        return { bg: '#D1FAE5', text: '#10B981', icon: 'checkmark-circle' };
    }
  };

  // Summary stats
  const totalSales = summaryData?.totalSales ?? salesSummary.reduce((sum, item) => sum + (item.totalQuantitySold || 0), 0);
  const totalRevenue = summaryData?.totalRevenue ?? salesSummary.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const totalTransactions = summaryData?.totalTransactions ?? salesSummary.reduce((sum, item) => sum + (item.transactionCount || 0), 0);

  const filteredData = salesSummary.filter(item => {
    const matchesSearch = 
      (item.stockName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'top' && item.status === 'Top Seller') ||
      (filterStatus === 'slow' && item.status === 'Slow Mover') ||
      (filterStatus === 'good' && item.status === 'Good');

    return matchesSearch && matchesFilter;
  });

  const openTransactionDetails = (stock: any) => {
    setSelectedStock(stock);
    setViewAllTransactions(false);
    setShowTransactionDetails(true);
  };

  const openAllTransactions = () => {
    setSelectedStock(null);
    setViewAllTransactions(true);
    setShowTransactionDetails(true);
  };

  // Get all transaction data combined with stock info
  const getAllTransactionsData = () => {
    const allTransactions: any[] = [];
    Object.keys(transactionRegister).forEach(stockId => {
      const stock = salesSummary.find(s => s.id === stockId);
      (transactionRegister[stockId] || []).forEach(txn => {
        allTransactions.push({
          ...txn,
          stockId,
          stockName: stock?.stockName || txn.stockName || 'Unknown',
          sku: stock?.sku || txn.sku || 'N/A'
        });
      });
    });
    return allTransactions;
  };

  const renderTransactionModal = () => {
    const isAllTransactions = viewAllTransactions;
    const transactionData = isAllTransactions 
      ? getAllTransactionsData() 
      : (selectedStock ? transactionRegister[selectedStock.id] || [] : []);
    
    const totalQty = transactionData.reduce((sum: number, txn: any) => sum + (txn.quantity || 0), 0);
    const totalAmt = transactionData.reduce((sum: number, txn: any) => sum + (txn.amount || 0), 0);
    const totalTxns = transactionData.length;

    const renderTransactionItem = ({ item }: any) => (
      <View style={styles.transactionCard}>
        <View style={styles.transactionCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.transactionInvoice}>#{item.invoiceNo || '—'}</Text>
            <Text style={styles.transactionDate}>{item.date || '—'}</Text>
          </View>
          <View style={[
            styles.transactionStatusBadge,
            { backgroundColor: item.status === 'Completed' ? '#D1FAE5' : '#DBEAFE' }
          ]}>
            <Text style={[
              styles.transactionStatusText,
              { color: item.status === 'Completed' ? '#059669' : '#2563EB' }
            ]}>
              {item.status || 'Completed'}
            </Text>
          </View>
        </View>

        <View style={styles.transactionDivider} />

        {isAllTransactions && (
          <View style={styles.transactionStockInfo}>
            <Ionicons name="cube-outline" size={14} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionStockName}>{item.stockName || 'Unknown'}</Text>
              <Text style={styles.transactionStockSku}>SKU: {item.sku || 'N/A'}</Text>
            </View>
          </View>
        )}

        <View style={styles.transactionDetails}>
          <View style={styles.transactionDetailRow}>
            <Ionicons name="business-outline" size={14} color="#6B7280" />
            <Text style={styles.transactionDetailLabel}>Sub-Dealer:</Text>
            <Text style={styles.transactionDetailValue}>{item.subDealer || '—'}</Text>
          </View>
          <View style={styles.transactionDetailRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.transactionDetailLabel}>Location:</Text>
            <Text style={styles.transactionDetailValue}>{item.location || '—'}</Text>
          </View>
          <View style={styles.transactionDetailRow}>
            <Ionicons name="card-outline" size={14} color="#6B7280" />
            <Text style={styles.transactionDetailLabel}>Payment:</Text>
            <Text style={styles.transactionDetailValue}>{item.paymentMode || 'Credit'}</Text>
          </View>
        </View>

        <View style={styles.transactionFooter}>
          <View style={styles.transactionFooterItem}>
            <Text style={styles.transactionFooterLabel}>Quantity</Text>
            <Text style={styles.transactionFooterValue}>{item.quantity || 0} units</Text>
          </View>
          <View style={styles.transactionFooterDivider} />
          <View style={styles.transactionFooterItem}>
            <Text style={styles.transactionFooterLabel}>Rate</Text>
            <Text style={[styles.transactionFooterValue, { color: '#3B82F6' }]}>
              ₹ {(item.rate || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.transactionFooterDivider} />
          <View style={styles.transactionFooterItem}>
            <Text style={styles.transactionFooterLabel}>Amount</Text>
            <Text style={[styles.transactionFooterValue, { color: '#10B981' }]}>
              {formatCurrency(item.amount || 0)}
            </Text>
          </View>
        </View>
      </View>
    );

    return (
      <Modal
        visible={showTransactionDetails}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowTransactionDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTransactionDetails(false)} style={styles.closeButton}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <Text style={styles.modalSubtitle}>
                {isAllTransactions ? 'All Products' : selectedStock?.stockName || '—'}
              </Text>
            </View>
            {!isAllTransactions && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={openAllTransactions}
              >
                <Ionicons name="grid-outline" size={18} color="#0088CC" />
                <Text style={styles.viewAllButtonText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.modalProductCard}>
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Transactions</Text>
                <Text style={styles.modalStatValue}>{totalTxns}</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Quantity</Text>
                <Text style={[styles.modalStatValue, { color: '#3B82F6' }]}>{totalQty}</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Amount</Text>
                <Text style={[styles.modalStatValue, { color: '#10B981' }]}>{formatCurrency(totalAmt)}</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={transactionData}
            keyExtractor={(item, i) => item.id || String(i)}
            renderItem={renderTransactionItem}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No transaction records found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    );
  };

  const renderSalesItem = ({ item }: any) => {
    const statusStyle = getStatusStyle(item.status || 'Good');

    return (
      <View style={styles.salesCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stockName}>{item.stockName || '—'}</Text>
            <Text style={styles.skuText}>SKU: {item.sku || '—'}</Text>
            {item.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon as any} size={14} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status || 'Good'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>QUANTITY SOLD</Text>
            <Text style={styles.statValue}>{item.totalQuantitySold || 0}</Text>
            <Text style={styles.statUnit}>units</Text>
          </View>

          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={styles.statLabel}>AVG RATE</Text>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>
              {formatCurrency(item.averageRate || 0)}
            </Text>
            <Text style={styles.statUnit}>per unit</Text>
          </View>

          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={styles.statLabel}>TOTAL AMOUNT</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {formatCurrency(item.totalAmount || 0)}
            </Text>
            <Text style={styles.statUnit}>revenue</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="receipt-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{item.transactionCount || 0} transactions</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>Last: {item.lastSaleDate || '—'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.trendRow}>
          <View style={styles.trendIndicator}>
            <Ionicons 
              name={item.trend === 'up' ? "trending-up" : "trending-down"} 
              size={18} 
              color={item.trend === 'up' ? "#10B981" : "#EF4444"} 
            />
            <Text style={[
              styles.trendText,
              { color: item.trend === 'up' ? "#10B981" : "#EF4444" }
            ]}>
              {item.trend === 'up' ? 'Trending Up' : 'Trending Down'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.viewDetailsBtn}
            onPress={() => openTransactionDetails(item)}
          >
            <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
            <Ionicons name="chevron-forward" size={14} color="#0088CC" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderTransactionModal()}

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Sales Summary</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={openAllTransactions}
        >
          <Ionicons name="receipt-outline" size={20} color="#0088CC" />
          <Text style={styles.headerButtonText}>All Transactions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput 
            placeholder="Search stock or SKU..." 
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

      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Ionicons name="cube" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{totalSales}</Text>
          <Text style={styles.summaryLab}>Units Sold</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="trending-up" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.summaryLab}>Total Revenue</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="receipt" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{totalTransactions}</Text>
          <Text style={styles.summaryLab}>Transactions</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'top', label: 'Top Seller' },
          { key: 'good', label: 'Good' },
          { key: 'slow', label: 'Slow Mover' },
        ].map(({ key, label }) => (
          <TouchableOpacity 
            key={key}
            style={[styles.filterPill, filterStatus === key && styles.filterPillActive]}
            onPress={() => setFilterStatus(key)}
          >
            <Text style={[styles.filterPillText, filterStatus === key && styles.filterPillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading sales data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={renderSalesItem}
          contentContainerStyle={styles.listPadding}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No sales records found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6
  },
  headerButtonText: { fontSize: 13, fontWeight: '600', color: '#0088CC' },
  
  searchSection: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff' },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 14, 
    borderRadius: 12,
    height: 48
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },

  summaryStrip: { 
    flexDirection: 'row', 
    paddingVertical: 18, 
    backgroundColor: '#10B981',
    marginHorizontal: 15,
    borderRadius: 14,
    marginTop: 12
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.3)' },
  summaryVal: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  summaryLab: { color: '#E0F2FE', fontSize: 10, marginTop: 2, fontWeight: '600' },

  filterContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12, gap: 8 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6'
  },
  filterPillActive: { backgroundColor: '#10B981' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterPillTextActive: { color: '#fff' },

  listPadding: { padding: 15, paddingBottom: 50 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  salesCard: { 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E5E7EB'
  },

  cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'flex-start', gap: 12 },
  stockName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  skuText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start'
  },
  categoryText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },

  statsGrid: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderTopWidth: 1, borderColor: '#E5E7EB' },
  statBox: { flex: 1, padding: 14, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderColor: '#E5E7EB' },
  statLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: 'bold', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  statUnit: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },

  bottomRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  metaInfo: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },

  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  trendIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendText: { fontSize: 13, fontWeight: '600' },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailsText: { color: '#0088CC', fontSize: 12, fontWeight: 'bold' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  closeButton: { padding: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  viewAllButtonText: { fontSize: 12, fontWeight: '600', color: '#0088CC' },
  
  modalProductCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  modalStatsRow: { flexDirection: 'row', gap: 12 },
  modalStatBox: { flex: 1, alignItems: 'center' },
  modalStatLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginBottom: 6 },
  modalStatValue: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  
  modalListContent: { padding: 15, paddingBottom: 50 },
  
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  transactionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14
  },
  transactionInvoice: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  transactionDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  transactionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  transactionStatusText: { fontSize: 10, fontWeight: 'bold' },
  
  transactionDivider: { height: 1, backgroundColor: '#F3F4F6' },
  
  transactionStockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  transactionStockName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  transactionStockSku: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  
  transactionDetails: { padding: 14, gap: 8 },
  transactionDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  transactionDetailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', minWidth: 80 },
  transactionDetailValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', flex: 1 },
  
  transactionFooter: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  transactionFooterItem: { flex: 1, padding: 12, alignItems: 'center' },
  transactionFooterDivider: { width: 1, backgroundColor: '#E5E7EB' },
  transactionFooterLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  transactionFooterValue: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 14, color: '#9CA3AF', marginTop: 12, fontWeight: '500' }
});

export default SalesSummaryScreen;