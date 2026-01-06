import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StockSummaryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSalesRegister, setShowSalesRegister] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewAllProducts, setViewAllProducts] = useState(false);

  // Stock Data
  const STOCK_SUMMARY = [
    {
      id: '1',
      productName: 'Samsung 12 Laptop',
      sku: 'SAM-LP-12',
      category: 'Laptops',
      inHand: 45,
      subDealerSold: 120,
      lastSaleDate: '02 Jan 26',
      trend: 'up',
      status: 'Healthy'
    },
    {
      id: '2',
      productName: 'Lenovo Tab M10',
      sku: 'LEN-TB-M10',
      category: 'Tablets',
      inHand: 5,
      subDealerSold: 85,
      lastSaleDate: '04 Jan 26',
      trend: 'down',
      status: 'Low Stock'
    },
    {
      id: '3',
      productName: 'HP LaserJet Pro',
      sku: 'HP-LJ-P11',
      category: 'Printers',
      inHand: 0,
      subDealerSold: 210,
      lastSaleDate: '05 Jan 26',
      trend: 'up',
      status: 'Out of Stock'
    },
    {
      id: '4',
      productName: 'Dell 24" Monitor',
      sku: 'DELL-MON-24',
      category: 'Peripherals',
      inHand: 82,
      subDealerSold: 15,
      lastSaleDate: '30 Dec 25',
      trend: 'down',
      status: 'Overstocked'
    },
    {
      id: '5',
      productName: 'Logitech Wireless Mouse',
      sku: 'LOGI-WM-X2',
      category: 'Accessories',
      inHand: 150,
      subDealerSold: 450,
      lastSaleDate: '05 Jan 26',
      trend: 'up',
      status: 'Fast Mover'
    }
  ];

  // Sales Register Data
  const SALES_REGISTER = {
    '1': [
      {
        id: 'SR-001',
        date: '02 Jan 26',
        subDealer: 'Sharma Electronics',
        location: 'Delhi NCR',
        quantity: 15,
        amount: '₹ 8,25,000',
        status: 'Delivered',
        invoiceNo: 'INV-2026-001'
      },
      {
        id: 'SR-002',
        date: '28 Dec 25',
        subDealer: 'Tech Hub Store',
        location: 'Noida',
        quantity: 25,
        amount: '₹ 13,75,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-998'
      }
    ],
    '2': [
      {
        id: 'SR-005',
        date: '04 Jan 26',
        subDealer: 'Mobile Plus',
        location: 'Mumbai',
        quantity: 20,
        amount: '₹ 2,80,000',
        status: 'Delivered',
        invoiceNo: 'INV-2026-005'
      }
    ],
    '3': [
      {
        id: 'SR-008',
        date: '05 Jan 26',
        subDealer: 'Office Solutions',
        location: 'Bangalore',
        quantity: 50,
        amount: '₹ 12,50,000',
        status: 'Delivered',
        invoiceNo: 'INV-2026-008'
      }
    ],
    '4': [
      {
        id: 'SR-012',
        date: '30 Dec 25',
        subDealer: 'Display Pro',
        location: 'Hyderabad',
        quantity: 10,
        amount: '₹ 1,50,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-1000'
      }
    ],
    '5': [
      {
        id: 'SR-014',
        date: '05 Jan 26',
        subDealer: 'Accessories Hub',
        location: 'Chennai',
        quantity: 100,
        amount: '₹ 1,50,000',
        status: 'Delivered',
        invoiceNo: 'INV-2026-010'
      },
      {
        id: 'SR-015',
        date: '03 Jan 26',
        subDealer: 'Tech Bazaar',
        location: 'Pune',
        quantity: 150,
        amount: '₹ 2,25,000',
        status: 'Delivered',
        invoiceNo: 'INV-2026-006'
      }
    ]
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Out of Stock':
        return { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle' };
      case 'Low Stock':
        return { bg: '#FEF3C7', text: '#D97706', icon: 'warning' };
      case 'Overstocked':
        return { bg: '#DBEAFE', text: '#2563EB', icon: 'archive' };
      case 'Fast Mover':
        return { bg: '#D1FAE5', text: '#059669', icon: 'flash' };
      default:
        return { bg: '#D1FAE5', text: '#10B981', icon: 'checkmark-circle' };
    }
  };

  const filteredData = STOCK_SUMMARY.filter(item => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'low' && item.status === 'Low Stock') ||
      (filterStatus === 'out' && item.status === 'Out of Stock') ||
      (filterStatus === 'fast' && item.status === 'Fast Mover');

    return matchesSearch && matchesFilter;
  });

  const totalSales = STOCK_SUMMARY.reduce((sum, item) => sum + item.subDealerSold, 0);
  const totalStock = STOCK_SUMMARY.reduce((sum, item) => sum + item.inHand, 0);
  const lowStockCount = STOCK_SUMMARY.filter(item => 
    item.status === 'Low Stock' || item.status === 'Out of Stock'
  ).length;

  const openSalesRegister = (product) => {
    setSelectedProduct(product);
    setViewAllProducts(false);
    setShowSalesRegister(true);
  };

  const openAllProductsRegister = () => {
    setSelectedProduct(null);
    setViewAllProducts(true);
    setShowSalesRegister(true);
  };

  // Get all sales data combined with product info
  const getAllSalesData = () => {
    const allSales = [];
    Object.keys(SALES_REGISTER).forEach(productId => {
      const product = STOCK_SUMMARY.find(p => p.id === productId);
      SALES_REGISTER[productId].forEach(sale => {
        allSales.push({
          ...sale,
          productId,
          productName: product?.productName || 'Unknown',
          sku: product?.sku || 'N/A'
        });
      });
    });
    // Sort by date (most recent first)
    return allSales.sort((a, b) => {
      const dateA = new Date(a.date.replace(/(\d{2}) (\w+) (\d{2})/, '20$3-$2-$1'));
      const dateB = new Date(b.date.replace(/(\d{2}) (\w+) (\d{2})/, '20$3-$2-$1'));
      return dateB - dateA;
    });
  };

  const renderSalesRegisterModal = () => {
    const isAllProducts = viewAllProducts;
    const salesData = isAllProducts 
      ? getAllSalesData() 
      : (selectedProduct ? SALES_REGISTER[selectedProduct.id] || [] : []);
    
    const totalQty = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalTransactions = salesData.length;

    const renderSaleItem = ({ item }) => (
      <View style={styles.saleCard}>
        <View style={styles.saleCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saleInvoice}>#{item.invoiceNo}</Text>
            <Text style={styles.saleDate}>{item.date}</Text>
          </View>
          <View style={[
            styles.saleStatusBadge,
            { backgroundColor: item.status === 'Delivered' ? '#D1FAE5' : '#DBEAFE' }
          ]}>
            <Text style={[
              styles.saleStatusText,
              { color: item.status === 'Delivered' ? '#059669' : '#2563EB' }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.saleDivider} />

        {isAllProducts && (
          <View style={styles.saleProductInfo}>
            <Ionicons name="cube-outline" size={14} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.saleProductName}>{item.productName}</Text>
              <Text style={styles.saleProductSku}>SKU: {item.sku}</Text>
            </View>
          </View>
        )}

        <View style={styles.saleDetails}>
          <View style={styles.saleDetailRow}>
            <Ionicons name="business-outline" size={14} color="#6B7280" />
            <Text style={styles.saleDetailLabel}>Sub-Dealer:</Text>
            <Text style={styles.saleDetailValue}>{item.subDealer}</Text>
          </View>
          <View style={styles.saleDetailRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.saleDetailLabel}>Location:</Text>
            <Text style={styles.saleDetailValue}>{item.location}</Text>
          </View>
        </View>

        <View style={styles.saleFooter}>
          <View style={styles.saleFooterItem}>
            <Text style={styles.saleFooterLabel}>Quantity</Text>
            <Text style={styles.saleFooterValue}>{item.quantity} units</Text>
          </View>
          <View style={styles.saleFooterDivider} />
          <View style={styles.saleFooterItem}>
            <Text style={styles.saleFooterLabel}>Amount</Text>
            <Text style={[styles.saleFooterValue, { color: '#10B981' }]}>{item.amount}</Text>
          </View>
        </View>
      </View>
    );

    return (
      <Modal
        visible={showSalesRegister}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSalesRegister(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSalesRegister(false)} style={styles.closeButton}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalTitle}>Sales Register</Text>
              <Text style={styles.modalSubtitle}>
                {isAllProducts ? 'All Products' : selectedProduct?.productName}
              </Text>
            </View>
            {!isAllProducts && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={openAllProductsRegister}
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
                <Text style={styles.modalStatValue}>{totalTransactions}</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Quantity Sold</Text>
                <Text style={[styles.modalStatValue, { color: '#3B82F6' }]}>{totalQty}</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={salesData}
            keyExtractor={item => item.id}
            renderItem={renderSaleItem}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No sales records found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    );
  };

  const renderStockItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.stockCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{item.productName}</Text>
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
            <Text style={styles.statLabel}>IN HAND</Text>
            <Text style={styles.statValue}>{item.inHand}</Text>
          </View>

          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={styles.statLabel}>SUB-DEALER SOLD</Text>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>
              {item.subDealerSold}
            </Text>
          </View>

          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={styles.statLabel}>LAST SALE</Text>
            <Text style={styles.dateValue}>{item.lastSaleDate}</Text>
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
            style={styles.viewRegisterBtn}
            onPress={() => openSalesRegister(item)}
          >
            <Text style={styles.viewRegisterText}>VIEW REGISTER</Text>
            <Ionicons name="chevron-forward" size={14} color="#0088CC" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderSalesRegisterModal()}

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Stock Summary</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={openAllProductsRegister}
        >
          <Ionicons name="receipt-outline" size={20} color="#0088CC" />
          <Text style={styles.headerButtonText}>All Sales</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput 
            placeholder="Search product or SKU..." 
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Ionicons name="trending-up" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{totalSales}</Text>
          <Text style={styles.summaryLab}>Total Sales</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="cube" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{totalStock}</Text>
          <Text style={styles.summaryLab}>Total Stock</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{lowStockCount}</Text>
          <Text style={styles.summaryLab}>Alerts</Text>
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
          style={[styles.filterPill, filterStatus === 'low' && styles.filterPillActive]}
          onPress={() => setFilterStatus('low')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'low' && styles.filterPillTextActive]}>
            Low Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'out' && styles.filterPillActive]}
          onPress={() => setFilterStatus('out')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'out' && styles.filterPillTextActive]}>
            Out of Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'fast' && styles.filterPillActive]}
          onPress={() => setFilterStatus('fast')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'fast' && styles.filterPillTextActive]}>
            Fast Mover
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={renderStockItem}
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
    backgroundColor: '#0088CC',
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
  filterPillActive: { backgroundColor: '#0088CC' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterPillTextActive: { color: '#fff' },

  listPadding: { padding: 15, paddingBottom: 50 },
  stockCard: { 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E5E7EB'
  },

  cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'flex-start', gap: 12 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
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
  dateValue: { fontSize: 13, fontWeight: '600', color: '#4B5563' },

  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
  },
  trendIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendText: { fontSize: 13, fontWeight: '600' },
  viewRegisterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewRegisterText: { color: '#0088CC', fontSize: 12, fontWeight: 'bold' },

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
  
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  saleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14
  },
  saleInvoice: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  saleDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  saleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  saleStatusText: { fontSize: 10, fontWeight: 'bold' },
  
  saleDivider: { height: 1, backgroundColor: '#F3F4F6' },
  
  saleProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  saleProductName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  saleProductSku: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  
  saleDetails: { padding: 14, gap: 8 },
  saleDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saleDetailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', minWidth: 80 },
  saleDetailValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', flex: 1 },
  
  saleFooter: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saleFooterItem: { flex: 1, padding: 12, alignItems: 'center' },
  saleFooterDivider: { width: 1, backgroundColor: '#E5E7EB' },
  saleFooterLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  saleFooterValue: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 14, color: '#9CA3AF', marginTop: 12, fontWeight: '500' }
});

export default StockSummaryScreen;