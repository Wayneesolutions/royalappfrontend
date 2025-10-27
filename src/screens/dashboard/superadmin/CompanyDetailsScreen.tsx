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
  ActivityIndicator
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
  maxUsers?: number;
  guid?: string;
  admin: {
    name: string;
    phone: string;
    email: string;
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
  onCreateNew,
  onBack
}: { 
  companies: Company[]; 
  onViewDetails: (company: Company) => void;
  onCreateNew: () => void;
  onBack: () => void;
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
              <Text style={styles.headerSubtitle}>{filteredCompanies.length} total companies</Text>
            </View>
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

            {/* Performance Indicator */}
            <View style={styles.performanceIndicator}>
              <View style={styles.performanceHeader}>
                <Activity size={16} color="#6b7280" />
                <Text style={styles.performanceLabel}>Performance Score</Text>
              </View>
              <View style={styles.performanceBar}>
                <View style={[
                  styles.performanceFill, 
                  { 
                    width: `${Math.min(100, Math.max(0, 
                      ((company.stats?.activeUsers || 0) / Math.max(1, company.stats?.totalUsers || 1)) * 50 +
                      ((company.stats?.totalOrders - (company.stats?.pendingOrders || 0)) / Math.max(1, company.stats?.totalOrders || 1)) * 50
                    ))}%`,
                    backgroundColor: company.stats?.totalOrders > 0 ? '#16a34a' : '#6b7280'
                  }
                ]} />
              </View>
              <Text style={styles.performanceScore}>
                {Math.round(
                  ((company.stats?.activeUsers || 0) / Math.max(1, company.stats?.totalUsers || 1)) * 50 +
                  ((company.stats?.totalOrders - (company.stats?.pendingOrders || 0)) / Math.max(1, company.stats?.totalOrders || 1)) * 50
                )}%
              </Text>
            </View>

            {/* Enhanced Metrics */}
            <View style={styles.metricsContainer}>
              {/* Sales Performance */}
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#dcfce7' }]}>
                  <TrendingUp size={16} color="#16a34a" />
                </View>
                <Text style={styles.metricValue}>
                  {company.stats?.totalSales || '₹0'}
                </Text>
                <Text style={styles.metricLabel}>Total Sales</Text>
              </View>

              {/* Order Statistics */}
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#fef3c7' }]}>
                  <Package size={16} color="#d97706" />
                </View>
                <Text style={styles.metricValue}>
                  {company.stats?.totalOrders?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.metricLabel}>Total Orders</Text>
              </View>

              {/* Pending Orders */}
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#fecaca' }]}>
                  <AlertCircle size={16} color="#dc2626" />
                </View>
                <Text style={styles.metricValue}>
                  {company.stats?.pendingOrders?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.metricLabel}>Pending Orders</Text>
              </View>

              {/* User Activity */}
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#dbeafe' }]}>
                  <Users size={16} color="#2563eb" />
                </View>
                <Text style={styles.metricValue}>
                  {company.stats?.activeUsers || 0}/{company.stats?.totalUsers || 0}
                </Text>
                <Text style={styles.metricLabel}>Active Users</Text>
              </View>

              {/* Completion Rate */}
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#f0fdf4' }]}>
                  <CheckCircle size={16} color="#16a34a" />
                </View>
                <Text style={styles.metricValue}>
                  {company.stats?.totalOrders > 0 
                    ? `${Math.round(((company.stats.totalOrders - (company.stats.pendingOrders || 0)) / company.stats.totalOrders) * 100)}%`
                    : '0%'
                  }
                </Text>
                <Text style={styles.metricLabel}>Completion Rate</Text>
              </View>

              {/* Average Order Value */}
              <View style={styles.metricItem}>
                <View style={[styles.metricIcon, { backgroundColor: '#fef7ff' }]}>
                  <DollarSign size={16} color="#8b5cf6" />
                </View>
                <Text style={styles.metricValue}>
                  {company.stats?.totalOrders > 0 
                    ? `₹${Math.round((Number(company.stats?.totalSales?.replace('₹', '').replace(',', '')) || 0) / company.stats.totalOrders).toLocaleString()}`
                    : '₹0'
                  }
                </Text>
                <Text style={styles.metricLabel}>Avg Order Value</Text>
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
                    Last Activity: {company.stats?.totalOrders > 0 ? 'Active' : 'No Activity'}
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'all' | 'admin' | 'asm' | 'rsm' | 'zonal' | 'salesman' | 'dealers' | 'distibutors' | 'subdealer'>('all');
  const [userFilterStatus, setUserFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load company users
  const loadCompanyUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await apiService.superadminGetCompanyDetails(company.id);
      if (res.success && res.data && res.data.allUsers) {
        setCompanyUsers(res.data.allUsers);
      }
    } catch (error) {
      console.error('Failed to load company users:', error);
      Alert.alert('Error', 'Failed to load company users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = companyUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = userFilterRole === 'all' || user.role === userFilterRole;
    const matchesStatus = userFilterStatus === 'all' || 
                         (userFilterStatus === 'active' && user.isActive) ||
                         (userFilterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Admin',
      'asm': 'Area Sales Manager',
      'rsm': 'Regional Sales Manager',
      'zonal': 'Zonal Manager',
      'salesman': 'Salesman',
      'dealers': 'Dealer',
      'distibutors': 'Distributor',
      'subdealer': 'Sub Dealer'
    };
    return roleMap[role] || role;
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const colorMap: { [key: string]: string } = {
      'admin': '#3B82F6',
      'asm': '#F59E0B',
      'rsm': '#8B5CF6',
      'zonal': '#06B6D4',
      'salesman': '#EF4444',
      'dealers': '#10B981',
      'distibutors': '#F97316',
      'subdealer': '#84CC16'
    };
    return colorMap[role] || '#6B7280';
  };

  // Format last login
  const formatLastLogin = (lastLogin: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
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
            <View style={styles.backButtonContent}>
              <ArrowLeft size={20} color="#2563eb" />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
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

            {/* Assigned Admin */}
            {company.admin && (
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <UserCheck size={20} color="#2563eb" />
                  <Text style={styles.infoCardTitle}>Assigned Admin</Text>
                </View>
                
                <View style={styles.adminCard}>
                  <View style={styles.adminAvatar}>
                    <Text style={styles.adminAvatarText}>
                      {company.admin.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.adminInfo}>
                    <Text style={styles.adminName}>{company.admin.name}</Text>
                    <Text style={styles.adminEmail}>{company.admin.email}</Text>
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
            )}

            {/* Company Statistics Overview */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <BarChart3 size={20} color="#2563eb" />
                <Text style={styles.infoCardTitle}>Statistics Overview</Text>
              </View>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={styles.statItemHeader}>
                    <Users size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Users</Text>
                  </View>
                  <Text style={styles.statValue}>{company.stats.totalUsers}</Text>
                  <Text style={styles.statSubValue}>
                    {company.stats.activeUsers} active
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <View style={styles.statItemHeader}>
                    <Package size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Orders</Text>
                  </View>
                  <Text style={styles.statValue}>{company.stats.totalOrders}</Text>
                  <Text style={styles.statSubValue}>
                    {company.stats.pendingOrders} pending
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <View style={styles.statItemHeader}>
                    <DollarSign size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Total Sales</Text>
                  </View>
                  <Text style={styles.statValue}>{company.stats.totalSales}</Text>
                  <Text style={styles.statSubValue}>All time</Text>
                </View>
                
                <View style={styles.statItem}>
                  <View style={styles.statItemHeader}>
                    <Activity size={16} color="#6b7280" />
                    <Text style={styles.statLabel}>Activity</Text>
                  </View>
                  <Text style={styles.statValue}>
                    {company.stats.activeUsers > 0 ? 'High' : 'Low'}
                  </Text>
                  <Text style={styles.statSubValue}>
                    {company.stats.activeUsers} active users
                  </Text>
                </View>
              </View>
            </View>

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
                    setShowUserModal(true);
                    loadCompanyUsers();
                  }}
                >
                  <Users size={20} color="#16a34a" />
                  <Text style={styles.quickActionText}>Manage Users</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => {
                    setShowReportsModal(true);
                  }}
                >
                  <BarChart3 size={20} color="#f59e0b" />
                  <Text style={styles.quickActionText}>View Reports</Text>
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
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => {
                  setShowUserModal(true);
                  loadCompanyUsers();
                }}
              >
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

      {/* User Management Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userModalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Users size={24} color="#2563eb" />
                <View>
                  <Text style={styles.modalTitle}>Company Users</Text>
                  <Text style={styles.modalSubtitle}>{company.name} - {filteredUsers.length} users</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowUserModal(false)}
              >
                <View style={styles.closeButtonContent}>
                  <X size={18} color="#6b7280" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Search and Filters */}
            <View style={styles.searchFiltersContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={styles.filtersRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
                  {(['all', 'admin', 'asm', 'rsm', 'zonal', 'salesman', 'dealers', 'distibutors', 'subdealer'] as const).map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.filterChip,
                        userFilterRole === role && styles.filterChipActive
                      ]}
                      onPress={() => setUserFilterRole(role)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        userFilterRole === role && styles.filterChipTextActive
                      ]}>
                        {role === 'all' ? 'All Roles' : getRoleDisplayName(role)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <View style={styles.statusFilters}>
                  {(['all', 'active', 'inactive'] as const).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusFilter,
                        userFilterStatus === status && styles.statusFilterActive
                      ]}
                      onPress={() => setUserFilterStatus(status)}
                    >
                      <View style={[
                        styles.statusDot,
                        status === 'active' && styles.statusDotActive,
                        status === 'inactive' && styles.statusDotInactive
                      ]} />
                      <Text style={[
                        styles.statusFilterText,
                        userFilterStatus === status && styles.statusFilterTextActive
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Users List */}
            <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
              {loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <View key={user._id} style={styles.userCard}>
                    <View style={styles.userCardHeader}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <View style={styles.userRoleContainer}>
                          <View style={[styles.userRoleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                            <Text style={styles.userRoleText}>{getRoleDisplayName(user.role)}</Text>
                          </View>
                          <View style={[
                            styles.userStatusBadge,
                            user.isActive ? styles.userStatusActive : styles.userStatusInactive
                          ]}>
                            <View style={[
                              styles.userStatusDot,
                              user.isActive ? styles.userStatusDotActive : styles.userStatusDotInactive
                            ]} />
                            <Text style={[
                              styles.userStatusText,
                              user.isActive ? styles.userStatusTextActive : styles.userStatusTextInactive
                            ]}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.userCardFooter}>
                      <View style={styles.userFooterItem}>
                        <Calendar size={14} color="#9ca3af" />
                        <Text style={styles.userFooterText}>
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.userFooterItem}>
                        <Users size={14} color="#9ca3af" />
                        <Text style={styles.userFooterText}>
                          Last login: {formatLastLogin(user.lastLogin)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Users size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateTitle}>No users found</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {userSearchQuery || userFilterRole !== 'all' || userFilterStatus !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No users have been added to this company yet'
                    }
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reports Modal */}
      <Modal
        visible={showReportsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userModalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <BarChart3 size={24} color="#f59e0b" />
                <View>
                  <Text style={styles.modalTitle}>Company Reports</Text>
                  <Text style={styles.modalSubtitle}>{company.name} - Analytics & Reports</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowReportsModal(false)}
              >
                <View style={styles.closeButtonContent}>
                  <X size={20} color="#6b7280" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Reports Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Sales Overview */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>Sales Overview</Text>
                <View style={styles.reportCard}>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Total Sales</Text>
                    <Text style={styles.reportValue}>{company.stats?.totalSales || '₹0'}</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Total Orders</Text>
                    <Text style={styles.reportValue}>{company.stats?.totalOrders?.toLocaleString() || '0'}</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Pending Orders</Text>
                    <Text style={styles.reportValue}>{company.stats?.pendingOrders?.toLocaleString() || '0'}</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Average Order Value</Text>
                    <Text style={styles.reportValue}>
                      {company.stats?.totalOrders > 0 
                        ? `₹${Math.round((Number(company.stats?.totalSales?.replace('₹', '').replace(',', '')) || 0) / company.stats.totalOrders).toLocaleString()}`
                        : '₹0'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* User Analytics */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>User Analytics</Text>
                <View style={styles.reportCard}>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Total Users</Text>
                    <Text style={styles.reportValue}>{company.stats?.totalUsers || '0'}</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Active Users</Text>
                    <Text style={styles.reportValue}>{company.stats?.activeUsers || '0'}</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>User Activity Rate</Text>
                    <Text style={styles.reportValue}>
                      {company.stats?.totalUsers > 0 
                        ? `${Math.round((company.stats.activeUsers / company.stats.totalUsers) * 100)}%`
                        : '0%'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Performance Metrics */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>Performance Metrics</Text>
                <View style={styles.reportCard}>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Orders per User</Text>
                    <Text style={styles.reportValue}>
                      {company.stats?.totalUsers > 0 
                        ? Math.round(company.stats.totalOrders / company.stats.totalUsers)
                        : '0'
                      }
                    </Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Sales per User</Text>
                    <Text style={styles.reportValue}>
                      {company.stats?.totalUsers > 0 
                        ? `₹${Math.round((Number(company.stats?.totalSales?.replace('₹', '').replace(',', '')) || 0) / company.stats.totalUsers).toLocaleString()}`
                        : '₹0'
                      }
                    </Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Order Completion Rate</Text>
                    <Text style={styles.reportValue}>
                      {company.stats?.totalOrders > 0 
                        ? `${Math.round(((company.stats.totalOrders - company.stats.pendingOrders) / company.stats.totalOrders) * 100)}%`
                        : '0%'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Coming Soon Features */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>Advanced Reports</Text>
                <View style={styles.comingSoonCard}>
                  <BarChart3 size={32} color="#9ca3af" />
                  <Text style={styles.comingSoonTitle}>Advanced Analytics Coming Soon</Text>
                  <Text style={styles.comingSoonText}>
                    Detailed charts, trend analysis, and comprehensive reporting features will be available in the next update.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Package size={16} color="#f59e0b" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Orders Processed</Text>
                      <Text style={styles.activityDescription}>
                        {company.stats?.totalOrders || 0} orders have been processed
                      </Text>
                      <Text style={styles.activityTime}>Ongoing</Text>
                    </View>
                  </View>

                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <TrendingUp size={16} color="#16a34a" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Sales Generated</Text>
                      <Text style={styles.activityDescription}>
                        Total sales of {company.stats?.totalSales || '₹0'} recorded
                      </Text>
                      <Text style={styles.activityTime}>Ongoing</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Coming Soon Features */}
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>Detailed Activity Tracking</Text>
                <View style={styles.comingSoonCard}>
                  <Activity size={32} color="#9ca3af" />
                  <Text style={styles.comingSoonTitle}>Advanced Activity Log Coming Soon</Text>
                  <Text style={styles.comingSoonText}>
                    Detailed user actions, system events, and comprehensive activity tracking will be available in the next update.
                  </Text>
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
  const [guid, setGuid] = useState<string>(String(Date.now()));
  const [adminOptions, setAdminOptions] = useState<{label:string; value:string}[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
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
      setMaxUsers(company.maxUsers?.toString() || '100');
      setGuid(company.guid?.toString() || Date.now().toString());
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
        selectedAdminId,
        street,
        country,
        pincode,
        guid,
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

  const filteredAdmins = adminOptions.filter(admin =>
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
            <TouchableOpacity 
              style={styles.dropdownContainer}
              onPress={() => setShowAdminDropdown(!showAdminDropdown)}
            >
              <View style={styles.dropdownButton}>
                <Users size={20} color="#9ca3af" />
                <Text style={[
                  styles.dropdownText,
                  !selectedAdminId && styles.dropdownPlaceholder
                ]}>
                  {selectedAdminId 
                    ? adminOptions.find(a => a.value === selectedAdminId)?.label 
                    : 'Select an admin'
                  }
                </Text>
                <ArrowLeft 
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
              <View style={styles.dropdownList}>
                {/* Search Bar */}
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
                
                <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                  {filteredAdmins.length > 0 ? (
                    filteredAdmins.map((admin) => (
                      <TouchableOpacity
                        key={admin.value}
                        style={[
                          styles.dropdownItem,
                          selectedAdminId === admin.value && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setSelectedAdminId(admin.value);
                          setShowAdminDropdown(false);
                          setAdminSearchQuery('');
                        }}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Text style={[
                            styles.dropdownItemText,
                            selectedAdminId === admin.value && styles.dropdownItemTextSelected
                          ]}>
                            {admin.label}
                          </Text>
                          {selectedAdminId === admin.value && (
                            <Check size={16} color="#2563eb" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.dropdownEmptyState}>
                      <Text style={styles.dropdownEmptyText}>No admins found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
            
            {selectedAdminId && (
              <View style={styles.selectedAdminInfo}>
                <Check size={16} color="#16a34a" />
                <Text style={styles.selectedAdminText}>
                  Selected: {adminOptions.find(a => a.value === selectedAdminId)?.label}
                </Text>
              </View>
            )}
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

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company);
    setCurrentView('details');
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await apiService.superadminListCompanies({ page: 1, limit: 50, search: '' });
      if (res.success && res.data) {
        console.log('Raw company data:', res.data.companies[0]); // Debug log
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
          admin: { 
            name: c.assignedAdmin?.name || '', 
            phone: c.assignedAdmin?.mobile || '', 
            email: c.assignedAdmin?.email || '' 
          },
          stats: { 
            totalSales: c.stats?.totalSales ? `₹${Number(c.stats.totalSales).toLocaleString()}` : '₹0', 
            totalOrders: c.stats?.totalOrders || 0, 
            pendingOrders: c.stats?.pendingOrders || 0, 
            totalUsers: c.stats?.totalUsers || 0, 
            activeUsers: c.stats?.activeUsers || 0 
          }
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
        // Map UI form to backend payload for update
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

        const res = await apiService.superadminUpdateCompany(selectedCompany.id, payload);
        if (res.success && res.data) {
          Alert.alert('Success', 'Company updated successfully!');
          
          // Update the companies list with the updated data
          setCompanies(companies.map(c => 
            c.id === selectedCompany.id ? { 
              ...c, 
              name: res.data.companyName,
              code: res.data.companyCode,
              address: res.data.contactDetails?.address?.street || '',
              city: res.data.contactDetails?.address?.city || '',
              state: res.data.contactDetails?.address?.state || '',
              pincode: res.data.contactDetails?.address?.pincode || '',
              phone: res.data.contactDetails?.phone || '',
              email: res.data.contactDetails?.email || '',
            } : c
          ));
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
          onBack={() => navigation.goBack()}
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
  headerTitleContainer: {
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
  dropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    maxHeight: 200,
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
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
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
  selectedAdminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  selectedAdminText: {
    fontSize: 12,
    color: '#16a34a',
    marginLeft: 6,
    fontWeight: '500',
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
});

export default CompanyManagementSystem;