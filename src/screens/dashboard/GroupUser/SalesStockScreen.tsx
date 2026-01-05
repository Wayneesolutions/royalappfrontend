import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, TextInput, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StockSummaryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, low, out, overstock, fast
  const [showSalesRegister, setShowSalesRegister] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- Enhanced Static Data with Stock Status ---
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
      inHand: 5, // LOW STOCK
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
      inHand: 0, // OUT OF STOCK
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

  // --- Sales Register Data for Each Product ---
  const SALES_REGISTER = {
    '1': [ // Samsung 12 Laptop
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
      },
      {
        id: 'SR-003',
        date: '20 Dec 25',
        subDealer: 'Digital World',
        location: 'Gurgaon',
        quantity: 30,
        amount: '₹ 16,50,000',
        status: 'In Transit',
        invoiceNo: 'INV-2025-985'
      },
      {
        id: 'SR-004',
        date: '15 Dec 25',
        subDealer: 'Metro Computers',
        location: 'Faridabad',
        quantity: 50,
        amount: '₹ 27,50,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-972'
      }
    ],
    '2': [ // Lenovo Tab M10
      {
        id: 'SR-005',
        date: '04 Jan 26',
        subDealer: 'Mobile Plus',
        location: 'Mumbai',
        quantity: 20,
        amount: '₹ 2,80,000',
        status: 'Delivered',
        invoiceNo: 'INV-2026-005'
      },
      {
        id: 'SR-006',
        date: '30 Dec 25',
        subDealer: 'Gadget Zone',
        location: 'Pune',
        quantity: 35,
        amount: '₹ 4,90,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-999'
      },
      {
        id: 'SR-007',
        date: '22 Dec 25',
        subDealer: 'Tech Bazaar',
        location: 'Nashik',
        quantity: 30,
        amount: '₹ 4,20,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-987'
      }
    ],
    '3': [ // HP LaserJet Pro
      {
        id: 'SR-008',
        date: '05 Jan 26',
        subDealer: 'Office Solutions',
        location: 'Bangalore',
        quantity: 50,
        amount: '₹ 12,50,000',
        status: 'Delivered',
        invoiceNo: 'INV-2026-008'
      },
      {
        id: 'SR-009',
        date: '03 Jan 26',
        subDealer: 'Print World',
        location: 'Mysore',
        quantity: 40,
        amount: '₹ 10,00,000',
        status: 'In Transit',
        invoiceNo: 'INV-2026-003'
      },
      {
        id: 'SR-010',
        date: '28 Dec 25',
        subDealer: 'Business Tech',
        location: 'Hubli',
        quantity: 60,
        amount: '₹ 15,00,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-997'
      },
      {
        id: 'SR-011',
        date: '18 Dec 25',
        subDealer: 'Corporate Supplies',
        location: 'Mangalore',
        quantity: 60,
        amount: '₹ 15,00,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-980'
      }
    ],
    '4': [ // Dell 24" Monitor
      {
        id: 'SR-012',
        date: '30 Dec 25',
        subDealer: 'Display Pro',
        location: 'Hyderabad',
        quantity: 10,
        amount: '₹ 1,50,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-1000'
      },
      {
        id: 'SR-013',
        date: '10 Dec 25',
        subDealer: 'Vision Electronics',
        location: 'Warangal',
        quantity: 5,
        amount: '₹ 75,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-965'
      }
    ],
    '5': [ // Logitech Wireless Mouse
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
        subDealer: 'PC Peripherals',
        location: 'Coimbatore',
        quantity: 120,
        amount: '₹ 1,80,000',
        status: 'Delivered',
        invoiceNo: 'INV-2026-004'
      },
      {
        id: 'SR-016',
        date: '01 Jan 26',
        subDealer: 'Gadget Store',
        location: 'Madurai',
        quantity: 80,
        amount: '₹ 1,20,000',
        status: 'In Transit',
        invoiceNo: 'INV-2026-001'
      },
      {
        id: 'SR-017',
        date: '28 Dec 25',
        subDealer: 'Tech Accessories',
        location: 'Trichy',
        quantity: 150,
        amount: '₹ 2,25,000',
        status: 'Delivered',
        invoiceNo: 'INV-2025-996'
      }
    ]
  };

  // Get status badge styling
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
      case 'Healthy':
      default:
        return { bg: '#D1FAE5', text: '#10B981', icon: 'checkmark-circle' };
    }
  };

  // Filter data based on search and status
  const filteredData = STOCK_SUMMARY.filter(item => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'low' && item.status === 'Low Stock') ||
      (filterStatus === 'out' && item.status === 'Out of Stock') ||
      (filterStatus === 'overstock' && item.status === 'Overstocked') ||
      (filterStatus === 'fast' && item.status === 'Fast Mover');

    return matchesSearch && matchesFilter;
  });

  // Calculate summary stats
  const totalSales = STOCK_SUMMARY.reduce((sum, item) => sum + item.subDealerSold, 0);
  const totalStock = STOCK_SUMMARY.reduce((sum, item) => sum + item.inHand, 0);
  const lowStockCount = STOCK_SUMMARY.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').length;

  // Open sales register modal
  const openSalesRegister = (product) => {
    setSelectedProduct(product);
    setShowSalesRegister(true);
  };

  // Close sales register modal
  const closeSalesRegister = () => {
    setShowSalesRegister(false);
    setSelectedProduct(null);
  };

  // Render Sales Register Modal
  const renderSalesRegisterModal = () => {
    if (!selectedProduct) return null;

    const salesData = SALES_REGISTER[selectedProduct.id] || [];
    const totalQty = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalAmount = salesData.reduce((sum, sale) => {
      const amount = parseFloat(sale.amount.replace(/[₹,]/g, ''));
      return sum + amount;
    }, 0);

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
            <Ionicons 
              name={item.status === 'Delivered' ? 'checkmark-circle' : 'time'} 
              size={12} 
              color={item.status === 'Delivered' ? '#059669' : '#2563EB'} 
            />
            <Text style={[
              styles.saleStatusText,
              { color: item.status === 'Delivered' ? '#059669' : '#2563EB' }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.saleDivider} />

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
        onRequestClose={closeSalesRegister}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSalesRegister} style={styles.closeButton}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalTitle}>Sales Register</Text>
              <Text style={styles.modalSubtitle}>{selectedProduct.productName}</Text>
            </View>
          </View>

          {/* Product Info Card */}
          <View style={styles.modalProductCard}>
            <View style={styles.modalProductInfo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalProductName}>{selectedProduct.productName}</Text>
                <Text style={styles.modalProductSKU}>SKU: {selectedProduct.sku}</Text>
                <View style={styles.modalCategoryBadge}>
                  <Ionicons name="pricetag-outline" size={10} color="#6B7280" />
                  <Text style={styles.modalCategoryText}>{selectedProduct.category}</Text>
                </View>
              </View>
              <View style={[
                styles.modalStatusBadge,
                { backgroundColor: getStatusStyle(selectedProduct.status).bg }
              ]}>
                <Text style={[
                  styles.modalStatusText,
                  { color: getStatusStyle(selectedProduct.status).text }
                ]}>
                  {selectedProduct.status}
                </Text>
              </View>
            </View>

            {/* Summary Stats */}
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Transactions</Text>
                <Text style={styles.modalStatValue}>{salesData.length}</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Quantity Sold</Text>
                <Text style={[styles.modalStatValue, { color: '#3B82F6' }]}>{totalQty}</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Value</Text>
                <Text style={[styles.modalStatValue, { color: '#10B981' }]}>
                  ₹ {(totalAmount / 100000).toFixed(2)}L
                </Text>
              </View>
            </View>
          </View>

          {/* Sales List */}
          <View style={styles.modalListHeader}>
            <Ionicons name="receipt-outline" size={18} color="#6B7280" />
            <Text style={styles.modalListTitle}>Transaction History ({salesData.length})</Text>
          </View>

          <FlatList
            data={salesData}
            keyExtractor={item => item.id}
            renderItem={renderSaleItem}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={60} color="#D1D5DB" />
                <Text style={styles.emptyText}>No sales records found</Text>
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
        {/* Product Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{item.productName}</Text>
              {item.status === 'Fast Mover' && (
                <Ionicons name="flame" size={16} color="#F59E0B" style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={styles.skuText}>SKU: {item.sku}</Text>
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag-outline" size={10} color="#6B7280" />
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="cube-outline" size={16} color="#6B7280" />
              <Text style={styles.statLabel}>IN HAND</Text>
            </View>
            <Text style={[
              styles.statValue,
              item.inHand === 0 && { color: '#DC2626' },
              item.inHand > 0 && item.inHand <= 10 && { color: '#F59E0B' }
            ]}>
              {item.inHand}
            </Text>
          </View>

          <View style={[styles.statBox, styles.borderLeft]}>
            <View style={styles.statIconRow}>
              <Ionicons name="people-outline" size={16} color="#3B82F6" />
              <Text style={styles.statLabel}>SUB-DEALER SOLD</Text>
            </View>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>
              {item.subDealerSold}
            </Text>
          </View>

          <View style={[styles.statBox, styles.borderLeft]}>
            <View style={styles.statIconRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.statLabel}>LAST MOVEMENT</Text>
            </View>
            <Text style={styles.dateValue}>{item.lastSaleDate}</Text>
          </View>
        </View>

        {/* Trend Indicator */}
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
            <Text style={styles.viewRegisterText}>VIEW SALES REGISTER</Text>
            <Ionicons name="chevron-forward" size={14} color="#0088CC" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sales Register Modal */}
      {renderSalesRegisterModal()}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Summary</Text>
        <Text style={styles.headerSub}>Sub-dealer Sales Movement & Inventory Status</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput 
            placeholder="Search product, SKU or category..." 
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

      {/* Quick Summary Strip */}
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

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'all' && styles.filterPillActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'all' && styles.filterPillTextActive]}>
            All Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'low' && styles.filterPillActive]}
          onPress={() => setFilterStatus('low')}
        >
          <Ionicons name="warning" size={12} color={filterStatus === 'low' ? '#fff' : '#D97706'} />
          <Text style={[styles.filterPillText, filterStatus === 'low' && styles.filterPillTextActive]}>
            Low Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'out' && styles.filterPillActive]}
          onPress={() => setFilterStatus('out')}
        >
          <Ionicons name="close-circle" size={12} color={filterStatus === 'out' ? '#fff' : '#DC2626'} />
          <Text style={[styles.filterPillText, filterStatus === 'out' && styles.filterPillTextActive]}>
            Out of Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'fast' && styles.filterPillActive]}
          onPress={() => setFilterStatus('fast')}
        >
          <Ionicons name="flash" size={12} color={filterStatus === 'fast' ? '#fff' : '#059669'} />
          <Text style={[styles.filterPillText, filterStatus === 'fast' && styles.filterPillTextActive]}>
            Fast Mover
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={renderStockItem}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubText}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  searchSection: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff' },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 14, 
    borderRadius: 12,
    height: 48
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 14,
    color: '#111827'
  },

  summaryStrip: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingVertical: 18, 
    backgroundColor: '#0088CC',
    marginHorizontal: 15,
    borderRadius: 14,
    marginTop: 12,
    shadowColor: '#0088CC',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)'
  },
  summaryVal: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  summaryLab: { 
    color: '#E0F2FE', 
    fontSize: 10, 
    marginTop: 2, 
    fontWeight: '600',
    textTransform: 'uppercase'
  },

  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap'
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 4
  },
  filterPillActive: {
    backgroundColor: '#0088CC'
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  filterPillTextActive: {
    color: '#fff'
  },

  listPadding: { padding: 15, paddingBottom: 50 },
  stockCard: { 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },

  cardHeader: { 
    flexDirection: 'row', 
    padding: 16, 
    alignItems: 'flex-start',
    gap: 12
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  skuText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4
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
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },

  statsGrid: { 
    flexDirection: 'row', 
    backgroundColor: '#F9FAFB', 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  statBox: { flex: 1, padding: 14, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderColor: '#E5E7EB' },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6
  },
  statLabel: { 
    fontSize: 9, 
    color: '#9CA3AF', 
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#4B5563' },

  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff'
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600'
  },
  viewRegisterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4
  },
  viewRegisterText: { 
    color: '#0088CC', 
    fontSize: 12, 
    fontWeight: 'bold'
  },

  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 80,
    paddingHorizontal: 40
  },
  emptyText: { 
    color: '#6B7280', 
    marginTop: 12, 
    fontSize: 16,
    fontWeight: '600'
  },
  emptySubText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4
  },

  // Sales Register Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  closeButton: {
    padding: 4
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2
  },
  modalProductCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3
  },
  modalProductInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  modalProductSKU: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4
  },
  modalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4
  },
  modalCategoryText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600'
  },
  modalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  modalStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  modalStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    gap: 12
  },
  modalStatBox: {
    flex: 1,
    alignItems: 'center'
  },
  modalStatLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937'
  },
  modalListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  modalListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151'
  },
  modalListContent: {
    padding: 15,
    paddingBottom: 50
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  saleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14
  },
  saleInvoice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  saleDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  saleStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4
  },
  saleStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  saleDivider: {
    height: 1,
    backgroundColor: '#F3F4F6'
  },
  saleDetails: {
    padding: 14,
    gap: 8
  },
  saleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  saleDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    minWidth: 80
  },
  saleDetailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1
  },
  saleFooter: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  saleFooterItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center'
  },
  saleFooterDivider: {
    width: 1,
    backgroundColor: '#E5E7EB'
  },
  saleFooterLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  saleFooterValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937'
  }
});

export default StockSummaryScreen;