import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Package, 
  Search, 
  Plus, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Database, 
  Zap, 
  Edit, 
  Trash2, 
  Check, 
  MapPin, 
  Calendar, 
  AlertCircle,
  Clock,
  Activity,
  DollarSign,
  Target,
  BarChart3,
  UserCheck,
  CheckCircle,
  Globe,
  FileText,
  Hash,
  Settings,
  X,
  Save,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { apiService } from '../../../services/api';

// ==================== TYPE DEFINITIONS ====================
interface Company {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstNumber: string;
  status: 'active' | 'inactive';
  createdAt: string;
  maxUser?: number;
  guid?: string;
  tallySerialId?: string;
  admin: {
    name: string;
    phone: string;
    email: string;
  };
  admins?: Array<{
    _id: string;
    name: string;
    email: string;
    mobile: string;
    isDefault?: boolean;
  }>;
  stats: {
    totalSales: string;
    totalOrders: number;
    pendingOrders: number;
    totalUsers: number;
    activeUsers: number;
  };
}

// ==================== MOCK DATA ====================
const initialCompanies: Company[] = [];
type AdminOption = { label: string; value: string };

// ==================== COMPANIES LIST SCREEN ====================
const CompaniesListScreen = ({ 
  companies, 
  onViewDetails, 
  onCreateNew,
  onBack,
  onDelete,
  onToggleStatus
}: { 
  companies: Company[]; 
  onViewDetails: (company: Company) => void;
  onCreateNew: () => void;
  onBack: () => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const { width } = useWindowDimensions();
  const isCompact = width < 420;

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || company.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      {isCompact ? (
        <View style={[styles.header, styles.headerCompact]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <View style={styles.backButtonContent}>
                <ArrowLeft size={20} color="#2563eb" />
                <Text style={styles.backButtonText}>Back</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backButton, styles.addButtonCompact]}
              onPress={onCreateNew}
              activeOpacity={0.85}
            >
              <View style={styles.backButtonContent}>
                <Plus size={20} color="#2563eb" />
                <Text style={[styles.backButtonText, styles.backButtonTextSecondary]}>Add company</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconContainer}>
              <Building2 size={24} color="#2563eb" />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Companies</Text>
              <Text style={styles.headerSubtitle}>
                {filteredCompanies.length} total companies
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <View style={styles.backButtonContent}>
                <ArrowLeft size={20} color="#2563eb" />
                <Text style={styles.backButtonText}>Back</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <View style={styles.iconContainer}>
                <Building2 size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Companies</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredCompanies.length} total companies
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onCreateNew}
            activeOpacity={0.85}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Company</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company name or code..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.filterContainer}>
          {(['all', 'inactive'] as const).map(status => {
            const label = status === 'all' ? 'Active' : 'Deleted';
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status)}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.filterButtonActive
                ]}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Companies List */}
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {filteredCompanies.map(company => (
          <View
            key={company.id}
            style={styles.companyCard}
          >
            <TouchableOpacity
              style={styles.companyCardContent}
              onPress={() => onViewDetails(company)}
              activeOpacity={0.7}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.companyIcon}>
                    <Building2 size={28} color="#2563eb" />
                  </View>
                  <View style={styles.companyTextGroup}>
                    <Text style={styles.companyName} numberOfLines={2}>{company.name}</Text>
                    <Text style={styles.companyCode} numberOfLines={1}>{company.code}</Text>
                    <Text style={styles.companyGuid} numberOfLines={1}>
                      GUID: {company.guid ? company.guid : 'Not assigned'}
                    </Text>
                    <Text style={styles.companyGuid} numberOfLines={1}>
                      Tally Serial: {company.tallySerialId ? company.tallySerialId : 'Not assigned'}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  company.status === 'active' ? styles.statusActive : styles.statusInactive
                ]}>
                  <View style={[
                    styles.statusDot,
                    company.status === 'active' ? styles.statusDotActive : styles.statusDotInactive
                  ]} />
                  <Text style={[
                    styles.statusText,
                    company.status === 'active' ? styles.statusTextActive : styles.statusTextInactive
                  ]}>
                    {company.status}
                  </Text>
                </View>
              </View>

            {/* Admin Info */}
            <View style={styles.adminInfo}>
              <View style={styles.adminRow}>
                <Users size={16} color="#9ca3af" />
                <Text style={styles.adminLabel}>Admin:</Text>
                <Text style={styles.adminValue}>{company.admin.name}</Text>
              </View>
              <View style={styles.adminRow}>
                <Phone size={16} color="#9ca3af" />
                <Text style={styles.adminValue}>{company.phone}</Text>
              </View>
            </View>


              {/* Enhanced Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.footerRow}>
                  <View style={styles.footerItem}>
                    <Calendar size={14} color="#9ca3af" />
                    <Text style={styles.footerTextGray}>Created: {company.createdAt}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Activity size={14} color="#9ca3af" />
                    <Text style={styles.footerTextGray}>
                      Status: {company.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.footerRow}>
                  <View style={styles.footerItem}>
                    <MapPin size={14} color="#9ca3af" />
                    <Text style={styles.footerTextGray}>{company.city}, {company.state}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Building2 size={14} color="#9ca3af" />
                    <Text style={styles.footerTextGray}>ID: {company.id}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.cardActionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  company.status === 'active' ? styles.deactivateButton : styles.activateButton
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleStatus(company.id);
                }}
              >
                <Zap size={16} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {company.status === 'active' ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButtonList]}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(company.id);
                }}
              >
                <Trash2 size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredCompanies.length === 0 && (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No companies found</Text>
            <Text style={styles.emptyStateSubtitle}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== COMPANY DETAILS SCREEN ====================
const CompanyDetailsScreen = ({ 
  company, 
  onBack, 
  onEdit, 
  onDelete 
}: { 
  company: Company; 
  onBack: () => void;
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
}) => {
  const [showActivityModal, setShowActivityModal] = useState(false);

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Company',
      'Are you sure you want to deactivate this company?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', onPress: () => Alert.alert('Success', 'Company deactivated') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <View style={styles.backButtonContent}>
              <ArrowLeft size={20} color="#2563eb" />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>{company.name}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">{company.code}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit(company)}>
            <Edit size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(company.id)}>
            <Trash2 size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status Banner */}
        <View style={[
          styles.statusBanner,
          company.status === 'active' ? styles.statusBannerActive : styles.statusBannerInactive
        ]}>
          <View style={styles.statusBannerLeft}>
            <Check size={24} color={company.status === 'active' ? '#16a34a' : '#dc2626'} />
            <Text style={[
              styles.statusBannerText,
              company.status === 'active' ? styles.statusBannerTextActive : styles.statusBannerTextInactive
            ]}>
              Company is {company.status}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDeactivate}>
            <Text style={styles.deactivateText}>Deactivate</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.tabContent}>
          {/* Company Basic Information */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Building2 size={20} color="#2563eb" />
                <Text style={styles.infoCardTitle}>Company Information</Text>
              </View>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <View style={styles.infoItemHeader}>
                    <Building2 size={16} color="#6b7280" />
                    <Text style={styles.infoLabel}>Company Name</Text>
                  </View>
                  <Text style={styles.infoValue}>{company.name}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <View style={styles.infoItemHeader}>
                    <FileText size={16} color="#6b7280" />
                    <Text style={styles.infoLabel}>Company Code</Text>
                  </View>
                  <Text style={styles.infoValue}>{company.code}</Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoItemHeader}>
                    <Hash size={16} color="#6b7280" />
                    <Text style={styles.infoLabel}>Company GUID</Text>
                  </View>
                  <Text style={styles.infoValue}>{company.guid || 'Not assigned'}</Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoItemHeader}>
                    <Settings size={16} color="#6b7280" />
                    <Text style={styles.infoLabel}>Tally Serial ID</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {company.tallySerialId || 'Not provided'}
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <View style={styles.infoItemHeader}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={styles.infoLabel}>Created Date</Text>
                  </View>
                  <Text style={styles.infoValue}>{company.createdAt}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <View style={styles.infoItemHeader}>
                    <CheckCircle size={16} color={company.status === 'active' ? '#16a34a' : '#dc2626'} />
                    <Text style={styles.infoLabel}>Status</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    company.status === 'active' ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      company.status === 'active' ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Phone size={20} color="#2563eb" />
                <Text style={styles.infoCardTitle}>Contact Information</Text>
              </View>
              
              <View style={styles.contactGrid}>
                <View style={styles.contactItem}>
                  <View style={styles.contactItemHeader}>
                    <MapPin size={16} color="#6b7280" />
                    <Text style={styles.infoLabel}>Address</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {company.address ? company.address : 'Not provided'}
                  </Text>
                  {(company.city || company.state) && (
                    <Text style={styles.infoSubValue}>
                      {company.city}{company.city && company.state ? ', ' : ''}{company.state}
                    </Text>
                  )}
                  {company.pincode && (
                    <Text style={styles.infoSubValue}>PIN: {company.pincode}</Text>
                  )}
                </View>
                
                <View style={styles.contactItem}>
                  <View style={styles.contactItemHeader}>
                    <Phone size={16} color="#6b7280" />
                    <Text style={styles.infoLabel}>Phone</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {company.phone ? company.phone : 'Not provided'}
                  </Text>
                </View>
                
                <View style={styles.contactItem}>
                  <View style={styles.contactItemHeader}>
                    <Mail size={16} color="#6b7280" />
                    <Text style={styles.infoLabel}>Email</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {company.email ? company.email : 'Not provided'}
                  </Text>
                </View>
                
                {company.gstNumber && (
                  <View style={styles.contactItem}>
                    <View style={styles.contactItemHeader}>
                      <FileText size={16} color="#6b7280" />
                      <Text style={styles.infoLabel}>GST Number</Text>
                    </View>
                    <Text style={styles.infoValue}>{company.gstNumber}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Assigned Admins */}
            {(company.admins && company.admins.length > 0) || company.admin?.name ? (
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <UserCheck size={20} color="#2563eb" />
                  <Text style={styles.infoCardTitle}>
                    Assigned Admins {company.admins && company.admins.length > 0 ? `(${company.admins.length})` : ''}
                  </Text>
                </View>
                
                {company.admins && company.admins.length > 0 ? (
                  // Display multiple admins
                  company.admins.map((admin, index) => (
                    <View key={admin._id || index} style={[styles.adminCard, index > 0 && styles.adminCardMargin]}>
                      <View style={styles.adminAvatar}>
                        <Text style={styles.adminAvatarText}>
                          {admin.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.adminInfoContainer}>
                        <View style={styles.adminInfo}>
                          <View style={styles.adminNameRow}>
                            <Text style={styles.adminName}>{admin.name}</Text>
                            {index === 0 && (
                              <View style={styles.defaultAdminBadge}>
                                <Text style={styles.defaultAdminBadgeText}>Default</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.adminEmail} numberOfLines={1} ellipsizeMode="tail">{admin.email}</Text>
                          {admin.mobile && (
                            <Text style={styles.adminPhone}>{admin.mobile}</Text>
                          )}
                        </View>
                        <View style={styles.adminStatus}>
                          <CheckCircle size={16} color="#16a34a" />
                          <Text style={styles.adminStatusText}>Active</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  // Fallback to single admin (backward compatibility)
                  company.admin?.name && (
                    <View style={styles.adminCard}>
                      <View style={styles.adminAvatar}>
                        <Text style={styles.adminAvatarText}>
                          {company.admin.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.adminInfoContainer}>
                        <View style={styles.adminInfo}>
                          <Text style={styles.adminName}>{company.admin.name}</Text>
                          <Text style={styles.adminEmail} numberOfLines={1} ellipsizeMode="tail">{company.admin.email}</Text>
                          {company.admin.phone && (
                            <Text style={styles.adminPhone}>{company.admin.phone}</Text>
                          )}
                        </View>
                        <View style={styles.adminStatus}>
                          <CheckCircle size={16} color="#16a34a" />
                          <Text style={styles.adminStatusText}>Active</Text>
                        </View>
                      </View>
                    </View>
                  )
                )}
              </View>
            ) : (
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <UserCheck size={20} color="#9ca3af" />
                  <Text style={styles.infoCardTitle}>Assigned Admins</Text>
                </View>
                <View style={styles.noAdminsContainer}>
                  <Text style={styles.noAdminsText}>No admins assigned</Text>
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Settings size={20} color="#2563eb" />
                <Text style={styles.infoCardTitle}>Quick Actions</Text>
              </View>
              
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => {
                    onEdit(company);
                  }}
                >
                  <Edit size={20} color="#2563eb" />
                  <Text style={styles.quickActionText}>Edit Company</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => {
                    setShowActivityModal(true);
                  }}
                >
                  <Activity size={20} color="#8b5cf6" />
                  <Text style={styles.quickActionText}>Activity Log</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </ScrollView>

      {/* Activity Log Modal */}
      <Modal
        visible={showActivityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userModalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Activity size={24} color="#8b5cf6" />
                <View>
                  <Text style={styles.modalTitle}>Activity Log</Text>
                  <Text style={styles.modalSubtitle}>{company.name} - Recent Activity</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowActivityModal(false)}
              >
                <View style={styles.closeButtonContent}>
                  <X size={20} color="#6b7280" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Activity Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Recent Activity */}
              <View style={styles.activitySection}>
                <Text style={styles.reportSectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Users size={16} color="#16a34a" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Company Created</Text>
                      <Text style={styles.activityDescription}>
                        Company "{company.name}" was created and configured
                      </Text>
                      <Text style={styles.activityTime}>{company.createdAt}</Text>
                    </View>
                  </View>

                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <UserCheck size={16} color="#2563eb" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Admin Assigned</Text>
                      <Text style={styles.activityDescription}>
                        Admin "{company.admin.name}" was assigned to manage this company
                      </Text>
                      <Text style={styles.activityTime}>Recently</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================== CREATE/EDIT COMPANY SCREEN ====================
const CompanyFormScreen = ({ 
  company, 
  onBack, 
  onSave 
}: { 
  company: Partial<Company> | null; 
  onBack: () => void;
  onSave: (data: any) => void;
}) => {
  const isEdit = !!company?.id;
  const [formData, setFormData] = useState<Partial<Company>>(company || {
    status: 'active',
    admin: { name: '', phone: '', email: '' },
  });
  const [maxUsers, setMaxUsers] = useState<string>('100');
  const [guid, setGuid] = useState<string>(company?.guid ? String(company.guid) : '');
  const [tallySerialId, setTallySerialId] = useState<string>(company?.tallySerialId || '');
  const [adminOptions, setAdminOptions] = useState<AdminOption[]>([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [street, setStreet] = useState<string>('');
  const [country, setCountry] = useState<string>('India');
  const [pincode, setPincode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form fields when editing
  React.useEffect(() => {
    if (isEdit && company) {
      setStreet(company.address || '');
      setPincode(company.pincode || '');
      setMaxUsers(company.maxUser?.toString() || '100');
      setGuid(company.guid?.toString() || '');
      setTallySerialId(company.tallySerialId || '');
    }
  }, [isEdit, company]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.phone || !formData.email || !street || !formData.city || !formData.state || !country || !pincode) {
      Alert.alert('Error', 'Please fill all required fields (Name, Code, Mobile, Email, Street, City, State, Country, Pincode)');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        maxUsers,
        selectedAdminIds,
        street,
        country,
        pincode,
        guid,
        tallySerialId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: 'admin', field: string, value: any) => {
    setFormData((prev) => {
      const admin = {
        name: prev.admin?.name || '',
        phone: prev.admin?.phone || '',
        email: prev.admin?.email || '',
      };
      return {
        ...prev,
        [parent]: { ...admin, [field]: value },
      } as Partial<Company>;
    });
  };

  const filteredAdmins = adminOptions.filter((admin:AdminOption) =>
    admin.label.toLowerCase().includes(adminSearchQuery.toLowerCase())
  );

  // Load admins for dropdown
  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiService.superadminListAdmins({ page: 1, limit: 100 });
        if (res.success && res.data) {
          const opts = res.data.admins.map((a:any) => ({ label: `${a.name} (${a.email})`, value: a._id }));
          setAdminOptions(opts);
        }
      } catch (e) {}
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <View style={styles.backButtonContent}>
              <ArrowLeft size={20} color="#2563eb" />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {isEdit ? 'Edit Company' : 'Create New Company'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.formContainer}>
          {/* Basic Information */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            <Text style={styles.formLabel}>Company Name *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.name || ''}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Enter company name"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>Company Code *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.code || ''}
              onChangeText={(text) => updateField('code', text)}
              placeholder="e.g., RP001"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>Street *</Text>
            <TextInput
              style={styles.formInput}
              value={street}
              onChangeText={setStreet}
              placeholder="House/Street"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>City *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.city || ''}
              onChangeText={(text) => updateField('city', text)}
              placeholder="City"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>State *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.state || ''}
              onChangeText={(text) => updateField('state', text)}
              placeholder="State"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>Country *</Text>
            <TextInput
              style={styles.formInput}
              value={country}
              onChangeText={setCountry}
              placeholder="Country"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>Pincode *</Text>
            <TextInput
              style={styles.formInput}
              value={pincode}
              onChangeText={setPincode}
              placeholder="PIN/ZIP"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>Company Mobile *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.phone || ''}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="+91 XXXXX XXXXX"
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>Company Email *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.email || ''}
              onChangeText={(text) => updateField('email', text)}
              placeholder="info@company.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Admin Details */}
          {/* Contact Details */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Contact Details</Text>
            <Text style={styles.formLabel}>Website</Text>
            <TextInput
              style={styles.formInput}
              value={(formData as any).website || ''}
              onChangeText={(text) => updateField('website' as any, text)}
              placeholder="https://example.com"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Additional Fields */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Additional Settings</Text>
            <Text style={styles.formLabel}>Max Users *</Text>
            <TextInput
              style={styles.formInput}
              value={maxUsers}
              onChangeText={setMaxUsers}
              placeholder="100"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>GUID *</Text>
            <TextInput
              style={styles.formInput}
              value={guid}
              onChangeText={setGuid}
              placeholder="Unique GUID"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>Tally Serial ID</Text>
            <TextInput
              style={styles.formInput}
              value={tallySerialId}
              onChangeText={setTallySerialId}
              placeholder="Enter Tally serial ID"
              autoCapitalize="characters"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.formLabel}>Assign Admins (optional)</Text>
            
            {/* Selected Admins Display */}
            {selectedAdminIds.length > 0 && (
              <View style={styles.selectedAdminsContainer}>
                <Text style={styles.selectedAdminsHeader}>
                  Selected Admins ({selectedAdminIds.length})
                </Text>
                {selectedAdminIds.map((adminId) => {
                  const admin = adminOptions.find(a => a.value === adminId);
                  if (!admin) return null;
                  return (
                    <View key={adminId} style={styles.selectedAdminItem}>
                      <View style={styles.selectedAdminInfo}>
                        <Users size={18} color="#2563eb" />
                        <View style={styles.selectedAdminDetails}>
                          <Text style={styles.selectedAdminName} numberOfLines={1} ellipsizeMode="tail">
                            {admin.label}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeAdminButton}
                        onPress={() => {
                          setSelectedAdminIds(selectedAdminIds.filter(id => id !== adminId));
                        }}
                      >
                        <Text style={styles.removeAdminButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Admin Selector */}
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity 
                style={styles.dropdownContainer}
                onPress={() => {
                  if (!showAdminDropdown) {
                    setShowAdminDropdown(true);
                  }
                }}
                activeOpacity={0.9}
              >
                <View style={styles.dropdownButton}>
                  <Users size={20} color="#9ca3af" />
                  <Text style={[
                    styles.dropdownText,
                    selectedAdminIds.length === 0 && styles.dropdownPlaceholder
                  ]}>
                    {selectedAdminIds.length > 0 
                      ? `Select Admins (${selectedAdminIds.length} selected)`
                      : 'Select admins'
                    }
                  </Text>
                  <ChevronDown 
                    size={20} 
                    color="#9ca3af" 
                    style={[
                      styles.dropdownChevron,
                      showAdminDropdown && styles.dropdownChevronRotated
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {showAdminDropdown && (
                <>
                  <TouchableOpacity 
                    activeOpacity={1}
                    style={styles.dropdownBackdrop}
                    onPress={() => {
                      setShowAdminDropdown(false);
                      setAdminSearchQuery('');
                    }}
                  />
                  <View style={styles.dropdownPopover}>
                    <View style={styles.dropdownSearchContainer}>
                      <Search size={16} color="#9ca3af" />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder="Search admins..."
                        value={adminSearchQuery}
                        onChangeText={setAdminSearchQuery}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <ScrollView 
                      style={styles.dropdownScroll} 
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredAdmins.length > 0 ? (
                        filteredAdmins.map((admin) => {
                          const isSelected = selectedAdminIds.includes(admin.value);
                          return (
                            <TouchableOpacity
                              key={admin.value}
                              style={[
                                styles.dropdownItem,
                                isSelected && styles.dropdownItemSelected,
                              ]}
                              onPress={() => {
                                if (isSelected) {
                                  // Remove admin from selection
                                  setSelectedAdminIds(selectedAdminIds.filter(id => id !== admin.value));
                                } else {
                                  // Add admin to selection
                                  setSelectedAdminIds([...selectedAdminIds, admin.value]);
                                }
                                // Don't close selector - allow multiple selections
                              }}
                            >
                              <View style={styles.dropdownItemContent}>
                                <Users size={18} color={isSelected ? "#2563eb" : "#9ca3af"} />
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    isSelected && styles.dropdownItemTextSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {admin.label}
                                </Text>
                                {isSelected && (
                                  <Check size={18} color="#2563eb" />
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={styles.dropdownEmptyState}>
                          <Text style={styles.dropdownEmptyText}>No admins found</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Status */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Company Status</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => updateField('status', 'active')}
              >
                <View style={[
                  styles.radio,
                  formData.status === 'active' && styles.radioSelected
                ]}>
                  {formData.status === 'active' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => updateField('status', 'inactive')}
              >
                <View style={[
                  styles.radio,
                  formData.status === 'inactive' && styles.radioSelected
                ]}>
                  {formData.status === 'inactive' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Inactive</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Check size={20} color="#fff" />
          )}
          <Text style={styles.submitButtonText}>
            {isSubmitting 
              ? (isEdit ? 'Updating...' : 'Creating...') 
              : (isEdit ? 'Update' : 'Create')
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==================== MAIN APP COMPONENT ====================
const CompanyManagementSystem = () => {
  const navigation = useNavigation();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'create' | 'edit'>('list');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleViewDetails = async (company: Company) => {
    try {
      setLoading(true);
      // Fetch full company details to get latest assigned admins
      const res = await apiService.superadminGetCompanyDetails(company.id);
      if (res.success && res.data) {
        const c = res.data;
        // Map the detailed company data
        const detailedCompany: Company = {
          id: c._id || company.id,
          name: c.companyName || company.name,
          code: c.companyCode || company.code,
          guid: c.guid ? String(c.guid) : company.guid || '',
          maxUser: c.maxUser ?? company.maxUser,
          tallySerialId: c.tallySerialId || company.tallySerialId || '',
          address: c.contactDetails?.address?.street || company.address || '',
          city: c.contactDetails?.address?.city || company.city || '',
          state: c.contactDetails?.address?.state || company.state || '',
          pincode: c.contactDetails?.address?.pincode || company.pincode || '',
          phone: c.companyMobile || company.phone || '',
          email: c.companyEmail || company.email || '',
          gstNumber: company.gstNumber || '',
          status: c.isActive ? 'active' : 'inactive',
          createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : company.createdAt,
          admin: c.assignedAdmin ? {
            name: c.assignedAdmin.name || '',
            phone: c.assignedAdmin.mobile || '',
            email: c.assignedAdmin.email || ''
          } : company.admin,
          admins: c.assignedAdmins && Array.isArray(c.assignedAdmins) && c.assignedAdmins.length > 0
            ? c.assignedAdmins.map((a: any) => ({
                _id: a._id || a.toString(),
                name: a.name || '',
                email: a.email || '',
                mobile: a.mobile || '',
                isDefault: false
              }))
            : company.admins || [],
          stats: {
            totalSales: c.stats?.totalSales ? `₹${Number(c.stats.totalSales).toLocaleString()}` : company.stats.totalSales,
            totalOrders: c.stats?.totalOrders || company.stats.totalOrders,
            pendingOrders: c.stats?.pendingOrders || company.stats.pendingOrders,
            totalUsers: c.stats?.totalUsers || company.stats.totalUsers,
            activeUsers: c.stats?.activeUsers || company.stats.activeUsers
          }
        };
        setSelectedCompany(detailedCompany);
        setCurrentView('details');
      } else {
        // Fallback to the company from list if details fetch fails
        setSelectedCompany(company);
        setCurrentView('details');
      }
    } catch (error) {
      console.error('Failed to load company details:', error);
      // Fallback to the company from list if details fetch fails
      setSelectedCompany(company);
      setCurrentView('details');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await apiService.superadminListCompanies({ page: 1, limit: 50, search: '' });
      if (res.success && res.data) {
        console.log('Raw company data:', res.data.companies[0]); // Debug log
        const mapped: Company[] = res.data.companies.map((c:any) => {
          // Get all assigned admins
          const assignedAdmins: Array<{
            _id: string;
            name: string;
            email: string;
            mobile: string;
            isDefault?: boolean;
          }> = [];
          
          if (c.assignedAdmins && Array.isArray(c.assignedAdmins)) {
            assignedAdmins.push(...c.assignedAdmins
              .filter((a: any) => a.isActive)
              .map((a: any) => {
                const admin = a.adminId;
                if (typeof admin === 'object' && admin) {
                  return {
                    _id: admin._id || admin.toString(),
                    name: admin.name || '',
                    email: admin.email || '',
                    mobile: admin.mobile || '',
                    isDefault: false // We'll determine this based on defaultCompany
                  };
                }
                return null;
              })
              .filter(Boolean));
          }
          
          // Get default admin (for backward compatibility)
          const defaultAdmin = c.assignedAdmin || (assignedAdmins.length > 0 ? {
            name: assignedAdmins[0].name,
            email: assignedAdmins[0].email,
            phone: assignedAdmins[0].mobile
          } : { name: '', phone: '', email: '' });
          
          return {
            id: c._id,
            name: c.companyName,
            code: c.companyCode,
            guid: c.guid ? String(c.guid) : '',
            tallySerialId: c.tallySerialId || '',
            address: c.contactDetails?.address?.street || '',
            city: c.contactDetails?.address?.city || '',
            state: c.contactDetails?.address?.state || '',
            pincode: c.contactDetails?.address?.pincode || '',
            phone: c.companyMobile || '',
            email: c.companyEmail || '',
            gstNumber: '',
            status: c.isActive ? 'active' : 'inactive',
            createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
            admin: { 
              name: defaultAdmin?.name || '', 
              phone: defaultAdmin?.mobile || defaultAdmin?.phone || '', 
              email: defaultAdmin?.email || '' 
            },
            admins: assignedAdmins,
            stats: { 
              totalSales: c.stats?.totalSales ? `₹${Number(c.stats.totalSales).toLocaleString()}` : '₹0', 
              totalOrders: c.stats?.totalOrders || 0, 
              pendingOrders: c.stats?.pendingOrders || 0, 
              totalUsers: c.stats?.totalUsers || 0, 
              activeUsers: c.stats?.activeUsers || 0 
            }
          };
        });
        setCompanies(mapped);
      }
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreateNew = () => {
    setSelectedCompany(null);
    setCurrentView('create');
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setCurrentView('edit');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedCompany(null);
  };

  const handleToggleStatus = async (id: string) => {
    const company = companies.find(c => c.id === id);
    if (!company) return;

    const action = company.status === 'active' ? 'deactivate' : 'activate';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Company`,
      `Are you sure you want to ${action} ${company.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          style: company.status === 'active' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await apiService.superadminToggleCompanyStatus(id);
              
              if (result?.success) {
                // Reload companies to reflect changes
                await loadCompanies();
                const message = action === 'activate' 
                  ? 'Company activated successfully!' 
                  : 'Company deactivated successfully! It has been moved to "Deleted" view.';
                Alert.alert('Success', message);
              } else {
                Alert.alert('Error', result?.message || `Failed to ${action} company`);
              }
            } catch (error: any) {
              console.error(`Error ${action}ing company:`, error);
              Alert.alert('Error', error?.message || `Failed to ${action} company`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSave = async (data: any) => {
    try {
      if (currentView === 'create') {
        const payload: any = {
          companyName: data.name || '',
          companyState: data.state || '',
          companyCountry: data.country || 'India',
          companyMobile: data.phone || '',
          companyEmail: data.email || '',
          companyCode: data.code || '',
          maxUser: Number(data.maxUsers) || 100,
          contactDetails: {
            email: data.email,
            phone: data.phone,
            address: {
              street: data.street,
              city: data.city,
              state: data.state,
              country: data.country || 'India',
              pincode: data.pincode,
            }
          }
        };

        if (data.guid) {
          payload.guid = Number(data.guid);
        }
        if (data.tallySerialId) {
          payload.tallySerialId = data.tallySerialId.trim();
        }

        const res = await apiService.superadminCreateCompany(payload as any);
        if (res.success && res.data) {
          Alert.alert('Success', 'Company created successfully!');
          await loadCompanies();

          // Assign admins if provided
          if (data.selectedAdminIds && Array.isArray(data.selectedAdminIds) && data.selectedAdminIds.length > 0) {
            try {
              // Assign each admin to the company
              for (let i = 0; i < data.selectedAdminIds.length; i++) {
                const adminId = data.selectedAdminIds[i];
                await apiService.superadminAssignCompanyToAdmin(adminId, { 
                  companyId: res.data._id, 
                  setAsDefault: i === 0 // Set first admin as default
                });
              }
            } catch (e) {
              console.error('Error assigning admins:', e);
              // assignment failure is non-blocking
            }
          }
        } else {
          Alert.alert('Failed', res.message || 'Failed to create company');
        }
      } else if (currentView === 'edit' && selectedCompany) {
        const payload: any = {
          companyName: data.name || '',
          companyState: data.state || '',
          companyCountry: data.country || 'India',
          companyMobile: data.phone || '',
          companyEmail: data.email || '',
          companyCode: data.code || '',
          maxUser: Number(data.maxUsers) || 100,
          contactDetails: {
            email: data.email,
            phone: data.phone,
            address: {
              street: data.street,
              city: data.city,
              state: data.state,
              country: data.country || 'India',
              pincode: data.pincode,
            }
          }
        };

        if (data.guid) {
          payload.guid = Number(data.guid);
        }
        if (data.tallySerialId) {
          payload.tallySerialId = data.tallySerialId.trim();
        }

        const res = await apiService.superadminUpdateCompany(selectedCompany.id, payload);
        if (res.success && res.data) {
          // Handle admin assignments
          if (data.selectedAdminIds && Array.isArray(data.selectedAdminIds)) {
            try {
              // Get current assigned admins
              const companyRes = await apiService.superadminListCompanies({ page: 1, limit: 100 });
              if (companyRes.success && companyRes.data) {
                const companyData = companyRes.data.companies.find((c: any) => c._id === selectedCompany.id);
                const currentAdminIds: string[] = [];
                if (companyData && companyData.assignedAdmins && Array.isArray(companyData.assignedAdmins)) {
                  currentAdminIds.push(...companyData.assignedAdmins
                    .filter((a: any) => a.isActive)
                    .map((a: any) => a.adminId?._id || a.adminId || '')
                    .filter(Boolean));
                }

                // Remove admins that are no longer selected
                const adminsToRemove = currentAdminIds.filter(id => !data.selectedAdminIds.includes(id));
                // Add new admins
                const adminsToAdd = data.selectedAdminIds.filter(id => !currentAdminIds.includes(id));

                // Remove admins
                for (const adminId of adminsToRemove) {
                  // Note: There's no remove endpoint, so we might need to handle this differently
                  // For now, we'll just add the new ones
                }

                // Add new admins
                for (let i = 0; i < adminsToAdd.length; i++) {
                  const adminId = adminsToAdd[i];
                  await apiService.superadminAssignCompanyToAdmin(adminId, {
                    companyId: selectedCompany.id,
                    setAsDefault: false
                  });
                }
              }
            } catch (e) {
              console.error('Error updating admin assignments:', e);
              // assignment failure is non-blocking
            }
          }

          await loadCompanies();
          Alert.alert('Success', 'Company updated successfully!');
        } else {
          Alert.alert('Failed', res.message || 'Failed to update company');
        }
      }
    } catch (e:any) {
      Alert.alert('Error', e.message || 'Failed to save company');
    }
    setCurrentView('list');
    setSelectedCompany(null);
  };

  const handleDelete = async (id: string) => {
    const company = companies.find(c => c.id === id);
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete "${company?.name}"? The company will be deactivated and removed from the listing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await apiService.superadminDeleteCompany(id);
              
              if (result?.success) {
                // Remove from local state and reload
                await loadCompanies();
                setCurrentView('list');
                setSelectedCompany(null);
                Alert.alert('Success', 'Company deleted successfully! To view deleted companies, use the "Deleted" filter.');
              } else {
                Alert.alert('Error', result?.message || 'Failed to delete company');
              }
            } catch (error: any) {
              console.error('Error deleting company:', error);
              Alert.alert('Error', error?.message || 'Failed to delete company');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {currentView === 'list' && (
        <CompaniesListScreen
          companies={companies}
          onViewDetails={handleViewDetails}
          onCreateNew={handleCreateNew}
          onBack={() => navigation.goBack()}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}
      
      {currentView === 'details' && selectedCompany && (
        <CompanyDetailsScreen
          company={selectedCompany}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      
      {(currentView === 'create' || currentView === 'edit') && (
        <CompanyFormScreen
          company={currentView === 'edit' ? selectedCompany : null}
          onBack={handleBack}
          onSave={handleSave}
        />
      )}
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  headerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    rowGap: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  backButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  headerTitleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    flexShrink: 1,
  },
  headerTextGroup: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonCompact: {
    marginRight: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 10,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    padding: 10,
    borderRadius: 10,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120, // Extra padding for dropdown and buttons
  },
  companyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  companyCardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  companyTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  companyIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  companyCode: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  companyGuid: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#16a34a',
  },
  statusDotInactive: {
    backgroundColor: '#dc2626',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#15803d',
  },
  statusTextInactive: {
    color: '#b91c1c',
  },
  adminInfo: {
    flex: 1,
    minWidth: 0, // Allow flex to shrink
    marginRight: 12,
  },
  // Performance Indicator styles
  performanceIndicator: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  performanceBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  performanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  performanceScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  adminValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    gap: 8,
  },
  metricItem: {
    alignItems: 'center',
    width: '30%',
    minWidth: 80,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  cardFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#9333ea',
    fontWeight: '500',
  },
  footerTextGray: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
  },
  statusBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  statusBannerActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusBannerInactive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBannerTextActive: {
    color: '#15803d',
  },
  statusBannerTextInactive: {
    color: '#b91c1c',
  },
  deactivateText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    flex: 1,
    minWidth: 150,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  userStatItem: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  userStatLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  viewAllButton: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  salesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  salesLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  salesValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  formContainer: {
    padding: 16,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  // Dropdown styles
  dropdownContainer: {
    position: 'relative',
    marginBottom: 4,
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginLeft: 12,
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownChevron: {
    transform: [{ rotate: '90deg' }],
  },
  dropdownChevronRotated: {
    transform: [{ rotate: '270deg' }],
  },
  dropdownPopover: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    maxHeight: 180,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
    paddingVertical: 4,
  },
  dropdownScroll: {
    maxHeight: 160,
    flexGrow: 0,
  },
  selectedAdminsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedAdminsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  selectedAdminItem: {
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
  selectedAdminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  selectedAdminDetails: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0,
  },
  selectedAdminName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    flexShrink: 1,
  },
  removeAdminButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    flexShrink: 0,
    minWidth: 60,
    maxWidth: 80,
  },
  removeAdminButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    marginLeft: 8,
  },
  dropdownItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  dropdownEmptyState: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  selectedAdminText: {
    fontSize: 12,
    color: '#16a34a',
    marginLeft: 6,
    fontWeight: '500',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModalContent: {
    width: '92%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  dropdownModalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  dropdownModalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  dropdownModalClose: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  dropdownModalList: {
    maxHeight: 320,
  },
  dropdownEmptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // Enhanced Overview Section styles
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactGrid: {
    gap: 16,
  },
  contactItem: {
    marginBottom: 16,
  },
  contactItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoSubValue: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  adminInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
    minWidth: 0, // Allow flex to shrink
  },
  adminCardMargin: {
    marginTop: 12,
  },
  adminNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  defaultAdminBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultAdminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
  },
  noAdminsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  noAdminsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
    flexShrink: 1,
  },
  adminPhone: {
    fontSize: 12,
    color: '#9ca3af',
  },
  adminStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0, // Prevent status from shrinking
  },
  adminStatusText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
    marginLeft: 4,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statSubValue: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  // User Management Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  userModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  closeButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchFiltersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersRow: {
    gap: 12,
  },
  roleFilters: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statusFilters: {
    flexDirection: 'row',
    gap: 12,
  },
  statusFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusFilterActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  userRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userRoleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  userStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userStatusActive: {
    backgroundColor: '#dcfce7',
  },
  userStatusInactive: {
    backgroundColor: '#fee2e2',
  },
  userStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  userStatusDotActive: {
    backgroundColor: '#16a34a',
  },
  userStatusDotInactive: {
    backgroundColor: '#dc2626',
  },
  userStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userStatusTextActive: {
    color: '#15803d',
  },
  userStatusTextInactive: {
    color: '#b91c1c',
  },
  userCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  userFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userFooterText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Reports Modal styles
  reportSection: {
    marginBottom: 24,
  },
  reportSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  reportLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  reportValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  comingSoonCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Activity Log styles
  activitySection: {
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardActionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activateButton: {
    backgroundColor: '#10b981',
    borderRightWidth: 0.5,
    borderRightColor: '#f9fafb',
  },
  deactivateButton: {
    backgroundColor: '#f59e0b',
    borderRightWidth: 0.5,
    borderRightColor: '#f9fafb',
  },
  deleteButtonList: {
    backgroundColor: '#ef4444',
  },
});

export default CompanyManagementSystem;