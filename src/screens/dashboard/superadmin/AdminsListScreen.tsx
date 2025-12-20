// src/screens/dashboard/superadmin/AdminsListScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  companyCode: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

const AdminsListScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { superadminUpdateAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [companiesOptions, setCompaniesOptions] = useState<{ label: string; value: string; code?: string }[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [defaultCompanyId, setDefaultCompanyId] = useState<string>('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companiesOptions.filter(company =>
    company.label.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await apiService.superadminListAdmins({ page: 1, limit: 25, search: searchQuery });
      if (res.success && res.data) {
        const mapped: Admin[] = res.data.admins.map((a:any) => {
          // Show all companies if available, otherwise just default
          let companies = '';
          let companyCode = '';
          
          if (a.companies && Array.isArray(a.companies) && a.companies.length > 0) {
            const companyNames = a.companies.map((c: any) => {
              const company = c.companyId;
              if (typeof company === 'object' && company) {
                return company.companyName || company.companyCode || '';
              }
              return '';
            }).filter(Boolean);
            
            companies = companyNames.length > 0 
              ? companyNames.join(', ') 
              : (a.defaultCompany?.companyName || '');
            
            // Get default company code
            if (a.defaultCompany) {
              companyCode = typeof a.defaultCompany === 'object' 
                ? a.defaultCompany.companyCode || ''
                : '';
            }
          } else if (a.defaultCompany) {
            companies = typeof a.defaultCompany === 'object' 
              ? a.defaultCompany.companyName || ''
              : '';
            companyCode = typeof a.defaultCompany === 'object' 
              ? a.defaultCompany.companyCode || ''
              : '';
          }
          
          return {
            id: a._id,
            name: a.name,
            email: a.email,
            phone: a.mobile || '',
            company: companies || 'No company assigned',
            companyCode: companyCode,
            status: a.isActive ? 'active' as const : 'inactive' as const,
            lastLogin: a.lastLogin ? new Date(a.lastLogin).toLocaleString() : 'Never',
            createdAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          };
        });
        setAdmins(mapped);
      }
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
    (async () => {
      try {
        const res = await apiService.superadminListCompanies({ page: 1, limit: 100 });
        if (res.success && res.data) {
          setCompaniesOptions(res.data.companies.map((c:any) => ({ label: `${c.companyName} (${c.companyCode})`, value: c._id, code: c.companyCode }))
          );
        }
      } catch {}
    })();
  }, []);

  const handleCreateAdmin = async () => {
    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.password || selectedCompanyIds.length === 0) {
        Alert.alert('Validation', 'Please fill all required fields: Name, Email, Phone, Password and select at least one Company');
        return;
      }

      // Password validation
      if (formData.password.length < 8) {
        Alert.alert('Validation Error', 'Password must be at least 8 characters long');
        return;
      }

      const res = await apiService.superadminCreateAdmin({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        mobile: formData.phone,
        companyIds: selectedCompanyIds,
        defaultCompanyId: defaultCompanyId || selectedCompanyIds[0], // Use selected default or first company
      });

      if (res.success) {
        Alert.alert('Success', 'Admin created successfully');
        setModalVisible(false);
        setFormData({ name: '', email: '', phone: '', password: '' });
        setSelectedCompanyIds([]);
        setDefaultCompanyId('');
        setShowCompanyDropdown(false);
        setCompanySearchQuery('');
        loadAdmins(); // Refresh the list
      } else {
        Alert.alert('Failed', res.message || 'Failed to create admin');
      }
    } catch (e:any) {
      Alert.alert('Error', e.message || 'Failed to create admin');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormData({ name: '', email: '', phone: '', password: '' });
    setSelectedCompanyIds([]);
    setDefaultCompanyId('');
    setShowCompanyDropdown(false);
    setCompanySearchQuery('');
  };

  const handleEditAdmin = async (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      password: '', // Don't pre-fill password
    });
    
    // Fetch full admin data to get all companies
    try {
      const res = await apiService.superadminListAdmins({ page: 1, limit: 100 });
      if (res.success && res.data) {
        const fullAdmin = res.data.admins.find((a: any) => a._id === admin.id);
        if (fullAdmin) {
          // Extract company IDs from companies array
          const companyIds: string[] = [];
          if (fullAdmin.companies && Array.isArray(fullAdmin.companies)) {
            companyIds.push(...fullAdmin.companies.map((c: any) => 
              typeof c.companyId === 'object' && c.companyId?._id 
                ? c.companyId._id 
                : c.companyId
            ));
          }
          setSelectedCompanyIds(companyIds);
          
          // Set default company
          if (fullAdmin.defaultCompany) {
            const defaultId = typeof fullAdmin.defaultCompany === 'object' && fullAdmin.defaultCompany._id
              ? fullAdmin.defaultCompany._id
              : fullAdmin.defaultCompany;
            setDefaultCompanyId(defaultId);
          } else if (companyIds.length > 0) {
            setDefaultCompanyId(companyIds[0]);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching admin details:', e);
      // Fallback to single company from admin object
      const company = companiesOptions.find(c => c.label.includes(admin.company));
      if (company) {
        setSelectedCompanyIds([company.value]);
        setDefaultCompanyId(company.value);
      }
    }
    
    setEditModalVisible(true);
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;

    try {
      setIsSubmitting(true);
      
      if (!formData.name || !formData.email || !formData.phone) {
        Alert.alert('Validation', 'Please fill all required fields: Name, Email, Phone');
        return;
      }

      // Password validation (only if provided)
      if (formData.password && formData.password.length < 8) {
        Alert.alert('Validation Error', 'Password must be at least 8 characters long');
        return;
      }

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        mobile: formData.phone,
      };

      // Only include password if provided
      if (formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      // Include companyIds if changed
      if (selectedCompanyIds.length > 0) {
        updateData.companyIds = selectedCompanyIds;
        updateData.defaultCompanyId = defaultCompanyId || selectedCompanyIds[0];
      }

      const res = await superadminUpdateAdmin(editingAdmin.id, updateData);

      if (res.success) {
        Alert.alert('Success', 'Admin updated successfully');
        setEditModalVisible(false);
        setEditingAdmin(null);
        setFormData({ name: '', email: '', phone: '', password: '' });
        setSelectedCompanyIds([]);
        setDefaultCompanyId('');
        setShowCompanyDropdown(false);
        setCompanySearchQuery('');
        loadAdmins(); // Refresh the list
      } else {
        Alert.alert('Failed', res.message || 'Failed to update admin');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingAdmin(null);
    setFormData({ name: '', email: '', phone: '', password: '' });
    setSelectedCompanyIds([]);
    setDefaultCompanyId('');
    setShowCompanyDropdown(false);
    setCompanySearchQuery('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admins</Text>
          <Text style={styles.headerSubtitle}>{filteredAdmins.length} Total</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search admins..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Admins List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredAdmins.map((admin) => (
          <TouchableOpacity
            key={admin.id}
            style={styles.adminCard}
            activeOpacity={0.7}
          >
            {/* Admin Header */}
            <View style={styles.cardHeader}>
              <View style={styles.adminAvatar}>
                <Ionicons name="person" size={24} color="#3B82F6" />
              </View>
              <View style={styles.adminInfo}>
                <Text style={styles.adminName}>{admin.name}</Text>
                <Text style={styles.adminRole}>Company Admin</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: admin.status === 'active' ? '#D1FAE5' : '#FEE2E2' }]}>
                <View style={[styles.statusDot, { backgroundColor: admin.status === 'active' ? '#10B981' : '#EF4444' }]} />
                <Text style={[styles.statusText, { color: admin.status === 'active' ? '#059669' : '#DC2626' }]}>
                  {admin.status}
                </Text>
              </View>
            </View>

            {/* Company Info */}
            <View style={styles.companySection}>
              <View style={styles.companyBadge}>
                <Ionicons name="business" size={14} color="#8B5CF6" />
                <Text style={styles.companyText} numberOfLines={2}>
                  {admin.company}
                </Text>
              </View>
              {admin.companyCode && (
                <Text style={styles.companyCode}>Code: {admin.companyCode}</Text>
              )}
            </View>

            {/* Contact Info */}
            <View style={styles.contactSection}>
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{admin.email}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{admin.phone}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text style={styles.footerText}>Last login: {admin.lastLogin}</Text>
              </View>
              <Text style={styles.createdText}>Created: {admin.createdAt}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditAdmin(admin)}
              >
                <Ionicons name="create-outline" size={16} color="#3B82F6" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Admin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Admin</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.form}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="admin@company.com"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password (min 8 characters)"
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>Minimum 8 characters required</Text>
              </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assign to Companies *</Text>
              
              {/* Selected Companies Display */}
              {selectedCompanyIds.length > 0 && (
                <View style={styles.selectedCompaniesContainer}>
                  <Text style={styles.selectedCompaniesHeader}>
                    Selected Companies ({selectedCompanyIds.length})
                  </Text>
                  {selectedCompanyIds.map((companyId) => {
                    const company = companiesOptions.find(c => c.value === companyId);
                    if (!company) return null;
                    const isDefault = defaultCompanyId === companyId;
                    return (
                      <View key={companyId} style={styles.selectedCompanyItem}>
                        <View style={styles.selectedCompanyInfo}>
                          <Ionicons name="business" size={20} color="#3B82F6" />
                          <View style={styles.selectedCompanyDetails}>
                            <Text style={styles.selectedCompanyName} numberOfLines={1} ellipsizeMode="tail">
                              {company.label}
                              {isDefault && (
                                <Text style={styles.defaultBadge}> (Default)</Text>
                              )}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.selectedCompanyActions}>
                          {!isDefault && selectedCompanyIds.length > 1 && (
                            <TouchableOpacity
                              style={styles.setDefaultButton}
                              onPress={() => {
                                setDefaultCompanyId(companyId);
                                Alert.alert('Success', 'Default company updated');
                              }}
                            >
                              <Text style={styles.setDefaultButtonText}>Set Default</Text>
                            </TouchableOpacity>
                          )}
                          {selectedCompanyIds.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeCompanyButton}
                              onPress={() => {
                                const newIds = selectedCompanyIds.filter(id => id !== companyId);
                                setSelectedCompanyIds(newIds);
                                // If removing default, set first remaining as default
                                if (defaultCompanyId === companyId && newIds.length > 0) {
                                  setDefaultCompanyId(newIds[0]);
                                } else if (newIds.length === 0) {
                                  setDefaultCompanyId('');
                                }
                              }}
                            >
                              <Ionicons name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                          {selectedCompanyIds.length === 1 && (
                            <Text style={styles.cannotRemoveText}>Required</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Company Selector Button */}
              <TouchableOpacity 
                style={styles.dropdownContainer}
                onPress={() => {
                  if (!showCompanyDropdown) {
                    setShowCompanyDropdown(true);
                  }
                }}
              >
                <View style={styles.dropdownButton}>
                  <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                  <Text style={[
                    styles.dropdownText,
                    selectedCompanyIds.length === 0 && styles.dropdownPlaceholder
                  ]}>
                    {selectedCompanyIds.length > 0 
                      ? `Select Companies (${selectedCompanyIds.length} selected)`
                      : 'Select companies'
                    }
                  </Text>
                  <Ionicons 
                    name={showCompanyDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </View>
              </TouchableOpacity>
              
              {showCompanyDropdown && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownBackdrop}
                    activeOpacity={1}
                    onPress={() => {
                      setShowCompanyDropdown(false);
                      setCompanySearchQuery('');
                    }}
                  />
                  <View style={styles.dropdownWrapper}>
                    <View style={styles.dropdownPanel}>
                    <View style={styles.dropdownSearchContainer}>
                      <Ionicons name="search" size={16} color="#9CA3AF" />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder="Search companies..."
                        value={companySearchQuery}
                        onChangeText={setCompanySearchQuery}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    
                    <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator>
                      {filteredCompanies.length > 0 ? (
                        filteredCompanies.map((company) => {
                          const isSelected = selectedCompanyIds.includes(company.value);
                          return (
                            <TouchableOpacity
                              key={company.value}
                              style={[
                                styles.dropdownItem,
                                isSelected && styles.dropdownItemSelected
                              ]}
                              onPress={() => {
                                if (isSelected) {
                                  // Remove company from selection
                                  setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== company.value));
                                  if (defaultCompanyId === company.value) {
                                    const remaining = selectedCompanyIds.filter(id => id !== company.value);
                                    setDefaultCompanyId(remaining.length > 0 ? remaining[0] : '');
                                  }
                                } else {
                                  // Add company to selection
                                  const newIds = [...selectedCompanyIds, company.value];
                                  setSelectedCompanyIds(newIds);
                                  // Set as default if it's the first one
                                  if (newIds.length === 1) {
                                    setDefaultCompanyId(company.value);
                                  }
                                }
                                // Don't close selector - allow multiple selections
                              }}
                            >
                              <View style={styles.dropdownItemContent}>
                                <Ionicons name="business" size={20} color={isSelected ? "#3B82F6" : "#6B7280"} />
                                <View style={styles.dropdownItemDetails}>
                                  <Text style={[
                                    styles.dropdownItemText,
                                    isSelected && styles.dropdownItemTextSelected
                                  ]}>
                                    {company.label}
                                  </Text>
                                </View>
                                {isSelected && (
                                  <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={styles.dropdownEmptyState}>
                          <Text style={styles.dropdownEmptyText}>No companies found</Text>
                        </View>
                      )}
                    </ScrollView>
                    </View>
                  </View>
                </>
              )}
            </View>
            <View style={styles.formBottomSpacer} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateAdmin}
              >
                <Text style={styles.createButtonText}>Create Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Admin</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.form}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="admin@company.com"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password (Optional)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Leave blank to keep current password"
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Companies</Text>
                
                {/* Selected Companies Display */}
                {selectedCompanyIds.length > 0 && (
                  <View style={styles.selectedCompaniesContainer}>
                    <Text style={styles.selectedCompaniesHeader}>
                      Selected Companies ({selectedCompanyIds.length})
                    </Text>
                    {selectedCompanyIds.map((companyId) => {
                      const company = companiesOptions.find(c => c.value === companyId);
                      if (!company) return null;
                      const isDefault = defaultCompanyId === companyId;
                      return (
                        <View key={companyId} style={styles.selectedCompanyItem}>
                          <View style={styles.selectedCompanyInfo}>
                            <Ionicons name="business" size={20} color="#3B82F6" />
                            <View style={styles.selectedCompanyDetails}>
                              <Text style={styles.selectedCompanyName}>
                                {company.label}
                                {isDefault && (
                                  <Text style={styles.defaultBadge}> (Default)</Text>
                                )}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.selectedCompanyActions}>
                            {!isDefault && selectedCompanyIds.length > 1 && (
                              <TouchableOpacity
                                style={styles.setDefaultButton}
                                onPress={() => {
                                  setDefaultCompanyId(companyId);
                                  Alert.alert('Success', 'Default company updated');
                                }}
                              >
                                <Text style={styles.setDefaultButtonText}>Set Default</Text>
                              </TouchableOpacity>
                            )}
                            {selectedCompanyIds.length > 1 && (
                              <TouchableOpacity
                                style={styles.removeCompanyButton}
                                onPress={() => {
                                  const newIds = selectedCompanyIds.filter(id => id !== companyId);
                                  setSelectedCompanyIds(newIds);
                                  // If removing default, set first remaining as default
                                  if (defaultCompanyId === companyId && newIds.length > 0) {
                                    setDefaultCompanyId(newIds[0]);
                                  } else if (newIds.length === 0) {
                                    setDefaultCompanyId('');
                                  }
                                }}
                              >
                                <Ionicons name="close-circle" size={24} color="#EF4444" />
                              </TouchableOpacity>
                            )}
                            {selectedCompanyIds.length === 1 && (
                              <Text style={styles.cannotRemoveText}>Required</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Company Selector Button */}
                <TouchableOpacity 
                  style={styles.dropdownContainer}
                  onPress={() => {
                    if (!showCompanyDropdown) {
                      setShowCompanyDropdown(true);
                    }
                  }}
                >
                  <View style={styles.dropdownButton}>
                    <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                    <Text style={[
                      styles.dropdownText,
                      selectedCompanyIds.length === 0 && styles.dropdownPlaceholder
                    ]}>
                      {selectedCompanyIds.length > 0 
                        ? `Select Companies (${selectedCompanyIds.length} selected)`
                        : 'Select companies'
                      }
                    </Text>
                    <Ionicons 
                      name={showCompanyDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </View>
                </TouchableOpacity>

                {showCompanyDropdown && (
                  <View style={styles.dropdownWrapper}>
                    <TouchableOpacity
                      style={styles.dropdownBackdrop}
                      activeOpacity={1}
                      onPress={() => {
                        setShowCompanyDropdown(false);
                        setCompanySearchQuery('');
                      }}
                    />
                    <View style={styles.dropdownPanel}>
                      <View style={styles.dropdownSearchContainer}>
                        <Ionicons name="search" size={16} color="#9CA3AF" />
                        <TextInput
                          style={styles.dropdownSearchInput}
                          placeholder="Search companies..."
                          value={companySearchQuery}
                          onChangeText={setCompanySearchQuery}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator>
                        {filteredCompanies.length > 0 ? (
                          filteredCompanies.map((company) => {
                            const isSelected = selectedCompanyIds.includes(company.value);
                            return (
                              <TouchableOpacity
                                key={company.value}
                                style={[
                                  styles.dropdownItem,
                                  isSelected && styles.dropdownItemSelected
                                ]}
                                onPress={() => {
                                  if (isSelected) {
                                    // Remove company from selection
                                    setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== company.value));
                                    if (defaultCompanyId === company.value) {
                                      const remaining = selectedCompanyIds.filter(id => id !== company.value);
                                      setDefaultCompanyId(remaining.length > 0 ? remaining[0] : '');
                                    }
                                  } else {
                                    // Add company to selection
                                    const newIds = [...selectedCompanyIds, company.value];
                                    setSelectedCompanyIds(newIds);
                                    // Set as default if it's the first one
                                    if (newIds.length === 1) {
                                      setDefaultCompanyId(company.value);
                                    }
                                  }
                                  // Don't close selector - allow multiple selections
                                }}
                              >
                                <View style={styles.dropdownItemContent}>
                                  <Ionicons name="business" size={20} color={isSelected ? "#3B82F6" : "#6B7280"} />
                                  <View style={styles.dropdownItemDetails}>
                                    <Text style={[
                                      styles.dropdownItemText,
                                      isSelected && styles.dropdownItemTextSelected
                                    ]}>
                                      {company.label}
                                    </Text>
                                  </View>
                                  {isSelected && (
                                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <View style={styles.dropdownEmptyState}>
                            <Text style={styles.dropdownEmptyText}>No companies found</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  </View>
                )}

                {showCompanyDropdown && <View style={styles.dropdownSpacer} />}
            </View>
            <View style={styles.formBottomSpacer} />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeEditModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleUpdateAdmin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>Update Admin</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  adminRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  companySection: {
    flexDirection: 'column',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginBottom: 4,
  },
  companyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
    marginLeft: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  companyCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  contactSection: {
    gap: 8,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 6,
  },
  createdText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formContent: {
    paddingBottom: 120, // Extra padding for dropdown and buttons
  },
  formBottomSpacer: {
    height: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Dropdown styles
  dropdownContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 4,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 998,
  },
  dropdownPanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    zIndex: 1001,
  },
  dropdownScroll: {
    maxHeight: 160,
    flexGrow: 0,
  },
  dropdownSpacer: {
    height: 0,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  selectedCompanyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  selectedCompanyText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
    fontWeight: '500',
  },
  // Search dropdown styles
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    paddingVertical: 4,
  },
  dropdownEmptyState: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Multi-select company styles
  selectedCompaniesContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCompaniesHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  selectedCompanyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
    maxWidth: '100%',
  },
  selectedCompanyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    minWidth: 0, // Allow flex shrinking
  },
  selectedCompanyDetails: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0, // Allow flex shrinking
  },
  selectedCompanyName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  defaultBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  selectedCompanyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0, // Prevent actions from shrinking
  },
  setDefaultButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
    minWidth: 70,
    maxWidth: 90,
  },
  setDefaultButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
  },
  removeCompanyButton: {
    padding: 4,
  },
  cannotRemoveText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginRight: 8,
  },
  dropdownItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});

export default AdminsListScreen;