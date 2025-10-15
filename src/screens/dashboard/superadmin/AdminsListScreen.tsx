// src/screens/dashboard/superadmin/AdminsListScreen.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    companyCode: '',
  });

  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: '1',
      name: 'Satish Kumar',
      email: 'satish@royalpaints.com',
      phone: '+91 98765 43210',
      company: 'Royal Paints Pvt Ltd',
      companyCode: 'RP001',
      status: 'active',
      lastLogin: '2 hours ago',
      createdAt: '15 Jan 2024',
    },
    {
      id: '2',
      name: 'Rajesh Sharma',
      email: 'rajesh@elitecoatings.com',
      phone: '+91 98765 43211',
      company: 'Elite Coatings',
      companyCode: 'EC002',
      status: 'active',
      lastLogin: '5 hours ago',
      createdAt: '10 Feb 2024',
    },
    {
      id: '3',
      name: 'Amit Verma',
      email: 'amit@premiumcolors.com',
      phone: '+91 98765 43212',
      company: 'Premium Colors Ltd',
      companyCode: 'PC003',
      status: 'active',
      lastLogin: '1 day ago',
      createdAt: '05 Mar 2024',
    },
  ]);

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAdmin = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.company || !formData.companyCode) {
      alert('Please fill all fields');
      return;
    }

    const newAdmin: Admin = {
      id: String(admins.length + 1),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      companyCode: formData.companyCode,
      status: 'active',
      lastLogin: 'Never',
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setAdmins([...admins, newAdmin]);
    setModalVisible(false);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      companyCode: '',
    });
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
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Admin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Admin</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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
                <Text style={styles.label}>Company Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter company name"
                    value={formData.company}
                    onChangeText={(text) => setFormData({ ...formData, company: text })}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Code</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="code-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., RP001"
                    value={formData.companyCode}
                    onChangeText={(text) => setFormData({ ...formData, companyCode: text })}
                    autoCapitalize="characters"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
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
});

export default AdminsListScreen;