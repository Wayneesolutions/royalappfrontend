import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, TextInput, ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortKey = 'date_asc' | 'date_desc' | 'type_asc' | 'billno_asc' | 'billno_desc';

interface Transaction {
  _id: string;
  source: string;
  date: string;
  voucherNo: string;
  type: string;
  amount: number;
  debit: number;
  credit: number;
  partyName?: string;
  description?: string;
  balance: number;
  runningBalance?: number;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date_asc',   label: 'Date: Oldest First' },
  { key: 'date_desc',  label: 'Date: Newest First' },
  { key: 'type_asc',   label: 'Voucher Type (A-Z)' },
  { key: 'billno_asc', label: 'Bill No (A-Z)' },
  { key: 'billno_desc',label: 'Bill No (Z-A)' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDate = (date: Date) =>
  `${String(date.getDate()).padStart(2,'0')} ${SHORT_MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;

const toApiDate = (date: Date) => date.toISOString().split('T')[0];

const fmtAmt = (n: number) => {
  if (!n && n !== 0) return '—';
  return Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const fmtBalance = (n: number) => {
  if (n === 0) return '—';
  return `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${n >= 0 ? 'Dr' : 'Cr'}`;
};

const vchTypeColor = (type: string) => {
  switch ((type || '').toLowerCase()) {
    case 'sales':    return { bg: '#E8F5E9', text: '#2E7D32' };
    case 'purchase': return { bg: '#FFF3E0', text: '#E65100' };
    case 'receipt':  return { bg: '#E3F2FD', text: '#1565C0' };
    case 'payment':  return { bg: '#FCE4EC', text: '#C62828' };
    case 'journal':  return { bg: '#F3E5F5', text: '#6A1B9A' };
    default:         return { bg: '#F5F5F5', text: '#546E7A' };
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

const LedgerReportScreen = () => {
  const [currentView, setCurrentView] = useState<'list' | 'report'>('list');
  const [selectedLedger, setSelectedLedger] = useState<any>(null);

  // Ledger list
  const [ledgers, setLedgers]       = useState<any[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Transactions
  const [transactions, setTransactions]     = useState<Transaction[]>([]);
  const [ledgerSummary, setLedgerSummary]   = useState<any>(null);
  const [loadingTxns, setLoadingTxns]       = useState(false);

  // Sorting
  const [sortKey, setSortKey]               = useState<SortKey>('date_asc');
  const [isSortModalVisible, setSortModalVisible] = useState(false);

  // Date filter
  const [isDateModalVisible, setDateModalVisible] = useState(false);
  const [dateLabel, setDateLabel]     = useState('All');
  const [dateRange, setDateRange]     = useState('All Time');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calStart, setCalStart] = useState<Date | null>(null);
  const [calEnd,   setCalEnd]   = useState<Date | null>(null);
  const [startDateParam, setStartDateParam] = useState<string | undefined>(undefined);
  const [endDateParam,   setEndDateParam]   = useState<string | undefined>(undefined);

  useEffect(() => { fetchLedgers(); }, []);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const result = await apiService.adminGetAllDealers();
      setLedgers(result?.data?.dealers || []);
    } catch { setLedgers([]); }
    finally { setLoadingLedgers(false); }
  };

  const fetchLedgerDetails = async (ledgerId: string, sd?: string, ed?: string) => {
    try {
      setLoadingTxns(true);
      const params: any = {};
      if (sd) params.startDate = sd;
      if (ed) params.endDate   = ed;
      const result = await apiService.getLedgerDetails(ledgerId, params);
      if (result?.success && result?.data) {
        setLedgerSummary(result.data.summary || null);
        const raw: Transaction[] = result.data.transactions || [];

        // Always sort oldest→newest for correct running balance computation
        const TYPE_ORDER = ['Sales', 'Purchase', 'Receipt', 'Payment', 'Journal'];
        raw.sort((a, b) => {
          const dA = new Date(a.date).getTime();
          const dB = new Date(b.date).getTime();
          if (dA !== dB) return dA - dB;
          const tA = TYPE_ORDER.indexOf(a.type ?? '');
          const tB = TYPE_ORDER.indexOf(b.type ?? '');
          return (tA < 0 ? 99 : tA) - (tB < 0 ? 99 : tB);
        });

        // Running balance: Dr always reduces magnitude, Cr always increases magnitude
        const opening = result.data.summary?.openingBalance || 0;
        let running = opening;
        const withBalance = raw.map(t => {
          const sign = running >= 0 ? 1 : -1;
          const newMag = Math.abs(running) - (t.debit || 0) + (t.credit || 0);
          running = sign * newMag;
          return { ...t, runningBalance: running };
        });

        setTransactions(withBalance);
      } else {
        setLedgerSummary(null);
        setTransactions([]);
      }
    } catch {
      setLedgerSummary(null);
      setTransactions([]);
    } finally { setLoadingTxns(false); }
  };

  // ── Date helpers ─────────────────────────────────────────────────────────

  const applyDateRange = (label: string, start: Date | null, end: Date | null, range: string) => {
    const sd = start ? toApiDate(start) : undefined;
    const ed = end   ? toApiDate(end)   : undefined;
    setDateLabel(label);
    setDateRange(range);
    setStartDateParam(sd);
    setEndDateParam(ed);
    setDateModalVisible(false);
    if (selectedLedger) fetchLedgerDetails(selectedLedger._id, sd, ed);
  };

  const handlePredefinedDate = (item: string) => {
    const today = new Date();
    switch (item) {
      case 'Today':
        applyDateRange('Today', today, today, formatDate(today));
        break;
      case 'Yesterday': {
        const y = new Date(today); y.setDate(y.getDate() - 1);
        applyDateRange('Yesterday', y, y, formatDate(y));
        break;
      }
      case 'This Week': {
        const s = new Date(today); s.setDate(today.getDate() - today.getDay());
        applyDateRange('This Week', s, today, `${formatDate(s)} - ${formatDate(today)}`);
        break;
      }
      case 'This Month': {
        const s = new Date(today.getFullYear(), today.getMonth(), 1);
        applyDateRange('This Month', s, today, `${formatDate(s)} - ${formatDate(today)}`);
        break;
      }
      case 'Last Month': {
        const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const e = new Date(today.getFullYear(), today.getMonth(), 0);
        applyDateRange('Last Month', s, e, `${formatDate(s)} - ${formatDate(e)}`);
        break;
      }
      case 'This Year': {
        const s = new Date(today.getFullYear(), 3, 1);
        const e = new Date(today.getFullYear() + 1, 2, 31);
        applyDateRange('This Year', s, e, `${formatDate(s)} - ${formatDate(e)}`);
        break;
      }
      case 'Last Year': {
        const s = new Date(today.getFullYear() - 1, 3, 1);
        const e = new Date(today.getFullYear(), 2, 31);
        applyDateRange('Last Year', s, e, `${formatDate(s)} - ${formatDate(e)}`);
        break;
      }
      case 'All':
        applyDateRange('All', null, null, 'All Time');
        break;
    }
  };

  const handleCalendarSave = () => {
    if (calStart && calEnd) {
      const label = 'Custom';
      const range = `${formatDate(calStart)} - ${formatDate(calEnd)}`;
      applyDateRange(label, calStart, calEnd, range);
      setShowCalendar(false);
      setCalStart(null);
      setCalEnd(null);
    }
  };

  const handleDayPress = (date: Date) => {
    if (!calStart || (calStart && calEnd)) {
      setCalStart(date); setCalEnd(null);
    } else {
      if (date < calStart) { setCalEnd(calStart); setCalStart(date); }
      else { setCalEnd(date); }
    }
  };

  const isSameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const inRange = (d: Date, s: Date | null, e: Date | null) =>
    !!s && !!e && d >= s && d <= e;

  // ── Calendar render (past months only) ──────────────────────────────────

  const renderCalendarMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(<View key={`e${i}`} style={styles.calDay} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const cur     = new Date(year, month, day);
      const isStart = isSameDay(cur, calStart);
      const isEnd   = isSameDay(cur, calEnd);
      const inR     = calStart && calEnd && inRange(cur, calStart, calEnd);
      cells.push(
        <TouchableOpacity
          key={day}
          style={[styles.calDay, (isStart || isEnd) && styles.calDaySelected, inR && !isStart && !isEnd && styles.calDayInRange]}
          onPress={() => handleDayPress(cur)}
        >
          <Text style={[(isStart || isEnd) ? styles.calDayTxtSel : styles.calDayTxt]}>{day}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View key={`${year}-${month}`} style={styles.calMonth}>
        <Text style={styles.calMonthTitle}>{MONTH_NAMES[month]} {year}</Text>
        <View style={styles.calWeekRow}>
          {['S','M','T','W','T','F','S'].map((d, i) => <Text key={i} style={styles.calWeekDay}>{d}</Text>)}
        </View>
        <View style={styles.calGrid}>{cells}</View>
      </View>
    );
  };

  // Build past 12 months array (oldest → newest, so user sees most recent at bottom)
  const calMonths = Array.from({ length: 13 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (12 - i));
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // ── List view ────────────────────────────────────────────────────────────

  const filteredLedgers = ledgers.filter(l =>
    (l.LedgerName || l.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLedgerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.ledgerRow}
      onPress={() => {
        setSelectedLedger(item);
        setCurrentView('report');
        fetchLedgerDetails(item._id, startDateParam, endDateParam);
      }}
    >
      <View style={styles.ledgerRowLeft}>
        <Text style={styles.ledgerName}>{item.LedgerName || item.name}</Text>
        {item.LedgerMobile ? <Text style={styles.ledgerSub}>{item.LedgerMobile}</Text> : null}
      </View>
      {item.LedgerOpening ? (
        <Text style={styles.ledgerBalance}>
          ₹{Math.abs(item.LedgerOpening).toLocaleString('en-IN')}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color="#CBD5E0" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );

  const renderList = () => (
    <View style={styles.flex1}>
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Ledger Report</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#A0AEC0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ledger..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#A0AEC0" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loadingLedgers ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#2B6CB0" /></View>
      ) : filteredLedgers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="book-outline" size={48} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>No Ledgers Found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLedgers}
          keyExtractor={i => i._id || i.LedgerName}
          renderItem={renderLedgerItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );

  // ── Report view ──────────────────────────────────────────────────────────

  const opening  = ledgerSummary?.openingBalance  ?? 0;
  const totDebit = ledgerSummary?.totalDebit      ?? 0;
  const totCredit= ledgerSummary?.totalCredit     ?? 0;

  // closing = last transaction by date (transactions always stored date_asc)
  const lastTxn  = transactions.length > 0 ? transactions[transactions.length - 1] : null;
  const closing  = lastTxn ? (lastTxn as any).runningBalance ?? opening : (ledgerSummary?.closingBalance ?? opening);

  const sortedTransactions = useMemo(() => {
    const arr = [...transactions];
    switch (sortKey) {
      case 'date_desc':
        return arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'type_asc':
        return arr.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
      case 'billno_asc':
        return arr.sort((a, b) => (a.voucherNo || '').localeCompare(b.voucherNo || ''));
      case 'billno_desc':
        return arr.sort((a, b) => (b.voucherNo || '').localeCompare(a.voucherNo || ''));
      default: // date_asc — already in correct order
        return arr;
    }
  }, [transactions, sortKey]);

  const renderTxnCard = ({ item, index }: { item: Transaction, index: number }) => {
    const hasDebit  = (item.debit  || 0) > 0;
    const hasCredit = (item.credit || 0) > 0;
    const dateStr   = item.date
      ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
      : '—';
    const typeMeta  = vchTypeColor(item.type);
    const bal       = item.runningBalance ?? 0;
    const balDr     = bal >= 0;
    const particulars = item.partyName || item.description || selectedLedger?.LedgerName || '—';
    const amtVal    = hasDebit ? item.debit : (hasCredit ? item.credit : 0);
    const amtLabel  = hasDebit ? 'Dr' : (hasCredit ? 'Cr' : '');
    const amtColor  = hasDebit ? '#C53030' : '#276749';

    return (
      <View style={[styles.txnRow, index === 0 && { borderTopWidth: 0 }]}>
        {/* Left: Vch No + date + type badge */}
        <View style={styles.txnLeft}>
          <Text style={styles.txnVchNo}>{item.voucherNo || '—'}</Text>
          <View style={styles.txnSubRow}>
            <Text style={styles.txnDateTxt}>{dateStr}</Text>
            {item.type ? (
              <View style={[styles.txnTypeBadge, { backgroundColor: typeMeta.bg }]}>
                <Text style={[styles.txnTypeBadgeTxt, { color: typeMeta.text }]}>{item.type}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Right: Amount (Dr/Cr label right of value) + running balance in parens */}
        <View style={styles.txnRight}>
          {amtVal ? (
            <Text style={[styles.txnAmtTxt, { color: amtColor }]}>
              ₹{fmtAmt(amtVal)} {amtLabel}
            </Text>
          ) : (
            <Text style={styles.txnAmtTxt}>—</Text>
          )}
          <Text style={[styles.txnBalParen, { color: balDr ? '#1565C0' : '#C62828' }]}>
            (₹{fmtAmt(Math.abs(bal))} {balDr ? 'Dr' : 'Cr'})
          </Text>
        </View>
      </View>
    );
  };

  const renderReport = () => (
    <View style={styles.flex1}>
      {/* Header */}
      <View style={styles.reportHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentView('list')}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backBtnTxt} numberOfLines={1}>
            {selectedLedger?.LedgerName || 'Back'}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerFilterRow}>
          <TouchableOpacity style={styles.datePill} onPress={() => setDateModalVisible(true)}>
            <Ionicons name="calendar-outline" size={14} color="#90CDF4" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.datePillLabel}>{dateLabel.toUpperCase()}</Text>
              <Text style={styles.datePillRange}>{dateRange}</Text>
            </View>
            <Ionicons name="chevron-down" size={14} color="#90CDF4" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalVisible(true)}>
            <Ionicons name="swap-vertical-outline" size={18} color="#90CDF4" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary cards */}
      {ledgerSummary && (
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>Opening Balance</Text>
            <Text style={[styles.summaryVal, { color: '#2D3748' }]}>{fmtBalance(opening)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <View style={[styles.summaryItem, styles.summaryHalf]}>
              <Text style={styles.summaryLbl}>Total Debit</Text>
              <Text style={[styles.summaryVal, { color: '#C53030' }]}>₹{fmtAmt(totDebit)}</Text>
            </View>
            <View style={styles.summaryDividerV} />
            <View style={[styles.summaryItem, styles.summaryHalf]}>
              <Text style={styles.summaryLbl}>Total Credit</Text>
              <Text style={[styles.summaryVal, { color: '#276749' }]}>₹{fmtAmt(totCredit)}</Text>
            </View>
          </View>
          <View style={styles.closingRow}>
            <Text style={styles.closingLbl}>Closing Balance</Text>
            <Text style={[styles.closingVal, { color: closing >= 0 ? '#1565C0' : '#C62828' }]}>
              {fmtBalance(closing)}
            </Text>
          </View>
        </View>
      )}

      {/* Transaction list */}
      {loadingTxns ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2B6CB0" />
          <Text style={styles.loadingTxt}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="document-text-outline" size={52} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>No Transactions</Text>
          <Text style={styles.emptySubtitle}>Try selecting a wider date range</Text>
        </View>
      ) : (
        <FlatList
          data={sortedTransactions}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderTxnCard}
          contentContainerStyle={styles.txnList}
        />
      )}
    </View>
  );

  // ── Date Modal ───────────────────────────────────────────────────────────

  const DATE_OPTIONS = ['Today','Yesterday','This Week','This Month','Last Month','This Year','Last Year','All','Custom Date'];

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <View style={styles.flex1}>
      {currentView === 'list'   && renderList()}
      {currentView === 'report' && renderReport()}

      {/* Date picker modal */}
      <Modal visible={isDateModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Period</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4A5568" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {DATE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalOpt, opt === dateLabel && styles.modalOptActive]}
                  onPress={() => {
                    if (opt === 'Custom Date') {
                      setDateModalVisible(false);
                      setTimeout(() => setShowCalendar(true), 300);
                    } else {
                      handlePredefinedDate(opt);
                    }
                  }}
                >
                  <Text style={[styles.modalOptTxt, opt === dateLabel && styles.modalOptTxtActive]}>
                    {opt}
                  </Text>
                  {opt === dateLabel && <Ionicons name="checkmark" size={18} color="#2B6CB0" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sort modal */}
      <Modal visible={isSortModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4A5568" />
              </TouchableOpacity>
            </View>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.modalOpt, opt.key === sortKey && styles.modalOptActive]}
                onPress={() => { setSortKey(opt.key); setSortModalVisible(false); }}
              >
                <Text style={[styles.modalOptTxt, opt.key === sortKey && styles.modalOptTxtActive]}>
                  {opt.label}
                </Text>
                {opt.key === sortKey && <Ionicons name="checkmark" size={18} color="#2B6CB0" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Calendar modal */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.calOverlay}>
          <View style={styles.calContainer}>
            {/* Cal header */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => { setShowCalendar(false); setCalStart(null); setCalEnd(null); }}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.calHeaderTitle}>SELECT DATE RANGE</Text>
              <TouchableOpacity
                onPress={handleCalendarSave}
                disabled={!calStart || !calEnd}
              >
                <Text style={[styles.calSaveBtn, (!calStart || !calEnd) && { opacity: 0.3 }]}>SAVE</Text>
              </TouchableOpacity>
            </View>

            {/* Selected range display */}
            {(calStart || calEnd) && (
              <View style={styles.calRangeBar}>
                <Text style={styles.calRangeTxt}>
                  {calStart ? formatDate(calStart) : '—'} → {calEnd ? formatDate(calEnd) : '—'}
                </Text>
              </View>
            )}

            {/* Months (past 12 + current, scroll up to see older) */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {calMonths.map(({ year, month }) => renderCalendarMonth(year, month))}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: '#F7FAFC' },

  // ── List ──
  listHeader: {
    backgroundColor: '#1A365D',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listHeaderTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2D4A7A', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  ledgerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
  },
  ledgerRowLeft: { flex: 1 },
  ledgerName: { fontSize: 15, fontWeight: '600', color: '#1A202C' },
  ledgerSub:  { fontSize: 12, color: '#718096', marginTop: 2 },
  ledgerBalance: { fontSize: 14, fontWeight: '700', color: '#2B6CB0', marginRight: 4 },
  separator: { height: 1, backgroundColor: '#EDF2F7', marginLeft: 16 },

  // ── Report header ──
  reportHeader: {
    backgroundColor: '#1A365D',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  headerFilterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  datePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2A4A7F', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  sortBtn: {
    backgroundColor: '#2A4A7F', borderRadius: 10,
    padding: 10, alignItems: 'center', justifyContent: 'center',
  },
  datePillLabel: { color: '#BEE3F8', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  datePillRange: { color: '#fff', fontSize: 13, fontWeight: '500', marginTop: 1 },

  // ── Summary ──
  summarySection: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { flex: 1 },
  summaryHalf: { flex: 1, alignItems: 'center' },
  summaryLbl: { fontSize: 11, color: '#718096', fontWeight: '500', marginBottom: 2 },
  summaryVal: { fontSize: 15, fontWeight: '700' },
  summaryDividerV: { width: 1, height: 36, backgroundColor: '#E2E8F0' },
  closingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  closingLbl: { fontSize: 13, fontWeight: '600', color: '#2D3748' },
  closingVal: { fontSize: 16, fontWeight: '800' },

  // ── Transaction rows (compact) ──
  txnList: { paddingBottom: 20 },
  txnRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0F4F8',
  },
  txnLeft: { flex: 1, paddingRight: 12 },
  txnVchNo: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  txnSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  txnDateTxt: { fontSize: 12, color: '#4A5568', fontWeight: '500' },
  txnTypeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  txnTypeBadgeTxt: { fontSize: 11, fontWeight: '700' },
  txnRight: { alignItems: 'flex-end', minWidth: 110 },
  txnAmtTxt: { fontSize: 14, fontWeight: '700' },
  txnBalParen: { fontSize: 12, fontWeight: '500', marginTop: 2 },


  // ── Common ──
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#4A5568' },
  emptySubtitle: { fontSize: 13, color: '#A0AEC0', marginTop: 4 },
  loadingTxt: { fontSize: 14, color: '#718096', marginTop: 8 },

  // ── Date Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '70%',
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  modalOpt: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F7FAFC',
  },
  modalOptActive: { backgroundColor: '#EBF8FF', marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 8 },
  modalOptTxt: { fontSize: 16, color: '#4A5568' },
  modalOptTxtActive: { color: '#2B6CB0', fontWeight: '700' },

  // ── Calendar ──
  calOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  calContainer: { flex: 1, backgroundColor: '#1A365D', paddingTop: Platform.OS === 'ios' ? 44 : 0 },
  calHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16,
  },
  calHeaderTitle: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  calSaveBtn: { color: '#90CDF4', fontSize: 15, fontWeight: '700' },
  calRangeBar: {
    backgroundColor: '#2A4A7F', paddingHorizontal: 16, paddingVertical: 10,
  },
  calRangeTxt: { color: '#BEE3F8', fontSize: 14, textAlign: 'center' },
  calMonth: { backgroundColor: '#fff', marginBottom: 2, padding: 14 },
  calMonthTitle: { fontSize: 16, fontWeight: '700', color: '#1A202C', marginBottom: 12 },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  calWeekDay: { width: 36, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#718096' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', margin: 2 },
  calDayTxt: { fontSize: 14, color: '#2D3748' },
  calDaySelected: { backgroundColor: '#2B6CB0', borderRadius: 18 },
  calDayTxtSel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  calDayInRange: { backgroundColor: '#BEE3F8', borderRadius: 18 },
});

export default LedgerReportScreen;
