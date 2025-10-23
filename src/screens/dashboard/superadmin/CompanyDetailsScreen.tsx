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
  StatusBar
} from 'react-native';
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
  AlertCircle 
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
  admin: {
    name: string;
    phone: string;
    email: string;
  };
  tally: {
    server: string;
    port: string;
    lastSync: string;
    status: 'connected' | 'disconnected';
  };
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

// ==================== COMPANIES LIST SCREEN ====================
const CompaniesListScreen = ({ 
  companies, 
  onViewDetails, 
  onCreateNew 
}: { 
  companies: Company[]; 
  onViewDetails: (company: Company) => void;
  onCreateNew: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Building2 size={24} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Companies</Text>
            <Text style={styles.headerSubtitle}>{filteredCompanies.length} total companies</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onCreateNew}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

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
          {(['all', 'active', 'inactive'] as const).map(status => (
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
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Companies List */}
      <ScrollView style={styles.scrollView}>
        {filteredCompanies.map(company => (
          <TouchableOpacity
            key={company.id}
            style={styles.companyCard}
            onPress={() => onViewDetails(company)}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.companyIcon}>
                  <Building2 size={28} color="#2563eb" />
                </View>
                <View>
                  <Text style={styles.companyName}>{company.name}</Text>
                  <Text style={styles.companyCode}>Code: {company.code}</Text>
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

            {/* Metrics */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#dcfce7' }]}>
                  <TrendingUp size={16} color="#16a34a" />
                </View>
                <Text style={styles.metricValue}>{company.stats.totalSales}</Text>
                <Text style={styles.metricLabel}>Total Sales</Text>
              </View>
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#fef3c7' }]}>
                  <Package size={16} color="#d97706" />
                </View>
                <Text style={styles.metricValue}>{company.stats.totalOrders}</Text>
                <Text style={styles.metricLabel}>Orders</Text>
              </View>
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#dbeafe' }]}>
                  <Users size={16} color="#2563eb" />
                </View>
                <Text style={styles.metricValue}>{company.stats.activeUsers}/{company.stats.totalUsers}</Text>
                <Text style={styles.metricLabel}>Users</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <Database size={14} color="#9333ea" />
                <Text style={styles.footerText}>Synced: {company.tally.lastSync}</Text>
              </View>
              <View style={styles.footerItem}>
                <Calendar size={14} color="#9ca3af" />
                <Text style={styles.footerTextGray}>Created: {company.createdAt}</Text>
              </View>
            </View>
          </TouchableOpacity>
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sales'>('overview');

  const handleTestConnection = () => {
    Alert.alert('Test Connection', 'Testing Tally connection...');
  };

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
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{company.name}</Text>
            <Text style={styles.headerSubtitle}>{company.code}</Text>
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <TrendingUp size={24} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{company.stats.totalSales}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Package size={24} color="#d97706" />
            </View>
            <Text style={styles.statValue}>{company.stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <AlertCircle size={24} color="#dc2626" />
            </View>
            <Text style={styles.statValue}>{company.stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <Users size={24} color="#16a34a" />
            </View>
            <Text style={styles.statValue}>{company.stats.activeUsers}/{company.stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['overview', 'users', 'sales'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive
              ]}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Company Information */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Company Information</Text>
              <View style={styles.infoRow}>
                <Building2 size={16} color="#9ca3af" />
                <Text style={styles.infoLabel}>Company Name</Text>
                <Text style={styles.infoValue}>{company.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={16} color="#9ca3af" />
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{company.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={16} color="#9ca3af" />
                <Text style={styles.infoLabel}>City, State</Text>
                <Text style={styles.infoValue}>{company.city}, {company.state}</Text>
              </View>
            </View>

            {/* Tally Integration */}
            <View style={styles.infoCard}>
              <View style={styles.tallyHeader}>
                <Text style={styles.infoCardTitle}>Tally Integration</Text>
                <View style={[
                  styles.tallyStatus,
                  company.tally.status === 'connected' ? styles.tallyConnected : styles.tallyDisconnected
                ]}>
                  <View style={[
                    styles.tallyDot,
                    company.tally.status === 'connected' ? styles.tallyDotConnected : styles.tallyDotDisconnected
                  ]} />
                  <Text style={[
                    styles.tallyStatusText,
                    company.tally.status === 'connected' ? styles.tallyStatusTextConnected : styles.tallyStatusTextDisconnected
                  ]}>
                    {company.tally.status}
                  </Text>
                </View>
              </View>
              <View style={styles.tallyInfo}>
                <Database size={20} color="#9333ea" />
                <View>
                  <Text style={styles.tallyLabel}>Server URL</Text>
                  <Text style={styles.tallyValue}>{company.tally.server}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.testButton} onPress={handleTestConnection}>
                <Zap size={20} color="#fff" />
                <Text style={styles.testButtonText}>Test Connection</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>User Statistics</Text>
              <View style={styles.userStats}>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatValue}>{company.stats.totalUsers}</Text>
                  <Text style={styles.userStatLabel}>Total Users</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={[styles.userStatValue, { color: '#16a34a' }]}>
                    {company.stats.activeUsers}
                  </Text>
                  <Text style={styles.userStatLabel}>Active</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={[styles.userStatValue, { color: '#dc2626' }]}>
                    {company.stats.totalUsers - company.stats.activeUsers}
                  </Text>
                  <Text style={styles.userStatLabel}>Inactive</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllButtonText}>View All Users →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'sales' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Sales Overview</Text>
              <View style={styles.salesRow}>
                <Text style={styles.salesLabel}>Total Sales</Text>
                <Text style={styles.salesValue}>{company.stats.totalSales}</Text>
              </View>
              <View style={styles.salesRow}>
                <Text style={styles.salesLabel}>Total Orders</Text>
                <Text style={styles.salesValue}>{company.stats.totalOrders}</Text>
              </View>
              <View style={styles.salesRow}>
                <Text style={styles.salesLabel}>Pending Orders</Text>
                <Text style={[styles.salesValue, { color: '#d97706' }]}>
                  {company.stats.pendingOrders}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllButtonText}>View Detailed Report →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
  const [guid, setGuid] = useState<string>(String(Date.now()));
  const [adminOptions, setAdminOptions] = useState<{label:string; value:string}[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [country, setCountry] = useState<string>('India');
  const [pincode, setPincode] = useState<string>('');

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.phone || !formData.email || !street || !formData.city || !formData.state || !country || !pincode) {
      Alert.alert('Error', 'Please fill all required fields (Name, Code, Mobile, Email, Street, City, State, Country, Pincode)');
      return;
    }
    onSave({
      ...formData,
      maxUsers,
      selectedAdminId,
      street,
      country,
      pincode,
      guid,
    });
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
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>
              {isEdit ? 'Edit Company' : 'Create New Company'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEdit ? 'Update company details' : 'Fill in the company information'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
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
            <Text style={styles.formLabel}>Assign Admin (optional)</Text>
            <View style={styles.formInput}>
              <ScrollView style={{ maxHeight: 180 }}>
                {adminOptions.map(opt => (
                  <TouchableOpacity key={opt.value} style={{ paddingVertical: 8 }} onPress={() => setSelectedAdminId(opt.value)}>
                    <Text style={{ color: selectedAdminId === opt.value ? '#2563eb' : '#111827', fontWeight: selectedAdminId === opt.value ? '700' : '500' }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {!!selectedAdminId && (
                <Text style={{ color: '#6b7280', marginTop: 8 }}>Selected: {adminOptions.find(a => a.value === selectedAdminId)?.label}</Text>
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
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Check size={20} color="#fff" />
          <Text style={styles.submitButtonText}>
            {isEdit ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==================== MAIN APP COMPONENT ====================
const CompanyManagementSystem = () => {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'create' | 'edit'>('list');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company);
    setCurrentView('details');
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await apiService.superadminListCompanies({ page: 1, limit: 50, search: '' });
      if (res.success && res.data) {
        const mapped: Company[] = res.data.companies.map((c:any) => ({
          id: c._id,
          name: c.companyName,
          code: c.companyCode,
          address: c.contactDetails?.address?.street || '',
          city: c.contactDetails?.address?.city || '',
          state: c.contactDetails?.address?.state || '',
          pincode: c.contactDetails?.address?.pincode || '',
          phone: c.companyMobile || '',
          email: c.companyEmail || '',
          gstNumber: '',
          status: c.isActive ? 'active' : 'inactive',
          createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          admin: { name: '', phone: '', email: '' },
          tally: { server: '', port: '9000', lastSync: 'Never', status: 'disconnected' },
          stats: { totalSales: '₹0', totalOrders: 0, pendingOrders: 0, totalUsers: 0, activeUsers: 0 },
        }));
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

  const handleSave = async (data: any) => {
    try {
      if (currentView === 'create') {
        // Map UI form to backend payload
        const payload = {
          companyName: data.name || '',
          companyState: data.state || '',
          companyCountry: data.country || 'India',
          companyMobile: data.phone || '',
          companyEmail: data.email || '',
          companyCode: data.code || '',
          maxUser: Number(data.maxUsers) || 100,
          guid: Number(data.guid) || Date.now(),
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

        const res = await apiService.superadminCreateCompany(payload as any);
        if (res.success && res.data) {
          Alert.alert('Success', 'Company created successfully!');
          // Optionally refresh list
          setCompanies([{ 
            id: res.data._id,
            name: res.data.companyName,
            code: res.data.companyCode,
            address: payload.contactDetails.address.street || '',
            city: payload.contactDetails.address.city || '',
            state: payload.contactDetails.address.state || '',
            pincode: payload.contactDetails.address.pincode || '',
            phone: payload.contactDetails.phone || '',
            email: payload.contactDetails.email || '',
            gstNumber: '',
            status: 'active',
            createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            admin: { name: '', phone: '', email: '' },
            tally: { server: '', port: '9000', lastSync: 'Never', status: 'disconnected' },
          stats: { totalSales: '₹0', totalOrders: 0, pendingOrders: 0, totalUsers: 0, activeUsers: 0 },
          }, ...companies]);

          // Assign admin if provided
          if (data.selectedAdminId) {
            try {
              await apiService.superadminAssignCompanyToAdmin(data.selectedAdminId, { companyId: res.data._id, setAsDefault: true });
            } catch (e) {
              // assignment failure is non-blocking
            }
          }
        } else {
          Alert.alert('Failed', res.message || 'Failed to create company');
        }
      } else if (currentView === 'edit' && selectedCompany) {
        // Could integrate update-company here similarly
        setCompanies(companies.map(c => 
          c.id === selectedCompany.id ? { ...c, ...data } : c
        ));
        Alert.alert('Success', 'Company updated successfully!');
      }
    } catch (e:any) {
      Alert.alert('Error', e.message || 'Failed to save company');
    }
    setCurrentView('list');
    setSelectedCompany(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Company',
      'Are you sure you want to delete this company? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setCompanies(companies.filter(c => c.id !== id));
            setCurrentView('list');
            setSelectedCompany(null);
            Alert.alert('Success', 'Company deleted successfully!');
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
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
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  companyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
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
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  metricItem: {
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
  tallyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tallyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tallyConnected: {
    backgroundColor: '#dcfce7',
  },
  tallyDisconnected: {
    backgroundColor: '#fee2e2',
  },
  tallyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tallyDotConnected: {
    backgroundColor: '#16a34a',
  },
  tallyDotDisconnected: {
    backgroundColor: '#dc2626',
  },
  tallyStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tallyStatusTextConnected: {
    color: '#15803d',
  },
  tallyStatusTextDisconnected: {
    color: '#b91c1c',
  },
  tallyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tallyLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  tallyValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9333ea',
    padding: 12,
    borderRadius: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
});

export default CompanyManagementSystem;