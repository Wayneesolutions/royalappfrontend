import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Share
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../../../services/api';

const LedgerReportScreen = () => {
  // --- UI Navigation ---
  const [currentView, setCurrentView] = useState('hierarchy');
  const [selectedLedger, setSelectedLedger] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  // --- Ledger list state ---
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Transaction state ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // --- Date States ---
  const [isDateModalVisible, setDateModalVisible] = useState(false);
  const [dateLabel, setDateLabel] = useState('This Year');
  const [dateRange, setDateRange] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarStartDate, setCalendarStartDate] = useState<Date | null>(null);
  const [calendarEndDate, setCalendarEndDate] = useState<Date | null>(null);
  const [startDateParam, setStartDateParam] = useState<string | undefined>(undefined);
  const [endDateParam, setEndDateParam] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchLedgers();
    // Set default date range to this year
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 3, 1);
    const yearEnd = new Date(today.getFullYear() + 1, 2, 31);
    setDateRange(`${formatDate(yearStart)} - ${formatDate(yearEnd)}`);
  }, []);

  const fetchLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const result = await apiService.adminGetAllDealers();
      if (result?.success && result?.data?.dealers) {
        setLedgers(result.data.dealers);
      } else {
        setLedgers([]);
      }
    } catch (e) {
      setLedgers([]);
    } finally {
      setLoadingLedgers(false);
    }
  };

  const fetchLedgerDetails = async (ledgerId: string) => {
    try {
      setLoadingTransactions(true);
      const params: any = {};
      if (startDateParam) params.startDate = startDateParam;
      if (endDateParam) params.endDate = endDateParam;
      const result = await apiService.getLedgerDetails(ledgerId, params);
      if (result?.success && result?.data) {
        const txns = result.data?.transactions || result.data?.entries || [];
        setTransactions(Array.isArray(txns) ? txns : []);
        setLedgerSummary(result.data?.summary || result.data?.ledger || null);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const filteredLedgers = ledgers.filter(l =>
    (l.LedgerName || l.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- DATE HELPERS ---
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  };

  const toApiDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePredefinedDateSelect = (item: string) => {
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    let range = '';

    switch (item) {
      case 'Today':
        start = today; end = today;
        range = formatDate(today);
        break;
      case 'Yesterday':
        const yest = new Date(today); yest.setDate(yest.getDate() - 1);
        start = yest; end = yest;
        range = formatDate(yest);
        break;
      case 'This Week':
        start = new Date(today); start.setDate(today.getDate() - today.getDay());
        end = today;
        range = `${formatDate(start)} - ${formatDate(end)}`;
        break;
      case 'This Month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        range = `${formatDate(start)} - ${formatDate(end)}`;
        break;
      case 'Last Month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        range = `${formatDate(start)} - ${formatDate(end)}`;
        break;
      case 'This Quarter':
        const qm = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), qm, 1); end = today;
        range = `${formatDate(start)} - ${formatDate(end)}`;
        break;
      case 'This Year':
        start = new Date(today.getFullYear(), 3, 1);
        end = new Date(today.getFullYear() + 1, 2, 31);
        range = `${formatDate(start)} - ${formatDate(end)}`;
        break;
      case 'Last Year':
        start = new Date(today.getFullYear() - 1, 3, 1);
        end = new Date(today.getFullYear(), 2, 31);
        range = `${formatDate(start)} - ${formatDate(end)}`;
        break;
      case 'All':
        range = 'All Time'; start = null; end = null;
        break;
    }

    setDateLabel(item);
    setDateRange(range);
    setStartDateParam(start ? toApiDate(start) : undefined);
    setEndDateParam(end ? toApiDate(end) : undefined);
    setDateModalVisible(false);

    if (selectedLedger) {
      fetchLedgerDetails(selectedLedger._id || selectedLedger.id);
    }
  };

  const handleCalendarSave = () => {
    if (calendarStartDate && calendarEndDate) {
      setDateLabel('Custom Date');
      setDateRange(`${formatDate(calendarStartDate)} - ${formatDate(calendarEndDate)}`);
      setStartDateParam(toApiDate(calendarStartDate));
      setEndDateParam(toApiDate(calendarEndDate));
      setShowCalendar(false);
      setCalendarStartDate(null);
      setCalendarEndDate(null);
      if (selectedLedger) fetchLedgerDetails(selectedLedger._id || selectedLedger.id);
    }
  };

  const handleCalendarDatePress = (date: Date) => {
    if (!calendarStartDate || (calendarStartDate && calendarEndDate)) {
      setCalendarStartDate(date); setCalendarEndDate(null);
    } else {
      if (date < calendarStartDate) {
        setCalendarEndDate(calendarStartDate); setCalendarStartDate(date);
      } else {
        setCalendarEndDate(date);
      }
    }
  };

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const isInRange = (date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    return date >= start && date <= end;
  };

  const renderCalendarMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) days.push(<View key={`e-${i}`} style={styles.calendarDay} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const cur = new Date(year, month, day);
      const isStart = isSameDay(cur, calendarStartDate);
      const isEnd = isSameDay(cur, calendarEndDate);
      const inRange = calendarStartDate && calendarEndDate && isInRange(cur, calendarStartDate, calendarEndDate);
      days.push(
        <TouchableOpacity key={day} style={[styles.calendarDay, (isStart || isEnd) && styles.calendarDaySelected, inRange && !isStart && !isEnd && styles.calendarDayInRange]} onPress={() => handleCalendarDatePress(cur)}>
          <Text style={[(isStart || isEnd) && styles.calendarDayTextSelected, styles.calendarDayText]}>{day}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View key={`${year}-${month}`} style={styles.calendarMonthContainer}>
        <Text style={styles.calendarMonthTitle}>{monthNames[month]} {year}</Text>
        <View style={styles.calendarWeekDays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={styles.calendarWeekDay}>{d}</Text>)}
        </View>
        <View style={styles.calendarDaysGrid}>{days}</View>
      </View>
    );
  };

  // Format currency
  const formatAmount = (amount: number) => {
    if (!amount && amount !== 0) return '—';
    return `₹ ${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  // Get transaction type label
  const getTxnType = (txn: any) => txn.type || txn.voucherType || txn.transactionType || 'Entry';
  const getTxnAmount = (txn: any) => txn.amount || txn.debit || txn.credit || 0;
  const getTxnBalance = (txn: any) => txn.balance || txn.runningBalance || 0;
  const getTxnDate = (txn: any) => {
    const d = txn.date || txn.createdAt;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };
  const getTxnVoucher = (txn: any) => txn.voucherNo || txn.invoiceNo || txn.reference || txn._id?.slice(-6).toUpperCase();
  const isDebit = (txn: any) => (txn.debit > 0) || (txn.amount < 0) || (txn.type === 'Purchase');

  // --- SCREEN RENDERS ---
  const renderGroups = () => (
    <View style={styles.container}>
      <View style={styles.headerBlue}>
        <Text style={styles.headerTitle}>All Ledgers</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search Ledgers..."
            placeholderTextColor="#A0D8F1"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loadingLedgers ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0088CC" />
          <Text style={styles.loadingText}>Loading ledgers...</Text>
        </View>
      ) : filteredLedgers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📒</Text>
          <Text style={styles.emptyTitle}>No Ledgers Found</Text>
          <Text style={styles.emptySubtitle}>No ledger records available</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLedgers}
          keyExtractor={(item) => item._id || item.id || item.LedgerName}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupRow}
              onPress={() => {
                setSelectedLedger(item);
                setCurrentView('report');
                fetchLedgerDetails(item._id || item.id);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.groupText}>{item.LedgerName || item.name}</Text>
                {item.LedgerMobile && <Text style={styles.groupSub}>{item.LedgerMobile}</Text>}
              </View>
              <Text style={{ color: '#ccc', fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderReport = () => (
    <View style={styles.container}>
      <View style={styles.headerBlue}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => setCurrentView('hierarchy')}>
            <Text style={styles.whiteLink}>← {selectedLedger?.LedgerName || selectedLedger?.name}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.dateSelectorBar} onPress={() => setDateModalVisible(true)}>
          <Text style={styles.chevronIcon}>‹</Text>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.dateLabelText}>{dateLabel.toUpperCase()}</Text>
            <Text style={styles.dateRangeText}>{dateRange}</Text>
          </View>
          <Text style={styles.chevronIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {ledgerSummary && (
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Opening Balance</Text>
          <Text style={styles.balanceValue}>{formatAmount(ledgerSummary.openingBalance || ledgerSummary.opening || 0)}</Text>
        </View>
      )}

      {loadingTransactions ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0088CC" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>No Transactions</Text>
          <Text style={styles.emptySubtitle}>No transactions found for selected period</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, i) => item._id || item.id || String(i)}
          renderItem={({ item }) => {
            const amount = getTxnAmount(item);
            const isNeg = isDebit(item);
            return (
              <TouchableOpacity style={styles.reportCard} onPress={() => { setSelectedVoucher(item); setCurrentView('detail'); }}>
                <View style={styles.voucherHeader}>
                  <View>
                    <Text style={styles.vDate}>{getTxnDate(item)} | {getTxnType(item)}</Text>
                    {item.items?.map((prod: any, idx: number) => (
                      <Text key={idx} style={styles.itemSmallText}>{prod.name || prod.productName} ({prod.qty || prod.quantity} {prod.unit || 'pc'})</Text>
                    ))}
                    {!item.items && item.description && (
                      <Text style={styles.itemSmallText}>{item.description}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.vAmount, { color: isNeg ? '#D32F2F' : '#388E3C' }]}>
                      {isNeg ? '-' : ''}{formatAmount(amount)}
                    </Text>
                    <Text style={styles.vRunningBal}>({formatAmount(getTxnBalance(item))})</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={() =>
            ledgerSummary ? (
              <View style={[styles.balanceRow, { borderTopWidth: 1, borderColor: '#eee', marginTop: 10 }]}>
                <Text style={styles.balanceLabel}>Closing Balance</Text>
                <Text style={styles.balanceValue}>{formatAmount(ledgerSummary.closingBalance || ledgerSummary.closing || 0)}</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );

  const renderDetail = () => {
    if (!selectedVoucher) return null;
    const amount = getTxnAmount(selectedVoucher);
    const isNeg = isDebit(selectedVoucher);
    const isPaid = selectedVoucher.status === 'paid' || selectedVoucher.status === 'PAID';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setCurrentView('report')}>
            <Text style={styles.whiteLink}>← Voucher: {getTxnVoucher(selectedVoucher)}</Text>
          </TouchableOpacity>
          <View style={styles.detailHero}>
            <Text style={styles.detailAmountBig}>{isNeg ? '-' : ''}{formatAmount(amount)}</Text>
            <Text style={styles.detailClientName}>{selectedLedger?.LedgerName || selectedLedger?.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isPaid ? '#388E3C' : '#D32F2F' }]}>
              <Text style={styles.statusText}>{selectedVoucher.status?.toUpperCase() || (isNeg ? 'DEBIT' : 'CREDIT')}</Text>
            </View>
          </View>
          <View style={styles.invoiceDueDates}>
            <View>
              <Text style={styles.dateSub}>Date</Text>
              <Text style={styles.dateMain}>{getTxnDate(selectedVoucher)}</Text>
            </View>
            {selectedVoucher.dueDate && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.dateSub}>Due Date</Text>
                <Text style={styles.dateMain}>{new Date(selectedVoucher.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollContent}>
          {selectedVoucher.items && selectedVoucher.items.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>ITEMS</Text>
              {selectedVoucher.items.map((item: any, i: number) => (
                <View key={i} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.fullItemName}>{item.name || item.productName}</Text>
                    <Text style={styles.fullItemPrice}>₹ {(item.total || item.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetailText}>Qty: {item.qty || item.quantity} {item.unit || 'pc'}</Text>
                    <Text style={styles.itemDetailText}>Rate: ₹ {(item.rate || item.price || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>SUMMARY</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBlue}>Gross Total</Text>
              <Text style={styles.summaryValueBlue}>{formatAmount(selectedVoucher.grossTotal || amount)}</Text>
            </View>
            {selectedVoucher.taxAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>{formatAmount(selectedVoucher.taxAmount)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>{formatAmount(selectedVoucher.netAmount || amount)}</Text>
            </View>
          </View>

          {selectedVoucher.notes && (
            <>
              <Text style={styles.sectionTitle}>NOTES</Text>
              <View style={styles.termsBox}>
                <Text style={styles.termsText}>{selectedVoucher.notes}</Text>
              </View>
            </>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => Share.share({ message: `Ledger Entry\nVoucher: ${getTxnVoucher(selectedVoucher)}\nAmount: ${formatAmount(amount)}\nDate: ${getTxnDate(selectedVoucher)}` })}
        >
          <Text style={styles.shareBtnText}>SHARE DETAILS</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {currentView === 'hierarchy' && renderGroups()}
      {currentView === 'report' && renderReport()}
      {currentView === 'detail' && renderDetail()}

      {/* Date Modal */}
      <Modal visible={isDateModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Text style={{ fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {['Today', 'Yesterday', 'This Week', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Last Year', 'All', 'Custom Date'].map(item => (
                <TouchableOpacity key={item} style={styles.modalOption} onPress={() => {
                  if (item === 'Custom Date') {
                    setDateModalVisible(false);
                    setTimeout(() => setShowCalendar(true), 300);
                  } else {
                    handlePredefinedDateSelect(item);
                  }
                }}>
                  <Text style={[styles.optionText, item === dateLabel && { color: '#0088cc', fontWeight: 'bold' }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => { setShowCalendar(false); setCalendarStartDate(null); setCalendarEndDate(null); }}>
                <Text style={styles.calendarCloseBtn}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.calendarHeaderTitle}>SELECT RANGE</Text>
              <TouchableOpacity onPress={handleCalendarSave} disabled={!calendarStartDate || !calendarEndDate}>
                <Text style={[styles.calendarSaveBtn, (!calendarStartDate || !calendarEndDate) && { opacity: 0.3 }]}>SAVE</Text>
              </TouchableOpacity>
            </View>
            {calendarStartDate && calendarEndDate && (
              <View style={styles.calendarSelectedRange}>
                <Text style={styles.calendarSelectedText}>{formatDate(calendarStartDate)} - {formatDate(calendarEndDate)}</Text>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {[0, 1, 2, 3, 4, 5].map(offset => {
                const d = new Date(); d.setMonth(d.getMonth() + offset);
                return renderCalendarMonth(d.getFullYear(), d.getMonth());
              })}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F9' },
  headerBlue: { backgroundColor: '#0088CC', padding: 15, paddingTop: 40 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0077B3', borderRadius: 5, paddingHorizontal: 10, marginTop: 10 },
  searchBar: { flex: 1, height: 40, color: '#fff' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  whiteLink: { color: '#fff', fontSize: 16 },
  dateSelectorBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0077B3', padding: 10, borderRadius: 5, marginTop: 15 },
  dateLabelText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  dateRangeText: { color: '#fff', fontSize: 13 },
  chevronIcon: { color: '#fff', fontSize: 20 },
  groupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  groupText: { fontSize: 16, color: '#333' },
  groupSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#EBF4FA' },
  balanceLabel: { color: '#555', fontSize: 14 },
  balanceValue: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  reportCard: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  voucherHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  vDate: { color: '#555', fontSize: 14, fontWeight: 'bold' },
  itemSmallText: { fontSize: 12, color: '#888', marginTop: 2 },
  vAmount: { fontSize: 16, fontWeight: 'bold' },
  vRunningBal: { color: '#999', fontSize: 12 },
  detailHeader: { backgroundColor: '#0088CC', padding: 15, paddingTop: 40 },
  detailHero: { alignItems: 'center', paddingVertical: 20 },
  detailAmountBig: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  detailClientName: { color: '#fff', fontSize: 18, marginTop: 5 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, marginTop: 10 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  invoiceDueDates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  dateSub: { color: '#AAD4FF', fontSize: 12 },
  dateMain: { color: '#fff', fontSize: 15, fontWeight: '500' },
  scrollContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#999', marginTop: 20, marginBottom: 12, letterSpacing: 0.5 },
  itemCard: { backgroundColor: '#fff', padding: 15, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#E5E5E5' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fullItemName: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1 },
  fullItemPrice: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  itemDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  itemDetailText: { fontSize: 13, color: '#777' },
  summaryBox: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 6, borderWidth: 1, borderColor: '#E5E5E5' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  summaryLabelBlue: { fontSize: 15, color: '#0088CC', fontWeight: '600' },
  summaryValueBlue: { fontSize: 15, color: '#0088CC', fontWeight: '600' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#E0E0E0', marginTop: 8, paddingTop: 12 },
  summaryTotalLabel: { fontSize: 16, color: '#333', fontWeight: 'bold' },
  summaryTotalValue: { fontSize: 16, color: '#333', fontWeight: 'bold' },
  termsBox: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 6, borderWidth: 1, borderColor: '#E5E5E5' },
  termsText: { color: '#555', fontSize: 14, lineHeight: 20 },
  shareBtn: { margin: 15, padding: 16, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#0088CC', alignItems: 'center', borderRadius: 6 },
  shareBtnText: { color: '#0088CC', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 15, borderTopRightRadius: 15, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 15, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalOption: { paddingVertical: 15, borderBottomWidth: 0.5, borderColor: '#f0f0f0' },
  optionText: { fontSize: 16, color: '#444' },
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  calendarModal: { flex: 1, backgroundColor: '#0088CC', paddingTop: 40 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  calendarCloseBtn: { color: '#fff', fontSize: 24, fontWeight: 'bold', width: 40 },
  calendarHeaderTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  calendarSaveBtn: { color: '#fff', fontSize: 14, fontWeight: 'bold', width: 40, textAlign: 'right' },
  calendarSelectedRange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0088CC', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#0077B3' },
  calendarSelectedText: { color: '#fff', fontSize: 15 },
  calendarMonthContainer: { backgroundColor: '#fff', marginBottom: 1, padding: 15 },
  calendarMonthTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  calendarWeekDays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  calendarWeekDay: { width: 40, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#666' },
  calendarDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', margin: 2 },
  calendarDayText: { fontSize: 15, color: '#333' },
  calendarDaySelected: { backgroundColor: '#0088CC', borderRadius: 20 },
  calendarDayTextSelected: { color: '#fff', fontWeight: 'bold' },
  calendarDayInRange: { backgroundColor: '#B3E5FC', borderRadius: 20 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6B7280' },
});

export default LedgerReportScreen;
