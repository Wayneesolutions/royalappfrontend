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
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Helper function to show toast messages that works on all platforms
const showToast = (message: string, duration: 'short' | 'long' = 'short') => {
  console.log('showToast called with:', message, 'duration:', duration, 'platform:', Platform.OS);
  
  try {
    if (Platform.OS === 'android') {
      const { ToastAndroid } = require('react-native');
      ToastAndroid.show(message, duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT);
      console.log('ToastAndroid.show called successfully');
    } else {
      // For web and iOS, use Alert instead
      console.log('Using Alert.alert for non-Android platform');
      Alert.alert('Error', message); // Changed title to "Error" for better visibility
    }
  } catch (error) {
    console.error('Error in showToast:', error);
    // Fallback to Alert if toast fails
    Alert.alert('Error', message);
  }
};

interface Target {
  _id: string;
  targetId: string;
  companyId: string;
  assignedTo: {
    _id: string;
    name: string;
    role: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    role: string;
  };
  targetType: string;
  targetPeriod: string;
  targetAmount: number;
  targetQuantity: number;
  startDate: string;
  endDate: string;
  status: string;
  achievedAmount: number;
  achievedQuantity: number;
  achievementPercentage: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface TargetStats {
  totalTargets: number;
  totalTargetAmount: number;
  totalAchievedAmount: number;
  averageAchievement: number;
  targetsByRole: { [key: string]: number };
  targetsByMonth: { [key: string]: number };
  topPerformers: Array<{
    userId: string;
    userName: string;
    userRole: string;
    achievementPercentage: number;
  }>;
  underPerformers: Array<{
    userId: string;
    userName: string;
    userRole: string;
    achievementPercentage: number;
  }>;
}

const TargetManagementScreen = () => {
  const { user, getTargetPerformanceReport, getUsersForTargetAssignment, assignTargets } = useAuth();
  const navigation = useNavigation();
  
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetStats, setTargetStats] = useState<TargetStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTargetDetails, setShowTargetDetails] = useState(false);
  const [showCreateTarget, setShowCreateTarget] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Form state for creating targets
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [targetType, setTargetType] = useState('order');
  const [targetPeriod, setTargetPeriod] = useState('monthly');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  

  const statusOptions = [
    { key: '', label: 'All Status', color: '#6B7280' },
    { key: 'active', label: 'Active', color: '#10B981' },
    { key: 'completed', label: 'Completed', color: '#3B82F6' },
    { key: 'expired', label: 'Expired', color: '#EF4444' },
    { key: 'cancelled', label: 'Cancelled', color: '#9CA3AF' },
  ];

  const periodOptions = [
    { key: '', label: 'All Periods', color: '#6B7280' },
    { key: 'monthly', label: 'Monthly', color: '#3B82F6' },
  ];


  const fetchTargetData = async () => {
    if (!user?.defaultCompany) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch target performance report
      const result = await getTargetPerformanceReport();
      
      if (result?.success && result?.data) {
        const data = result.data;
        setTargets(data.targets || []);
        setTargetStats(data.performanceMetrics || null);
      }

      // Fetch team members for target assignment
      const teamResult = await getUsersForTargetAssignment();
      if (teamResult?.success && teamResult?.data) {
        setTeamMembers(teamResult.data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch target data:', error);
      Alert.alert('Error', 'Failed to load target data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTargetData();
  }, [user?.defaultCompany]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTargetData();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setShowFilters(false);
  };

  const handlePeriodFilter = (period: string) => {
    setSelectedPeriod(period);
    setShowFilters(false);
  };

  const handleViewTargetDetails = (target: Target) => {
    setSelectedTarget(target);
    setShowTargetDetails(true);
  };

  const handleCreateTarget = () => {
    setShowCreateTarget(true);
  };

  const handleSubmitTarget = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a team member');
      return;
    }
    if (!targetAmount || !targetQuantity) {
      Alert.alert('Error', 'Please fill in target amount and quantity');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please fill in start and end dates');
      return;
    }

    try {
      setSubmitting(true);
      
      const targetData = {
        assignedTo: selectedUser._id,
        targetType: targetPeriod,
        period: {
          startDate: startDate,
          endDate: endDate,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        },
        targetAmount: parseFloat(targetAmount),
        targetQuantity: parseInt(targetQuantity),
        notes: notes
      };

      const result = await assignTargets([targetData]);
      console.log('Target creation result:', result);
      
      if (result?.success) {
        // Success case - targets were assigned (with or without warnings)
        if (result.data?.errors && result.data.errors.length > 0) {
          // Show warning message for partial success
          showToast(`Targets assigned with warnings: ${result.data.errors[0]}`, 'long');
        }
        
        // Close modal immediately and reset form
        setShowCreateTarget(false);
        resetForm();
        fetchTargetData(); // Refresh the targets list
        
        // Show success message
        Alert.alert(
          'Success', 
          result.message || 'Target created successfully!'
        );
      } else {
        // Error case - no targets were assigned due to errors
        console.log('Error case - success is false');
        console.log('Result data errors:', result.data?.errors);
        console.log('Result message:', result?.message);
        
        if (result.data?.errors && result.data.errors.length > 0) {
          console.log('About to show error toast:', result.data.errors[0]);
          showToast(result.data.errors[0], 'long');
        } else {
          console.log('About to show generic error toast:', result?.message || 'Failed to create target');
          showToast(result?.message || 'Failed to create target', 'short');
        }
      }
    } catch (error) {
      console.error('Failed to create target:', error);
      showToast('Failed to create target', 'short');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setTargetAmount('');
    setTargetQuantity('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setTargetPeriod('monthly');
  };


  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const statusConfig = statusOptions.find(s => s.key === status);
    return statusConfig?.color || '#6B7280';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      rsm: '#3B82F6',
      asm: '#10B981',
      salesman: '#F59E0B',
      dealers: '#8B5CF6',
      distibutors: '#06B6D4',
      subdealer: '#EF4444',
    };
    return colors[role] || '#6B7280';
  };

  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return '#10B981';
    if (percentage >= 75) return '#3B82F6';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };


  const renderStatCard = (title: string, value: string | number, icon: string, color: string, subtitle?: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={20} color="white" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );

  const renderTargetCard = ({ item }: { item: Target }) => (
    <TouchableOpacity
      style={styles.targetCard}
      onPress={() => handleViewTargetDetails(item)}
    >
      <View style={styles.targetHeader}>
        <View style={styles.targetInfo}>
          <Text style={styles.targetId}>{item.targetId}</Text>
          <Text style={styles.targetType}>{item.targetType.toUpperCase()}</Text>
          <Text style={styles.targetPeriod}>{item.targetPeriod}</Text>
        </View>
        <View style={styles.targetStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.achievementBadge, { backgroundColor: getAchievementColor(item.achievementPercentage) }]}>
            <Text style={styles.achievementText}>{item.achievementPercentage.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.targetDetails}>
        <View style={styles.targetAmount}>
          <Text style={styles.amountLabel}>Target Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.targetAmount)}</Text>
        </View>
        <View style={styles.targetAchieved}>
          <Text style={styles.achievedLabel}>Achieved</Text>
          <Text style={styles.achievedValue}>{formatCurrency(item.achievedAmount)}</Text>
        </View>
        <View style={styles.targetProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(item.achievementPercentage, 100)}%`,
                  backgroundColor: getAchievementColor(item.achievementPercentage)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{item.achievementPercentage.toFixed(1)}%</Text>
        </View>
      </View>
      
      <View style={styles.targetFooter}>
        <View style={styles.targetAssignee}>
          <View style={[styles.assigneeAvatar, { backgroundColor: getRoleColor(item.assignedTo.role) }]}>
            <Text style={styles.assigneeInitial}>{item.assignedTo.name.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.assigneeName}>{item.assignedTo.name}</Text>
            <Text style={styles.assigneeRole}>{item.assignedTo.role}</Text>
          </View>
        </View>
        <View style={styles.targetDates}>
          <Text style={styles.dateLabel}>Period</Text>
          <Text style={styles.dateValue}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCreateTargetModal = () => (
    <Modal
      visible={showCreateTarget}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create New Target</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowCreateTarget(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Target Assignment</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Assign To</Text>
              <View style={styles.teamMembersList}>
                {teamMembers.map((member) => (
                  <TouchableOpacity
                    key={member._id}
                    style={[
                      styles.memberOption,
                      selectedUser?._id === member._id && styles.selectedMemberOption
                    ]}
                    onPress={() => setSelectedUser(member)}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: getRoleColor(member.role) }]}>
                      <Text style={styles.memberInitial}>{member.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                    {selectedUser?._id === member._id && (
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {selectedUser && (
                <View style={styles.selectedUserDisplay}>
                  <Text style={styles.selectedUserLabel}>Selected:</Text>
                  <View style={styles.selectedUserInfo}>
                    <View style={[styles.memberAvatar, { backgroundColor: getRoleColor(selectedUser.role) }]}>
                      <Text style={styles.memberInitial}>{selectedUser.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{selectedUser.name}</Text>
                      <Text style={styles.memberRole}>{selectedUser.role}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>


            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Period</Text>
              <View style={styles.periodOptions}>
                {periodOptions.slice(1).map((period) => (
                  <TouchableOpacity
                    key={period.key}
                    style={[
                      styles.periodOption,
                      targetPeriod === period.key && styles.selectedPeriodOption
                    ]}
                    onPress={() => setTargetPeriod(period.key)}
                  >
                    <Text style={[
                      styles.periodLabel,
                      targetPeriod === period.key && styles.selectedPeriodLabel
                    ]}>
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Amount (₹)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter target amount"
                keyboardType="numeric"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Quantity</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter target quantity"
                keyboardType="numeric"
                value={targetQuantity}
                onChangeText={setTargetQuantity}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Date</Text>
              <TextInput
                style={styles.formInput}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
                keyboardType="default"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>End Date</Text>
              <TextInput
                style={styles.formInput}
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
                keyboardType="default"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Add any additional notes"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setShowCreateTarget(false);
              // Reset form
              setSelectedUser(null);
              setTargetAmount('');
              setTargetQuantity('');
              setStartDate('');
              setEndDate('');
              setNotes('');
            }}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.createBtn,
              (!selectedUser || !targetAmount || !targetQuantity || submitting) && styles.disabledBtn
            ]}
            onPress={handleSubmitTarget}
            disabled={!selectedUser || !targetAmount || !targetQuantity || submitting}
          >
            <Text style={[
              styles.createBtnText,
              (!selectedUser || !targetAmount || !targetQuantity || submitting) && styles.disabledBtnText
            ]}>
              {submitting ? 'Creating...' : 'Create Target'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTargetDetails = () => (
    <Modal
      visible={showTargetDetails}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Target Details</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowTargetDetails(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {selectedTarget && (
          <ScrollView style={styles.modalContent}>
            {/* Target Header */}
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTargetId}>{selectedTarget.targetId}</Text>
                <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedTarget.status) }]}>
                  <Text style={styles.detailStatusText}>{selectedTarget.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.detailTargetType}>{selectedTarget.targetType.toUpperCase()}</Text>
            </View>

            {/* Achievement Overview */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Achievement Overview</Text>
              <View style={styles.achievementStats}>
                <View style={styles.achievementStat}>
                  <Text style={styles.achievementStatValue}>{formatCurrency(selectedTarget.targetAmount)}</Text>
                  <Text style={styles.achievementStatLabel}>Target Amount</Text>
                </View>
                <View style={styles.achievementStat}>
                  <Text style={styles.achievementStatValue}>{formatCurrency(selectedTarget.achievedAmount)}</Text>
                  <Text style={styles.achievementStatLabel}>Achieved Amount</Text>
                </View>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: getAchievementColor(selectedTarget.achievementPercentage) }]}>
                    {selectedTarget.achievementPercentage.toFixed(1)}%
                  </Text>
                  <Text style={styles.achievementStatLabel}>Achievement</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(selectedTarget.achievementPercentage, 100)}%`,
                      backgroundColor: getAchievementColor(selectedTarget.achievementPercentage)
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Target Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Target Information</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Target Period</Text>
                <Text style={styles.detailInfoValue}>{selectedTarget.targetPeriod}</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Start Date</Text>
                <Text style={styles.detailInfoValue}>{formatDate(selectedTarget.startDate)}</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>End Date</Text>
                <Text style={styles.detailInfoValue}>{formatDate(selectedTarget.endDate)}</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Target Quantity</Text>
                <Text style={styles.detailInfoValue}>{selectedTarget.targetQuantity}</Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Achieved Quantity</Text>
                <Text style={styles.detailInfoValue}>{selectedTarget.achievedQuantity}</Text>
              </View>
            </View>

            {/* Assigned To */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Assigned To</Text>
              <View style={styles.assigneeCard}>
                <View style={[styles.assigneeAvatar, { backgroundColor: getRoleColor(selectedTarget.assignedTo.role) }]}>
                  <Text style={styles.assigneeInitial}>{selectedTarget.assignedTo.name.charAt(0)}</Text>
                </View>
                <View style={styles.assigneeDetails}>
                  <Text style={styles.assigneeName}>{selectedTarget.assignedTo.name}</Text>
                  <Text style={styles.assigneeRole}>{selectedTarget.assignedTo.role}</Text>
                </View>
              </View>
            </View>

            {/* Assigned By */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Assigned By</Text>
              <View style={styles.assigneeCard}>
                <View style={[styles.assigneeAvatar, { backgroundColor: getRoleColor(selectedTarget.assignedBy.role) }]}>
                  <Text style={styles.assigneeInitial}>{selectedTarget.assignedBy.name.charAt(0)}</Text>
                </View>
                <View style={styles.assigneeDetails}>
                  <Text style={styles.assigneeName}>{selectedTarget.assignedBy.name}</Text>
                  <Text style={styles.assigneeRole}>{selectedTarget.assignedBy.role}</Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            {selectedTarget.notes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Notes</Text>
                <Text style={styles.detailNotes}>{selectedTarget.notes}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  if (loading && !targetStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading targets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Target Management</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={handleCreateTarget}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Target Stats */}
      {targetStats && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Target Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Total Targets', targetStats.totalTargets, 'target', '#3B82F6')}
            {renderStatCard('Total Amount', formatCurrency(targetStats.totalTargetAmount), 'trending-up', '#10B981')}
            {renderStatCard('Achieved', formatCurrency(targetStats.totalAchievedAmount), 'checkmark-circle', '#10B981')}
            {renderStatCard('Avg Achievement', `${targetStats.averageAchievement.toFixed(1)}%`, 'bar-chart', '#F59E0B')}
          </View>
        </View>
      )}

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search targets..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#3B82F6" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Status:</Text>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.filterChip,
                    { borderColor: selectedStatus === status.key ? status.color : '#E5E7EB' }
                  ]}
                  onPress={() => handleStatusFilter(status.key)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedStatus === status.key ? status.color : '#6B7280' }
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Period:</Text>
              {periodOptions.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.filterChip,
                    { borderColor: selectedPeriod === period.key ? period.color : '#E5E7EB' }
                  ]}
                  onPress={() => handlePeriodFilter(period.key)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedPeriod === period.key ? period.color : '#6B7280' }
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Targets List */}
      <View style={styles.targetsSection}>
        <View style={styles.targetsHeader}>
          <Text style={styles.sectionTitle}>
            Targets ({targets.length})
          </Text>
          {(selectedStatus || selectedPeriod) && (
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setSelectedStatus('');
                setSelectedPeriod('');
              }}
            >
              <Text style={styles.clearFilterText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={targets}
          renderItem={renderTargetCard}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="flag-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No targets found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedStatus || selectedPeriod ? 'Try adjusting your search or filters' : 'No targets available'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>

      {renderCreateTargetModal()}
      {renderTargetDetails()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  createBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  targetsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  targetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  targetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  targetInfo: {
    flex: 1,
  },
  targetId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  targetType: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: 2,
  },
  targetPeriod: {
    fontSize: 12,
    color: '#6B7280',
  },
  targetStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  achievementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  achievementText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  targetDetails: {
    marginBottom: 12,
  },
  targetAmount: {
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  targetAchieved: {
    marginBottom: 8,
  },
  achievedLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  achievedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  targetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  targetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetAssignee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  assigneeInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  assigneeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  assigneeRole: {
    fontSize: 10,
    color: '#6B7280',
  },
  targetDates: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 10,
    color: '#1F2937',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
  },
  disabledBtnText: {
    color: '#6B7280',
  },
  // Form styles
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateInputText: {
    fontSize: 16,
    color: '#6B7280',
  },
  teamMembersList: {
    gap: 8,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  memberRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedMemberOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  selectedUserDisplay: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  selectedUserLabel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 8,
  },
  selectedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  periodOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 14,
    color: '#1F2937',
  },
  selectedPeriodOption: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  selectedPeriodLabel: {
    color: 'white',
  },
  // Detail styles
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTargetId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  detailTargetType: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  achievementStat: {
    alignItems: 'center',
  },
  achievementStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  assigneeCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeDetails: {
    marginLeft: 12,
  },
  detailNotes: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default TargetManagementScreen;
