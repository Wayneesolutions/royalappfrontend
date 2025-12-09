import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface SubDealer {
  _id: string;
  SDName: string;
  SDEmail?: string;
  SDMobileNo: string;
  SDContactPerson?: string;
  SDType?: 'Sub Dealer' | 'TSO';
  SDAddress1?: string;
  SDAddress2?: string;
  SDAddress3?: string;
  SDState?: string;
  SDPincode?: string;
  SDCountry?: string;
  SDGSTNType?: string;
  SDGSTNNumber?: string;
  isActive: boolean;
  groupId?: {
    _id: string;
    GroupName: string;
    GroupGUID: string;
  } | string;
  companyId?: {
    _id: string;
    companyName: string;
    companyCode: string;
  } | string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  name?: string;
  email?: string;
  mobile?: string;
}

const TeamManagement = () => {
  const navigation = useNavigation();
  const { user, createSubDealer, getSubDealers, updateSubDealer, deactivateSubDealer } = useAuth();
  
  // State management
  const [subDealers, setSubDealers] = useState<SubDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubDealer, setSelectedSubDealer] = useState<SubDealer | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    SDName: '',
    SDEmail: '',
    SDMobileNo: '',
    SDContactPerson: '',
    SDType: 'Sub Dealer' as 'Sub Dealer' | 'TSO',
    SDAddress1: '',
    SDAddress2: '',
    SDAddress3: '',
    SDState: '',
    SDCountry: 'India',
    SDPincode: '',
    SDGSTNType: '',
    SDGSTNNumber: '',
  });

  // Fetch sub-dealers
  const fetchSubDealers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('TeamManagement - Fetching sub-dealers with params:', {
        page: 1,
        limit: 100,
        search: searchQuery,
      });
      
      const result = await getSubDealers({
        page: 1,
        limit: 100,
        search: searchQuery,
      });
      
      console.log('TeamManagement - Sub-dealers result:', result);
      
      if (result?.success && result.data?.subDealers) {
        let fetchedSubDealers = result.data.subDealers || [];
        
        // Sort sub-dealers
        fetchedSubDealers = sortSubDealers(fetchedSubDealers, sortBy, sortOrder);
        
        setSubDealers(fetchedSubDealers);
        
        console.log('TeamManagement - Sub-dealers loaded:', fetchedSubDealers.length);
      } else {
        console.log('TeamManagement - No sub-dealers data received');
        setSubDealers([]);
      }
    } catch (error) {
      console.error('Failed to fetch sub-dealers:', error);
      setError(`Failed to load sub-dealers: ${(error as Error).message || 'Unknown error'}`);
      setSubDealers([]);
    } finally {
      setLoading(false);
    }
  };

  // Sort sub-dealers
  const sortSubDealers = (subDealers: SubDealer[], sortBy: string, order: string) => {
    return [...subDealers].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.SDName || a.name || '').toLowerCase();
          bValue = (b.SDName || b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.SDEmail || a.email || '').toLowerCase();
          bValue = (b.SDEmail || b.email || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = (a.SDName || a.name || '').toLowerCase();
          bValue = (b.SDName || b.name || '').toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  useEffect(() => {
    fetchSubDealers();
  }, [searchQuery, sortBy, sortOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubDealers();
    setRefreshing(false);
  };

  // Handle sub-dealer creation
  const handleCreateSubDealer = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.SDName || !formData.SDMobileNo) {
        Alert.alert('Validation Error', 'Sub-dealer name and mobile are required');
        setLoading(false);
        return;
      }
      
      const subDealerData = {
        SDName: formData.SDName,
        SDEmail: formData.SDEmail || '',
        SDMobileNo: formData.SDMobileNo,
        SDContactPerson: formData.SDContactPerson || formData.SDName,
        SDType: formData.SDType,
        SDAddress1: formData.SDAddress1 || '',
        SDAddress2: formData.SDAddress2 || '',
        SDAddress3: formData.SDAddress3 || '',
        SDState: formData.SDState || '',
        SDCountry: formData.SDCountry || 'India',
        SDPincode: formData.SDPincode || '',
        SDGSTNType: formData.SDGSTNType || '',
        SDGSTNNumber: formData.SDGSTNNumber || '',
      };

      const result = await createSubDealer(subDealerData);
      
      if (result?.success) {
        Alert.alert('Success', 'Sub-dealer created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchSubDealers();
      } else {
        Alert.alert('Error', result?.message || 'Failed to create sub-dealer');
      }
    } catch (error) {
      console.error('Error creating sub-dealer:', error);
      Alert.alert('Error', 'Failed to create sub-dealer');
    } finally {
      setLoading(false);
    }
  };

  // Handle sub-dealer update
  const handleUpdateSubDealer = async () => {
    if (!selectedSubDealer) return;
    
    try {
      setLoading(true);
      
      const updateData = {
        SDName: formData.SDName,
        SDEmail: formData.SDEmail || '',
        SDMobileNo: formData.SDMobileNo,
        SDContactPerson: formData.SDContactPerson || formData.SDName,
        SDType: formData.SDType,
        SDAddress1: formData.SDAddress1 || '',
        SDAddress2: formData.SDAddress2 || '',
        SDAddress3: formData.SDAddress3 || '',
        SDState: formData.SDState || '',
        SDCountry: formData.SDCountry || 'India',
        SDPincode: formData.SDPincode || '',
        SDGSTNType: formData.SDGSTNType || '',
        SDGSTNNumber: formData.SDGSTNNumber || '',
      };

      const result = await updateSubDealer(selectedSubDealer._id, updateData);
      
      if (result?.success) {
        Alert.alert('Success', 'Sub-dealer updated successfully!');
        setShowEditModal(false);
        setSelectedSubDealer(null);
        resetForm();
        fetchSubDealers();
      } else {
        Alert.alert('Error', result?.message || 'Failed to update sub-dealer');
      }
    } catch (error) {
      console.error('Error updating sub-dealer:', error);
      Alert.alert('Error', 'Failed to update sub-dealer');
    } finally {
      setLoading(false);
    }
  };

  // Handle sub-dealer deactivation
  const handleDeactivateSubDealer = async (subDealer: SubDealer) => {
    setSelectedSubDealer(subDealer);
    setShowDeleteModal(true);
  };

  // Confirm deactivation
  const confirmDeactivation = async () => {
    if (!selectedSubDealer) return;
    
    try {
      setLoading(true);
      const result = await deactivateSubDealer(selectedSubDealer._id);
      
      if (result?.success) {
        Alert.alert('Success', 'Sub-dealer deactivated successfully!');
        setShowDeleteModal(false);
        setSelectedSubDealer(null);
        fetchSubDealers();
      } else {
        Alert.alert('Error', result?.message || 'Failed to deactivate sub-dealer');
      }
    } catch (error) {
      console.error('Error deactivating sub-dealer:', error);
      Alert.alert('Error', 'Failed to deactivate sub-dealer');
    } finally {
      setLoading(false);
    }
  };

  // Handle sub-dealer click for details
  const handleSubDealerClick = (subDealer: SubDealer) => {
    setSelectedSubDealer(subDealer);
    setShowDetailsModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      SDName: '',
      SDEmail: '',
      SDMobileNo: '',
      SDContactPerson: '',
      SDType: 'Sub Dealer',
      SDAddress1: '',
      SDAddress2: '',
      SDAddress3: '',
      SDState: '',
      SDCountry: 'India',
      SDPincode: '',
      SDGSTNType: '',
      SDGSTNNumber: '',
    });
  };

  // Open edit modal
  const openEditModal = (subDealer: SubDealer) => {
    setSelectedSubDealer(subDealer);
    setFormData({
      SDName: subDealer.SDName || subDealer.name || '',
      SDEmail: subDealer.SDEmail || subDealer.email || '',
      SDMobileNo: subDealer.SDMobileNo || subDealer.mobile || '',
      SDContactPerson: subDealer.SDContactPerson || subDealer.SDName || subDealer.name || '',
      SDType: subDealer.SDType || 'Sub Dealer',
      SDAddress1: subDealer.SDAddress1 || '',
      SDAddress2: subDealer.SDAddress2 || '',
      SDAddress3: subDealer.SDAddress3 || '',
      SDState: subDealer.SDState || '',
      SDCountry: subDealer.SDCountry || 'India',
      SDPincode: subDealer.SDPincode || '',
      SDGSTNType: subDealer.SDGSTNType || '',
      SDGSTNNumber: subDealer.SDGSTNNumber || '',
    });
    setShowEditModal(true);
  };

  // Render sub-dealer item
  const renderSubDealerItem = ({ item }: { item: SubDealer }) => {
    // Safely get group name
    let groupName = 'No Group';
    if (item.groupId && typeof item.groupId === 'object' && item.groupId !== null && item.groupId.GroupName) {
      groupName = item.groupId.GroupName;
    } else if (item.groupId && typeof item.groupId === 'string' && item.groupId.trim() !== '') {
      groupName = 'No Group';
    }

    return (
      <TouchableOpacity
        style={styles.subDealerCard}
        onPress={() => handleSubDealerClick(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.subdealerInfoHeader}>
            <Text style={styles.subDealerName}>{item.SDName || item.name || 'N/A'}</Text>
            <View style={styles.badgesContainer}>
              {item.SDType && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.SDType}</Text>
                </View>
              )}
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }
              ]}>
                <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                openEditModal(item);
              }}
            >
              <Ionicons name="pencil" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeactivateSubDealer(item);
              }}
            >
              <Ionicons name="trash" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.subdealerDetails}>
          {item.SDMobileNo && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.SDMobileNo}</Text>
            </View>
          )}

          {item.SDEmail && (
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.SDEmail}</Text>
            </View>
          )}

          {item.SDContactPerson && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.SDContactPerson}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="folder-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Group: {groupName}</Text>
          </View>

          {item.SDState && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                {item.SDAddress1 && `${item.SDAddress1}, `}
                {item.SDState}
                {item.SDPincode && ` - ${item.SDPincode}`}
              </Text>
            </View>
          )}

          {item.SDGSTNNumber && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>GST: {item.SDGSTNNumber}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Sub-Dealers Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search criteria'
          : 'No sub-dealers are registered under you yet'
        }
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.clearFiltersText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search sub-dealers..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonSelected]}>
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('email')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'email' && styles.sortButtonSelected]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('createdAt')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'createdAt' && styles.sortButtonSelected]}>
              Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortOrderButton}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Ionicons 
              name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Dealers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading sub-dealers...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubDealers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={subDealers}
          renderItem={renderSubDealerItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={subDealers.length === 0 ? styles.emptyListContainer : styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Quick Stats */}
      {subDealers.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {subDealers.length} sub-dealer{subDealers.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Create Sub-Dealer Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Sub-Dealer</Text>
            <TouchableOpacity onPress={handleCreateSubDealer} disabled={loading}>
              <Text style={styles.modalSaveText}>Create</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Required Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Required Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sub Dealer Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDName}
                  onChangeText={(text) => setFormData({...formData, SDName: text})}
                  placeholder="Enter subdealer name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.SDType === 'Sub Dealer' && styles.typeButtonActive
                    ]}
                    onPress={() => setFormData({...formData, SDType: 'Sub Dealer'})}
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
                    onPress={() => setFormData({...formData, SDType: 'TSO'})}
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
            </View>

            {/* Address Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Line 1</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDAddress1}
                  onChangeText={(text) => setFormData({...formData, SDAddress1: text})}
                  placeholder="Enter address line 1"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Line 2</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDAddress2}
                  onChangeText={(text) => setFormData({...formData, SDAddress2: text})}
                  placeholder="Enter address line 2"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Line 3</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDAddress3}
                  onChangeText={(text) => setFormData({...formData, SDAddress3: text})}
                  placeholder="Enter address line 3"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDState}
                  onChangeText={(text) => setFormData({...formData, SDState: text})}
                  placeholder="Enter state"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Country</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDCountry}
                  onChangeText={(text) => setFormData({...formData, SDCountry: text})}
                  placeholder="Enter country"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pincode</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDPincode}
                  onChangeText={(text) => setFormData({...formData, SDPincode: text})}
                  placeholder="Enter pincode"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Contact Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Person</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDContactPerson}
                  onChangeText={(text) => setFormData({...formData, SDContactPerson: text})}
                  placeholder="Enter contact person name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDMobileNo}
                  onChangeText={(text) => setFormData({...formData, SDMobileNo: text})}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDEmail}
                  onChangeText={(text) => setFormData({...formData, SDEmail: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* GST Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GST Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>GSTN Type</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDGSTNType}
                  onChangeText={(text) => setFormData({...formData, SDGSTNType: text})}
                  placeholder="Enter GSTN type"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>GSTN Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDGSTNNumber}
                  onChangeText={(text) => setFormData({...formData, SDGSTNNumber: text.toUpperCase()})}
                  placeholder="Enter GSTN number"
                  autoCapitalize="characters"
                  maxLength={15}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Sub-Dealer Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Sub-Dealer</Text>
            <TouchableOpacity onPress={handleUpdateSubDealer} disabled={loading}>
              <Text style={styles.modalSaveText}>Update</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Required Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Required Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sub Dealer Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDName}
                  onChangeText={(text) => setFormData({...formData, SDName: text})}
                  placeholder="Enter subdealer name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.SDType === 'Sub Dealer' && styles.typeButtonActive
                    ]}
                    onPress={() => setFormData({...formData, SDType: 'Sub Dealer'})}
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
                    onPress={() => setFormData({...formData, SDType: 'TSO'})}
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
            </View>

            {/* Address Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Line 1</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDAddress1}
                  onChangeText={(text) => setFormData({...formData, SDAddress1: text})}
                  placeholder="Enter address line 1"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Line 2</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDAddress2}
                  onChangeText={(text) => setFormData({...formData, SDAddress2: text})}
                  placeholder="Enter address line 2"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Line 3</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDAddress3}
                  onChangeText={(text) => setFormData({...formData, SDAddress3: text})}
                  placeholder="Enter address line 3"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDState}
                  onChangeText={(text) => setFormData({...formData, SDState: text})}
                  placeholder="Enter state"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Country</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDCountry}
                  onChangeText={(text) => setFormData({...formData, SDCountry: text})}
                  placeholder="Enter country"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pincode</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDPincode}
                  onChangeText={(text) => setFormData({...formData, SDPincode: text})}
                  placeholder="Enter pincode"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Contact Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Person</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDContactPerson}
                  onChangeText={(text) => setFormData({...formData, SDContactPerson: text})}
                  placeholder="Enter contact person name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDMobileNo}
                  onChangeText={(text) => setFormData({...formData, SDMobileNo: text})}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDEmail}
                  onChangeText={(text) => setFormData({...formData, SDEmail: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* GST Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GST Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>GSTN Type</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDGSTNType}
                  onChangeText={(text) => setFormData({...formData, SDGSTNType: text})}
                  placeholder="Enter GSTN type"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>GSTN Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.SDGSTNNumber}
                  onChangeText={(text) => setFormData({...formData, SDGSTNNumber: text.toUpperCase()})}
                  placeholder="Enter GSTN number"
                  autoCapitalize="characters"
                  maxLength={15}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Sub-Dealer Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sub-Dealer Details</Text>
            <TouchableOpacity onPress={() => {
              setShowDetailsModal(false);
              if (selectedSubDealer) {
                openEditModal(selectedSubDealer);
              }
            }}>
              <Text style={styles.modalSaveText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedSubDealer && (
              <>
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Basic Information</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Name:</Text>
                    <Text style={styles.detailsValue}>{selectedSubDealer.SDName || selectedSubDealer.name || 'N/A'}</Text>
                  </View>
                  {selectedSubDealer.SDContactPerson && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Contact Person:</Text>
                      <Text style={styles.detailsValue}>{selectedSubDealer.SDContactPerson}</Text>
                    </View>
                  )}
                  {selectedSubDealer.SDEmail && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Email:</Text>
                      <Text style={styles.detailsValue}>{selectedSubDealer.SDEmail}</Text>
                    </View>
                  )}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Mobile:</Text>
                    <Text style={styles.detailsValue}>{selectedSubDealer.SDMobileNo || selectedSubDealer.mobile || 'N/A'}</Text>
                  </View>
                  {selectedSubDealer.SDType && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Type:</Text>
                      <Text style={styles.detailsValue}>{selectedSubDealer.SDType}</Text>
                    </View>
                  )}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Status:</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: selectedSubDealer.isActive ? '#D1FAE5' : '#FEE2E2' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: selectedSubDealer.isActive ? '#059669' : '#DC2626' }
                      ]}>
                        {selectedSubDealer.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>

                {(selectedSubDealer.SDAddress1 || selectedSubDealer.SDAddress2 || selectedSubDealer.SDAddress3 || selectedSubDealer.SDState || selectedSubDealer.SDPincode) && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Address Information</Text>
                    {selectedSubDealer.SDAddress1 && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Address Line 1:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.SDAddress1}</Text>
                      </View>
                    )}
                    {selectedSubDealer.SDAddress2 && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Address Line 2:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.SDAddress2}</Text>
                      </View>
                    )}
                    {selectedSubDealer.SDAddress3 && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Address Line 3:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.SDAddress3}</Text>
                      </View>
                    )}
                    {selectedSubDealer.SDState && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>State:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.SDState}</Text>
                      </View>
                    )}
                    {selectedSubDealer.SDPincode && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Pincode:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.SDPincode}</Text>
                      </View>
                    )}
                    {selectedSubDealer.SDCountry && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Country:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.SDCountry}</Text>
                      </View>
                    )}
                  </View>
                )}

                {(selectedSubDealer.SDGSTNType || selectedSubDealer.SDGSTNNumber) && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>GST Information</Text>
                    {selectedSubDealer.SDGSTNType && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>GSTN Type:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.SDGSTNType}</Text>
                      </View>
                    )}
                    {selectedSubDealer.SDGSTNNumber && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>GSTN Number:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.SDGSTNNumber}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Company Information</Text>
                  {selectedSubDealer.companyId && (
                    <>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Company:</Text>
                        <Text style={styles.detailsValue}>
                          {typeof selectedSubDealer.companyId === 'object' 
                            ? selectedSubDealer.companyId.companyName 
                            : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Company Code:</Text>
                        <Text style={styles.detailsValue}>
                          {typeof selectedSubDealer.companyId === 'object' 
                            ? selectedSubDealer.companyId.companyCode 
                            : 'N/A'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {selectedSubDealer.groupId && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Group Information</Text>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Group Name:</Text>
                      <Text style={styles.detailsValue}>
                        {typeof selectedSubDealer.groupId === 'object' 
                          ? selectedSubDealer.groupId.GroupName 
                          : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Group GUID:</Text>
                      <Text style={styles.detailsValue}>
                        {typeof selectedSubDealer.groupId === 'object' 
                          ? selectedSubDealer.groupId.GroupGUID 
                          : 'N/A'}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedSubDealer.createdBy && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Created By</Text>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Name:</Text>
                      <Text style={styles.detailsValue}>
                        {typeof selectedSubDealer.createdBy === 'object' 
                          ? selectedSubDealer.createdBy.name 
                          : 'N/A'}
                      </Text>
                    </View>
                    {typeof selectedSubDealer.createdBy === 'object' && selectedSubDealer.createdBy.email && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Email:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.createdBy.email}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Timeline Information</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Created:</Text>
                    <Text style={styles.detailsValue}>{new Date(selectedSubDealer.createdAt).toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Last Updated:</Text>
                    <Text style={styles.detailsValue}>{new Date(selectedSubDealer.updatedAt).toLocaleString()}</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Deactivate Sub-Dealer</Text>
            </View>
            
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalMessage}>
                Are you sure you want to deactivate "{selectedSubDealer?.SDName || selectedSubDealer?.name || 'this sub-dealer'}"?
              </Text>
              <Text style={styles.deleteModalSubMessage}>
                This action will make the sub-dealer inactive and they won't be able to access the system.
              </Text>
            </View>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedSubDealer(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={confirmDeactivation}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Deactivate</Text>
                )}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#8B5CF6',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    borderRadius: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sortButtonSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  sortOrderButton: {
    padding: 4,
    marginLeft: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subDealerCard: {
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subdealerInfoHeader: {
    flex: 1,
  },
  subDealerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  subdealerDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
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
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  clickIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clickIndicatorText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  detailsValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  deleteModalContent: {
    marginBottom: 24,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalSubMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default TeamManagement;

