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

interface Target {
  _id: string;
  targetId: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  targetType: string;
  period: {
    startDate: string;
    endDate: string;
    year: number;
    month: number;
  };
  targetAmount: number;
  targetQuantity: number;
  achievedAmount: number;
  achievedQuantity: number;
  achievementPercentage: number;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const TargetManagementScreen = () => {
  const { getTargetPerformanceReport, updateTarget } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Partial<Target>>({});
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'achieved' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'achievement' | 'date'>('date');

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const result = await getTargetPerformanceReport();
      if (result?.success) {
        setTargets(result.data?.targets || []);
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
      Alert.alert('Error', 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTargets();
    setRefreshing(false);
  };

  const handleEditTarget = (target: Target) => {
    setSelectedTarget(target);
    setEditingTarget({
      targetAmount: target.targetAmount,
      targetQuantity: target.targetQuantity,
      notes: target.notes,
      status: target.status
    });
    setShowEditModal(true);
  };

  const handleUpdateTarget = async () => {
    if (!selectedTarget || !editingTarget.targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setUpdating(true);
      const result = await updateTarget(selectedTarget._id, editingTarget);
      
      if (result?.success) {
        Alert.alert('Success', 'Target updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              setShowEditModal(false);
              setSelectedTarget(null);
              setEditingTarget({});
              fetchTargets();
            }
          }
        ]);
      } else {
        Alert.alert('Error', result?.message || 'Failed to update target');
      }
    } catch (error) {
      console.error('Error updating target:', error);
      Alert.alert('Error', 'Failed to update target');
    } finally {
      setUpdating(false);
    }
  };

  const getFilteredAndSortedTargets = () => {
    let filtered = targets;

    // Apply filter
    switch (filter) {
      case 'active':
        filtered = targets.filter(t => t.status === 'active');
        break;
      case 'achieved':
        filtered = targets.filter(t => t.achievementPercentage >= 100);
        break;
      case 'pending':
        filtered = targets.filter(t => t.achievementPercentage < 100);
        break;
      default:
        filtered = targets;
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.assignedTo.name.localeCompare(b.assignedTo.name);
        case 'amount':
          return b.targetAmount - a.targetAmount;
        case 'achievement':
          return b.achievementPercentage - a.achievementPercentage;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'achieved': return '#059669';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return '#10B981';
    if (percentage >= 75) return '#F59E0B';
    if (percentage >= 50) return '#F97316';
    return '#EF4444';
  };

  const renderTargetItem = ({ item }: { item: Target }) => (
    <View style={styles.targetCard}>
      <View style={styles.targetHeader}>
        <View style={styles.targetUserInfo}>
          <Text style={styles.targetUserName}>{item.assignedTo.name}</Text>
          <Text style={styles.targetUserRole}>{item.assignedTo.role}</Text>
        </View>
        <View style={styles.targetActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditTarget(item)}
          >
            <Ionicons name="pencil" size={16} color="#077BC3" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.targetDetails}>
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Period:</Text>
          <Text style={styles.targetValue}>
            {item.period.year}-{item.period.month.toString().padStart(2, '0')}
          </Text>
        </View>
        
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Target Amount:</Text>
          <Text style={styles.targetValue}>₹{item.targetAmount.toLocaleString()}</Text>
        </View>

        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Achieved:</Text>
          <Text style={[styles.targetValue, { color: getAchievementColor(item.achievementPercentage) }]}>
            ₹{item.achievedAmount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Achievement:</Text>
          <Text style={[styles.targetValue, { color: getAchievementColor(item.achievementPercentage) }]}>
            {item.achievementPercentage.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Status:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
    </View>
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

  const renderSortButton = (sortType: typeof sortBy, label: string) => (
    <TouchableOpacity
      style={[styles.sortButton, sortBy === sortType && styles.activeSortButton]}
      onPress={() => setSortBy(sortType)}
    >
      <Text style={[styles.sortButtonText, sortBy === sortType && styles.activeSortButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#077BC3" />
        <Text style={styles.loadingText}>Loading targets...</Text>
      </View>
    );
  }

  const filteredTargets = getFilteredAndSortedTargets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Target Management</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTargets.length} targets • {targets.filter(t => t.achievementPercentage >= 100).length} achieved
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            {renderFilterButton('all', 'All')}
            {renderFilterButton('active', 'Active')}
            {renderFilterButton('achieved', 'Achieved')}
            {renderFilterButton('pending', 'Pending')}
          </View>
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sortRow}>
            {renderSortButton('date', 'Date')}
            {renderSortButton('name', 'Name')}
            {renderSortButton('amount', 'Amount')}
            {renderSortButton('achievement', 'Achievement')}
          </View>
        </ScrollView>
      </View>

      {/* Targets List */}
      <FlatList
        data={filteredTargets}
        renderItem={renderTargetItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.targetsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flag" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No targets found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' ? 'No targets have been assigned yet' : `No ${filter} targets found`}
            </Text>
          </View>
        }
      />

      {/* Edit Target Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Target</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount *</Text>
              <TextInput
                style={styles.input}
                value={editingTarget.targetAmount?.toString() || ''}
                onChangeText={(text) => setEditingTarget(prev => ({ ...prev, targetAmount: parseFloat(text) || 0 }))}
                placeholder="Enter target amount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Quantity</Text>
              <TextInput
                style={styles.input}
                value={editingTarget.targetQuantity?.toString() || ''}
                onChangeText={(text) => setEditingTarget(prev => ({ ...prev, targetQuantity: parseInt(text) || 0 }))}
                placeholder="Enter target quantity"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {['active', 'achieved', 'pending', 'failed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      editingTarget.status === status && styles.selectedStatusOption
                    ]}
                    onPress={() => setEditingTarget(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      editingTarget.status === status && styles.selectedStatusOptionText
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingTarget.notes || ''}
                onChangeText={(text) => setEditingTarget(prev => ({ ...prev, notes: text }))}
                placeholder="Enter notes (optional)"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateButton, updating && styles.disabledButton]}
              onPress={handleUpdateTarget}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.updateButtonText}>Update Target</Text>
                </>
              )}
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
  sortContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  activeSortButton: {
    backgroundColor: '#10B981',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#fff',
  },
  targetsList: {
    padding: 16,
  },
  targetCard: {
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
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetUserInfo: {
    flex: 1,
  },
  targetUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  targetUserRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  targetActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  targetDetails: {
    gap: 8,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  targetValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
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
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
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
    height: 80,
    textAlignVertical: 'top',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedStatusOption: {
    backgroundColor: '#077BC3',
    borderColor: '#077BC3',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedStatusOptionText: {
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
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default TargetManagementScreen;
