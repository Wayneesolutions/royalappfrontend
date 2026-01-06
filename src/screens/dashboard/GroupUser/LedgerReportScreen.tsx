import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, SafeAreaView, ScrollView, TextInput, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const LedgerReportScreen = () => {
  // --- UI Navigation ---
  const [currentView, setCurrentView] = useState('hierarchy'); 
  const [selectedLedger, setSelectedLedger] = useState('Abbas Infotech');
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // --- Search State for Groups ---
  const [searchQuery, setSearchQuery] = useState('');
  const allGroups = ['abc', 'Abbas Infotech', 'ADITI AGENCY', 'Sundry Debtors', 'Cash in Hand', 'Bank Accounts'];
  const filteredGroups = allGroups.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- Date States ---
  const [isDateModalVisible, setDateModalVisible] = useState(false);
  const [dateLabel, setDateLabel] = useState('This Year');
  const [dateRange, setDateRange] = useState('01 Apr 25 - 31 Mar 26');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarStartDate, setCalendarStartDate] = useState(null);
  const [calendarEndDate, setCalendarEndDate] = useState(null);

  // --- Transaction Data ---
  const TRANSACTIONS = [
    { 
      id: '1', 
      date: '26 May 25', 
      type: 'Sales', 
      voucherNo: 'INV-001',
      amount: '₹ 1,00,000', 
      balance: '₹ 1,68,000', 
      status: 'UNPAID', 
      dueDate: '05 Jun 25', 
      items: [
        { name: 'Samsung 12 laptop', qty: '10', unit: 'PC', rate: '10,000', total: '1,00,000' }
      ],
      taxRate: 18,
      taxAmount: '18,000',
      grossTotal: '1,00,000',
      netAmount: '1,18,000'
    },
    { 
      id: '2', 
      date: '28 May 25', 
      type: 'Purchase', 
      voucherNo: 'PUR-002',
      amount: '-₹ 1,34,000', 
      balance: '₹ 34,000', 
      status: 'PAID', 
      dueDate: '07 Jun 25', 
      items: [
        { name: 'Bingo! Mad Angles 60 Gm', qty: '100', unit: 'pkt', rate: '1,340', total: '1,34,000' }
      ],
      taxRate: 12,
      taxAmount: '16,080',
      grossTotal: '1,34,000',
      netAmount: '1,50,080'
    },
    { 
      id: '3', 
      date: '30 May 25', 
      type: 'Sales', 
      voucherNo: 'INV-003',
      ref: '12', 
      amount: '₹ 1,80,000', 
      balance: '₹ 2,14,000', 
      status: 'UNPAID', 
      dueDate: '09 Jun 25', 
      items: [
        { name: 'Lenovo Tab M10 FHD Plus', qty: '4', unit: 'PC', rate: '45,000', total: '1,80,000' }
      ],
      taxRate: 18,
      taxAmount: '32,400',
      grossTotal: '1,80,000',
      netAmount: '2,12,400'
    },
  ];

  // --- DATE HANDLERS ---
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  };

  const handlePredefinedDateSelect = (item) => {
    const today = new Date();
    let range = '';

    switch(item) {
      case 'Today':
        range = formatDate(today);
        break;
      case 'Yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        range = formatDate(yesterday);
        break;
      case 'This Week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        range = `${formatDate(weekStart)} - ${formatDate(today)}`;
        break;
      case 'This Month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        range = `${formatDate(monthStart)} - ${formatDate(today)}`;
        break;
      case 'Last Month':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        range = `${formatDate(lastMonthStart)} - ${formatDate(lastMonthEnd)}`;
        break;
      case 'This Quarter':
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        const quarterStart = new Date(today.getFullYear(), quarterMonth, 1);
        range = `${formatDate(quarterStart)} - ${formatDate(today)}`;
        break;
      case 'This Year':
        const yearStart = new Date(today.getFullYear(), 3, 1);
        const yearEnd = new Date(today.getFullYear() + 1, 2, 31);
        range = `${formatDate(yearStart)} - ${formatDate(yearEnd)}`;
        break;
      case 'Last Year':
        const lastYearStart = new Date(today.getFullYear() - 1, 3, 1);
        const lastYearEnd = new Date(today.getFullYear(), 2, 31);
        range = `${formatDate(lastYearStart)} - ${formatDate(lastYearEnd)}`;
        break;
      case 'All':
        range = 'All Time';
        break;
    }

    setDateLabel(item);
    setDateRange(range);
    setDateModalVisible(false);
  };

  // --- CALENDAR FUNCTIONS ---
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isInRange = (date, start, end) => {
    if (!start || !end || !date) return false;
    const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return dateTime >= startTime && dateTime <= endTime;
  };

  const handleCalendarDatePress = (date) => {
    if (!calendarStartDate || (calendarStartDate && calendarEndDate)) {
      setCalendarStartDate(date);
      setCalendarEndDate(null);
    } else {
      if (date < calendarStartDate) {
        setCalendarEndDate(calendarStartDate);
        setCalendarStartDate(date);
      } else {
        setCalendarEndDate(date);
      }
    }
  };

  const handleCalendarSave = () => {
    if (calendarStartDate && calendarEndDate) {
      const formattedStart = formatDate(calendarStartDate);
      const formattedEnd = formatDate(calendarEndDate);
      setDateLabel('Custom Date');
      setDateRange(`${formattedStart} - ${formattedEnd}`);
      setShowCalendar(false);
      setCalendarStartDate(null);
      setCalendarEndDate(null);
    }
  };

  const renderCalendarMonth = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isStart = isSameDay(currentDate, calendarStartDate);
      const isEnd = isSameDay(currentDate, calendarEndDate);
      const inRange = calendarStartDate && calendarEndDate && isInRange(currentDate, calendarStartDate, calendarEndDate);
      
      days.push(
        <TouchableOpacity 
          key={day} 
          style={[
            styles.calendarDay,
            (isStart || isEnd) && styles.calendarDaySelected,
            inRange && !isStart && !isEnd && styles.calendarDayInRange
          ]}
          onPress={() => handleCalendarDatePress(currentDate)}
        >
          <Text style={[
            styles.calendarDayText,
            (isStart || isEnd) && styles.calendarDayTextSelected
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View key={`${year}-${month}`} style={styles.calendarMonthContainer}>
        <Text style={styles.calendarMonthTitle}>{monthNames[month]} {year}</Text>
        <View style={styles.calendarWeekDays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <Text key={i} style={styles.calendarWeekDay}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarDaysGrid}>
          {days}
        </View>
      </View>
    );
  };

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
      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.groupRow} 
            onPress={() => { setSelectedLedger(item); setCurrentView('report'); }}
          >
            <Text style={styles.groupText}>{item}</Text>
            <Text style={{color: '#ccc'}}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderReport = () => (
    <View style={styles.container}>
      <View style={styles.headerBlue}>
        <View style={styles.headerTopRow}>
           <TouchableOpacity onPress={() => setCurrentView('hierarchy')}>
             <Text style={styles.whiteLink}>← {selectedLedger}</Text>
           </TouchableOpacity>
          
        </View>
        <TouchableOpacity style={styles.dateSelectorBar} onPress={() => setDateModalVisible(true)}>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.chevronIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={styles.dateLabelText}>{dateLabel.toUpperCase()}</Text>
            <Text style={styles.dateRangeText}>{dateRange}</Text>
          </View>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>^ Opening Balance</Text>
        <Text style={styles.balanceValue}>₹ 68,000</Text>
      </View>

      <FlatList
        data={TRANSACTIONS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.reportCard} onPress={() => { setSelectedVoucher(item); setCurrentView('detail'); }}>
            <View style={styles.voucherHeader}>
              <View>
                <Text style={styles.vDate}>{item.date} | {item.type}</Text>
                {item.items.map((prod, idx) => (
                   <Text key={idx} style={styles.itemSmallText}>{prod.name} ({prod.qty} {prod.unit})</Text>
                ))}
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={[styles.vAmount, {color: item.amount.startsWith('-') ? '#D32F2F' : '#388E3C'}]}>{item.amount}</Text>
                <Text style={styles.vRunningBal}>({item.balance})</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={() => (
          <View style={[styles.balanceRow, { borderTopWidth: 1, borderColor: '#eee', marginTop: 10 }]}>
            <Text style={styles.balanceLabel}>^ Closing Balance</Text>
            <Text style={styles.balanceValue}>₹ 4,22,000</Text>
          </View>
        )}
      />
    </View>
  );

  const renderDetail = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => setCurrentView('report')}>
          <Text style={styles.whiteLink}>← Voucher no: {selectedVoucher.voucherNo}</Text>
        </TouchableOpacity>
        <View style={styles.detailHero}>
          <Text style={styles.detailAmountBig}>{selectedVoucher.amount}</Text>
          <Text style={styles.detailClientName}>{selectedLedger}</Text>
          <View style={[styles.statusBadge, {backgroundColor: selectedVoucher.status === 'UNPAID' ? '#D32F2F' : '#388E3C'}]}>
             <Text style={styles.statusText}>{selectedVoucher.status}</Text>
          </View>
        </View>
        <View style={styles.invoiceDueDates}>
          <View>
            <Text style={styles.dateSub}>Invoice Date</Text>
            <Text style={styles.dateMain}>{selectedVoucher.date}</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={styles.dateSub}>Due Date</Text>
            <Text style={styles.dateMain}>{selectedVoucher.dueDate}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        <Text style={styles.sectionTitle}>ITEMS</Text>
        {selectedVoucher.items.map((item, i) => (
          <View key={i} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.fullItemName}>{item.name}</Text>
              <Text style={styles.fullItemPrice}>₹ {item.total}</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDetailText}>Qty: {item.qty} {item.unit}</Text>
              <Text style={styles.itemDetailText}>Rate: ₹ {item.rate} / {item.unit}</Text>
            </View>
          </View>
        ))}

        <View style={styles.netAmountSection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Amount</Text>
            <Text style={styles.summaryValue}>₹ {selectedVoucher.netAmount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>SUMMARY</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBlue}>Gross Total</Text>
            <Text style={styles.summaryValueBlue}>₹ {selectedVoucher.grossTotal}</Text>
          </View>
          {selectedVoucher.taxRate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST @ {selectedVoucher.taxRate}%</Text>
              <Text style={styles.summaryValue}>₹ {selectedVoucher.taxAmount}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>₹ {selectedVoucher.netAmount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>TERMS</Text>
        <View style={styles.termsBox}>
          <Text style={styles.termsText}>Due date: {selectedVoucher.dueDate}</Text>
        </View>

        <View style={{height: 20}} />
      </ScrollView>

      <TouchableOpacity style={styles.shareBtn}>
        <Text style={styles.shareBtnText}>SHARE INVOICE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

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
                  <Text style={{fontSize: 20}}>✕</Text>
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {['Today', 'Yesterday', 'This Week', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Last Year', 'All', 'Custom Date'].map(item => (
                <TouchableOpacity key={item} style={styles.modalOption} onPress={() => {
                    if (item === 'Custom Date') {
                        setDateModalVisible(false);
                        setTimeout(() => {
                          setShowCalendar(true);
                        }, 300);
                    } else {
                        handlePredefinedDateSelect(item);
                    }
                }}>
                    <Text style={[styles.optionText, item === dateLabel && {color: '#0088cc', fontWeight: 'bold'}]}>{item}</Text>
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
              <TouchableOpacity onPress={() => {
                setShowCalendar(false);
                setCalendarStartDate(null);
                setCalendarEndDate(null);
              }}>
                <Text style={styles.calendarCloseBtn}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.calendarHeaderTitle}>SELECT RANGE</Text>
              <TouchableOpacity 
                onPress={handleCalendarSave}
                disabled={!calendarStartDate || !calendarEndDate}
              >
                <Text style={[
                  styles.calendarSaveBtn, 
                  (!calendarStartDate || !calendarEndDate) && {opacity: 0.3}
                ]}>
                  SAVE
                </Text>
              </TouchableOpacity>
            </View>
            
            {calendarStartDate && calendarEndDate && (
              <View style={styles.calendarSelectedRange}>
                <Text style={styles.calendarSelectedText}>
                  {formatDate(calendarStartDate)} - {formatDate(calendarEndDate)}
                </Text>
                <TouchableOpacity onPress={() => {
                  setCalendarStartDate(calendarStartDate);
                  setCalendarEndDate(null);
                }}>
                  <Text style={styles.calendarEditBtn}>✏️</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {[0, 1, 2, 3, 4, 5].map(offset => {
                const date = new Date();
                date.setMonth(date.getMonth() + offset);
                return renderCalendarMonth(date.getFullYear(), date.getMonth());
              })}
              <View style={{height: 20}} />
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
  headerIcons: { color: '#fff', fontSize: 18 },
  dateSelectorBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0077B3', padding: 10, borderRadius: 5, marginTop: 15 },
  dateLabelText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  dateRangeText: { color: '#fff', fontSize: 13 },
  chevronIcon: { color: '#fff', fontSize: 20 },
  groupRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  groupText: { fontSize: 16, color: '#333' },
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
  netAmountSection: { backgroundColor: '#fff', padding: 15, borderRadius: 6, marginTop: 10, marginBottom: 5 },
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
  
  // Calendar Styles
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  calendarModal: { flex: 1, backgroundColor: '#0088CC', paddingTop: 40 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#0088CC' },
  calendarCloseBtn: { color: '#fff', fontSize: 24, fontWeight: 'bold', width: 40 },
  calendarHeaderTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  calendarSaveBtn: { color: '#fff', fontSize: 14, fontWeight: 'bold', width: 40, textAlign: 'right' },
  calendarSelectedRange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0088CC', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#0077B3' },
  calendarSelectedText: { color: '#fff', fontSize: 15 },
  calendarEditBtn: { fontSize: 18 },
  calendarMonthContainer: { backgroundColor: '#fff', marginBottom: 1, padding: 15 },
  calendarMonthTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  calendarWeekDays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  calendarWeekDay: { width: 40, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#666' },
  calendarDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', margin: 2 },
  calendarDayText: { fontSize: 15, color: '#333' },
  calendarDaySelected: { backgroundColor: '#0088CC', borderRadius: 20 },
  calendarDayTextSelected: { color: '#fff', fontWeight: 'bold' },
  calendarDayInRange: { backgroundColor: '#B3E5FC', borderRadius: 20 }
});
export default LedgerReportScreen;