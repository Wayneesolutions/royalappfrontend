import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthContext';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  hierarchyLevel: number;
}

interface Target {
  assignedTo: string;
  targetType: string;
  period: {
    startDate: string;
    endDate: string;
    year: number;
    month: number;
  };
  targetAmount: number;
  targetQuantity: number;
  notes: string;
}

const TargetAssignmentScreen = () => {
  const { getUsersForTargetAssignment, assignTargets } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [usersByRole, setUsersByRole] = useState<Record<string, User[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentTarget, setCurrentTarget] = useState<Target>({
    assignedTo: '',
    targetType: 'monthly',
    period: {
      startDate: '',
      endDate: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    },
    targetAmount: 0,
    targetQuantity: 0,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await getUsersForTargetAssignment();
      if (result?.success) {
        setUsers(result.data.users);
        setUsersByRole(result.data.usersByRole);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users for target assignment');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const openAssignmentModal = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('No Users Selected', 'Please select at least one user to assign targets');
      return;
    }
    setShowAssignmentModal(true);
  };

  const addTarget = () => {
    if (!currentTarget.assignedTo || !currentTarget.targetAmount || !currentTarget.period.startDate || !currentTarget.period.endDate) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setTargets(prev => [...prev, { ...currentTarget }]);
    setCurrentTarget({
      assignedTo: '',
      targetType: 'monthly',
      period: {
        startDate: '',
        endDate: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      },
      targetAmount: 0,
      targetQuantity: 0,
      notes: ''
    });
  };

  const removeTarget = (index: number) => {
    setTargets(prev => prev.filter((_, i) => i !== index));
  };

  const submitTargets = async () => {
    if (targets.length === 0) {
      Alert.alert('No Targets', 'Please add at least one target');
      return;
    }

    try {
      setSubmitting(true);
      const result = await assignTargets(targets);
      
      if (result?.success) {
        Alert.alert(
          'Success', 
          `Successfully assigned ${result.data?.assignedTargets || targets.length} targets`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowAssignmentModal(false);
                setTargets([]);
                setSelectedUsers([]);
                fetchUsers();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result?.message || 'Failed to assign targets');
      }
    } catch (error) {
      console.error('Error assigning targets:', error);
      Alert.alert('Error', 'Failed to assign targets');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'dealers': 'Dealers',
      'subdealers': 'Sub Dealers',
      'distributors': 'Distributors',
      'salesman': 'Salesman',
      'asm': 'ASM',
      'rsm': 'RSM',
      'zonal': 'Zonal Manager',
      'admin': 'Admin'
    };
    return roleNames[role] || role;
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some(u => u._id === item._id);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => handleUserSelect(item)}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userRole}>{getRoleDisplayName(item.role)}</Text>
        </View>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isSelected ? '#10B981' : '#9CA3AF'}
        />
      </TouchableOpacity>
    );
  };

  const renderTargetItem = ({ item, index }: { item: Target; index: number }) => {
    const user = users.find(u => u._id === item.assignedTo);
    
    return (
      <View style={styles.targetItem}>
        <View style={styles.targetInfo}>
          <Text style={styles.targetUser}>{user?.name || 'Unknown User'}</Text>
          <Text style={styles.targetAmount}>₹{item.targetAmount.toLocaleString()}</Text>
          <Text style={styles.targetPeriod}>
            {item.period.year}-{item.period.month.toString().padStart(2, '0')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeTarget(index)}
        >
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#077BC3" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Target Assignment</Text>
        <TouchableOpacity
          style={[styles.assignButton, selectedUsers.length === 0 && styles.disabledButton]}
          onPress={openAssignmentModal}
          disabled={selectedUsers.length === 0}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.assignButtonText}>Assign Targets</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectedUsersContainer}>
        <Text style={styles.selectedUsersTitle}>
          Selected Users ({selectedUsers.length})
        </Text>
        {selectedUsers.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedUsers.map(user => (
              <View key={user._id} style={styles.selectedUserChip}>
                <Text style={styles.selectedUserChipText}>{user.name}</Text>
                <TouchableOpacity onPress={() => handleUserSelect(user)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.userList}
      />

      {/* Assignment Modal */}
      <Modal
        visible={showAssignmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Targets</Text>
            <TouchableOpacity onPress={() => setShowAssignmentModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.targetForm}>
              <Text style={styles.formTitle}>Target Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assign To</Text>
                <View style={styles.userSelector}>
                  {selectedUsers.map(user => (
                    <TouchableOpacity
                      key={user._id}
                      style={[
                        styles.userOption,
                        currentTarget.assignedTo === user._id && styles.selectedUserOption
                      ]}
                      onPress={() => setCurrentTarget(prev => ({ ...prev, assignedTo: user._id }))}
                    >
                      <Text style={[
                        styles.userOptionText,
                        currentTarget.assignedTo === user._id && styles.selectedUserOptionText
                      ]}>
                        {user.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={currentTarget.targetAmount.toString()}
                  onChangeText={(text) => setCurrentTarget(prev => ({ 
                    ...prev, 
                    targetAmount: parseFloat(text) || 0 
                  }))}
                  keyboardType="numeric"
                  placeholder="Enter target amount"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={currentTarget.targetQuantity.toString()}
                  onChangeText={(text) => setCurrentTarget(prev => ({ 
                    ...prev, 
                    targetQuantity: parseInt(text) || 0 
                  }))}
                  keyboardType="numeric"
                  placeholder="Enter target quantity"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={currentTarget.period.startDate}
                  onChangeText={(text) => setCurrentTarget(prev => ({ 
                    ...prev, 
                    period: { ...prev.period, startDate: text }
                  }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={currentTarget.period.endDate}
                  onChangeText={(text) => setCurrentTarget(prev => ({ 
                    ...prev, 
                    period: { ...prev.period, endDate: text }
                  }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={currentTarget.notes}
                  onChangeText={(text) => setCurrentTarget(prev => ({ ...prev, notes: text }))}
                  placeholder="Enter notes"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity style={styles.addTargetButton} onPress={addTarget}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addTargetButtonText}>Add Target</Text>
              </TouchableOpacity>
            </View>

            {targets.length > 0 && (
              <View style={styles.targetsList}>
                <Text style={styles.targetsListTitle}>Targets to Assign ({targets.length})</Text>
                <FlatList
                  data={targets}
                  renderItem={renderTargetItem}
                  keyExtractor={(_, index) => index.toString()}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={submitTargets}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Targets</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  selectedUsersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedUsersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#077BC3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedUserChipText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 4,
  },
  userList: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedUserItem: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  userInfo: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  targetForm: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  userSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  selectedUserOption: {
    borderColor: '#077BC3',
    backgroundColor: '#EBF8FF',
  },
  userOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedUserOptionText: {
    color: '#077BC3',
    fontWeight: '500',
  },
  addTargetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#077BC3',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addTargetButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  targetsList: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  targetsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  targetInfo: {
    flex: 1,
  },
  targetUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  targetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 2,
  },
  targetPeriod: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default TargetAssignmentScreen;
