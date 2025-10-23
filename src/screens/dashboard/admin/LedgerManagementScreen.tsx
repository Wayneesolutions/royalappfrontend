import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';

interface Ledger {
  _id: string;
  ledgerId: string;
  partyName: string;
  partyType: string;
  accountType: string;
  currentBalance: number;
  creditLimit: number;
  status: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  partyId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LedgerSummary {
  totalLedgers: number;
  totalReceivable: number;
  totalPayable: number;
  totalDebitBalance: number;
  totalCreditBalance: number;
  activeLedgers: number;
  inactiveLedgers: number;
}

const LedgerManagementScreen = () => {
  const { getLedgers, getLedgerSummary, createLedger, getUsersForLedger } = useAuth();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'receivable' | 'payable'>('all');
  const [sortBy, setSortBy] = useState<'partyName' | 'currentBalance' | 'createdAt'>('partyName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  
  // Create ledger form
  const [createForm, setCreateForm] = useState({
    partyId: '',
    partyName: '',
    partyType: 'customer',
    accountType: 'receivable',
    openingBalance: 0,
    creditLimit: 0,
    contactInfo: {
      email: '',
      phone: ''
    },
    notes: ''
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter, sortBy, sortOrder, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: 1,
        limit: 50,
        sortBy,
        sortOrder
      };
      
      if (filter !== 'all') {
        if (filter === 'receivable') {
          params.accountType = 'receivable';
        } else if (filter === 'payable') {
          params.accountType = 'payable';
        } else {
          params.status = filter;
        }
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const result = await getLedgers(params);
      if (result?.success) {
        setLedgers(result.data?.ledgers || []);
      }

      // Fetch summary
      const summaryResult = await getLedgerSummary();
      if (summaryResult?.success) {
        setSummary(summaryResult.data?.summary);
      }
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      Alert.alert('Error', 'Failed to fetch ledger data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleViewDetails = (ledger: Ledger) => {
    setSelectedLedger(ledger);
    setShowDetailsModal(true);
  };

  const handleCreateLedger = async () => {
    try {
      if (!createForm.partyId || !createForm.partyName) {
        Alert.alert('Error', 'Please select a party and enter party name');
        return;
      }

      const result = await createLedger(createForm);
      if (result?.success) {
        Alert.alert('Success', 'Ledger created successfully', [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateModal(false);
              setCreateForm({
                partyId: '',
                partyName: '',
                partyType: 'customer',
                accountType: 'receivable',
                openingBalance: 0,
                creditLimit: 0,
                contactInfo: { email: '', phone: '' },
                notes: ''
              });
              fetchData();
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error creating ledger:', error);
      Alert.alert('Error', 'Failed to create ledger');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const result = await getUsersForLedger();
      if (result?.success) {
        setAvailableUsers(result.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType) {
      case 'receivable': return '#10B981';
      case 'payable': return '#F59E0B';
      case 'advance': return '#3B82F6';
      case 'deposit': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getBalanceColor = (balance: number, accountType: string) => {
    if (balance === 0) return '#6B7280';
    if (accountType === 'receivable') {
      return balance > 0 ? '#10B981' : '#EF4444';
    } else {
      return balance > 0 ? '#EF4444' : '#10B981';
    }
  };

  const formatBalance = (balance: number, accountType: string) => {
    const absBalance = Math.abs(balance);
    const sign = balance > 0 ? '+' : balance < 0 ? '-' : '';
    return `${sign}₹${absBalance.toLocaleString()}`;
  };

  const renderLedgerItem = ({ item }: { item: Ledger }) => (
    <TouchableOpacity style={styles.ledgerCard} onPress={() => handleViewDetails(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.ledgerInfo}>
          <Text style={styles.ledgerId}>{item.ledgerId}</Text>
          <Text style={styles.partyName}>{item.partyName}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.accountTypeBadge, { backgroundColor: getAccountTypeColor(item.accountType) }]}>
            <Text style={styles.accountTypeText}>{item.accountType}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10B981' : '#6B7280' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance:</Text>
          <Text style={[styles.balanceValue, { color: getBalanceColor(item.currentBalance, item.accountType) }]}>
            {formatBalance(item.currentBalance, item.accountType)}
          </Text>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Party Type:</Text>
            <Text style={styles.detailValue}>{item.partyType}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Credit Limit:</Text>
            <Text style={styles.detailValue}>₹{item.creditLimit.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.contactRow}>
          {item.contactInfo?.email && (
            <>
              <Ionicons name="mail" size={14} color="#6B7280" />
              <Text style={styles.contactText}>{item.contactInfo.email}</Text>
            </>
          )}
          {item.contactInfo?.phone && (
            <>
              <Ionicons name="call" size={14} color="#6B7280" style={styles.contactIcon} />
              <Text style={styles.contactText}>{item.contactInfo.phone}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="eye" size={16} color="#077BC3" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        <Text style={styles.createdBy}>Created by {item.createdBy.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: typeof filter, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.activeFilterButton]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[styles.filterButtonText, filter === filterType && styles.activeFilterButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#077BC3" />
        <Text style={styles.loadingText}>Loading ledgers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ledger Management</Text>
        <Text style={styles.headerSubtitle}>
          {ledgers.length} ledgers • ₹{summary?.totalDebitBalance?.toLocaleString() || '0'} total balance
        </Text>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{summary.totalLedgers}</Text>
              <Text style={styles.summaryLabel}>Total Ledgers</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                ₹{summary.totalReceivable.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Receivable</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                ₹{summary.totalPayable.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Payable</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
                ₹{summary.totalDebitBalance.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Debit Balance</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
                ₹{summary.totalCreditBalance.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Credit Balance</Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('active', 'Active')}
          {renderFilterButton('receivable', 'Receivable')}
          {renderFilterButton('payable', 'Payable')}
          {renderFilterButton('inactive', 'Inactive')}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by party name or ledger ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Create Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => {
          setShowCreateModal(true);
          fetchUsers();
        }}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create Ledger</Text>
      </TouchableOpacity>

      {/* Ledgers List */}
      <FlatList
        data={ledgers}
        renderItem={renderLedgerItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.ledgersList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No ledgers found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' ? 'No ledgers found' : `No ${filter} ledgers found`}
            </Text>
          </View>
        }
      />

      {/* Create Ledger Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Ledger</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Party *</Text>
              {loadingUsers ? (
                <ActivityIndicator size="small" color="#077BC3" />
              ) : (
                <ScrollView style={styles.userList} nestedScrollEnabled>
                  {availableUsers.map((user) => (
                    <TouchableOpacity
                      key={user._id}
                      style={[
                        styles.userItem,
                        createForm.partyId === user._id && styles.selectedUserItem
                      ]}
                      onPress={() => {
                        setCreateForm({
                          ...createForm,
                          partyId: user._id,
                          partyName: user.name,
                          partyType: user.partyType || 'customer'
                        });
                      }}
                    >
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userRole}>{user.role}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Account Type *</Text>
              <View style={styles.radioGroup}>
                {['receivable', 'payable', 'advance', 'deposit'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.radioOption,
                      createForm.accountType === type && styles.selectedRadioOption
                    ]}
                    onPress={() => setCreateForm({ ...createForm, accountType: type })}
                  >
                    <Text style={[
                      styles.radioText,
                      createForm.accountType === type && styles.selectedRadioText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Opening Balance</Text>
              <TextInput
                style={styles.formInput}
                value={createForm.openingBalance.toString()}
                onChangeText={(text) => setCreateForm({ ...createForm, openingBalance: parseFloat(text) || 0 })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Credit Limit</Text>
              <TextInput
                style={styles.formInput}
                value={createForm.creditLimit.toString()}
                onChangeText={(text) => setCreateForm({ ...createForm, creditLimit: parseFloat(text) || 0 })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={createForm.contactInfo.email}
                onChangeText={(text) => setCreateForm({ 
                  ...createForm, 
                  contactInfo: { ...createForm.contactInfo, email: text }
                })}
                keyboardType="email-address"
                placeholder="party@example.com"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                value={createForm.contactInfo.phone}
                onChangeText={(text) => setCreateForm({ 
                  ...createForm, 
                  contactInfo: { ...createForm.contactInfo, phone: text }
                })}
                keyboardType="phone-pad"
                placeholder="+91 98765 43210"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={createForm.notes}
                onChangeText={(text) => setCreateForm({ ...createForm, notes: text })}
                multiline
                numberOfLines={3}
                placeholder="Additional notes..."
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateLedger}
            >
              <Text style={styles.createButtonText}>Create Ledger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ledger Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ledger Details</Text>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedLedger && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Basic Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ledger ID:</Text>
                  <Text style={styles.detailValue}>{selectedLedger.ledgerId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Party Name:</Text>
                  <Text style={styles.detailValue}>{selectedLedger.partyName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Type:</Text>
                  <Text style={styles.detailValue}>{selectedLedger.accountType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>{selectedLedger.status}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Balance Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Current Balance:</Text>
                  <Text style={[styles.detailValue, { 
                    color: getBalanceColor(selectedLedger.currentBalance, selectedLedger.accountType) 
                  }]}>
                    {formatBalance(selectedLedger.currentBalance, selectedLedger.accountType)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Credit Limit:</Text>
                  <Text style={styles.detailValue}>₹{selectedLedger.creditLimit.toLocaleString()}</Text>
                </View>
              </View>

              {selectedLedger.contactInfo && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Contact Information</Text>
                  {selectedLedger.contactInfo.email && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue}>{selectedLedger.contactInfo.email}</Text>
                    </View>
                  )}
                  {selectedLedger.contactInfo.phone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phone:</Text>
                      <Text style={styles.detailValue}>{selectedLedger.contactInfo.phone}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Audit Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created By:</Text>
                  <Text style={styles.detailValue}>{selectedLedger.createdBy.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created At:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedLedger.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Updated:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedLedger.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#077BC3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#077BC3',
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ledgersList: {
    padding: 16,
  },
  ledgerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ledgerInfo: {
    flex: 1,
  },
  ledgerId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  accountTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountTypeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardContent: {
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  contactText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 12,
  },
  contactIcon: {
    marginLeft: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#077BC3',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  createdBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  userList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  userItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedUserItem: {
    backgroundColor: '#EBF8FF',
    borderColor: '#077BC3',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedRadioOption: {
    backgroundColor: '#077BC3',
    borderColor: '#077BC3',
  },
  radioText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedRadioText: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});

export default LedgerManagementScreen;
