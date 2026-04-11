import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../../services/api';

const StockSummaryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSalesRegister, setShowSalesRegister] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewAllProducts, setViewAllProducts] = useState(false);

  // --- API state ---
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    fetchStocks();
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const result = await apiService.getStockSummary();
      if (result?.success && result?.data) setSummaryData(result.data);
    } catch (e) {}
  };

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const result = await apiService.getStocks();
      if (result?.success && result?.data) {
        const data = result.data?.stocks || result.data?.items || result.data?.data || result.data || [];
        setStocks(Array.isArray(data) ? data : []);
      } else {
        setStocks([]);
      }
    } catch (e) {
      setStocks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchStocks(); fetchSummary(); };

  // Normalise fields
  const getProductName = (s: any) => s.productName || s.name || s.stockName || s.product?.name || '—';
  const getSku = (s: any) => s.sku || s.SKU || s.code || s.product?.sku || '';
  const getCategory = (s: any) => s.category || s.productCategory || s.product?.category || '';
  const getInHand = (s: any) => s.inHand ?? s.currentStock ?? s.quantity ?? s.stock?.current ?? 0;
  const getSold = (s: any) => s.subDealerSold ?? s.soldQuantity ?? s.sold ?? s.totalSold ?? 0;
  const getLastSaleDate = (s: any) => {
    const d = s.lastSaleDate || s.lastSale || s.updatedAt;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };
  const getTrend = (s: any) => s.trend || (getSold(s) > getInHand(s) ? 'up' : 'down');
  const getStatus = (s: any): string => {
    if (s.status) return s.status;
    const inHand = getInHand(s);
    const min = s.stock?.minimum ?? s.minStock ?? 10;
    if (inHand === 0) return 'Out of Stock';
    if (inHand <= min) return 'Low Stock';
    if (inHand > 100) return 'Overstocked';
    if (getSold(s) > 50) return 'Fast Mover';
    return 'Healthy';
  };
  const getSalesHistory = (s: any): any[] => s.salesHistory || s.transactions || s.sales || [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Out of Stock': return { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle' };
      case 'Low Stock':    return { bg: '#FEF3C7', text: '#D97706', icon: 'warning' };
      case 'Overstocked': return { bg: '#DBEAFE', text: '#2563EB', icon: 'archive' };
      case 'Fast Mover':  return { bg: '#D1FAE5', text: '#059669', icon: 'flash' };
      default:            return { bg: '#D1FAE5', text: '#10B981', icon: 'checkmark-circle' };
    }
  };

  // Summary stats (prefer API, fallback to computed)
  const totalSales = summaryData?.totalSold ?? summaryData?.totalSales ?? stocks.reduce((s, i) => s + getSold(i), 0);
  const totalStock = summaryData?.totalStock ?? summaryData?.totalInHand ?? stocks.reduce((s, i) => s + getInHand(i), 0);
  const lowStockCount = summaryData?.lowStockCount ?? stocks.filter(i => getStatus(i) === 'Low Stock' || getStatus(i) === 'Out of Stock').length;

  const filteredData = stocks.filter(item => {
    const status = getStatus(item);
    const matchesSearch =
      getProductName(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSku(item).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'low' && status === 'Low Stock') ||
      (filterStatus === 'out' && status === 'Out of Stock') ||
      (filterStatus === 'fast' && status === 'Fast Mover');
    return matchesSearch && matchesFilter;
  });

  const openSalesRegister = (product: any) => {
    setSelectedProduct(product); setViewAllProducts(false); setShowSalesRegister(true);
  };

  const openAllProductsRegister = () => {
    setSelectedProduct(null); setViewAllProducts(true); setShowSalesRegister(true);
  };

  // Get all sales for all stocks
  const getAllSalesData = () => {
    const all: any[] = [];
    stocks.forEach(s => {
      getSalesHistory(s).forEach((sale: any) => {
        all.push({ ...sale, productId: s._id || s.id, productName: getProductName(s), sku: getSku(s) });
      });
    });
    return all.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  };

  const getSaleInvoice = (s: any) => s.invoiceNo || s.voucherNo || s._id?.slice(-6).toUpperCase() || '—';
  const getSaleDate = (s: any) => {
    const d = s.date || s.createdAt;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };
  const getSaleDealer = (s: any) => s.subDealer || s.dealerName || s.customer || s.party || '—';
  const getSaleLocation = (s: any) => s.location || s.city || s.state || '—';
  const getSaleQty = (s: any) => s.quantity || s.qty || 0;
  const getSaleAmount = (s: any) => s.amount ? `₹ ${Number(s.amount).toLocaleString('en-IN')}` : '—';
  const getSaleStatus = (s: any) => s.status || 'Delivered';

  const renderSalesRegisterModal = () => {
    const salesData = viewAllProducts ? getAllSalesData() : getSalesHistory(selectedProduct || {});
    const totalQty = salesData.reduce((s: number, sale: any) => s + getSaleQty(sale), 0);

    const renderSaleItem = ({ item }: any) => (
      <View style={styles.saleCard}>
        <View style={styles.saleCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saleInvoice}>#{getSaleInvoice(item)}</Text>
            <Text style={styles.saleDate}>{getSaleDate(item)}</Text>
          </View>
          <View style={[styles.saleStatusBadge, { backgroundColor: getSaleStatus(item) === 'Delivered' ? '#D1FAE5' : '#DBEAFE' }]}>
            <Text style={[styles.saleStatusText, { color: getSaleStatus(item) === 'Delivered' ? '#059669' : '#2563EB' }]}>
              {getSaleStatus(item)}
            </Text>
          </View>
        </View>
        <View style={styles.saleDivider} />

        {viewAllProducts && item.productName && (
          <View style={styles.saleProductInfo}>
            <Ionicons name="cube-outline" size={14} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.saleProductName}>{item.productName}</Text>
              {item.sku && <Text style={styles.saleProductSku}>SKU: {item.sku}</Text>}
            </View>
          </View>
        )}

        <View style={styles.saleDetails}>
          <View style={styles.saleDetailRow}>
            <Ionicons name="business-outline" size={14} color="#6B7280" />
            <Text style={styles.saleDetailLabel}>Sub-Dealer:</Text>
            <Text style={styles.saleDetailValue}>{getSaleDealer(item)}</Text>
          </View>
          <View style={styles.saleDetailRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.saleDetailLabel}>Location:</Text>
            <Text style={styles.saleDetailValue}>{getSaleLocation(item)}</Text>
          </View>
        </View>

        <View style={styles.saleFooter}>
          <View style={styles.saleFooterItem}>
            <Text style={styles.saleFooterLabel}>Quantity</Text>
            <Text style={styles.saleFooterValue}>{getSaleQty(item)} units</Text>
          </View>
          <View style={styles.saleFooterDivider} />
          <View style={styles.saleFooterItem}>
            <Text style={styles.saleFooterLabel}>Amount</Text>
            <Text style={[styles.saleFooterValue, { color: '#10B981' }]}>{getSaleAmount(item)}</Text>
          </View>
        </View>
      </View>
    );

    return (
      <Modal visible={showSalesRegister} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowSalesRegister(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSalesRegister(false)} style={styles.closeButton}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalTitle}>Sales Register</Text>
              <Text style={styles.modalSubtitle}>{viewAllProducts ? 'All Products' : getProductName(selectedProduct || {})}</Text>
            </View>
            {!viewAllProducts && (
              <TouchableOpacity style={styles.viewAllButton} onPress={openAllProductsRegister}>
                <Ionicons name="grid-outline" size={18} color="#0088CC" />
                <Text style={styles.viewAllButtonText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.modalProductCard}>
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Transactions</Text>
                <Text style={styles.modalStatValue}>{salesData.length}</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Total Quantity Sold</Text>
                <Text style={[styles.modalStatValue, { color: '#3B82F6' }]}>{totalQty}</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={salesData}
            keyExtractor={(item, i) => item._id || item.id || String(i)}
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

  const renderStockItem = ({ item }: any) => {
    const status = getStatus(item);
    const statusStyle = getStatusStyle(status);
    const trend = getTrend(item);

    return (
      <View style={styles.stockCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{getProductName(item)}</Text>
            {getSku(item) ? <Text style={styles.skuText}>SKU: {getSku(item)}</Text> : null}
            {getCategory(item) ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{getCategory(item)}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon as any} size={14} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{status}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>IN HAND</Text>
            <Text style={styles.statValue}>{getInHand(item)}</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={styles.statLabel}>SOLD</Text>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{getSold(item)}</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={styles.statLabel}>LAST SALE</Text>
            <Text style={styles.dateValue}>{getLastSaleDate(item)}</Text>
          </View>
        </View>

        <View style={styles.trendRow}>
          <View style={styles.trendIndicator}>
            <Ionicons name={trend === 'up' ? 'trending-up' : 'trending-down'} size={18} color={trend === 'up' ? '#10B981' : '#EF4444'} />
            <Text style={[styles.trendText, { color: trend === 'up' ? '#10B981' : '#EF4444' }]}>
              {trend === 'up' ? 'Trending Up' : 'Trending Down'}
            </Text>
          </View>
          <TouchableOpacity style={styles.viewRegisterBtn} onPress={() => openSalesRegister(item)}>
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
        <TouchableOpacity style={styles.headerButton} onPress={openAllProductsRegister}>
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
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
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
        {[
          { key: 'all', label: 'All' },
          { key: 'low', label: 'Low Stock' },
          { key: 'out', label: 'Out of Stock' },
          { key: 'fast', label: 'Fast Mover' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterPill, filterStatus === key && styles.filterPillActive]}
            onPress={() => setFilterStatus(key)}
          >
            <Text style={[styles.filterPillText, filterStatus === key && styles.filterPillTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0088CC" />
          <Text style={styles.loadingText}>Loading stocks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, i) => item._id || item.id || String(i)}
          renderItem={renderStockItem}
          contentContainerStyle={styles.listPadding}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No stock records found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  headerButtonText: { fontSize: 13, fontWeight: '600', color: '#0088CC' },
  searchSection: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 14, borderRadius: 12, height: 48 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },
  summaryStrip: { flexDirection: 'row', paddingVertical: 18, backgroundColor: '#0088CC', marginHorizontal: 15, borderRadius: 14, marginTop: 12 },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' },
  summaryVal: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  summaryLab: { color: '#E0F2FE', fontSize: 10, marginTop: 2, fontWeight: '600' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12, gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterPillActive: { backgroundColor: '#0088CC' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterPillTextActive: { color: '#fff' },
  listPadding: { padding: 15, paddingBottom: 50 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  stockCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'flex-start', gap: 12 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  skuText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  categoryBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6, alignSelf: 'flex-start' },
  categoryText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderTopWidth: 1, borderColor: '#E5E7EB' },
  statBox: { flex: 1, padding: 14, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderColor: '#E5E7EB' },
  statLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: 'bold', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  trendIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendText: { fontSize: 13, fontWeight: '600' },
  viewRegisterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewRegisterText: { color: '#0088CC', fontSize: 12, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 14, color: '#9CA3AF', marginTop: 12, fontWeight: '500' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  closeButton: { padding: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  viewAllButtonText: { fontSize: 12, fontWeight: '600', color: '#0088CC' },
  modalProductCard: { backgroundColor: '#fff', margin: 15, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  modalStatsRow: { flexDirection: 'row', gap: 12 },
  modalStatBox: { flex: 1, alignItems: 'center' },
  modalStatLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginBottom: 6 },
  modalStatValue: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  modalListContent: { padding: 15, paddingBottom: 50 },
  saleCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  saleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  saleInvoice: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  saleDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  saleStatusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  saleStatusText: { fontSize: 10, fontWeight: 'bold' },
  saleDivider: { height: 1, backgroundColor: '#F3F4F6' },
  saleProductInfo: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#F9FAFB', gap: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
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
});

export default StockSummaryScreen;
