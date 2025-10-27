import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface OutstandingSummary {
  totalOutstanding: number;
  totalOrders: number;
  overdueCount: number;
  overdueAmount: number;
  pendingCount: number;
  pendingAmount: number;
  averageDaysOverdue: number;
}

interface OutstandingRecord {
  _id: string;
  outstandingId: string;
  companyId: {
    _id: string;
    companyName: string;
    companyCode: string;
  };
  partyId: {
    _id: string;
    name: string;
    email: string;
    mobile: string;
  };
  orderId: {
    _id: string;
    orderNumber: string;
    orderDate: string;
    finalAmount: number;
  };
  partyName: string;
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
      _id: string;
      name: string;
    };
    addedAt: string;
  }>;
}

export const OutstandingManagementScreen = () => {
  const navigation = useNavigation();
  const { 
    superadminGetOutstandingSummary, 
    superadminGetOutstandingList,
    superadminGetOutstandingDetails,
    superadminUpdateOutstanding,
    superadminAddCollectionNote
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  // Data states
  const [summary, setSummary] = useState<OutstandingSummary | null>(null);
  const [outstandingList, setOutstandingList] = useState<OutstandingRecord[]>([]);
  const [selectedOutstanding, setSelectedOutstanding] = useState<OutstandingRecord | null>(null);
  const [companyBreakdown, setCompanyBreakdown] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [agingAnalysis, setAgingAnalysis] = useState<any[]>([]);
  const [topParties, setTopParties] = useState<any[]>([]);
  
  // Filter states
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Note modal
  const [newNote, setNewNote] = useState('');

  const fetchOutstandingData = async () => {
    try {
      setLoading(true);
      
      // Fetch summary
      const summaryParams = {
        ...(selectedCompany !== 'all' && { companyId: selectedCompany }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedRiskLevel !== 'all' && { riskLevel: selectedRiskLevel })
      };
      
      const summaryResult = await superadminGetOutstandingSummary(summaryParams);
      if (summaryResult?.success && summaryResult?.data) {
        const data = summaryResult.data;
        setSummary(data.systemSummary);
        setCompanyBreakdown(data.companyBreakdown || []);
        setStatusBreakdown(data.statusBreakdown || []);
        setAgingAnalysis(data.agingAnalysis || []);
        setTopParties(data.topOutstandingParties || []);
      }

      // Fetch list
      const listParams = {
        page: currentPage,
        limit: 20,
        ...(selectedCompany !== 'all' && { companyId: selectedCompany }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedRiskLevel !== 'all' && { riskLevel: selectedRiskLevel }),
        ...(searchQuery && { search: searchQuery }),
        sortBy,
        sortOrder
      };
      
      const listResult = await superadminGetOutstandingList(listParams);
      if (listResult?.success && listResult?.data) {
        setOutstandingList(listResult.data.outstandingList || []);
        setTotalPages(listResult.data.pagination?.totalPages || 1);
        setTotalCount(listResult.data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch outstanding data:', error);
      Alert.alert('Error', 'Failed to load outstanding data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutstandingData();
  }, [currentPage, selectedCompany, selectedStatus, selectedRiskLevel, searchQuery, sortBy, sortOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOutstandingData();
    setRefreshing(false);
  };

  const handleViewDetails = async (outstanding: OutstandingRecord) => {
    try {
      const result = await superadminGetOutstandingDetails(outstanding._id);
      if (result?.success && result?.data) {
        setSelectedOutstanding(result.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch outstanding details:', error);
      Alert.alert('Error', 'Failed to load outstanding details');
    }
  };

  const handleUpdateStatus = async (outstandingId: string, status: string) => {
    try {
      const result = await superadminUpdateOutstanding(outstandingId, { status });
      if (result?.success) {
        Alert.alert('Success', 'Outstanding status updated successfully');
        fetchOutstandingData();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedOutstanding) return;
    
    try {
      const result = await superadminAddCollectionNote(selectedOutstanding._id, newNote.trim());
      if (result?.success) {
        Alert.alert('Success', 'Collection note added successfully');
        setNewNote('');
        setShowNoteModal(false);
        fetchOutstandingData();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      Alert.alert('Error', 'Failed to add collection note');
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': '#F59E0B',
      'overdue': '#EF4444',
      'partially_paid': '#3B82F6',
      'paid': '#10B981',
      'written_off': '#6B7280',
      'disputed': '#8B5CF6'
    };
    return colors[status] || '#6B7280';
  };

  const getRiskColor = (riskLevel: string) => {
    const colors = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'critical': '#DC2626'
    };
    return colors[riskLevel] || '#6B7280';
  };

  const getAgingColor = (ageRange: string) => {
    const colors = {
      'current': '#10B981',
      '1-30_days': '#F59E0B',
      '31-60_days': '#EF4444',
      '61-90_days': '#DC2626',
      'over_90_days': '#991B1B'
    };
    return colors[ageRange] || '#6B7280';
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="white" />
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const OutstandingCard = ({ outstanding }: { outstanding: OutstandingRecord }) => (
    <TouchableOpacity 
      style={styles.outstandingCard}
      onPress={() => handleViewDetails(outstanding)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.outstandingId}>{outstanding.outstandingId}</Text>
          <Text style={styles.companyName}>{outstanding.companyId.companyName}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(outstanding.status) }]}>
            <Text style={styles.statusText}>{outstanding.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(outstanding.riskLevel) }]}>
            <Text style={styles.riskText}>{outstanding.riskLevel.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.partyInfo}>
          <Text style={styles.partyName}>{outstanding.partyName}</Text>
          <Text style={styles.orderNumber}>Order: {outstanding.orderNumber}</Text>
        </View>
        <View style={styles.amountInfo}>
          <Text style={styles.outstandingAmount}>{formatCurrency(outstanding.outstandingAmount)}</Text>
          <Text style={styles.totalAmount}>of {formatCurrency(outstanding.totalAmount)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.footerText}>
            Due: {new Date(outstanding.dueDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.footerText}>
            {outstanding.daysOverdue} days overdue
          </Text>
        </View>
        {outstanding.assignedTo && (
          <View style={styles.footerItem}>
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Text style={styles.footerText}>{outstanding.assignedTo.name}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading outstanding data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Outstanding Management</Text>
            <Text style={styles.headerSubtitle}>System-wide Outstanding Analytics</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Stats */}
        {summary && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Outstanding Summary</Text>
            <View style={styles.summaryGrid}>
              <StatCard
                title="Total Outstanding"
                value={formatCurrency(summary.totalOutstanding)}
                icon="wallet-outline"
                color="#3B82F6"
                subtitle={`${summary.totalOrders} orders`}
              />
              <StatCard
                title="Overdue Amount"
                value={formatCurrency(summary.overdueAmount)}
                icon="warning-outline"
                color="#EF4444"
                subtitle={`${summary.overdueCount} overdue`}
              />
              <StatCard
                title="Pending Amount"
                value={formatCurrency(summary.pendingAmount)}
                icon="time-outline"
                color="#F59E0B"
                subtitle={`${summary.pendingCount} pending`}
              />
              <StatCard
                title="Avg Days Overdue"
                value={`${Math.round(summary.averageDaysOverdue)} days`}
                icon="calendar-outline"
                color="#8B5CF6"
                subtitle="Average delay"
              />
            </View>
          </View>
        )}

        {/* Company Breakdown */}
        {companyBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Breakdown</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {companyBreakdown.map((company, index) => (
                <View key={index} style={styles.companyCard}>
                  <Text style={styles.companyCardName}>{company.companyName}</Text>
                  <Text style={styles.companyCardAmount}>{formatCurrency(company.totalOutstanding)}</Text>
                  <Text style={styles.companyCardOrders}>{company.totalOrders} orders</Text>
                  <View style={styles.companyCardStats}>
                    <Text style={styles.companyCardOverdue}>{company.overdueCount} overdue</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Aging Analysis */}
        {agingAnalysis.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aging Analysis</Text>
            <View style={styles.agingGrid}>
              {agingAnalysis.map((age, index) => (
                <View key={index} style={styles.agingCard}>
                  <View style={[styles.agingIndicator, { backgroundColor: getAgingColor(age._id) }]} />
                  <Text style={styles.agingRange}>
                    {age._id === 'current' ? 'Current' : 
                     age._id === '1-30_days' ? '1-30 Days' :
                     age._id === '31-60_days' ? '31-60 Days' :
                     age._id === '61-90_days' ? '61-90 Days' :
                     '90+ Days'}
                  </Text>
                  <Text style={styles.agingCount}>{age.count}</Text>
                  <Text style={styles.agingAmount}>{formatCurrency(age.totalAmount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Outstanding Parties */}
        {topParties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Outstanding Parties</Text>
            <View style={styles.topPartiesCard}>
              {topParties.slice(0, 5).map((party, index) => (
                <View key={index} style={styles.partyItem}>
                  <View style={styles.partyRank}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.partyInfo}>
                    <Text style={styles.partyName}>{party.partyName}</Text>
                    <Text style={styles.partyCompany}>{party.companyName}</Text>
                  </View>
                  <View style={styles.partyStats}>
                    <Text style={styles.partyAmount}>{formatCurrency(party.totalOutstanding)}</Text>
                    <Text style={styles.partyOrders}>{party.orderCount} orders</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Outstanding List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Outstanding Records</Text>
            <Text style={styles.recordCount}>{totalCount} records</Text>
          </View>
          
          {outstandingList.length > 0 ? (
            outstandingList.map((outstanding) => (
              <OutstandingCard key={outstanding._id} outstanding={outstanding} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Outstanding Records</Text>
              <Text style={styles.emptySubtitle}>No outstanding records found with current filters</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Outstanding</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Search */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Search</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by party name or order number"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Company Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Company</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, selectedCompany === 'all' && styles.filterOptionActive]}
                    onPress={() => setSelectedCompany('all')}
                  >
                    <Text style={[styles.filterOptionText, selectedCompany === 'all' && styles.filterOptionTextActive]}>
                      All Companies
                    </Text>
                  </TouchableOpacity>
                  {companyBreakdown.map((company) => (
                    <TouchableOpacity
                      key={company._id}
                      style={[styles.filterOption, selectedCompany === company._id && styles.filterOptionActive]}
                      onPress={() => setSelectedCompany(company._id)}
                    >
                      <Text style={[styles.filterOptionText, selectedCompany === company._id && styles.filterOptionTextActive]}>
                        {company.companyName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.filterOptions}>
                  {['all', 'pending', 'overdue', 'partially_paid', 'paid', 'written_off', 'disputed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.filterOption, selectedStatus === status && styles.filterOptionActive]}
                      onPress={() => setSelectedStatus(status)}
                    >
                      <Text style={[styles.filterOptionText, selectedStatus === status && styles.filterOptionTextActive]}>
                        {status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Risk Level Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Risk Level</Text>
                <View style={styles.filterOptions}>
                  {['all', 'low', 'medium', 'high', 'critical'].map((risk) => (
                    <TouchableOpacity
                      key={risk}
                      style={[styles.filterOption, selectedRiskLevel === risk && styles.filterOptionActive]}
                      onPress={() => setSelectedRiskLevel(risk)}
                    >
                      <Text style={[styles.filterOptionText, selectedRiskLevel === risk && styles.filterOptionTextActive]}>
                        {risk === 'all' ? 'All Risk Levels' : risk.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setSelectedCompany('all');
                  setSelectedStatus('all');
                  setSelectedRiskLevel('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.modalButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Outstanding Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedOutstanding && (
              <ScrollView style={styles.modalContent}>
                {/* Basic Info */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Basic Information</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Outstanding ID:</Text>
                    <Text style={styles.detailsValue}>{selectedOutstanding.outstandingId}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Company:</Text>
                    <Text style={styles.detailsValue}>{selectedOutstanding.companyId.companyName}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Party:</Text>
                    <Text style={styles.detailsValue}>{selectedOutstanding.partyName}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Order Number:</Text>
                    <Text style={styles.detailsValue}>{selectedOutstanding.orderNumber}</Text>
                  </View>
                </View>

                {/* Financial Info */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Financial Information</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Total Amount:</Text>
                    <Text style={styles.detailsValue}>{formatCurrency(selectedOutstanding.totalAmount)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Paid Amount:</Text>
                    <Text style={styles.detailsValue}>{formatCurrency(selectedOutstanding.paidAmount)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Outstanding Amount:</Text>
                    <Text style={[styles.detailsValue, { color: '#EF4444', fontWeight: 'bold' }]}>
                      {formatCurrency(selectedOutstanding.outstandingAmount)}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Due Date:</Text>
                    <Text style={styles.detailsValue}>
                      {new Date(selectedOutstanding.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Days Overdue:</Text>
                    <Text style={[styles.detailsValue, { color: selectedOutstanding.daysOverdue > 0 ? '#EF4444' : '#10B981' }]}>
                      {selectedOutstanding.daysOverdue} days
                    </Text>
                  </View>
                </View>

                {/* Status & Risk */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Status & Risk</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOutstanding.status) }]}>
                      <Text style={styles.statusText}>{selectedOutstanding.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Risk Level:</Text>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(selectedOutstanding.riskLevel) }]}>
                      <Text style={styles.riskText}>{selectedOutstanding.riskLevel.toUpperCase()}</Text>
                    </View>
                  </View>
                  {selectedOutstanding.assignedTo && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Assigned To:</Text>
                      <Text style={styles.detailsValue}>{selectedOutstanding.assignedTo.name}</Text>
                    </View>
                  )}
                </View>

                {/* Collection Notes */}
                {selectedOutstanding.collectionNotes && selectedOutstanding.collectionNotes.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Collection Notes</Text>
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

                {/* Actions */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Quick Actions</Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                      onPress={() => handleUpdateStatus(selectedOutstanding._id, 'paid')}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Mark Paid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                      onPress={() => setShowNoteModal(true)}
                    >
                      <Ionicons name="add" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Add Note</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.noteModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Collection Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TextInput
                style={styles.noteInput}
                placeholder="Enter collection note..."
                value={newNote}
                onChangeText={setNewNote}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddNote}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Add Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  companyCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  companyCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  companyCardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 2,
  },
  companyCardOrders: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  companyCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  companyCardOverdue: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '500',
  },
  agingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  agingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  agingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  agingRange: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  agingCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  agingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  topPartiesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  partyRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  partyCompany: {
    fontSize: 12,
    color: '#6B7280',
  },
  partyStats: {
    alignItems: 'flex-end',
  },
  partyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 2,
  },
  partyOrders: {
    fontSize: 12,
    color: '#6B7280',
  },
  outstandingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  outstandingId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partyInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  outstandingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  detailsModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  noteModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#3B82F6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: '#F3F4F6',
  },
  modalButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    color: 'white',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  noteItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  noteMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  noteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 100,
  },
});

export default OutstandingManagementScreen;
