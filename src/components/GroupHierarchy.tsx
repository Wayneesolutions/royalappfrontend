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

  const getGroupLevel = (level: number): string => {
    if (level === 0) return 'Parent';
    if (level === 1) return 'Child';
    if (level === 2) return 'Sub-Child';
    return `Level ${level}`;
  };

  const renderUser = (user: User, type: 'user' | 'dealer') => (
    <View key={user._id} style={styles.userItem}>
      <Ionicons 
        name={type === 'dealer' ? 'storefront' : 'person'} 
        size={16} 
        color={type === 'dealer' ? '#10B981' : '#3B82F6'} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        {!!user.mobile && (
          <Text style={styles.userDetail}>📱 {user.mobile}</Text>
        )}
        {!!user.email && (
          <Text style={styles.userDetail}>✉️ {user.email}</Text>
        )}
        {user.role && type === 'user' && (
          <Text style={styles.userRole}>Role: {user.role}</Text>
        )}
      </View>
    </View>
  );

  const renderGroupNode = (group: GroupNode) => {
    const isExpanded = expandedGroups.has(group.groupGUID);
    const hasChildren = group.childGroups.length > 0;
    const usersCount = group.users.length;
    const dealersCount = group.dealers.length;
    const childrenCount = group.childGroups.length;
    const levelLabel = getGroupLevel(group.level);

    return (
      <View key={group.groupGUID} style={styles.groupNode}>
        <View style={styles.groupNodeContent}>
          <TouchableOpacity
            style={styles.groupCard}
            onPress={() => toggleGroup(group.groupGUID)}
            activeOpacity={0.7}
          >
            {/* Expand/Collapse Icon */}
            <View style={styles.expandIcon}>
              {hasChildren ? (
                <Ionicons
                  name={isExpanded ? 'chevron-down-circle' : 'chevron-forward-circle'}
                  size={22}
                  color="#3B82F6"
                />
              ) : (
                <View style={styles.dotIcon} />
              )}
            </View>

            {/* Group Info */}
            <View style={styles.groupInfo}>
              <View style={styles.groupTitleRow}>
                <Ionicons name="folder" size={18} color="#F59E0B" />
                <Text style={styles.groupName} numberOfLines={1}>{group.groupName}</Text>
              </View>
              
              <View style={styles.levelBadgeContainer}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{levelLabel}</Text>
                </View>
              </View>
              
              <View style={styles.groupStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={12} color="#3B82F6" />
                  <Text style={styles.statText}>{usersCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="storefront" size={12} color="#10B981" />
                  <Text style={styles.statText}>{dealersCount}</Text>
                </View>
                {childrenCount > 0 && (
                  <View style={styles.statItem}>
                    <Ionicons name="git-branch" size={12} color="#F59E0B" />
                    <Text style={styles.statText}>{childrenCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          {(usersCount > 0 || dealersCount > 0) && (
            <View style={styles.actionButtons}>
              {usersCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonUsers]}
                  onPress={() => openGroupDetail(group, 'users')}
                >
                  <Ionicons name="people-outline" size={12} color="#3B82F6" />
                  <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Users ({usersCount})</Text>
                </TouchableOpacity>
              )}
              {dealersCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDealers]}
                  onPress={() => openGroupDetail(group, 'dealers')}
                >
                  <Ionicons name="storefront-outline" size={12} color="#10B981" />
                  <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Dealers ({dealersCount})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Expanded Child Groups */}
        {isExpanded && hasChildren && (
          <View style={styles.childGroupsContainer}>
            {group.childGroups.map(childGroup => renderGroupNode(childGroup))}
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
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                  <Text style={{ color: '#fff', marginLeft: 8, fontSize: 14 }}>Back to Dealers</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Vouchers - {selectedDealer?.name}</Text>
                <Text style={styles.modalSubtitle}>{vouchers.length} vouchers found</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowDetailModal(false);
                setViewMode('dealers');
                setVouchers([]);
              }}>
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
            </View>

            {loadingVouchers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading vouchers...</Text>
              </View>
            ) : vouchers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No vouchers found</Text>
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
                contentContainerStyle={styles.detailList}
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
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                  <Text style={{ color: '#fff', marginLeft: 8, fontSize: 14 }}>Back to Vouchers</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Voucher Details</Text>
                <Text style={styles.modalSubtitle}>{selectedVoucher.vchnumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewMode('vouchers')}>
                <Ionicons name="close-circle" size={32} color="#fff" />
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
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={styles.loadingText}>Loading ledger entries...</Text>
                    </View>
                  ) : ledgerEntries.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                      <Text style={styles.emptyText}>No ledger entries found</Text>
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
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text style={styles.loadingText}>Loading inventory entries...</Text>
                    </View>
                  ) : inventoryEntries.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
                      <Text style={styles.emptyText}>No inventory entries found</Text>
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
    const dataToShow = viewMode === 'users' ? selectedGroup.users : selectedGroup.dealers;
    const title = viewMode === 'users' ? 'Users' : 'Dealers';
    const icon = viewMode === 'users' ? 'people' : 'storefront';

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{title + ' in ' + selectedGroup.groupName}</Text>
              <Text style={styles.modalSubtitle}>{dataToShow.length + ' ' + title.toLowerCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={dataToShow}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.detailUserCard}>
                <View style={styles.detailUserIcon}>
                  <Ionicons 
                    name={icon} 
                    size={24} 
                    color={viewMode === 'users' ? '#3B82F6' : '#10B981'} 
                  />
                </View>
                <View style={styles.detailUserInfo}>
                  <Text style={styles.detailUserName}>{item.name}</Text>
                  {!!item.mobile && (
                    <Text style={styles.detailUserDetail}>📱 {item.mobile}</Text>
                  )}
                  {!!item.email && (
                    <Text style={styles.detailUserDetail}>✉️ {item.email}</Text>
                  )}
                  {!!(item.role && viewMode === 'users') && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{item.role}</Text>
                    </View>
                  )}
                  {!!(viewMode === 'dealers' && item.LedgerGUID) && (
                    <TouchableOpacity 
                      style={styles.viewVouchersButton}
                      onPress={() => fetchDealerVouchers(item)}
                    >
                      <Ionicons name="receipt-outline" size={14} color="#fff" />
                      <Text style={styles.viewVouchersButtonText}>View Vouchers</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            contentContainerStyle={styles.detailList}
          />
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading group hierarchy...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Group Hierarchy</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="file-tray-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No group hierarchy found</Text>
          <Text style={styles.emptySubtext}>Groups will appear here once assigned</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="git-network" size={24} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Group Hierarchy</Text>
            <Text style={styles.subtitle}>
              {totalGroups} Groups • {totalUsers} Users • {totalDealers} Dealers
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={fetchHierarchy} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={18} color="#3B82F6" />
        <Text style={styles.infoText}>
          Tap groups to expand/collapse. Use buttons to view details.
        </Text>
      </View>

      {/* Content */}
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
    borderBottomWidth: 1,
    borderBottomColor: '#2563EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  groupNode: {
    marginBottom: 8,
  },
  groupNodeContent: {
    flex: 1,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expandIcon: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
    flex: 1,
  },
  levelBadgeContainer: {
    marginBottom: 6,
  },
  levelBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  groupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    paddingLeft: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonUsers: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionButtonDealers: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  childGroupsContainer: {
    marginTop: 2,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 4,
  },
  userInfo: {
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  userDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  userRole: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#3B82F6',
    borderBottomWidth: 1,
    borderBottomColor: '#2563EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  detailList: {
    padding: 16,
    paddingBottom: 24,
  },
  detailUserCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailUserIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  detailUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  detailUserDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 18,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'capitalize',
  },
  viewVouchersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  viewVouchersButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
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

