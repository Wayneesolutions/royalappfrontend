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

interface CreateSubDealerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subdealer?: SubDealer | null;
}

interface SubDealer {
  _id?: string;
  SDName?: string;
  SDType?: 'Sub Dealer' | 'TSO';
  SDAddress1?: string;
  SDAddress2?: string;
  SDAddress3?: string;
  SDState?: string;
  SDCountry?: string;
  SDPincode?: string;
  SDContactPerson?: string;
  SDMobileNo?: string;
  SDEmail?: string;
  SDGSTNType?: string;
  SDGSTNNumber?: string;
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

const CreateSubDealerModal: React.FC<CreateSubDealerModalProps> = ({ visible, onClose, onSuccess, subdealer }) => {
  const { user } = useAuth();
  const isEditMode = !!subdealer;
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    SDName: '',
    SDType: 'Sub Dealer' as 'Sub Dealer' | 'TSO',
    SDAddress1: '',
    SDAddress2: '',
    SDAddress3: '',
    SDState: '',
    SDCountry: 'India',
    SDPincode: '',
    SDContactPerson: '',
    SDMobileNo: '',
    SDEmail: '',
    SDGSTNType: '',
    SDGSTNNumber: '',
    groupId: '',
  });

  useEffect(() => {
    if (visible) {
      fetchGroups();
      if (subdealer) {
        // Populate form with subdealer data for edit
        // Safely extract groupId, handling null/undefined cases
        let groupId = '';
        if (subdealer.groupId) {
          if (typeof subdealer.groupId === 'object' && subdealer.groupId !== null && subdealer.groupId._id) {
            groupId = subdealer.groupId._id;
          } else if (typeof subdealer.groupId === 'string') {
            groupId = subdealer.groupId;
          }
        } else if (subdealer.group && subdealer.group._id) {
          groupId = subdealer.group._id;
        }
        
        setFormData({
          SDName: subdealer.SDName || '',
          SDType: subdealer.SDType || 'Sub Dealer',
          SDAddress1: subdealer.SDAddress1 || '',
          SDAddress2: subdealer.SDAddress2 || '',
          SDAddress3: subdealer.SDAddress3 || '',
          SDState: subdealer.SDState || '',
          SDCountry: subdealer.SDCountry || 'India',
          SDPincode: subdealer.SDPincode || '',
          SDContactPerson: subdealer.SDContactPerson || '',
          SDMobileNo: subdealer.SDMobileNo || '',
          SDEmail: subdealer.SDEmail || '',
          SDGSTNType: subdealer.SDGSTNType || '',
          SDGSTNNumber: subdealer.SDGSTNNumber || '',
          groupId: groupId,
        });
      } else {
        // Reset form for create
        setFormData({
          SDName: '',
          SDType: 'Sub Dealer',
          SDAddress1: '',
          SDAddress2: '',
          SDAddress3: '',
          SDState: '',
          SDCountry: 'India',
          SDPincode: '',
          SDContactPerson: '',
          SDMobileNo: '',
          SDEmail: '',
          SDGSTNType: '',
          SDGSTNNumber: '',
          groupId: '',
        });
      }
    }
  }, [visible, subdealer]);

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
    if (!formData.SDName.trim()) {
      Alert.alert('Validation Error', 'Sub Dealer Name is required');
      return;
    }

    // Group is optional, but if provided it should be valid
    // Allow empty groupId in edit mode (subdealer might not have a group)
    if (!isEditMode && !formData.groupId) {
      Alert.alert('Validation Error', 'Please select a group');
      return;
    }

    setLoading(true);
    try {
      const subdealerData: any = {
        SDName: formData.SDName.trim(),
        SDType: formData.SDType,
        SDAddress1: formData.SDAddress1 || undefined,
        SDAddress2: formData.SDAddress2 || undefined,
        SDAddress3: formData.SDAddress3 || undefined,
        SDState: formData.SDState || undefined,
        SDCountry: formData.SDCountry || 'India',
        SDPincode: formData.SDPincode || undefined,
        SDContactPerson: formData.SDContactPerson || undefined,
        SDMobileNo: formData.SDMobileNo || undefined,
        SDEmail: formData.SDEmail || undefined,
        SDGSTNType: formData.SDGSTNType || undefined,
        SDGSTNNumber: formData.SDGSTNNumber || undefined,
        groupId: formData.groupId && formData.groupId.trim() !== '' ? formData.groupId : null,
      };

      let result;
      if (isEditMode && subdealer?._id) {
        result = await apiService.adminUpdateSubDealer(subdealer._id, subdealerData);
      } else {
        result = await apiService.adminCreateSubDealer(subdealerData);
      }
      
      if (result?.success) {
        Alert.alert('Success', isEditMode ? 'Subdealer updated successfully' : 'Subdealer created successfully', [
          { text: 'OK', onPress: () => {
            onSuccess();
            onClose();
          }}
        ]);
      } else {
        Alert.alert('Error', result?.message || `Failed to ${isEditMode ? 'update' : 'create'} subdealer`);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || `Failed to ${isEditMode ? 'update' : 'create'} subdealer`);
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
          <Text style={styles.title}>{isEditMode ? 'Edit Subdealer' : 'Create Subdealer'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Required Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Sub Dealer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter subdealer name"
                value={formData.SDName}
                onChangeText={(text) => setFormData({ ...formData, SDName: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.SDType === 'Sub Dealer' && styles.typeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, SDType: 'Sub Dealer' })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.SDType === 'Sub Dealer' && styles.typeButtonTextActive
                  ]}>
                    Sub Dealer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.SDType === 'TSO' && styles.typeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, SDType: 'TSO' })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.SDType === 'TSO' && styles.typeButtonTextActive
                  ]}>
                    TSO
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 1</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter address line 1"
                value={formData.SDAddress1}
                onChangeText={(text) => setFormData({ ...formData, SDAddress1: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter address line 2"
                value={formData.SDAddress2}
                onChangeText={(text) => setFormData({ ...formData, SDAddress2: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Line 3</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter address line 3"
                value={formData.SDAddress3}
                onChangeText={(text) => setFormData({ ...formData, SDAddress3: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter state"
                value={formData.SDState}
                onChangeText={(text) => setFormData({ ...formData, SDState: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter country"
                value={formData.SDCountry}
                onChangeText={(text) => setFormData({ ...formData, SDCountry: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pincode"
                value={formData.SDPincode}
                onChangeText={(text) => setFormData({ ...formData, SDPincode: text })}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Person</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter contact person name"
                value={formData.SDContactPerson}
                onChangeText={(text) => setFormData({ ...formData, SDContactPerson: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                value={formData.SDMobileNo}
                onChangeText={(text) => setFormData({ ...formData, SDMobileNo: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={formData.SDEmail}
                onChangeText={(text) => setFormData({ ...formData, SDEmail: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* GST Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GST Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>GSTN Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter GSTN type"
                value={formData.SDGSTNType}
                onChangeText={(text) => setFormData({ ...formData, SDGSTNType: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GSTN Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter GSTN number"
                value={formData.SDGSTNNumber}
                onChangeText={(text) => setFormData({ ...formData, SDGSTNNumber: text.toUpperCase() })}
                autoCapitalize="characters"
                maxLength={15}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Company Information */}
          {user?.defaultCompany && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Company Information (Auto-filled)</Text>
              <View style={styles.companyInfo}>
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
            </View>
          )}
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
              <Text style={styles.createButtonText}>{isEditMode ? 'Update Subdealer' : 'Create Subdealer'}</Text>
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
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#0493D2',
    borderColor: '#0493D2',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
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
  groupSelectorText: {
    fontSize: 14,
    color: '#111827',
  },
  groupSelectorPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  companyInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  companyInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  companyInfoRow: {
    marginBottom: 4,
  },
  companyInfoText: {
    fontSize: 14,
    color: '#374151',
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
});

export default CreateSubDealerModal;

