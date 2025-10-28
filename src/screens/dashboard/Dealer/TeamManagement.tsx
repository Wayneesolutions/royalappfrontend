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
  email: string;
  name: string;
  mobile: string;
  role: string;
  isActive: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  companies: Array<{
    companyId: {
      _id: string;
      companyName: string;
      companyCode: string;
    };
    role: string;
    isActive: boolean;
  }>;
  hierarchy: {
    parentUser: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    level: number;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
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
    email: '',
    password: '',
    name: '',
    mobile: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
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
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
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
      
      const subDealerData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
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
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
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
      email: '',
      password: '',
      name: '',
      mobile: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      },
    });
  };

  // Open edit modal
  const openEditModal = (subDealer: SubDealer) => {
    setSelectedSubDealer(subDealer);
    setFormData({
      email: subDealer.email,
      password: '', // Don't show password
      name: subDealer.name,
      mobile: subDealer.mobile,
      address: {
        street: subDealer.address?.street || '',
        city: subDealer.address?.city || '',
        state: subDealer.address?.state || '',
        pincode: subDealer.address?.pincode || '',
        country: subDealer.address?.country || 'India',
      },
    });
    setShowEditModal(true);
  };

  // Render sub-dealer item
  const renderSubDealerItem = ({ item }: { item: SubDealer }) => (
    <TouchableOpacity
      style={styles.subDealerCard}
      onPress={() => handleSubDealerClick(item)}
      activeOpacity={0.7}
    >
      <View style={styles.subDealerInfo}>
        <Text style={styles.subDealerName}>{item.name}</Text>
        <Text style={styles.subDealerEmail}>{item.email}</Text>
        <Text style={styles.subDealerMobile}>{item.mobile}</Text>
        
        {item.address && (
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>
              {item.address.street && `${item.address.street}, `}
              {item.address.city && `${item.address.city}, `}
              {item.address.state && `${item.address.state} `}
              {item.address.pincode && `- ${item.address.pincode}`}
            </Text>
            {item.address.country && (
              <Text style={styles.countryText}>{item.address.country}</Text>
            )}
          </View>
        )}
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.isActive ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.isActive ? '#059669' : '#DC2626' }
            ]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Text style={styles.createdDate}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.subDealerActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            openEditModal(item);
          }}
        >
          <Ionicons name="create-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeactivateSubDealer(item);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.clickIndicator}>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        <Text style={styles.clickIndicatorText}>Tap to view details</Text>
      </View>
    </TouchableOpacity>
  );

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
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Enter sub-dealer name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mobile *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.mobile}
                onChangeText={(text) => setFormData({...formData, mobile: text})}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                placeholder="Enter password"
                secureTextEntry
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Street Address</Text>
              <TextInput
                style={styles.formInput}
                value={formData.address.street}
                onChangeText={(text) => setFormData({
                  ...formData, 
                  address: {...formData.address, street: text}
                })}
                placeholder="Enter street address"
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>City</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.address.city}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    address: {...formData.address, city: text}
                  })}
                  placeholder="Enter city"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.address.state}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    address: {...formData.address, state: text}
                  })}
                  placeholder="Enter state"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Pincode</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.address.pincode}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    address: {...formData.address, pincode: text}
                  })}
                  placeholder="Enter pincode"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Country</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.address.country}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    address: {...formData.address, country: text}
                  })}
                  placeholder="Enter country"
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
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={[styles.formInput, styles.disabledInput]}
                value={formData.email}
                editable={false}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Enter sub-dealer name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mobile *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.mobile}
                onChangeText={(text) => setFormData({...formData, mobile: text})}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Street Address</Text>
              <TextInput
                style={styles.formInput}
                value={formData.address.street}
                onChangeText={(text) => setFormData({
                  ...formData, 
                  address: {...formData.address, street: text}
                })}
                placeholder="Enter street address"
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>City</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.address.city}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    address: {...formData.address, city: text}
                  })}
                  placeholder="Enter city"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.address.state}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    address: {...formData.address, state: text}
                  })}
                  placeholder="Enter state"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Pincode</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.address.pincode}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    address: {...formData.address, pincode: text}
                  })}
                  placeholder="Enter pincode"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Country</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.address.country}
                  onChangeText={(text) => setFormData({
                    ...formData, 
                    address: {...formData.address, country: text}
                  })}
                  placeholder="Enter country"
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
                    <Text style={styles.detailsValue}>{selectedSubDealer.name}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Email:</Text>
                    <Text style={styles.detailsValue}>{selectedSubDealer.email}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Mobile:</Text>
                    <Text style={styles.detailsValue}>{selectedSubDealer.mobile}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Role:</Text>
                    <Text style={styles.detailsValue}>{selectedSubDealer.role}</Text>
                  </View>
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

                {selectedSubDealer.address && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Address Information</Text>
                    {selectedSubDealer.address.street && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Street:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.address.street}</Text>
                      </View>
                    )}
                    {selectedSubDealer.address.city && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>City:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.address.city}</Text>
                      </View>
                    )}
                    {selectedSubDealer.address.state && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>State:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.address.state}</Text>
                      </View>
                    )}
                    {selectedSubDealer.address.pincode && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Pincode:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.address.pincode}</Text>
                      </View>
                    )}
                    {selectedSubDealer.address.country && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Country:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.address.country}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Company Information</Text>
                  {selectedSubDealer.companies && selectedSubDealer.companies.length > 0 && (
                    <>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Company:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.companies[0].companyId.companyName}</Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Company Code:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.companies[0].companyId.companyCode}</Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Hierarchy Information</Text>
                  {selectedSubDealer.hierarchy && selectedSubDealer.hierarchy.parentUser && (
                    <>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Parent User:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.hierarchy.parentUser.name}</Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Parent Role:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.hierarchy.parentUser.role}</Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Hierarchy Level:</Text>
                        <Text style={styles.detailsValue}>{selectedSubDealer.hierarchy.level}</Text>
                      </View>
                    </>
                  )}
                </View>

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
                  {selectedSubDealer.createdBy && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Created By:</Text>
                      <Text style={styles.detailsValue}>{selectedSubDealer.createdBy.name}</Text>
                    </View>
                  )}
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
                Are you sure you want to deactivate "{selectedSubDealer?.name}"?
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
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subDealerInfo: {
    flex: 1,
  },
  subDealerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subDealerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  subDealerMobile: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  countryText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  createdDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  subDealerActions: {
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginBottom: 4,
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
});

export default TeamManagement;
