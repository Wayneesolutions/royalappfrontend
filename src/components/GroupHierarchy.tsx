import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import apiService from '../services/api';

interface User {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  role?: string;
  LedgerGUID?: string;
}

interface Voucher {
  _id: string;
  vchguid: string;
  vchnumber: string;
  vchdate: string;
  vchtype: string;
  vchamount: number;
  vchgoodsamt: number;
  vchpartyname: string;
  vchnarration?: string;
  ledgerId?: any;
}

interface LedgerEntry {
  _id: string;
  ledgerguid: string;
  ledgeramount: number;
  other1?: string;
  other2?: string;
  other3?: string;
  other4?: string;
  ledgerId?: {
    LedgerName: string;
    LedgerGUID: string;
  };
}

interface InventoryEntry {
  _id: string;
  itemguid: string;
  itemmainqty: number;
  itemaltqty?: number;
  itemmainunit?: string;
  itemaltunit?: string;
  itemrate: number;
  itemrateunit?: string;
  itemdisc?: number;
  itemamount: number;
  itemdescription?: string;
  other1?: string;
  other2?: string;
  other3?: string;
  other4?: string;
}

interface SubDealerItem {
  _id: string;
  SDName?: string;
  name?: string;
  SDMobileNo?: string;
  mobile?: string;
  SDEmail?: string;
  email?: string;
  SDAddress1?: string;
  SDAddress2?: string;
  SDState?: string;
}

interface GroupNode {
  groupGUID: string;
  groupName: string;
  level: number;
  users: User[];
  dealers: User[];
  childGroups: GroupNode[];
}

interface GroupHierarchyProps {
  onClose?: () => void;
}

type ViewMode = 'overview' | 'users' | 'dealers' | 'vouchers' | 'voucherDetail';
type VoucherTab = 'ledger' | 'inventory';

