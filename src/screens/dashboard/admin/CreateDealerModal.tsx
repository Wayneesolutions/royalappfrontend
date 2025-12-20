import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

interface Group {
  _id: string;
  GroupGUID: string;
  GroupName: string;
  GroupParent: string | null;
  cmpcode: string;
}

interface CreateDealerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dealer?: Dealer | null;
}

interface Dealer {
  _id?: string;
  LedgerGUID?: string;
  LedgerName?: string;
  LedgerMobile?: string;
  LedgerContact?: string;
  Email?: string;
  LedgerGSTIN?: string;
  LedgerAddress1?: string;
  LedgerAddress2?: string;
  LedgerState?: string;
  LedgerOpening?: number;
  LedgerOpeningDate?: string;
  LedgerJoinDate?: string;
  Remarks?: string;
  Other1?: string;
  Other2?: string;
  Other3?: string;
  Other4?: string;
  Other5?: string;
  other6?: string;
  other7?: string;
  other8?: string;
  groupId?: string | {
    _id: string;
    GroupGUID: string;
    GroupName: string;
  };
  group?: {
    _id: string;
    GroupGUID: string;
    GroupName: string;
  };
}

const CreateDealerModal: React.FC<CreateDealerModalProps> = ({ visible, onClose, onSuccess, dealer }) => {
  const isEditMode = !!dealer;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [showOpeningDatePicker, setShowOpeningDatePicker] = useState(false);
  const [showJoinDatePicker, setShowJoinDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    LedgerGUID: '',
    LedgerName: '',
    LedgerMobile: '',
    LedgerContact: '',
    Email: '',
    password: '',
    LedgerGSTIN: '',
    LedgerAddress1: '',
    LedgerAddress2: '',
    LedgerState: '',
    LedgerOpening: '',
    LedgerOpeningDate: '',
    LedgerJoinDate: '',
    Remarks: '',
    Other1: '',
    Other2: '',
    Other3: '',
    Other4: '',
    Other5: '',
    other6: '',
    other7: '',
    other8: '',
    groupId: '',
  });

  useEffect(() => {
    if (visible) {
      const isGroupUser = user?.role === 'groupuser' || !user?.role || user?.role === '';
      
      // For group users, don't fetch groups - they don't need to select
      if (!isGroupUser) {
        fetchGroups();
      }
      
      if (dealer) {
        // Populate form with dealer data for edit
        // Safely extract groupId, handling null/undefined cases
        let groupId = '';
        if (dealer.groupId) {
          if (typeof dealer.groupId === 'object' && dealer.groupId !== null && dealer.groupId._id) {
            groupId = dealer.groupId._id;
          } else if (typeof dealer.groupId === 'string') {
            groupId = dealer.groupId;
          }
        } else if (dealer.group && dealer.group._id) {
          groupId = dealer.group._id;
        }
        
        setFormData({
          LedgerGUID: dealer.LedgerGUID || '',
          LedgerName: dealer.LedgerName || '',
          LedgerMobile: dealer.LedgerMobile || '',
          LedgerContact: dealer.LedgerContact || '',
          Email: dealer.Email || '',
          password: '', // Don't populate password in edit mode for security
          LedgerGSTIN: dealer.LedgerGSTIN || '',
          LedgerAddress1: dealer.LedgerAddress1 || '',
          LedgerAddress2: dealer.LedgerAddress2 || '',
          LedgerState: dealer.LedgerState || '',
          LedgerOpening: dealer.LedgerOpening?.toString() || '',
          LedgerOpeningDate: dealer.LedgerOpeningDate ? dealer.LedgerOpeningDate.split('T')[0] : '',
          LedgerJoinDate: dealer.LedgerJoinDate ? dealer.LedgerJoinDate.split('T')[0] : '',
          Remarks: dealer.Remarks || '',
          Other1: dealer.Other1 || '',
          Other2: dealer.Other2 || '',
          Other3: dealer.Other3 || '',
          Other4: dealer.Other4 || '',
          Other5: dealer.Other5 || '',
          other6: dealer.other6 || '',
          other7: dealer.other7 || '',
          other8: dealer.other8 || '',
          groupId: groupId,
        });
      } else {
        // Reset form for create
        // For group users, auto-assign their first active group
        let autoGroupId = '';
        if (isGroupUser && user?.groups && Array.isArray(user.groups) && user.groups.length > 0) {
          // Find first active group
          const activeGroup = user.groups.find((g: any) => 
            (g.isActive === true || g.isActive === undefined) && g.groupId
          );
          if (activeGroup) {
            if (typeof activeGroup.groupId === 'object' && activeGroup.groupId !== null && activeGroup.groupId._id) {
              autoGroupId = activeGroup.groupId._id;
            } else if (typeof activeGroup.groupId === 'string') {
              autoGroupId = activeGroup.groupId;
            }
          }
        }
        
        setFormData({
          LedgerGUID: '',
          LedgerName: '',
          LedgerMobile: '',
          LedgerContact: '',
          Email: '',
          password: '',
          LedgerGSTIN: '',
          LedgerAddress1: '',
          LedgerAddress2: '',
          LedgerState: '',
          LedgerOpening: '',
          LedgerOpeningDate: '',
          LedgerJoinDate: '',
          Remarks: '',
          Other1: '',
          Other2: '',
          Other3: '',
          Other4: '',
          Other5: '',
          other6: '',
          other7: '',
          other8: '',
          groupId: autoGroupId, // Auto-assigned for group users, empty for admin
        });
      }
    }
  }, [visible, dealer, user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Handle date selection
  const handleDateSelect = (date: Date, type: 'opening' | 'join') => {
    const formattedDate = date.toISOString().split('T')[0];
    if (type === 'opening') {
      setFormData({ ...formData, LedgerOpeningDate: formattedDate });
      setShowOpeningDatePicker(false);
    } else {
      setFormData({ ...formData, LedgerJoinDate: formattedDate });
      setShowJoinDatePicker(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const result = await apiService.adminGetAllGroups({ includeInactive: false });
      if (result?.success && result.data?.groups) {
        setGroups(result.data.groups);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.GroupName.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
    group.GroupGUID.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  const selectedGroup = groups.find(g => g._id === formData.groupId);

  const handleCreate = async () => {
    if (!formData.LedgerName.trim()) {
      Alert.alert('Validation Error', 'Ledger Name is required');
      return;
    }

    // Group is optional for group users (backend will auto-assign to their first active group)
    // For admin users, group is required in create mode
    const isGroupUser = user?.role === 'groupuser' || !user?.role || user?.role === '';
    if (!isEditMode && !isGroupUser && !formData.groupId) {
      Alert.alert('Validation Error', 'Please select a group');
      return;
    }

    setLoading(true);
    try {
      // Company info is automatically fetched from user's current company
      const dealerData: any = {
        LedgerGUID: formData.LedgerGUID && formData.LedgerGUID.trim() ? formData.LedgerGUID.trim() : undefined,
        LedgerName: formData.LedgerName.trim(),
        LedgerMobile: formData.LedgerMobile || undefined,
        LedgerContact: formData.LedgerContact || undefined,
        Email: formData.Email || undefined,
        password: formData.password && formData.password.trim() ? formData.password.trim() : undefined,
        LedgerGSTIN: formData.LedgerGSTIN || undefined,
        LedgerAddress1: formData.LedgerAddress1 || undefined,
        LedgerAddress2: formData.LedgerAddress2 || undefined,
        LedgerState: formData.LedgerState || undefined,
        LedgerOpening: formData.LedgerOpening ? parseFloat(formData.LedgerOpening) : 0,
        LedgerOpeningDate: formData.LedgerOpeningDate || undefined,
        LedgerJoinDate: formData.LedgerJoinDate || undefined,
        Remarks: formData.Remarks || undefined,
        Other1: formData.Other1 || undefined,
        Other2: formData.Other2 || undefined,
        Other3: formData.Other3 || undefined,
        Other4: formData.Other4 || undefined,
        Other5: formData.Other5 || undefined,
        other6: formData.other6 || undefined,
        other7: formData.other7 || undefined,
        other8: formData.other8 || undefined,
        groupId: formData.groupId && formData.groupId.trim() !== '' ? formData.groupId : null,
      };

      let result;
      if (isEditMode && dealer?._id) {
        result = await apiService.adminUpdateDealer(dealer._id, dealerData);
      } else {
        result = await apiService.adminCreateDealer(dealerData);
      }
      
      if (result?.success) {
        Alert.alert('Success', isEditMode ? 'Dealer updated successfully' : 'Dealer created successfully', [
          { text: 'OK', onPress: () => {
            onSuccess();
            onClose();
          }}
        ]);
      } else {
        Alert.alert('Error', result?.message || `Failed to ${isEditMode ? 'update' : 'create'} dealer`);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || `Failed to ${isEditMode ? 'update' : 'create'} dealer`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditMode ? 'Edit Dealer' : 'Create Dealer'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Required Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ledger GUID {isEditMode ? '' : '(Optional - auto-generated if not provided)'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Ledger GUID (e.g., LED-COM-001-0001)"
                value={formData.LedgerGUID}
                onChangeText={(text) => setFormData({ ...formData, LedgerGUID: text })}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!isEditMode && (
                <Text style={styles.helperText}>
                  Leave blank to auto-generate a unique GUID
                </Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ledger Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter dealer name"
                value={formData.LedgerName}
                onChangeText={(text) => setFormData({ ...formData, LedgerName: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Group Selection - Hidden for group users, shown for admin */}
            {(() => {
              const isGroupUser = user?.role === 'groupuser' || !user?.role || user?.role === '';
              if (isGroupUser) {
                // For group users, show auto-assigned group info (read-only)
                const userGroup = user?.groups?.find((g: any) => 
                  (g.isActive === true || g.isActive === undefined) && g.groupId
                );
                const groupName = userGroup 
                  ? (typeof userGroup.groupId === 'object' && userGroup.groupId !== null 
                      ? userGroup.groupId.GroupName 
                      : userGroup.GroupName || 'Your Group')
                  : 'Your Group';
                
                return (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Group (Auto-assigned)</Text>
                    <View style={styles.autoAssignedGroup}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.autoAssignedGroupText}>
                        {groupName}
                      </Text>
                    </View>
                    <Text style={styles.helperText}>
                      The dealer will be automatically assigned to your group.
                    </Text>
                  </View>
                );
              } else {
                // For admin users, show group selector
                return (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Group *</Text>
                    <TouchableOpacity
                      style={styles.groupSelector}
                      onPress={() => setShowGroupSelector(true)}
                    >
                      <Text style={selectedGroup ? styles.groupSelectorText : styles.groupSelectorPlaceholder}>
                        {selectedGroup ? selectedGroup.GroupName : 'Select a group'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                );
              }
            })()}
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                value={formData.LedgerMobile}
                onChangeText={(text) => setFormData({ ...formData, LedgerMobile: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Person</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter contact person name"
                value={formData.LedgerContact}
                onChangeText={(text) => setFormData({ ...formData, LedgerContact: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={formData.Email}
                onChangeText={(text) => setFormData({ ...formData, Email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Password {isEditMode ? '(Optional - leave blank to keep current)' : '(Optional - for dealer login)'}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={isEditMode ? "Enter new password (optional)" : "Enter password for dealer login"}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {!isEditMode && (
                <Text style={styles.helperText}>
                  If provided, dealer can login using email/mobile and this password
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GSTIN</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter GSTIN (e.g., 27AAAAA0000A1Z5)"
                value={formData.LedgerGSTIN}
                onChangeText={(text) => setFormData({ ...formData, LedgerGSTIN: text.toUpperCase() })}
                autoCapitalize="characters"
                maxLength={15}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 1</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter address line 1"
                value={formData.LedgerAddress1}
                onChangeText={(text) => setFormData({ ...formData, LedgerAddress1: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter address line 2"
                value={formData.LedgerAddress2}
                onChangeText={(text) => setFormData({ ...formData, LedgerAddress2: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter state"
                value={formData.LedgerState}
                onChangeText={(text) => setFormData({ ...formData, LedgerState: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Financial Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Opening Balance</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter opening balance"
                value={formData.LedgerOpening}
                onChangeText={(text) => setFormData({ ...formData, LedgerOpening: text })}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Opening Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowOpeningDatePicker(true)}
              >
                <Text style={formData.LedgerOpeningDate ? styles.dateSelectorText : styles.dateSelectorPlaceholder}>
                  {formData.LedgerOpeningDate || 'Select opening date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Join Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowJoinDatePicker(true)}
              >
                <Text style={formData.LedgerJoinDate ? styles.dateSelectorText : styles.dateSelectorPlaceholder}>
                  {formData.LedgerJoinDate || 'Select join date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            {user?.defaultCompany && (
              <View style={styles.companyInfo}>
                <Text style={styles.companyInfoLabel}>Company Information (Auto-filled)</Text>
                <View style={styles.companyInfoRow}>
                  <Text style={styles.companyInfoText}>
                    <Text style={styles.companyInfoLabel}>Company:</Text> {user.defaultCompany.companyName || 'N/A'}
                  </Text>
                </View>
                <View style={styles.companyInfoRow}>
                  <Text style={styles.companyInfoText}>
                    <Text style={styles.companyInfoLabel}>Code:</Text> {user.defaultCompany.companyCode || 'N/A'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter remarks"
                value={formData.Remarks}
                onChangeText={(text) => setFormData({ ...formData, Remarks: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Other Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Fields</Text>
            
            {['Other1', 'Other2', 'Other3', 'Other4', 'Other5', 'other6', 'other7', 'other8'].map((field) => (
              <View key={field} style={styles.formGroup}>
                <Text style={styles.label}>{field}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${field}`}
                  value={formData[field as keyof typeof formData]}
                  onChangeText={(text) => setFormData({ ...formData, [field]: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>{isEditMode ? 'Update Dealer' : 'Create Dealer'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Group Selector Modal */}
      <Modal
        visible={showGroupSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Group</Text>
              <TouchableOpacity onPress={() => setShowGroupSelector(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search groups..."
              value={groupSearchQuery}
              onChangeText={setGroupSearchQuery}
              placeholderTextColor="#9CA3AF"
            />

            {loadingGroups ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0493D2" />
              </View>
            ) : (
              <FlatList
                data={filteredGroups}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.groupItem,
                      formData.groupId === item._id && styles.selectedGroupItem
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, groupId: item._id });
                      setShowGroupSelector(false);
                      setGroupSearchQuery('');
                    }}
                  >
                    <View style={styles.groupItemContent}>
                      <Text style={styles.groupItemName}>{item.GroupName}</Text>
                      <Text style={styles.groupItemGUID}>{item.GroupGUID}</Text>
                    </View>
                    {formData.groupId === item._id && (
                      <Ionicons name="checkmark-circle" size={24} color="#0493D2" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No groups found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker Modals */}
      {showOpeningDatePicker && (
        <DatePickerModal
          visible={showOpeningDatePicker}
          onClose={() => setShowOpeningDatePicker(false)}
          onSelect={(date) => handleDateSelect(date, 'opening')}
          selectedDate={formData.LedgerOpeningDate}
          title="Select Opening Date"
        />
      )}

      {showJoinDatePicker && (
        <DatePickerModal
          visible={showJoinDatePicker}
          onClose={() => setShowJoinDatePicker(false)}
          onSelect={(date) => handleDateSelect(date, 'join')}
          selectedDate={formData.LedgerJoinDate}
          title="Select Join Date"
        />
      )}
    </Modal>
  );
};

// Simple Date Picker Modal Component
interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate?: string;
  title: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({ visible, onClose, onSelect, selectedDate, title }) => {
  const [currentDate, setCurrentDate] = useState<Date>(
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth());
  const [day, setDay] = useState(currentDate.getDate());

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setCurrentDate(date);
      setYear(date.getFullYear());
      setMonth(date.getMonth());
      setDay(date.getDate());
    }
  }, [selectedDate]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 25 + i);

  const handleConfirm = () => {
    const selected = new Date(year, month, day);
    onSelect(selected);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={datePickerStyles.overlay}>
        <View style={datePickerStyles.container}>
          <View style={datePickerStyles.header}>
            <Text style={datePickerStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={datePickerStyles.pickerContainer}>
            <View style={datePickerStyles.pickerColumn}>
              <Text style={datePickerStyles.pickerLabel}>Year</Text>
              <ScrollView style={datePickerStyles.pickerScroll}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[
                      datePickerStyles.pickerItem,
                      year === y && datePickerStyles.pickerItemSelected
                    ]}
                    onPress={() => setYear(y)}
                  >
                    <Text style={[
                      datePickerStyles.pickerItemText,
                      year === y && datePickerStyles.pickerItemTextSelected
                    ]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={datePickerStyles.pickerColumn}>
              <Text style={datePickerStyles.pickerLabel}>Month</Text>
              <ScrollView style={datePickerStyles.pickerScroll}>
                {months.map((m, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      datePickerStyles.pickerItem,
                      month === index && datePickerStyles.pickerItemSelected
                    ]}
                    onPress={() => setMonth(index)}
                  >
                    <Text style={[
                      datePickerStyles.pickerItemText,
                      month === index && datePickerStyles.pickerItemTextSelected
                    ]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={datePickerStyles.pickerColumn}>
              <Text style={datePickerStyles.pickerLabel}>Day</Text>
              <ScrollView style={datePickerStyles.pickerScroll}>
                {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      datePickerStyles.pickerItem,
                      day === d && datePickerStyles.pickerItemSelected
                    ]}
                    onPress={() => setDay(d)}
                  >
                    <Text style={[
                      datePickerStyles.pickerItemText,
                      day === d && datePickerStyles.pickerItemTextSelected
                    ]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={datePickerStyles.footer}>
            <TouchableOpacity style={datePickerStyles.cancelButton} onPress={onClose}>
              <Text style={datePickerStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={datePickerStyles.confirmButton} onPress={handleConfirm}>
              <Text style={datePickerStyles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  formGroup: {
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
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dateSelectorText: {
    fontSize: 14,
    color: '#111827',
  },
  dateSelectorPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  companyInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  companyInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  companyInfoRow: {
    marginBottom: 4,
  },
  companyInfoText: {
    fontSize: 14,
    color: '#374151',
  },
  groupSelectorText: {
    fontSize: 14,
    color: '#111827',
  },
  groupSelectorPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  autoAssignedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  autoAssignedGroupText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  createButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0493D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedGroupItem: {
    backgroundColor: '#F3F4F6',
  },
  groupItemContent: {
    flex: 1,
  },
  groupItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  groupItemGUID: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  passwordToggle: {
    padding: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

const datePickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 300,
    paddingVertical: 16,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  pickerScroll: {
    flex: 1,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemTextSelected: {
    color: '#0493D2',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0493D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateDealerModal;

