import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, Share, StatusBar, Platform, ScrollView,
  Alert, ActivityIndicator, TextInput
} from 'react-native';
import apiService from '../../../services/api';

const OutstandingApp = () => {
  const [currentScreen, setCurrentScreen] = useState('groups');
  const [selectedLedger, setSelectedLedger] = useState<any>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null); // ← NEW
  const [searchQuery, setSearchQuery] = useState('');

  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => { fetchOutstandingList(); }, []);

  const fetchOutstandingList = async () => {
    try {
      setLoadingGroups(true);
      const result = await apiService.getOutstandingList();
      if (result?.success && result?.data) {
        const items: any[] = result.data?.outstandingList || [];
        const groupMap: Record<string, any> = {};
        items.forEach((item: any) => {
          const name = item.partyName || 'Unknown';
          if (!groupMap[name]) {
            groupMap[name] = {
              _id: item.partyId || name,
              partyName: name,
              outstandingAmount: 0,
              daysOverdue: 0,
              updatedAt: item.updatedAt,
              items: [],
            };
          }
          groupMap[name].outstandingAmount += item.outstandingAmount || 0;
          groupMap[name].daysOverdue = Math.max(groupMap[name].daysOverdue, item.daysOverdue || 0);
          groupMap[name].items.push(item);
        });
        const groups = Object.values(groupMap);
        setLedgerGroups(groups);
        const total = items.reduce((s: number, i: any) => s + (i.outstandingAmount || 0), 0);
        setSummary({ totalOutstanding: total });
      }
    } catch (e) {
      setLedgerGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const getName = (item: any) => item.partyName || item.ledgerName || item.name || item.LedgerName || 'Unknown';
  const getOutstanding = (item: any) => item.outstandingAmount || 0;
  const getInvoiceCount = (item: any) => item.items?.length || item.invoiceCount || 0;
  const getOverdueDays = (item: any) => item.daysOverdue || item.overdueDays || 0;
  const getLastActivity = (item: any) => {
    const d = item.items?.[0]?.vchdate || item.updatedAt;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const getBillVoucher = (b: any) => b.vchnumber || b.voucherNo || b.outstandingId || b._id?.slice(-6).toUpperCase();
  const getBillAmount = (b: any) => b.outstandingAmount || b.totalAmount || 0;
  const getBillDate = (b: any) => {
    const d = b.vchdate || b.date || b.createdAt;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };
  const getBillDue = (b: any) => {
    const d = b.dueDate;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };
  const getBillOverdue = (b: any) => b.daysOverdue || b.overdueDays || 0;
  const getBillItems = (b: any) => b.description || '—';

  const filteredGroups = ledgerGroups.filter(g =>
    getName(g).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOutstanding = summary?.totalOutstanding
    ?? ledgerGroups.reduce((s, g) => s + getOutstanding(g), 0);

  const openLedgerDetails = (ledger: any) => {
    setSelectedLedger(ledger);
    setCurrentScreen('details');
    setBills(ledger.items || []);
  };

  // ── NEW: open bill detail screen ──
  const openBillDetail = (bill: any) => {
    setSelectedBill(bill);
    setCurrentScreen('billDetail');
  };

  const goBack = () => {
    if (currentScreen === 'billDetail') {
      setCurrentScreen('details');
      setSelectedBill(null);
    } else if (currentScreen === 'details') {
      setCurrentScreen('groups');
      setSelectedLedger(null);
      setBills([]);
    }
  };

  // ─── Groups List Screen ───
  const GroupsListScreen = () => {
    const renderGroupCard = ({ item }: any) => (
      <TouchableOpacity style={styles.groupCard} onPress={() => openLedgerDetails(item)} activeOpacity={0.7}>
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{getName(item)}</Text>
            <View style={styles.groupMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📄</Text>
                <Text style={styles.metaText}>{getInvoiceCount(item)} invoice{getInvoiceCount(item) !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={styles.metaText}>{getLastActivity(item)}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
        <View style={styles.groupFooter}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Outstanding</Text>
            <Text style={styles.amountValue}>₹{getOutstanding(item).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[
            styles.overdueChip,
            getOverdueDays(item) > 90 ? styles.overdueChipCritical :
            getOverdueDays(item) > 60 ? styles.overdueChipHigh :
            getOverdueDays(item) > 30 ? styles.overdueChipMedium : styles.overdueChipLow
          ]}>
            <Text style={[
              styles.overdueChipText,
              getOverdueDays(item) > 90 ? styles.overdueChipTextCritical :
              getOverdueDays(item) > 60 ? styles.overdueChipTextHigh :
              getOverdueDays(item) > 30 ? styles.overdueChipTextMedium : styles.overdueChipTextLow
            ]}>
              {getOverdueDays(item) > 0 ? `${getOverdueDays(item)} days overdue` : 'Current'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Outstanding Reports</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.summaryBanner}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Outstanding</Text>
            <Text style={styles.summaryValue}>₹{totalOutstanding.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{filteredGroups.length} Parties</Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search parties..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {filteredGroups.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Parties</Text>
            <Text style={styles.sectionCount}>{filteredGroups.length} result{filteredGroups.length > 1 ? 's' : ''}</Text>
          </View>
        )}
        {loadingGroups ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading outstanding...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredGroups}
            keyExtractor={(item, i) => item._id || item.id || String(i)}
            renderItem={renderGroupCard}
            contentContainerStyle={[styles.listContent, filteredGroups.length === 0 && styles.listContentEmpty]}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>{searchQuery ? 'No Results Found' : 'No Outstanding Records'}</Text>
                <Text style={styles.emptySubtitle}>{searchQuery ? 'Try adjusting your search' : 'All accounts are clear'}</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    );
  };

  // ─── Details Screen ───
  const DetailsScreen = () => {
    const [isSharing, setIsSharing] = useState(false);
    const totalAmount = bills.reduce((s, b) => s + getBillAmount(b), 0);

    const onShareStatement = async () => {
      try {
        setIsSharing(true);
        await Share.share({
          message: `Outstanding Statement for ${getName(selectedLedger)}\n\nTotal Pending: ₹${totalAmount.toLocaleString('en-IN')}\n\nPlease process payment soon.`,
          title: 'Outstanding Statement',
        });
      } catch { Alert.alert('Error', 'Failed to share statement.'); }
      finally { setIsSharing(false); }
    };

    const onRemindBill = async (bill: any) => {
      try {
        await Share.share({
          message: `Payment Reminder\n\nInvoice: ${getBillVoucher(bill)}\nAmount: ₹${getBillAmount(bill).toLocaleString('en-IN')}\nOverdue: ${getBillOverdue(bill)} days`,
        });
      } catch { Alert.alert('Error', 'Failed to send reminder.'); }
    };

    const renderBillCard = ({ item }: any) => (
      <View style={styles.billCard}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.voucherSection}>
              <View style={styles.voucherBadge}>
                <Text style={styles.voucherBadgeText}>INVOICE</Text>
              </View>
              <Text style={styles.billVoucher}>{getBillVoucher(item)}</Text>
            </View>
            <View style={styles.amountSection}>
              <Text style={styles.billAmount}>₹{getBillAmount(item).toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Invoice Date</Text>
              <Text style={styles.dateValue}>{getBillDate(item)}</Text>
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={styles.dateValue}>{getBillDue(item)}</Text>
            </View>
          </View>
          {typeof getBillItems(item) === 'string' && getBillItems(item) !== '—' && (
            <View style={styles.itemsRow}>
              <Text style={styles.itemLabel}>Items</Text>
              <Text style={styles.itemText} numberOfLines={2}>{getBillItems(item)}</Text>
            </View>
          )}
          {getBillOverdue(item) > 0 && (
            <View style={styles.overdueContainer}>
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueIcon}>⏰</Text>
                <Text style={styles.overdueText}>Overdue by {getBillOverdue(item)} days</Text>
              </View>
            </View>
          )}
          <View style={styles.cardActions}>
            {/* ── FIXED: was Alert.alert, now navigates to BillDetailScreen ── */}
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => openBillDetail(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnTextSecondary}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => onRemindBill(item)} activeOpacity={0.7}>
              <Text style={styles.actionBtnTextPrimary}>Send Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Outstanding Details</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.ledgerName}>{getName(selectedLedger)}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{bills.length} Pending</Text>
              </View>
            </View>
            <View style={styles.summaryAmount}>
              <Text style={styles.amountLabel}>Total Outstanding</Text>
              <Text style={styles.amountValue}>₹ {totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.agingSection}>
              <Text style={styles.agingTitle}>Aging Analysis</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agingScrollContent}>
                {[
                  { label: '1-30 days', key: 30 },
                  { label: '31-60 days', key: 60 },
                  { label: '61-90 days', key: 90 },
                  { label: '90+ days', key: 999 },
                ].map(({ label, key }) => {
                  const amt = bills
                    .filter(b => {
                      const d = getBillOverdue(b);
                      if (key === 30) return d >= 1 && d <= 30;
                      if (key === 60) return d >= 31 && d <= 60;
                      if (key === 90) return d >= 61 && d <= 90;
                      return d > 90;
                    })
                    .reduce((s, b) => s + getBillAmount(b), 0);
                  const isActive = key === 999 && bills.some(b => getBillOverdue(b) > 90);
                  return (
                    <View key={key} style={[styles.agingItem, isActive && styles.agingItemActive]}>
                      <Text style={isActive ? styles.agingDaysActive : styles.agingDays}>{label}</Text>
                      <Text style={isActive ? styles.agingAmountActive : styles.agingAmount}>₹{amt.toLocaleString('en-IN')}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
          {bills.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Invoice Details</Text>
              <Text style={styles.sectionCount}>{bills.length} invoice{bills.length > 1 ? 's' : ''}</Text>
            </View>
          )}
          {bills.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Invoices</Text>
              <Text style={styles.emptySubtitle}>No outstanding invoices found</Text>
            </View>
          ) : (
            bills.map((item, i) => <View key={item._id || item.id || i}>{renderBillCard({ item })}</View>)
          )}
        </ScrollView>
        {bills.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.shareBtn, isSharing && styles.shareBtnDisabled]} onPress={onShareStatement} disabled={isSharing} activeOpacity={0.7}>
              <Text style={styles.shareIcon}>📤</Text>
              <Text style={styles.shareBtnText}>{isSharing ? 'Sharing...' : 'Share Statement'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  };

  // ─── NEW: Bill Detail Screen ───
  const BillDetailScreen = () => {
    const bill = selectedBill;
    const overdue = getBillOverdue(bill);

    const onSendReminder = async () => {
      try {
        await Share.share({
          message: `Payment Reminder\n\nInvoice: ${getBillVoucher(bill)}\nAmount: ₹${getBillAmount(bill).toLocaleString('en-IN')}\nInvoice Date: ${getBillDate(bill)}\nDue Date: ${getBillDue(bill)}\nOverdue: ${overdue} days\n\nPlease clear the outstanding at the earliest.`,
        });
      } catch { Alert.alert('Error', 'Failed to send reminder.'); }
    };

    const Row = ({ label, value }: { label: string; value: string }) => (
      <View style={styles.detailRowItem}>
        <Text style={styles.detailRowLabel}>{label}</Text>
        <Text style={styles.detailRowValue}>{value}</Text>
      </View>
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Invoice Details</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Amount hero card */}
          <View style={styles.billDetailHero}>
            <View style={styles.voucherBadge}>
              <Text style={styles.voucherBadgeText}>INVOICE</Text>
            </View>
            <Text style={styles.billDetailVoucher}>{getBillVoucher(bill)}</Text>
            <Text style={styles.billDetailAmount}>₹{getBillAmount(bill).toLocaleString('en-IN')}</Text>
            <Text style={styles.billDetailParty}>{getName(selectedLedger)}</Text>
            {overdue > 0 && (
              <View style={[styles.overdueBadge, { marginTop: 12, alignSelf: 'center' }]}>
                <Text style={styles.overdueIcon}>⏰</Text>
                <Text style={styles.overdueText}>Overdue by {overdue} days</Text>
              </View>
            )}
          </View>

          {/* Details card */}
          <View style={styles.billDetailCard}>
            <Text style={styles.billDetailSectionTitle}>Invoice Information</Text>
            <Row label="Voucher No." value={getBillVoucher(bill)} />
            <View style={styles.detailDivider} />
            <Row label="Invoice Date" value={getBillDate(bill)} />
            <View style={styles.detailDivider} />
            <Row label="Due Date" value={getBillDue(bill)} />
            <View style={styles.detailDivider} />
            <Row label="Outstanding Amount" value={`₹${getBillAmount(bill).toLocaleString('en-IN')}`} />
            {getBillItems(bill) !== '—' && (
              <>
                <View style={styles.detailDivider} />
                <Row label="Description" value={getBillItems(bill)} />
              </>
            )}
            {overdue > 0 && (
              <>
                <View style={styles.detailDivider} />
                <Row label="Days Overdue" value={`${overdue} days`} />
              </>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.shareBtn} onPress={onSendReminder} activeOpacity={0.7}>
            <Text style={styles.shareIcon}>🔔</Text>
            <Text style={styles.shareBtnText}>Send Reminder</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  if (currentScreen === 'billDetail') return <BillDetailScreen />;
  if (currentScreen === 'details') return <DetailsScreen />;
  return <GroupsListScreen />;
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E8ECF1' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? 15 : 0, height: 56 },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { color: '#1A1D1F', fontSize: 24, fontWeight: '600' },
  headerTitle: { color: '#1A1D1F', fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },
  headerSpacer: { width: 40 },
  summaryBanner: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, marginBottom: 12, borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  summaryContent: { flex: 1 },
  summaryLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: '500' },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#1A1D1F', letterSpacing: -0.5 },
  summaryBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  summaryBadgeText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchBox: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E8ECF1' },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1D1F' },
  clearIcon: { fontSize: 16, color: '#9CA3AF', paddingHorizontal: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F5F7FA' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1D1F', letterSpacing: 0.3 },
  sectionCount: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  groupCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, borderWidth: 1, borderColor: '#E8ECF1' },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 17, fontWeight: '700', color: '#1A1D1F', marginBottom: 8 },
  groupMeta: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaIcon: { fontSize: 12, marginRight: 4 },
  metaText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  metaDivider: { width: 1, height: 12, backgroundColor: '#E8ECF1', marginHorizontal: 10 },
  chevron: { fontSize: 24, color: '#9CA3AF', fontWeight: '300' },
  groupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  amountContainer: { flex: 1 },
  amountLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  amountValue: { fontSize: 18, fontWeight: '800', color: '#1A1D1F', letterSpacing: -0.3 },
  overdueChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  overdueChipLow: { backgroundColor: '#F0FDF4' },
  overdueChipMedium: { backgroundColor: '#FEF3C7' },
  overdueChipHigh: { backgroundColor: '#FEE2E2' },
  overdueChipCritical: { backgroundColor: '#FEF3F2' },
  overdueChipText: { fontSize: 11, fontWeight: '600' },
  overdueChipTextLow: { color: '#15803D' },
  overdueChipTextMedium: { color: '#CA8A04' },
  overdueChipTextHigh: { color: '#DC2626' },
  overdueChipTextCritical: { color: '#B91C1C' },
  scrollContent: { paddingBottom: 120 },
  listContent: { paddingBottom: 100 },
  listContentEmpty: { flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1D1F', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  summaryCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, marginBottom: 12, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  ledgerName: { fontSize: 16, fontWeight: '600', color: '#1A1D1F', flex: 1 },
  statusBadge: { backgroundColor: '#FFF4E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#FF9500' },
  summaryAmount: { marginBottom: 24 },
  agingSection: { borderTopWidth: 1, borderTopColor: '#F0F2F5', paddingTop: 16 },
  agingTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 12, letterSpacing: 0.8, textTransform: 'uppercase' },
  agingScrollContent: { gap: 10 },
  agingItem: { backgroundColor: '#F8F9FB', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, minWidth: 100, borderWidth: 1, borderColor: '#E8ECF1' },
  agingItemActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  agingDays: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  agingAmount: { fontSize: 14, color: '#1A1D1F', fontWeight: '700' },
  agingDaysActive: { fontSize: 11, color: '#C7D2FE', fontWeight: '600', marginBottom: 4 },
  agingAmountActive: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  billCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, borderWidth: 1, borderColor: '#E8ECF1' },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  voucherSection: { flex: 1 },
  voucherBadge: { backgroundColor: '#F0F2F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  voucherBadgeText: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  billVoucher: { fontSize: 16, fontWeight: '700', color: '#1A1D1F' },
  amountSection: { alignItems: 'flex-end' },
  billAmount: { fontSize: 20, fontWeight: '800', color: '#1A1D1F', letterSpacing: -0.3 },
  detailsRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  dateInfo: { flex: 1 },
  dateLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  dateValue: { fontSize: 14, color: '#1A1D1F', fontWeight: '600' },
  itemsRow: { marginBottom: 16 },
  itemLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  itemText: { fontSize: 13, color: '#1A1D1F', fontWeight: '500', lineHeight: 18 },
  overdueContainer: { marginBottom: 16 },
  overdueBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  overdueIcon: { fontSize: 12, marginRight: 6 },
  overdueText: { fontSize: 12, color: '#B91C1C', fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtnSecondary: { flex: 1, backgroundColor: '#F8F9FB', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E8ECF1' },
  actionBtnTextSecondary: { fontSize: 13, fontWeight: '600', color: '#1A1D1F' },
  actionBtnPrimary: { flex: 1, backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnTextPrimary: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: '#E8ECF1', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  shareBtn: { backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareBtnDisabled: { opacity: 0.6 },
  shareIcon: { fontSize: 16 },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // ── NEW styles for BillDetailScreen ──
  billDetailHero: { backgroundColor: '#4F46E5', marginHorizontal: 16, marginTop: 16, marginBottom: 12, borderRadius: 16, padding: 24, alignItems: 'flex-start' },
  billDetailVoucher: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, marginTop: 8 },
  billDetailAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  billDetailParty: { fontSize: 14, color: '#C7D2FE', fontWeight: '500' },
  billDetailCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, borderWidth: 1, borderColor: '#E8ECF1' },
  billDetailSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 16 },
  detailRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  detailRowLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  detailRowValue: { fontSize: 14, color: '#1A1D1F', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  detailDivider: { height: 1, backgroundColor: '#F0F2F5' },
});

export default OutstandingApp;