const GroupHierarchy: React.FC<GroupHierarchyProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState<GroupNode[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDealers, setTotalDealers] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<GroupNode | null>(null);
  const [selectedDealer, setSelectedDealer] = useState<User | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Voucher detail tabs
  const [selectedTab, setSelectedTab] = useState<VoucherTab>('ledger');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [inventoryEntries, setInventoryEntries] = useState<InventoryEntry[]>([]);
  const [loadingLedgerEntries, setLoadingLedgerEntries] = useState(false);
  const [loadingInventoryEntries, setLoadingInventoryEntries] = useState(false);

  // Sub dealer inline expand state
  const [expandedDealerIds, setExpandedDealerIds] = useState<Set<string>>(new Set());
  const [subDealerMap, setSubDealerMap] = useState<Record<string, SubDealerItem[]>>({});
  const [loadingDealerIds, setLoadingDealerIds] = useState<Set<string>>(new Set());
  // kept for subdealers modal view (backward compat with voucher flow)
  const [selectedDealerSubDealers, setSelectedDealerSubDealers] = useState<SubDealerItem[]>([]);
  const [loadingSubDealers, setLoadingSubDealers] = useState(false);

  // Get current company code from Redux
  const currentCompany = useSelector((state: any) => state.auth.user?.defaultCompany);
  const companyCode = currentCompany?.companyCode || '';

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching group hierarchy...');
      const result = await apiService.getGroupHierarchy();
      
      if (result?.success && result?.data) {
        console.log('✅ Group hierarchy fetched:', {
          totalGroups: result.data.totalGroups,
          totalUsers: result.data.totalUsers,
          totalDealers: result.data.totalDealers,
          hierarchyCount: result.data.hierarchy?.length
        });
        setHierarchy(result.data.hierarchy || []);
        setTotalGroups(result.data.totalGroups || 0);
        setTotalUsers(result.data.totalUsers || 0);
        setTotalDealers(result.data.totalDealers || 0);
        
        // Auto-expand all levels to show complete hierarchy
        const allGroups = new Set<string>();
        const expandAllGroups = (groups: GroupNode[]) => {
          groups.forEach((group: GroupNode) => {
            allGroups.add(group.groupGUID);
            if (group.childGroups && group.childGroups.length > 0) {
              expandAllGroups(group.childGroups);
            }
          });
        };
        if (result.data.hierarchy) {
          expandAllGroups(result.data.hierarchy);
        }
        setExpandedGroups(allGroups);
      }
    } catch (error) {
      console.error('Error fetching group hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupGUID: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupGUID)) {
        newSet.delete(groupGUID);
      } else {
        newSet.add(groupGUID);
      }
      return newSet;
    });
  };

  const openGroupDetail = (group: GroupNode, mode: ViewMode) => {
    setSelectedGroup(group);
    setViewMode(mode);
    setShowDetailModal(true);
  };

  const fetchDealerVouchers = async (dealer: User) => {
    if (!dealer.LedgerGUID) {
      Alert.alert('Error', 'Dealer GUID not found');
      return;
    }

    if (!companyCode) {
      Alert.alert('Error', 'Company code not found');
      return;
    }

    try {
      setLoadingVouchers(true);
      console.log('🔄 Fetching vouchers for dealer:', dealer.name, dealer.LedgerGUID);
      
      const result = await apiService.getVouchers({
        cmpcode: companyCode,
        ledgerguid: dealer.LedgerGUID,
        limit: 100
      });

      if (result?.success && result?.data) {
        console.log('✅ Vouchers fetched:', result.data.vouchers?.length || 0);
        setVouchers(result.data.vouchers || []);
        setSelectedDealer(dealer);
        setViewMode('vouchers');
      } else {
        Alert.alert('Info', 'No vouchers found for this dealer');
        setVouchers([]);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      Alert.alert('Error', 'Failed to fetch vouchers');
      setVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const toggleDealerSubDealers = async (dealer: User) => {
    const id = dealer._id;
    // If already expanded, collapse it
    if (expandedDealerIds.has(id)) {
      setExpandedDealerIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      return;
    }
    // Expand: mark loading
    setExpandedDealerIds(prev => new Set(prev).add(id));
    if (subDealerMap[id]) return; // already fetched
    setLoadingDealerIds(prev => new Set(prev).add(id));
    try {
      const result = await apiService.getSubDealersByDealer(id, { limit: 100 });
      const list: SubDealerItem[] = result?.success && result.data?.subdealers
        ? result.data.subdealers
        : [];
      setSubDealerMap(prev => ({ ...prev, [id]: list }));
    } catch {
      setSubDealerMap(prev => ({ ...prev, [id]: [] }));
    } finally {
      setLoadingDealerIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const viewVoucherDetails = async (voucher: Voucher) => {
    try {
      console.log('🔄 Fetching voucher details:', voucher.vchguid);
      
      const result = await apiService.getVoucherByGuid(voucher.vchguid, companyCode);

      if (result?.success && result?.data) {
        console.log('✅ Voucher details fetched');
        setSelectedVoucher(result.data);
        setViewMode('voucherDetail');
        setSelectedTab('ledger'); // Reset to ledger tab
        
        // Fetch ledger and inventory entries
        fetchLedgerEntries(voucher.vchguid);
        fetchInventoryEntries(voucher.vchguid);
      } else {
        Alert.alert('Error', 'Voucher details not found');
      }
    } catch (error) {
      console.error('Error fetching voucher details:', error);
      Alert.alert('Error', 'Failed to fetch voucher details');
    }
  };

  const fetchLedgerEntries = async (vchguid: string) => {
    try {
      setLoadingLedgerEntries(true);
      console.log('🔄 Fetching ledger entries for voucher:', vchguid);
      
      const result = await apiService.getLedgerEntriesByVoucher(vchguid, companyCode);
      
      if (result?.success && result?.data) {
        // Extract entries array from nested data structure
        const entries = result.data.entries || result.data || [];
        console.log('✅ Ledger entries fetched:', entries.length);
        setLedgerEntries(entries);
      } else {
        console.log('⚠️ No ledger entries found');
        setLedgerEntries([]);
      }
    } catch (error: any) {
      // Handle 404 (no entries found) gracefully
      if (error?.message?.includes('No ledger entries found') || error?.status === 404) {
        console.log('ℹ️ No ledger entries available for this voucher');
        setLedgerEntries([]);
      } else {
        console.error('Error fetching ledger entries:', error);
        setLedgerEntries([]);
      }
    } finally {
      setLoadingLedgerEntries(false);
    }
  };

  const fetchInventoryEntries = async (vchguid: string) => {
    try {
      setLoadingInventoryEntries(true);
      console.log('🔄 Fetching inventory entries for voucher:', vchguid);
      
      const result = await apiService.getInventoryEntriesByVoucher(vchguid, companyCode);
      
      if (result?.success && result?.data) {
        // Extract entries array from nested data structure
        const entries = result.data.entries || result.data || [];
        console.log('✅ Inventory entries fetched:', entries.length);
        setInventoryEntries(entries);
      } else {
        console.log('⚠️ No inventory entries found');
        setInventoryEntries([]);
      }
    } catch (error: any) {
      // Handle 404 (no entries found) gracefully
      if (error?.message?.includes('No inventory entries found') || error?.status === 404) {
        console.log('ℹ️ No inventory entries available for this voucher');
        setInventoryEntries([]);
      } else {
        console.error('Error fetching inventory entries:', error);
        setInventoryEntries([]);
      }
    } finally {
      setLoadingInventoryEntries(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getLevelColor = (level: number): string => {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EF4444'];
    return colors[level] || colors[colors.length - 1];
  };

  const getLevelLabel = (level: number): string => {
    if (level === 0) return 'Parent';
    if (level === 1) return 'Child';
    if (level === 2) return 'Sub-Child';
    return `Level ${level}`;
  };

  const renderGroupNode = (group: GroupNode) => {
    const isExpanded = expandedGroups.has(group.groupGUID);
    const hasChildren = group.childGroups.length > 0;
    const usersCount = group.users.length;
    const dealersCount = group.dealers.length;
    const levelColor = getLevelColor(group.level);
    const levelLabel = getLevelLabel(group.level);

    return (
      <View key={group.groupGUID} style={styles.groupNode}>
        <View style={[styles.groupCard, { borderLeftColor: levelColor }]}>
          {/* Header row */}
          <TouchableOpacity
            style={styles.groupCardHeader}
            onPress={() => toggleGroup(group.groupGUID)}
            activeOpacity={0.7}
          >
            <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
            <View style={styles.groupTitleBlock}>
              <Text style={styles.groupName} numberOfLines={1}>{group.groupName}</Text>
              <View style={[styles.levelBadge, { backgroundColor: levelColor + '18', borderColor: levelColor + '40' }]}>
                <Text style={[styles.levelBadgeText, { color: levelColor }]}>{levelLabel}</Text>
              </View>
            </View>
            <Ionicons
              name={hasChildren ? (isExpanded ? 'chevron-up' : 'chevron-down') : 'remove'}
              size={18}
              color={hasChildren ? levelColor : '#D1D5DB'}
            />
          </TouchableOpacity>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Ionicons name="people-outline" size={13} color="#3B82F6" />
              <Text style={styles.statChipText}>{usersCount} Users</Text>
            </View>
            <View style={styles.statChip}>
              <Ionicons name="storefront-outline" size={13} color="#10B981" />
              <Text style={styles.statChipText}>{dealersCount} Dealers</Text>
            </View>
            {hasChildren && (
              <View style={styles.statChip}>
                <Ionicons name="git-branch-outline" size={13} color="#F97316" />
                <Text style={styles.statChipText}>{group.childGroups.length} Sub-groups</Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          {(usersCount > 0 || dealersCount > 0) && (
            <View style={styles.actionRow}>
              {usersCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                  onPress={() => openGroupDetail(group, 'users')}
                >
                  <Ionicons name="people" size={14} color="#3B82F6" />
                  <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Users ({usersCount})</Text>
                </TouchableOpacity>
              )}
              {dealersCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                  onPress={() => openGroupDetail(group, 'dealers')}
                >
                  <Ionicons name="storefront" size={14} color="#10B981" />
                  <Text style={[styles.actionBtnText, { color: '#059669' }]}>Dealers ({dealersCount})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Children */}
        {isExpanded && hasChildren && (
          <View style={[styles.childrenContainer, { borderLeftColor: levelColor + '50' }]}>
            {group.childGroups.map(child => renderGroupNode(child))}
          </View>
        )}
      </View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedGroup) return null;

    // Handle vouchers view
    if (viewMode === 'vouchers') {
      return (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowDetailModal(false);
            setViewMode('dealers');
            setVouchers([]);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => setViewMode('dealers')}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                >
                  <Ionicons name="arrow-back" size={18} color="#3B82F6" />
                  <Text style={styles.backBtnText}>Back to Dealers</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Vouchers</Text>
                <Text style={styles.modalSubtitle}>{selectedDealer?.name} · {vouchers.length} found</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowDetailModal(false);
                setViewMode('dealers');
                setVouchers([]);
              }}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            {loadingVouchers ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading vouchers...</Text>
              </View>
            ) : vouchers.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No vouchers found</Text>
                <Text style={styles.emptySubtext}>This dealer has no vouchers yet</Text>
              </View>
            ) : (
              <FlatList
                data={vouchers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.voucherCard}>
                    <View style={styles.voucherHeader}>
                      <View style={styles.voucherTypeContainer}>
                        <Ionicons name="document-text" size={16} color="#3B82F6" />
                        <Text style={styles.voucherType}>{item.vchtype}</Text>
                      </View>
                      <Text style={styles.voucherAmount}>{formatAmount(item.vchamount)}</Text>
                    </View>
                    <View style={styles.voucherBody}>
                      <View style={styles.voucherRow}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.voucherLabel}>Date:</Text>
                        <Text style={styles.voucherValue}>{formatDate(item.vchdate)}</Text>
                      </View>
                      <View style={styles.voucherRow}>
                        <Ionicons name="barcode-outline" size={14} color="#6B7280" />
                        <Text style={styles.voucherLabel}>Voucher #:</Text>
                        <Text style={styles.voucherValue}>{item.vchnumber}</Text>
                      </View>
                      <View style={styles.voucherRow}>
                        <Ionicons name="finger-print-outline" size={14} color="#6B7280" />
                        <Text style={styles.voucherLabel}>GUID:</Text>
                        <Text style={[styles.voucherValue, { fontSize: 11 }]} numberOfLines={1}>
                          {item.vchguid}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.viewDetailsButton}
                      onPress={() => viewVoucherDetails(item)}
                    >
                      <Text style={styles.viewDetailsButtonText}>View Details</Text>
                      <Ionicons name="chevron-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                contentContainerStyle={styles.memberList}
              />
            )}
          </View>
        </Modal>
      );
    }

    // Handle voucher detail view
    if (viewMode === 'voucherDetail' && selectedVoucher) {
      return (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setViewMode('vouchers')}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => setViewMode('vouchers')}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                >
                  <Ionicons name="arrow-back" size={18} color="#3B82F6" />
                  <Text style={styles.backBtnText}>Back to Vouchers</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Voucher Details</Text>
                <Text style={styles.modalSubtitle}>{selectedVoucher.vchnumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewMode('vouchers')}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Voucher Basic Info */}
            <View style={styles.voucherBasicInfo}>
              <View style={styles.voucherBasicRow}>
                <Text style={styles.voucherBasicLabel}>Type:</Text>
                <Text style={styles.voucherBasicValue}>{selectedVoucher.vchtype}</Text>
              </View>
              <View style={styles.voucherBasicRow}>
                <Text style={styles.voucherBasicLabel}>Date:</Text>
                <Text style={styles.voucherBasicValue}>{formatDate(selectedVoucher.vchdate)}</Text>
              </View>
              <View style={styles.voucherBasicRow}>
                <Text style={styles.voucherBasicLabel}>Amount:</Text>
                <Text style={[styles.voucherBasicValue, { fontWeight: '700', color: '#10B981' }]}>
                  {formatAmount(selectedVoucher.vchamount)}
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'ledger' && styles.activeTab]}
                onPress={() => setSelectedTab('ledger')}
              >
                <Ionicons 
                  name="book-outline" 
                  size={18} 
                  color={selectedTab === 'ledger' ? '#3B82F6' : '#6B7280'} 
                />
                <Text style={[styles.tabText, selectedTab === 'ledger' && styles.activeTabText]}>
                  Ledger Entries
                </Text>
                {ledgerEntries.length > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{ledgerEntries.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'inventory' && styles.activeTab]}
                onPress={() => setSelectedTab('inventory')}
              >
                <Ionicons 
                  name="cube-outline" 
                  size={18} 
                  color={selectedTab === 'inventory' ? '#3B82F6' : '#6B7280'} 
                />
                <Text style={[styles.tabText, selectedTab === 'inventory' && styles.activeTabText]}>
                  Inventory Entries
                </Text>
                {inventoryEntries.length > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{inventoryEntries.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.tabContent}>
              {selectedTab === 'ledger' && (
                <>
                  {loadingLedgerEntries ? (
                    <View style={styles.centered}>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={styles.loadingText}>Loading ledger entries...</Text>
                    </View>
                  ) : ledgerEntries.length === 0 ? (
                    <View style={styles.centered}>
                      <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                      <Text style={styles.emptyTitle}>No ledger entries found</Text>
                    </View>
                  ) : (
                    ledgerEntries.map((entry, index) => (
                      <View key={entry._id} style={styles.entryCard}>
                        <View style={styles.entryHeader}>
                          <Text style={styles.entryNumber}>{'Entry #' + (index + 1)}</Text>
                          <View style={styles.entryAmountContainer}>
                            <Text style={[
                              styles.entryType,
                              { 
                                color: entry.ledgeramount >= 0 ? '#10B981' : '#EF4444',
                                backgroundColor: entry.ledgeramount >= 0 ? '#ECFDF5' : '#FEF2F2',
                                borderColor: entry.ledgeramount >= 0 ? '#10B981' : '#EF4444'
                              }
                            ]}>
                              {entry.ledgeramount >= 0 ? 'Credit' : 'Debit'}
                            </Text>
                            <Text style={[
                              styles.entryAmount,
                              { color: entry.ledgeramount >= 0 ? '#10B981' : '#EF4444' }
                            ]}>
                              {formatAmount(Math.abs(entry.ledgeramount))}
                            </Text>
                          </View>
                        </View>
                        
                        {!!entry.ledgerId && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Ledger Name:</Text>
                            <Text style={styles.entryValue}>{entry.ledgerId.LedgerName}</Text>
                          </View>
                        )}
                        
                        <View style={styles.entryRow}>
                          <Text style={styles.entryLabel}>Ledger GUID:</Text>
                          <Text style={[styles.entryValue, { fontSize: 10 }]} numberOfLines={1}>
                            {entry.ledgerguid}
                          </Text>
                        </View>
                        
                        {!!entry.other1 && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Type:</Text>
                            <Text style={styles.entryValue}>{entry.other1}</Text>
                          </View>
                        )}
                        
                        {!!entry.other2 && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Details:</Text>
                            <Text style={styles.entryValue}>{entry.other2}</Text>
                          </View>
                        )}
                        
                        {!!entry.other3 && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Reference:</Text>
                            <Text style={styles.entryValue}>{entry.other3}</Text>
                          </View>
                        )}
                        
                        {!!entry.other4 && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Period:</Text>
                            <Text style={styles.entryValue}>{entry.other4}</Text>
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </>
              )}

              {selectedTab === 'inventory' && (
                <>
                  {loadingInventoryEntries ? (
                    <View style={styles.centered}>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={styles.loadingText}>Loading inventory entries...</Text>
                    </View>
                  ) : inventoryEntries.length === 0 ? (
                    <View style={styles.centered}>
                      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
                      <Text style={styles.emptyTitle}>No inventory entries found</Text>
                    </View>
                  ) : (
                    inventoryEntries.map((entry, index) => (
                      <View key={entry._id} style={styles.entryCard}>
                        <View style={styles.entryHeader}>
                          <Text style={styles.entryNumber}>{'Item #' + (index + 1)}</Text>
                          <Text style={styles.entryAmount}>
                            {formatAmount(entry.itemamount)}
                          </Text>
                        </View>
                        
                        {!!entry.itemdescription && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Description:</Text>
                            <Text style={styles.entryValue}>{entry.itemdescription}</Text>
                          </View>
                        )}
                        
                        <View style={styles.entryRow}>
                          <Text style={styles.entryLabel}>Item GUID:</Text>
                          <Text style={[styles.entryValue, { fontSize: 10 }]} numberOfLines={1}>
                            {entry.itemguid}
                          </Text>
                        </View>
                        
                        <View style={styles.entryRow}>
                          <Text style={styles.entryLabel}>Quantity:</Text>
                          <Text style={styles.entryValue}>
                            {String(entry.itemmainqty) + ' ' + (entry.itemmainunit || 'units')}
                          </Text>
                        </View>
                        
                        {!!entry.itemaltqty && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Alt. Quantity:</Text>
                            <Text style={styles.entryValue}>
                              {String(entry.itemaltqty) + ' ' + (entry.itemaltunit || 'units')}
                            </Text>
                          </View>
                        )}
                        
                        <View style={styles.entryRow}>
                          <Text style={styles.entryLabel}>Rate:</Text>
                          <Text style={styles.entryValue}>
                            {formatAmount(entry.itemrate) + ' per ' + (entry.itemrateunit || entry.itemmainunit || 'unit')}
                          </Text>
                        </View>
                        
                        {!!(entry.itemdisc && entry.itemdisc > 0) && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Discount:</Text>
                            <Text style={styles.entryValue}>{formatAmount(entry.itemdisc)}</Text>
                          </View>
                        )}
                        
                        {!!entry.other1 && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Batch/Info:</Text>
                            <Text style={styles.entryValue}>{entry.other1}</Text>
                          </View>
                        )}
                        
                        {!!entry.other2 && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Additional:</Text>
                            <Text style={styles.entryValue}>{entry.other2}</Text>
                          </View>
                        )}
                        
                        {!!entry.other3 && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Location:</Text>
                            <Text style={styles.entryValue}>{entry.other3}</Text>
                          </View>
                        )}
                        
                        {!!entry.other4 && (
                          <View style={styles.entryRow}>
                            <Text style={styles.entryLabel}>Quality:</Text>
                            <Text style={styles.entryValue}>{entry.other4}</Text>
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </Modal>
      );
    }

    // Handle users/dealers list view
    const isUsers = viewMode === 'users';
    const dataToShow = isUsers ? selectedGroup.users : selectedGroup.dealers;
    const title = isUsers ? 'Users' : 'Dealers';

    const renderDealerRow = (item: User) => {
      const isExpanded = expandedDealerIds.has(item._id);
      const isLoading = loadingDealerIds.has(item._id);
      const subDealers = subDealerMap[item._id] || [];

      return (
        <View key={item._id} style={styles.dealerRow}>
          {/* Dealer card */}
          <View style={styles.memberCard}>
            <View style={[styles.memberAvatar, styles.memberAvatarDealer]}>
              <Ionicons name="storefront" size={20} color="#10B981" />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.name}</Text>
              {!!item.mobile && (
                <View style={styles.memberDetailRow}>
                  <Ionicons name="call-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.memberDetailText}>{item.mobile}</Text>
                </View>
              )}
              {!!item.email && (
                <View style={styles.memberDetailRow}>
                  <Ionicons name="mail-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.memberDetailText}>{item.email}</Text>
                </View>
              )}
              <View style={styles.dealerBtnRow}>
                {!!item.LedgerGUID && (
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => fetchDealerVouchers(item)}>
                    <Ionicons name="receipt-outline" size={13} color="#3B82F6" />
                    <Text style={[styles.outlineBtnText, { color: '#3B82F6' }]}>Vouchers</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: isExpanded ? '#8B5CF6' : '#C4B5FD', backgroundColor: isExpanded ? '#F5F3FF' : '#F8FAFF' }]}
                  onPress={() => toggleDealerSubDealers(item)}
                >
                  <Ionicons name={isExpanded ? 'chevron-up' : 'people-outline'} size={13} color="#8B5CF6" />
                  <Text style={[styles.outlineBtnText, { color: '#8B5CF6' }]}>
                    {isLoading ? 'Loading...' : isExpanded ? 'Hide Sub Dealers' : 'Sub Dealers'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Inline sub dealers */}
          {isExpanded && (
            <View style={styles.subDealerSection}>
              <View style={styles.subDealerSectionHeader}>
                <View style={styles.subDealerConnector} />
                <Text style={styles.subDealerSectionTitle}>Sub Dealers</Text>
              </View>
              {isLoading ? (
                <View style={styles.subDealerLoading}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={styles.subDealerLoadingText}>Loading...</Text>
                </View>
              ) : subDealers.length === 0 ? (
                <View style={styles.subDealerEmpty}>
                  <Text style={styles.subDealerEmptyText}>No sub dealers found</Text>
                </View>
              ) : (
                subDealers.map(sd => (
                  <View key={sd._id} style={styles.subDealerCard}>
                    <View style={styles.subDealerLine} />
                    <View style={[styles.memberAvatar, styles.memberAvatarSubDealer, { width: 34, height: 34, borderRadius: 17 }]}>
                      <Ionicons name="person-outline" size={16} color="#8B5CF6" />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.subDealerName}>{sd.SDName || sd.name || 'N/A'}</Text>
                      {!!(sd.SDMobileNo || sd.mobile) && (
                        <View style={styles.memberDetailRow}>
                          <Ionicons name="call-outline" size={11} color="#C4B5FD" />
                          <Text style={styles.subDealerDetail}>{sd.SDMobileNo || sd.mobile}</Text>
                        </View>
                      )}
                      {!!(sd.SDEmail || sd.email) && (
                        <View style={styles.memberDetailRow}>
                          <Ionicons name="mail-outline" size={11} color="#C4B5FD" />
                          <Text style={styles.subDealerDetail}>{sd.SDEmail || sd.email}</Text>
                        </View>
                      )}
                      {!!sd.SDAddress1 && (
                        <View style={styles.memberDetailRow}>
                          <Ionicons name="location-outline" size={11} color="#C4B5FD" />
                          <Text style={styles.subDealerDetail}>{[sd.SDAddress1, sd.SDAddress2, sd.SDState].filter(Boolean).join(', ')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      );
    };

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowDetailModal(false); setExpandedDealerIds(new Set()); }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{title} in {selectedGroup.groupName}</Text>
              <Text style={styles.modalSubtitle}>{dataToShow.length} {title.toLowerCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => { setShowDetailModal(false); setExpandedDealerIds(new Set()); }}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {dataToShow.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name={isUsers ? 'people-outline' : 'storefront-outline'} size={52} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No {title.toLowerCase()} found</Text>
            </View>
          ) : isUsers ? (
            <FlatList
              data={dataToShow}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.memberList}
              renderItem={({ item }) => (
                <View style={styles.memberCard}>
                  <View style={[styles.memberAvatar, styles.memberAvatarUser]}>
                    <Ionicons name="person" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    {!!item.mobile && (
                      <View style={styles.memberDetailRow}>
                        <Ionicons name="call-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.memberDetailText}>{item.mobile}</Text>
                      </View>
                    )}
                    {!!item.email && (
                      <View style={styles.memberDetailRow}>
                        <Ionicons name="mail-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.memberDetailText}>{item.email}</Text>
                      </View>
                    )}
                    {!!item.role && (
                      <View style={styles.rolePill}>
                        <Text style={styles.rolePillText}>{item.role}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          ) : (
            <ScrollView contentContainerStyle={styles.memberList}>
              {(dataToShow as User[]).map(dealer => renderDealerRow(dealer))}
            </ScrollView>
          )}
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading group hierarchy...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Group Hierarchy</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.centered}>
          <Ionicons name="git-network-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No groups found</Text>
          <Text style={styles.emptySubtext}>Groups will appear here once assigned</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Group Hierarchy</Text>
          <Text style={styles.pageSubtitle}>{totalGroups} Groups · {totalUsers} Users · {totalDealers} Dealers</Text>
        </View>
        <TouchableOpacity onPress={fetchHierarchy} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.refreshBtn}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hierarchy.map(group => renderGroupNode(group))}
      </ScrollView>

      {renderDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtext: { marginTop: 6, fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 32 },

  // ── Page header ───────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  pageSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  refreshBtn: { padding: 6, marginLeft: 8 },

  // ── Group card ────────────────────────────────────────────────────────────
  groupNode: { marginBottom: 10 },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  groupTitleBlock: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  childrenContainer: {
    marginTop: 4,
    marginLeft: 18,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 12,
  },

  // ── Modal shared ──────────────────────────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 52,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  backBtnText: { fontSize: 13, color: '#3B82F6', fontWeight: '500' },

  // ── Members list (users / dealers / sub dealers) ───────────────────────────
  memberList: { padding: 14, paddingBottom: 32 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarUser: { backgroundColor: '#EFF6FF' },
  memberAvatarDealer: { backgroundColor: '#F0FDF4' },
  memberAvatarSubDealer: { backgroundColor: '#F5F3FF' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 5 },
  memberDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  memberDetailText: { fontSize: 13, color: '#6B7280' },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rolePillText: { fontSize: 11, fontWeight: '600', color: '#3B82F6', textTransform: 'capitalize' },
  dealerBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFF',
  },
  outlineBtnText: { fontSize: 12, fontWeight: '600' },

  // ── Inline sub dealers ────────────────────────────────────────────────────
  dealerRow: { marginBottom: 4 },
  subDealerSection: {
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#DDD6FE',
    paddingLeft: 12,
    marginBottom: 8,
  },
  subDealerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  subDealerConnector: {
    width: 8,
    height: 2,
    backgroundColor: '#DDD6FE',
    marginRight: 6,
  },
  subDealerSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subDealerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  subDealerLine: {
    width: 12,
    height: 2,
    backgroundColor: '#DDD6FE',
    alignSelf: 'center',
    marginRight: 8,
  },
  subDealerName: { fontSize: 14, fontWeight: '600', color: '#4C1D95', marginBottom: 3 },
  subDealerDetail: { fontSize: 12, color: '#7C3AED' },
  subDealerLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  subDealerLoadingText: { fontSize: 13, color: '#8B5CF6' },
  subDealerEmpty: { padding: 12 },
  subDealerEmptyText: { fontSize: 13, color: '#A78BFA', fontStyle: 'italic' },

  // ── Vouchers ──────────────────────────────────────────────────────────────
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  voucherTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  voucherType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  voucherAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#10B981',
  },
  voucherBody: {
    gap: 8,
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voucherLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  voucherValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  viewDetailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  detailScrollView: {
    flex: 1,
  },
  voucherDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  voucherDetailSection: {
    marginBottom: 20,
  },
  voucherDetailSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  voucherDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  voucherDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  voucherDetailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  voucherDetailNarration: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    fontStyle: 'italic',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  voucherBasicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  voucherBasicRow: {
    alignItems: 'center',
  },
  voucherBasicLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  voucherBasicValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  entryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  entryNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  entryAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryType: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  entryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  entryValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default GroupHierarchy;

