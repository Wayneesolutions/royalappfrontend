import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, Share, StatusBar, Platform, ScrollView,
  Alert, ActivityIndicator, TextInput
} from 'react-native';

const OutstandingApp = () => {
  const [currentScreen, setCurrentScreen] = useState('groups'); // 'groups' or 'details'
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // All Ledger Groups Data
  const LEDGER_GROUPS = [
    {
      id: '1',
      name: 'Abbas Infotech',
      outstanding: 330400,
      invoiceCount: 2,
      overdueDays: 214,
      lastActivity: '30 May 25',
    },
    {
      id: '2',
      name: 'Tech Solutions Pvt Ltd',
      outstanding: 156000,
      invoiceCount: 3,
      overdueDays: 45,
      lastActivity: '15 Dec 24',
    },
    {
      id: '3',
      name: 'Global Enterprises',
      outstanding: 425000,
      invoiceCount: 5,
      overdueDays: 120,
      lastActivity: '10 Nov 24',
    },
    {
      id: '4',
      name: 'Smart Systems Inc',
      outstanding: 89500,
      invoiceCount: 1,
      overdueDays: 30,
      lastActivity: '20 Dec 24',
    },
    {
      id: '5',
      name: 'Digital Marketing Co',
      outstanding: 245000,
      invoiceCount: 4,
      overdueDays: 90,
      lastActivity: '05 Dec 24',
    },
    {
      id: '6',
      name: 'Innovative Tech Labs',
      outstanding: 178000,
      invoiceCount: 2,
      overdueDays: 60,
      lastActivity: '25 Nov 24',
    },
  ];

  // Bills for each ledger
  const BILLS_DATA = {
    '1': [
      { 
        id: '1', 
        date: '26 May 25', 
        voucherNo: 'INV-001',
        amount: 118000, 
        dueDate: '05 Jun 25', 
        overdueDays: 214,
        items: 'Samsung 12 laptop (10 PC)'
      },
      { 
        id: '2', 
        date: '30 May 25', 
        voucherNo: 'INV-003',
        amount: 212400, 
        dueDate: '09 Jun 25', 
        overdueDays: 210,
        items: 'Lenovo Tab M10 FHD Plus (4 PC)'
      },
    ],
    '2': [
      {
        id: '3',
        date: '15 Dec 24',
        voucherNo: 'INV-105',
        amount: 156000,
        dueDate: '30 Dec 24',
        overdueDays: 45,
        items: 'Dell Monitors 27" (8 PC)'
      }
    ],
    '3': [
      {
        id: '4',
        date: '10 Nov 24',
        voucherNo: 'INV-089',
        amount: 425000,
        dueDate: '25 Nov 24',
        overdueDays: 120,
        items: 'Server Equipment (Complete Setup)'
      }
    ],
  };

  const filteredGroups = LEDGER_GROUPS.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOutstanding = LEDGER_GROUPS.reduce((sum, group) => sum + group.outstanding, 0);

  const openLedgerDetails = (ledger) => {
    setSelectedLedger(ledger);
    setCurrentScreen('details');
  };

  const goBack = () => {
    if (currentScreen === 'details') {
      setCurrentScreen('groups');
      setSelectedLedger(null);
    } else {
      Alert.alert('Navigation', 'Exit app or go to previous screen');
    }
  };

  // Groups List Screen Component
  const GroupsListScreen = () => {
    const renderGroupCard = ({ item }) => (
      <TouchableOpacity 
        style={styles.groupCard}
        onPress={() => openLedgerDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={styles.groupMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📄</Text>
                <Text style={styles.metaText}>{item.invoiceCount} invoice{item.invoiceCount > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={styles.metaText}>{item.lastActivity}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>

        <View style={styles.groupFooter}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Outstanding</Text>
            <Text style={styles.amountValue}>₹{item.outstanding.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[
            styles.overdueChip,
            item.overdueDays > 90 ? styles.overdueChipCritical :
            item.overdueDays > 60 ? styles.overdueChipHigh :
            item.overdueDays > 30 ? styles.overdueChipMedium :
            styles.overdueChipLow
          ]}>
            <Text style={[
              styles.overdueChipText,
              item.overdueDays > 90 ? styles.overdueChipTextCritical :
              item.overdueDays > 60 ? styles.overdueChipTextHigh :
              item.overdueDays > 30 ? styles.overdueChipTextMedium :
              styles.overdueChipTextLow
            ]}>
              {item.overdueDays} days overdue
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );

    const renderEmptyState = () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
      </View>
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={goBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Outstanding Reports</Text>
            <View style={styles.headerSpacer} /> 
          </View>
        </View>

        {/* Summary Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Outstanding</Text>
            <Text style={styles.summaryValue}>₹{totalOutstanding.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{LEDGER_GROUPS.length} Parties</Text>
          </View>
        </View>

        {/* Search Bar */}
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

        {/* Section Header */}
        {filteredGroups.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Parties</Text>
            <Text style={styles.sectionCount}>{filteredGroups.length} result{filteredGroups.length > 1 ? 's' : ''}</Text>
          </View>
        )}

        {/* Groups List */}
        <FlatList
          data={filteredGroups}
          keyExtractor={item => item.id}
          renderItem={renderGroupCard}
          contentContainerStyle={[
            styles.listContent,
            filteredGroups.length === 0 && styles.listContentEmpty
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  };

  // Details Screen Component
  const DetailsScreen = () => {
    const [isSharing, setIsSharing] = useState(false);
    const pendingBills = BILLS_DATA[selectedLedger?.id] || [];
    const totalAmount = pendingBills.reduce((sum, item) => sum + item.amount, 0);

    const onShareStatement = async () => {
      try {
        setIsSharing(true);
        await Share.share({
          message: `Outstanding Statement for ${selectedLedger.name}\n\nTotal Pending: ₹${totalAmount.toLocaleString('en-IN')}\n\nPlease process payment soon.`,
          title: 'Outstanding Statement'
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to share statement.');
      } finally {
        setIsSharing(false);
      }
    };

    const onRemindBill = async (bill) => {
      try {
        await Share.share({
          message: `Payment Reminder\n\nInvoice: ${bill.voucherNo}\nAmount: ₹${bill.amount.toLocaleString('en-IN')}\nOverdue: ${bill.overdueDays} days`,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to send reminder.');
      }
    };

    const onViewBill = (bill) => {
      Alert.alert(
        bill.voucherNo,
        `Amount: ₹${bill.amount.toLocaleString('en-IN')}\nDate: ${bill.date}\nDue: ${bill.dueDate}\nItems: ${bill.items}`,
      );
    };

    const renderBillCard = ({ item }) => (
      <View style={styles.billCard}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.voucherSection}>
              <View style={styles.voucherBadge}>
                <Text style={styles.voucherBadgeText}>INVOICE</Text>
              </View>
              <Text style={styles.billVoucher}>{item.voucherNo}</Text>
            </View>
            <View style={styles.amountSection}>
              <Text style={styles.billAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Invoice Date</Text>
              <Text style={styles.dateValue}>{item.date}</Text>
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={styles.dateValue}>{item.dueDate}</Text>
            </View>
          </View>

          <View style={styles.itemsRow}>
            <Text style={styles.itemLabel}>Items</Text>
            <Text style={styles.itemText} numberOfLines={2}>{item.items}</Text>
          </View>

          <View style={styles.overdueContainer}>
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueIcon}>⏰</Text>
              <Text style={styles.overdueText}>Overdue by {item.overdueDays} days</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionBtnSecondary}
              onPress={() => onViewBill(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnTextSecondary}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtnPrimary} 
              onPress={() => onRemindBill(item)}
              activeOpacity={0.7}
            >
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
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={goBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Outstanding Details</Text>
            <View style={styles.headerSpacer} /> 
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.ledgerName}>{selectedLedger?.name}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{pendingBills.length} Pending</Text>
              </View>
            </View>
            
            <View style={styles.summaryAmount}>
              <Text style={styles.amountLabel}>Total Outstanding</Text>
              <Text style={styles.amountValue}>₹ {totalAmount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.agingSection}>
              <Text style={styles.agingTitle}>Aging Analysis</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.agingScrollContent}
              >
                <View style={styles.agingItem}>
                  <Text style={styles.agingDays}>1-30 days</Text>
                  <Text style={styles.agingAmount}>₹0</Text>
                </View>
                <View style={styles.agingItem}>
                  <Text style={styles.agingDays}>31-60 days</Text>
                  <Text style={styles.agingAmount}>₹0</Text>
                </View>
                <View style={styles.agingItem}>
                  <Text style={styles.agingDays}>61-90 days</Text>
                  <Text style={styles.agingAmount}>₹0</Text>
                </View>
                <View style={[styles.agingItem, styles.agingItemActive]}>
                  <Text style={styles.agingDaysActive}>90+ days</Text>
                  <Text style={styles.agingAmountActive}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Section Header for Invoice Details */}
          {pendingBills.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Invoice Details</Text>
              <Text style={styles.sectionCount}>{pendingBills.length} invoice{pendingBills.length > 1 ? 's' : ''}</Text>
            </View>
          )}

          {pendingBills.map((item) => (
            <View key={item.id}>
              {renderBillCard({ item })}
            </View>
          ))}
        </ScrollView>

     
      </SafeAreaView>
    );
  };

  return currentScreen === 'groups' ? <GroupsListScreen /> : <DetailsScreen />;
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  
  // Header
  header: { 
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF1',
  },
  headerTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 15 : 0,
    height: 56,
  },
  backBtn: { 
    padding: 8,
    marginLeft: -8,
  },
  backIcon: { 
    color: '#1A1D1F',
    fontSize: 24,
    fontWeight: '600'
  },
  headerTitle: { 
    color: '#1A1D1F',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSpacer: { 
    width: 40 
  },

  // Summary Banner
  summaryBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1D1F',
    letterSpacing: -0.5,
  },
  summaryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  summaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF1',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1D1F',
  },
  clearIcon: {
    fontSize: 16,
    color: '#9CA3AF',
    paddingHorizontal: 4,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1D1F',
    letterSpacing: 0.3,
  },
  sectionCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Group Card
  groupCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E8ECF1',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1D1F',
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E8ECF1',
    marginHorizontal: 10,
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1D1F',
    letterSpacing: -0.3,
  },
  overdueChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overdueChipLow: {
    backgroundColor: '#F0FDF4',
  },
  overdueChipMedium: {
    backgroundColor: '#FEF3C7',
  },
  overdueChipHigh: {
    backgroundColor: '#FEE2E2',
  },
  overdueChipCritical: {
    backgroundColor: '#FEF3F2',
  },
  overdueChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  overdueChipTextLow: {
    color: '#15803D',
  },
  overdueChipTextMedium: {
    color: '#CA8A04',
  },
  overdueChipTextHigh: {
    color: '#DC2626',
  },
  overdueChipTextCritical: {
    color: '#B91C1C',
  },

  // List
  scrollContent: {
    paddingBottom: 100,
  },
  listContent: { 
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D1F',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Details Screen Styles
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ledgerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D1F',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  summaryAmount: {
    marginBottom: 24,
  },
  agingSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingTop: 16,
  },
  agingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  agingScrollContent: {
    gap: 10,
  },
  agingItem: {
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E8ECF1',
  },
  agingItemActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  agingDays: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  agingAmount: {
    fontSize: 14,
    color: '#1A1D1F',
    fontWeight: '700',
  },
  agingDaysActive: {
    fontSize: 11,
    color: '#C7D2FE',
    fontWeight: '600',
    marginBottom: 4,
  },
  agingAmountActive: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Bill Card
  billCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E8ECF1',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  voucherSection: {
    flex: 1,
  },
  voucherBadge: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  voucherBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  billVoucher: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D1F',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1D1F',
    letterSpacing: -0.3,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    color: '#1A1D1F',
    fontWeight: '600',
  },
  itemsRow: {
    marginBottom: 16,
  },
  itemLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  itemText: {
    fontSize: 13,
    color: '#1A1D1F',
    fontWeight: '500',
    lineHeight: 18,
  },
  overdueContainer: {
    marginBottom: 16,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  overdueIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  overdueText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF1',
  },
  actionBtnTextSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1D1F',
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF1',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8ECF1',
  },
  downloadIcon: {
    fontSize: 16,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D1F',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnDisabled: {
    opacity: 0.6,
  },
  shareIcon: {
    fontSize: 16,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OutstandingApp;