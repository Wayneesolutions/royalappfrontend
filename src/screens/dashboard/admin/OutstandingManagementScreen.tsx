import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';

interface Outstanding {
  _id: string;
  outstandingId: string;
  partyName: string;
  partyType: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  status: string;
  daysOverdue: number;
  riskLevel: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  collectionNotes: Array<{
    note: string;
    addedBy: {
      name: string;
    };
    addedAt: string;
  }>;
}

interface OutstandingSummary {
  totalOutstanding: number;
  totalOrders: number;
  overdueCount: number;
  overdueAmount: number;
  pendingCount: number;
  pendingAmount: number;
  averageDaysOverdue: number;
}

const OutstandingManagementScreen = () => {
  const { getOutstandingSummary, getOutstandingList, updateOutstanding, addCollectionNote, assignOutstanding, getUsersForAssignment } = useAuth();
  const [summary, setSummary] = useState<OutstandingSummary | null>(null);
  const [outstandingList, setOutstandingList] = useState<Outstanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOutstanding, setSelectedOutstanding] = useState<Outstanding | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'partially_paid'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'outstandingAmount' | 'daysOverdue' | 'partyName'>('dueDate');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'hierarchy'>('list');
  const [expandedParties, setExpandedParties] = useState<Record<string, boolean>>({});

  // Hierarchy-specific state (independent of list filters)
  const [hierarchyParties, setHierarchyParties] = useState<any[]>([]);
  const [hierarchySummary, setHierarchySummary] = useState<{ totalParties: number; totalOutstanding: number; totalInvoices: number } | null>(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [hierarchyRefreshing, setHierarchyRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter, sortBy, searchQuery]);

  useEffect(() => {
    if (activeTab === 'hierarchy' && hierarchyParties.length === 0 && !hierarchyLoading) {
      fetchHierarchyData();
    }
  }, [activeTab]);

  const fetchHierarchyData = async (refreshing = false) => {
    try {
      if (refreshing) setHierarchyRefreshing(true);
      else setHierarchyLoading(true);
      const result = await apiService.getOutstandingHierarchy();
      if (result?.success) {
        setHierarchyParties(result.data?.parties || []);
        setHierarchySummary(result.data?.summary || null);
      }
    } catch (error) {
      console.error('Error fetching outstanding hierarchy:', error);
    } finally {
      setHierarchyLoading(false);
      setHierarchyRefreshing(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch summary
      const summaryResult = await getOutstandingSummary({
        status: filter === 'all' ? undefined : filter
      });
      if (summaryResult?.success) {
        setSummary(summaryResult.data?.summary);
      }

      // Fetch outstanding list
      const listResult = await getOutstandingList({
        status: filter === 'all' ? undefined : filter,
        sortBy,
        search: searchQuery || undefined,
        limit: 50
      });
      if (listResult?.success) {
        setOutstandingList(listResult.data?.outstandingList || []);
      }

      // Fetch users for assignment
      const usersResult = await getUsersForAssignment();
      if (usersResult?.success) {
        setUsers(usersResult.data?.users || []);
      }

    } catch (error) {
      console.error('Error fetching outstanding data:', error);
      Alert.alert('Error', 'Failed to fetch outstanding data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    if (activeTab === 'hierarchy') {
      fetchHierarchyData(true);
    }
  };

  const handleViewDetails = (outstanding: Outstanding) => {
    setSelectedOutstanding(outstanding);
    setShowDetailsModal(true);
  };

  const handleAssign = (outstanding: Outstanding) => {
    setSelectedOutstanding(outstanding);
    setShowAssignModal(true);
  };

  const handleAddNote = (outstanding: Outstanding) => {
    setSelectedOutstanding(outstanding);
    setShowNoteModal(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedOutstanding || !selectedUser) {
      Alert.alert('Error', 'Please select a user to assign');
      return;
    }

    try {
      const result = await assignOutstanding(selectedOutstanding._id, { assignedTo: selectedUser });
      if (result?.success) {
        Alert.alert('Success', 'Outstanding assigned successfully', [
          {
            text: 'OK',
            onPress: () => {
              setShowAssignModal(false);
              setSelectedUser('');
              fetchData();
            }
          }
        ]);
      } else {
        Alert.alert('Error', result?.message || 'Failed to assign outstanding');
      }
    } catch (error) {
      console.error('Error assigning outstanding:', error);
      Alert.alert('Error', 'Failed to assign outstanding');
    }
  };

  const handleAddNoteSubmit = async () => {
    if (!selectedOutstanding || !note.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      const result = await addCollectionNote(selectedOutstanding._id, { note: note.trim() });
      if (result?.success) {
        Alert.alert('Success', 'Note added successfully', [
          {
            text: 'OK',
            onPress: () => {
              setShowNoteModal(false);
              setNote('');
              fetchData();
            }
          }
        ]);
      } else {
        Alert.alert('Error', result?.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'partially_paid': return '#3B82F6';
      case 'paid': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const renderOutstandingItem = ({ item }: { item: Outstanding }) => (
    <TouchableOpacity style={styles.outstandingCard} onPress={() => handleViewDetails(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.partyInfo}>
          <Text style={styles.partyName}>{item.partyName}</Text>
          <Text style={styles.orderNumber}>Order: {item.orderNumber}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
          </View>
          {item.riskLevel !== 'low' && (
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.riskLevel) }]}>
              <Text style={styles.riskText}>{item.riskLevel}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Outstanding:</Text>
          <Text style={styles.amountValue}>₹{item.outstandingAmount.toLocaleString()}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Days Overdue:</Text>
            <Text style={[styles.detailValue, { color: item.daysOverdue > 0 ? '#EF4444' : '#10B981' }]}>
              {item.daysOverdue}
            </Text>
          </View>
        </View>

        {item.assignedTo && (
          <View style={styles.assignedRow}>
            <Text style={styles.assignedLabel}>Assigned to:</Text>
            <Text style={styles.assignedValue}>{item.assignedTo.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAssign(item)}
        >
          <Ionicons name="person-add" size={16} color="#077BC3" />
          <Text style={styles.actionButtonText}>Assign</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAddNote(item)}
        >
          <Ionicons name="add-circle" size={16} color="#10B981" />
          <Text style={styles.actionButtonText}>Add Note</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const toggleParty = (name: string) =>
    setExpandedParties(prev => ({ ...prev, [name]: !prev[name] }));

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

  const renderHierarchyTab = () => {
    if (hierarchyLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#077BC3" />
          <Text style={styles.loadingText}>Loading hierarchy...</Text>
        </View>
      );
    }

    const totalOutstanding = hierarchySummary?.totalOutstanding || 0;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={hierarchyRefreshing}
            onRefresh={() => fetchHierarchyData(true)}
          />
        }
      >
        {/* Summary Strip */}
        <View style={styles.hierStrip}>
          <View style={styles.hierStripItem}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.hierStripVal}>{hierarchySummary?.totalInvoices ?? 0}</Text>
            <Text style={styles.hierStripLab}>Total Bills</Text>
          </View>
          <View style={[styles.hierStripItem, styles.hierStripDivider]}>
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={styles.hierStripVal}>{hierarchySummary?.totalParties ?? 0}</Text>
            <Text style={styles.hierStripLab}>Parties</Text>
          </View>
          <View style={[styles.hierStripItem, styles.hierStripDivider]}>
            <Ionicons name="cash" size={20} color="#fff" />
            <Text style={styles.hierStripVal}>
              ₹{totalOutstanding >= 100000
                ? `${(totalOutstanding / 100000).toFixed(1)}L`
                : totalOutstanding >= 1000
                ? `${(totalOutstanding / 1000).toFixed(1)}K`
                : totalOutstanding.toFixed(0)}
            </Text>
            <Text style={styles.hierStripLab}>Outstanding</Text>
          </View>
        </View>

        {hierarchyParties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No outstanding data</Text>
          </View>
        ) : hierarchyParties.map(node => {
          const initials = (node.partyName || 'UN').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
          const isExpanded = expandedParties[node.partyName];
          return (
            <View key={node.partyName} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={styles.partyCard}
                onPress={() => toggleParty(node.partyName)}
                activeOpacity={0.85}
              >
                <View style={styles.partyCardLeft}>
                  <View style={styles.partyAvatar}>
                    <Text style={styles.partyAvatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.partyCardName} numberOfLines={1}>{node.partyName}</Text>
                    <Text style={styles.partyCardType}>{node.partyType || 'Party'}</Text>
                    {node.overdueCount > 0 && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueBadgeText}>{node.overdueCount} overdue</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.partyCardRight}>
                  <View style={styles.partyStatItem}>
                    <Text style={styles.partyStatVal}>{node.invoiceCount}</Text>
                    <Text style={styles.partyStatLab}>BILLS</Text>
                  </View>
                  <View style={styles.partyStatDivider} />
                  <View style={styles.partyStatItem}>
                    <Text style={[styles.partyStatVal, { color: '#EF4444' }]}>
                      ₹{node.totalOutstanding >= 100000
                        ? `${(node.totalOutstanding / 100000).toFixed(1)}L`
                        : node.totalOutstanding >= 1000
                        ? `${(node.totalOutstanding / 1000).toFixed(1)}K`
                        : node.totalOutstanding.toFixed(0)}
                    </Text>
                    <Text style={styles.partyStatLab}>OUTSTANDING</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#9CA3AF"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedItems}>
                  {(node.invoices || []).map((inv: any) => (
                    <View key={inv._id || inv.outstandingId} style={styles.expandedCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={styles.expandedOrderNum}>{inv.vchnumber || inv.outstandingId || '—'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inv.status) }]}>
                          <Text style={styles.statusText}>{(inv.status || '').replace('_', ' ')}</Text>
                        </View>
                      </View>
                      {inv.vchdate && (
                        <Text style={styles.expandedLabel}>
                          Date: {new Date(inv.vchdate).toLocaleDateString()}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={styles.expandedLabel}>
                          Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                        </Text>
                        <Text style={styles.expandedAmount}>₹{(inv.outstandingAmount || 0).toLocaleString()}</Text>
                      </View>
                      {inv.daysOverdue > 0 && (
                        <Text style={styles.expandedOverdue}>{inv.daysOverdue} days overdue</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#077BC3" />
        <Text style={styles.loadingText}>Loading outstanding data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Outstanding Management</Text>
        <Text style={styles.headerSubtitle}>
          {outstandingList.length} outstanding • ₹{summary?.totalOutstanding?.toLocaleString() || '0'} total
        </Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'list' && styles.tabItemActive]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons name="list-outline" size={18} color={activeTab === 'list' ? '#077BC3' : '#9CA3AF'} />
          <Text style={[styles.tabLabel, activeTab === 'list' && styles.tabLabelActive]}>Outstanding</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'hierarchy' && styles.tabItemActive]}
          onPress={() => setActiveTab('hierarchy')}
        >
          <Ionicons name="git-network-outline" size={18} color={activeTab === 'hierarchy' ? '#077BC3' : '#9CA3AF'} />
          <Text style={[styles.tabLabel, activeTab === 'hierarchy' && styles.tabLabelActive]}>Hierarchy</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'hierarchy' ? renderHierarchyTab() : (
        <>
          {/* Summary Cards */}
          {summary && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>₹{summary.totalOutstanding.toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Total Outstanding</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.overdueCount}</Text>
                <Text style={styles.summaryLabel}>Overdue</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.pendingCount}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
            </View>
          )}

          {/* Status Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filtersRow}>
                {renderFilterButton('all', 'All')}
                {renderFilterButton('pending', 'Pending')}
                {renderFilterButton('overdue', 'Overdue')}
                {renderFilterButton('partially_paid', 'Partial')}
              </View>
            </ScrollView>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by party name or order number..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Outstanding List */}
          <FlatList
            data={outstandingList}
            renderItem={renderOutstandingItem}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.outstandingList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No outstanding found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {filter === 'all' ? 'No outstanding records found' : `No ${filter} outstanding found`}
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Outstanding Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedOutstanding && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Party Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedOutstanding.partyName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedOutstanding.partyType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Number:</Text>
                  <Text style={styles.detailValue}>{selectedOutstanding.orderNumber}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Financial Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>₹{selectedOutstanding.totalAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid Amount:</Text>
                  <Text style={styles.detailValue}>₹{selectedOutstanding.paidAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Outstanding:</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444', fontWeight: 'bold' }]}>
                    ₹{selectedOutstanding.outstandingAmount.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Status & Dates</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOutstanding.status) }]}>
                    <Text style={styles.statusText}>{selectedOutstanding.status.replace('_', ' ')}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedOutstanding.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Days Overdue:</Text>
                  <Text style={[styles.detailValue, { color: selectedOutstanding.daysOverdue > 0 ? '#EF4444' : '#10B981' }]}>
                    {selectedOutstanding.daysOverdue}
                  </Text>
                </View>
              </View>

              {selectedOutstanding.collectionNotes.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Collection Notes</Text>
                  {selectedOutstanding.collectionNotes.map((note, index) => (
                    <View key={index} style={styles.noteItem}>
                      <Text style={styles.noteText}>{note.note}</Text>
                      <Text style={styles.noteMeta}>
                        {note.addedBy.name} • {new Date(note.addedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Assign Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Outstanding</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAssignModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select User to Assign</Text>
              <ScrollView style={styles.usersList}>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user._id}
                    style={[
                      styles.userOption,
                      selectedUser === user._id && styles.selectedUserOption
                    ]}
                    onPress={() => setSelectedUser(user._id)}
                  >
                    <Text style={[
                      styles.userOptionText,
                      selectedUser === user._id && styles.selectedUserOptionText
                    ]}>
                      {user.name} ({user.role})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAssignModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.assignButton}
              onPress={handleAssignSubmit}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.assignButtonText}>Assign</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Collection Note</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowNoteModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={note}
                onChangeText={setNote}
                placeholder="Enter collection note..."
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowNoteModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={handleAddNoteSubmit}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addNoteButtonText}>Add Note</Text>
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

  // Tab Bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#077BC3' },
  tabLabel: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabLabelActive: { color: '#077BC3' },

  // Hierarchy
  hierStrip: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18, backgroundColor: '#077BC3', marginHorizontal: 0, borderRadius: 14, marginBottom: 16, elevation: 4 },
  hierStripItem: { alignItems: 'center', flex: 1 },
  hierStripDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' },
  hierStripVal: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  hierStripLab: { color: '#DBEAFE', fontSize: 10, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },

  partyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  partyCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 8 },
  partyAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#077BC3', justifyContent: 'center', alignItems: 'center', marginRight: 10, flexShrink: 0 },
  partyAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  partyCardName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  partyCardType: { fontSize: 11, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
  overdueBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginTop: 4, alignSelf: 'flex-start' },
  overdueBadgeText: { fontSize: 10, color: '#EF4444', fontWeight: '600' },
  partyCardRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  partyStatItem: { alignItems: 'center', width: 72 },
  partyStatVal: { fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' },
  partyStatLab: { fontSize: 8, color: '#9CA3AF', marginTop: 2, fontWeight: '600', letterSpacing: 0.4 },
  partyStatDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB', marginHorizontal: 4 },

  expandedItems: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 6 },
  expandedCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  expandedOrderNum: { fontSize: 13, fontWeight: '700', color: '#111827' },
  expandedLabel: { fontSize: 12, color: '#6B7280' },
  expandedAmount: { fontSize: 14, fontWeight: '800', color: '#EF4444' },
  expandedOverdue: { fontSize: 11, color: '#EF4444', marginTop: 4 },
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
  outstandingList: {
    padding: 16,
  },
  outstandingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  riskText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardContent: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
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
    fontWeight: '600',
    color: '#111827',
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  assignedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#077BC3',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  noteMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  usersList: {
    maxHeight: 200,
  },
  userOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  selectedUserOption: {
    backgroundColor: '#077BC3',
  },
  userOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedUserOptionText: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  assignButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#077BC3',
    gap: 8,
  },
  assignButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  addNoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 8,
  },
  addNoteButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default OutstandingManagementScreen;
