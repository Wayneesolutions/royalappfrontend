import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SalesSummaryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [viewAllTransactions, setViewAllTransactions] = useState(false);

  // Sales Summary Data - Grouped by Stock/Product
  const SALES_SUMMARY = [
    {
      id: '1',
      stockName: 'Samsung 12 Laptop',
      sku: 'SAM-LP-12',
      category: 'Laptops',
      totalQuantitySold: 40,
      totalAmount: 2200000,
      averageRate: 55000,
      transactionCount: 2,
      lastSaleDate: '02 Jan 26',
      trend: 'up',
      status: 'Top Seller'
    },
    {
      id: '2',
      stockName: 'Lenovo Tab M10',
      sku: 'LEN-TB-M10',
      category: 'Tablets',
      totalQuantitySold: 55,
      totalAmount: 770000,
      averageRate: 14000,
      transactionCount: 2,
      lastSaleDate: '04 Jan 26',
      trend: 'up',
      status: 'Good'
    },
    {
      id: '3',
      stockName: 'HP LaserJet Pro',
      sku: 'HP-LJ-P11',
      category: 'Printers',
      totalQuantitySold: 90,
      totalAmount: 2250000,
      averageRate: 25000,
      transactionCount: 2,
      lastSaleDate: '05 Jan 26',
      trend: 'up',
      status: 'Top Seller'
    },
    {
      id: '4',
      stockName: 'Dell 24" Monitor',
      sku: 'DELL-MON-24',
      category: 'Peripherals',
      totalQuantitySold: 15,
      totalAmount: 225000,
      averageRate: 15000,
      transactionCount: 2,
      lastSaleDate: '30 Dec 25',
      trend: 'down',
      status: 'Slow Mover'
    },
    {
      id: '5',
      stockName: 'Logitech Wireless Mouse',
      sku: 'LOGI-WM-X2',
      category: 'Accessories',
      totalQuantitySold: 220,
      totalAmount: 330000,
      averageRate: 1500,
      transactionCount: 2,
      lastSaleDate: '05 Jan 26',
      trend: 'up',
      status: 'Top Seller'
    }
  ];

  // Detailed Transaction Register
  const TRANSACTION_REGISTER = {
    '1': [
      {
        id: 'TXN-001',
        date: '02 Jan 26',
        subDealer: 'Sharma Electronics',
        location: 'Delhi NCR',
        quantity: 15,
        rate: 55000,
        amount: 825000,
        status: 'Completed',
        invoiceNo: 'INV-2026-001',
        paymentMode: 'Credit'
      },
      {
        id: 'TXN-002',
        date: '28 Dec 25',
        subDealer: 'Tech Hub Store',
        location: 'Noida',
        quantity: 25,
        rate: 55000,
        amount: 1375000,
        status: 'Completed',
        invoiceNo: 'INV-2025-998',
        paymentMode: 'Cash'
      }
    ],
    '2': [
      {
        id: 'TXN-005',
        date: '04 Jan 26',
        subDealer: 'Mobile Plus',
        location: 'Mumbai',
        quantity: 20,
        rate: 14000,
        amount: 280000,
        status: 'Completed',
        invoiceNo: 'INV-2026-005',
        paymentMode: 'Credit'
      },
      {
        id: 'TXN-006',
        date: '30 Dec 25',
        subDealer: 'Gadget Zone',
        location: 'Pune',
        quantity: 35,
        rate: 14000,
        amount: 490000,
        status: 'Completed',
        invoiceNo: 'INV-2025-999',
        paymentMode: 'UPI'
      }
    ],
    '3': [
      {
        id: 'TXN-008',
        date: '05 Jan 26',
        subDealer: 'Office Solutions',
        location: 'Bangalore',
        quantity: 50,
        rate: 25000,
        amount: 1250000,
        status: 'Completed',
        invoiceNo: 'INV-2026-008',
        paymentMode: 'Credit'
      },
      {
        id: 'TXN-009',
        date: '03 Jan 26',
        subDealer: 'Print World',
        location: 'Mysore',
        quantity: 40,
        rate: 25000,
        amount: 1000000,
        status: 'Completed',
        invoiceNo: 'INV-2026-003',
        paymentMode: 'Cash'
      }
    ],
    '4': [
      {
        id: 'TXN-012',
        date: '30 Dec 25',
        subDealer: 'Display Pro',
        location: 'Hyderabad',
        quantity: 10,
        rate: 15000,
        amount: 150000,
        status: 'Completed',
        invoiceNo: 'INV-2025-1000',
        paymentMode: 'Credit'
      },
      {
        id: 'TXN-013',
        date: '10 Dec 25',
        subDealer: 'Vision Electronics',
        location: 'Warangal',
        quantity: 5,
        rate: 15000,
        amount: 75000,
        status: 'Completed',
        invoiceNo: 'INV-2025-965',
        paymentMode: 'Cash'
      }
    ],
    '5': [
      {
        id: 'TXN-014',
        date: '05 Jan 26',
        subDealer: 'Accessories Hub',
        location: 'Chennai',
        quantity: 100,
        rate: 1500,
        amount: 150000,
        status: 'Completed',
        invoiceNo: 'INV-2026-010',
        paymentMode: 'UPI'
      },
      {
        id: 'TXN-015',
        date: '03 Jan 26',
        subDealer: 'PC Peripherals',
        location: 'Coimbatore',
        quantity: 120,
        rate: 1500,
        amount: 180000,
        status: 'Completed',
        invoiceNo: 'INV-2026-004',
        paymentMode: 'Credit'
      }
    ]
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹ ${(amount / 100000).toFixed(2)} L`;
    }
    return `₹ ${(amount / 1000).toFixed(0)}K`;
  };

  const getStatusStyle = (status) => {
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

  const filteredData = SALES_SUMMARY.filter(item => {
    const matchesSearch = 
      item.stockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'top' && item.status === 'Top Seller') ||
      (filterStatus === 'slow' && item.status === 'Slow Mover') ||
      (filterStatus === 'good' && item.status === 'Good');

    return matchesSearch && matchesFilter;
  });

  const totalSales = SALES_SUMMARY.reduce((sum, item) => sum + item.totalQuantitySold, 0);
  const totalRevenue = SALES_SUMMARY.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalTransactions = SALES_SUMMARY.reduce((sum, item) => sum + item.transactionCount, 0);

  const openTransactionDetails = (stock) => {
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
    const allTransactions = [];
    Object.keys(TRANSACTION_REGISTER).forEach(stockId => {
      const stock = SALES_SUMMARY.find(s => s.id === stockId);
      TRANSACTION_REGISTER[stockId].forEach(txn => {
        allTransactions.push({
          ...txn,
          stockId,
          stockName: stock?.stockName || 'Unknown',
          sku: stock?.sku || 'N/A'
        });
      });
    });
    // Sort by date (most recent first)
    return allTransactions.sort((a, b) => {
      const dateA = new Date(a.date.replace(/(\d{2}) (\w+) (\d{2})/, '20$3-$2-$1'));
      const dateB = new Date(b.date.replace(/(\d{2}) (\w+) (\d{2})/, '20$3-$2-$1'));
      return dateB - dateA;
    });
  };

  const renderTransactionModal = () => {
    const isAllTransactions = viewAllTransactions;
    const transactionData = isAllTransactions 
      ? getAllTransactionsData() 
      : (selectedStock ? TRANSACTION_REGISTER[selectedStock.id] || [] : []);
    
    const totalQty = transactionData.reduce((sum, txn) => sum + txn.quantity, 0);
    const totalAmt = transactionData.reduce((sum, txn) => sum + txn.amount, 0);
    const totalTxns = transactionData.length;

    const renderTransactionItem = ({ item }) => (
      <View style={styles.transactionCard}>
        <View style={styles.transactionCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.transactionInvoice}>#{item.invoiceNo}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
          <View style={[
            styles.transactionStatusBadge,
            { backgroundColor: item.status === 'Completed' ? '#D1FAE5' : '#DBEAFE' }
          ]}>
            <Text style={[
              styles.transactionStatusText,
              { color: item.status === 'Completed' ? '#059669' : '#2563EB' }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.transactionDivider} />

        {isAllTransactions && (
          <View style={styles.transactionStockInfo}>
            <Ionicons name="cube-outline" size={14} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionStockName}>{item.stockName}</Text>
              <Text style={styles.transactionStockSku}>SKU: {item.sku}</Text>
            </View>
          </View>
        )}

        <View style={styles.transactionDetails}>
          <View style={styles.transactionDetailRow}>
            <Ionicons name="business-outline" size={14} color="#6B7280" />
            <Text style={styles.transactionDetailLabel}>Sub-Dealer:</Text>
            <Text style={styles.transactionDetailValue}>{item.subDealer}</Text>
          </View>
          <View style={styles.transactionDetailRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.transactionDetailLabel}>Location:</Text>
            <Text style={styles.transactionDetailValue}>{item.location}</Text>
          </View>
          <View style={styles.transactionDetailRow}>
            <Ionicons name="card-outline" size={14} color="#6B7280" />
            <Text style={styles.transactionDetailLabel}>Payment:</Text>
            <Text style={styles.transactionDetailValue}>{item.paymentMode}</Text>
          </View>
        </View>

        <View style={styles.transactionFooter}>
          <View style={styles.transactionFooterItem}>
            <Text style={styles.transactionFooterLabel}>Quantity</Text>
            <Text style={styles.transactionFooterValue}>{item.quantity} units</Text>
          </View>
          <View style={styles.transactionFooterDivider} />
          <View style={styles.transactionFooterItem}>
            <Text style={styles.transactionFooterLabel}>Rate</Text>
            <Text style={[styles.transactionFooterValue, { color: '#3B82F6' }]}>
              ₹ {item.rate.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.transactionFooterDivider} />
          <View style={styles.transactionFooterItem}>
            <Text style={styles.transactionFooterLabel}>Amount</Text>
            <Text style={[styles.transactionFooterValue, { color: '#10B981' }]}>
              {formatCurrency(item.amount)}
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
                {isAllTransactions ? 'All Products' : selectedStock?.stockName}
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
            keyExtractor={item => item.id}
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

  const renderSalesItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.salesCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stockName}>{item.stockName}</Text>
            <Text style={styles.skuText}>SKU: {item.sku}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>QUANTITY SOLD</Text>
            <Text style={styles.statValue}>{item.totalQuantitySold}</Text>
            <Text style={styles.statUnit}>units</Text>
          </View>

          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={styles.statLabel}>AVG RATE</Text>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>
              {formatCurrency(item.averageRate)}
            </Text>
            <Text style={styles.statUnit}>per unit</Text>
          </View>

          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={styles.statLabel}>TOTAL AMOUNT</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {formatCurrency(item.totalAmount)}
            </Text>
            <Text style={styles.statUnit}>revenue</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="receipt-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{item.transactionCount} transactions</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>Last: {item.lastSaleDate}</Text>
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
        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'all' && styles.filterPillActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'all' && styles.filterPillTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'top' && styles.filterPillActive]}
          onPress={() => setFilterStatus('top')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'top' && styles.filterPillTextActive]}>
            Top Seller
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'good' && styles.filterPillActive]}
          onPress={() => setFilterStatus('good')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'good' && styles.filterPillTextActive]}>
            Good
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'slow' && styles.filterPillActive]}
          onPress={() => setFilterStatus('slow')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'slow' && styles.filterPillTextActive]}>
            Slow Mover
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={renderSalesItem}
        contentContainerStyle={styles.listPadding}
      />
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