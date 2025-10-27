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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
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
        const mapped: Admin[] = res.data.admins.map((a:any) => ({
          id: a._id,
          name: a.name,
          email: a.email,
          phone: a.mobile || '',
          company: a.defaultCompany?.companyName || '',
          companyCode: a.defaultCompany?.companyCode || '',
          status: a.isActive ? 'active' as const : 'inactive' as const,
          lastLogin: a.lastLogin ? new Date(a.lastLogin).toLocaleString() : 'Never',
          createdAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        }));
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
      if (!formData.name || !formData.email || !formData.phone || !formData.password || !selectedCompanyId) {
        Alert.alert('Validation', 'Please fill all required fields: Name, Email, Phone, Password and select a Company');
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
        companyId: selectedCompanyId,
      });

      if (res.success) {
        Alert.alert('Success', 'Admin created successfully');
        setModalVisible(false);
        setFormData({ name: '', email: '', phone: '', password: '' });
        setSelectedCompanyId('');
        setShowCompanyDropdown(false);
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
    setSelectedCompanyId('');
    setShowCompanyDropdown(false);
    setCompanySearchQuery('');
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      password: '', // Don't pre-fill password
    });
    // Find and set the company ID
    const company = companiesOptions.find(c => c.label.includes(admin.company));
    if (company) {
      setSelectedCompanyId(company.value);
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

      // Only include companyId if changed
      if (selectedCompanyId) {
        updateData.companyId = selectedCompanyId;
      }

      const res = await superadminUpdateAdmin(editingAdmin.id, updateData);

      if (res.success) {
        Alert.alert('Success', 'Admin updated successfully');
        setEditModalVisible(false);
        setEditingAdmin(null);
        setFormData({ name: '', email: '', phone: '', password: '' });
        setSelectedCompanyId('');
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
    setSelectedCompanyId('');
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
                <Text style={styles.companyText}>{admin.company}</Text>
              </View>
              <Text style={styles.companyCode}>{admin.companyCode}</Text>
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
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.label}>Assign to Company *</Text>
              <TouchableOpacity 
                style={styles.dropdownContainer}
                onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
              >
                <View style={styles.dropdownButton}>
                  <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                  <Text style={[
                    styles.dropdownText,
                    !selectedCompanyId && styles.dropdownPlaceholder
                  ]}>
                    {selectedCompanyId 
                      ? companiesOptions.find(c => c.value === selectedCompanyId)?.label 
                      : 'Select a company'
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
                <View style={styles.dropdownList}>
                  {/* Search Bar */}
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
                  
                  <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company) => (
                        <TouchableOpacity
                          key={company.value}
                          style={[
                            styles.dropdownItem,
                            selectedCompanyId === company.value && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setSelectedCompanyId(company.value);
                            setShowCompanyDropdown(false);
                            setCompanySearchQuery('');
                          }}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={[
                              styles.dropdownItemText,
                              selectedCompanyId === company.value && styles.dropdownItemTextSelected
                            ]}>
                              {company.label}
                            </Text>
                            {selectedCompanyId === company.value && (
                              <Ionicons name="checkmark" size={16} color="#3B82F6" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownEmptyState}>
                        <Text style={styles.dropdownEmptyText}>No companies found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
              
              {selectedCompanyId && (
                <View style={styles.selectedCompanyInfo}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.selectedCompanyText}>
                    Selected: {companiesOptions.find(c => c.value === selectedCompanyId)?.label}
                  </Text>
                </View>
              )}
            </View>
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
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
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
                    style={styles.eyeButton}
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
                <Text style={styles.label}>Company</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
                >
                  <Text style={[
                    styles.dropdownText,
                    selectedCompanyId ? styles.dropdownTextSelected : styles.dropdownPlaceholder
                  ]}>
                    {selectedCompanyId
                      ? companiesOptions.find(c => c.value === selectedCompanyId)?.label || 'Select Company'
                      : 'Select Company'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {showCompanyDropdown && (
                  <View style={styles.dropdownList}>
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
                    <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                      {filteredCompanies.map((company) => (
                        <TouchableOpacity
                          key={company.value}
                          style={[
                            styles.dropdownItem,
                            selectedCompanyId === company.value && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setSelectedCompanyId(company.value);
                            setShowCompanyDropdown(false);
                            setCompanySearchQuery('');
                          }}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={[
                              styles.dropdownItemText,
                              selectedCompanyId === company.value && styles.dropdownItemTextSelected
                            ]}>
                              {company.label}
                            </Text>
                            {selectedCompanyId === company.value && (
                              <Ionicons name="checkmark" size={16} color="#3B82F6" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                      {filteredCompanies.length === 0 && (
                        <View style={styles.dropdownEmptyState}>
                          <Text style={styles.dropdownEmptyText}>No companies found</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
    marginLeft: 6,
    flex: 1,
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
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  dropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
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
});

export default AdminsListScreen;