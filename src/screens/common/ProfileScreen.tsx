// src/screens/common/ProfileScreen.tsx
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
  Image
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  LogOut,
  Edit2,
  Camera,
  Check,
  X,
  ChevronRight,
  Shield,
  HelpCircle,
  Info
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../navigation/types';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  company: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  avatar: string;
  joinedDate: string;
}


// ==================== ROLE DISPLAY MAPPING ====================
const ROLE_DISPLAY: Record<UserRole, string> = {
  [UserRole.SUPERADMIN]: 'Super Administrator',
  [UserRole.ADMIN]: 'Company Admin',
  [UserRole.ZONAL]: 'Zonal Manager',
  [UserRole.RSM]: 'Regional Sales Manager',
  [UserRole.ASM]: 'Area Sales Manager',
  [UserRole.DISTRIBUTOR]: 'Distributor',
  [UserRole.DEALER]: 'Dealer',
  [UserRole.SUB_DEALER]: 'Sub Dealer',
  [UserRole.SALESMAN]: 'Salesman',
};

// ==================== ROLE-BASED STATS ====================
const getRoleBasedStats = (role: UserRole) => {
  switch (role) {
    case UserRole.SUPERADMIN:
      return [
        { label: 'Companies', value: '24' },
        { label: 'Total Admins', value: '48' },
        { label: 'System Uptime', value: '99.9%' }
      ];
    case UserRole.ADMIN:
      return [
        { label: 'Total Users', value: '145' },
        { label: 'Revenue', value: '₹18.5L' },
        { label: 'Active Days', value: '156' }
      ];
    case UserRole.DISTRIBUTOR:
      return [
        { label: 'Dealers', value: '28' },
        { label: 'Sales', value: '₹12.3L' },
        { label: 'Orders', value: '245' }
      ];
    case UserRole.DEALER:
      return [
        { label: 'Orders', value: '89' },
        { label: 'Sales', value: '₹5.8L' },
        { label: 'Sub Dealers', value: '12' }
      ];
    default:
      return [
        { label: 'Orders', value: '145' },
        { label: 'Total Sales', value: '₹18.5L' },
        { label: 'Days Active', value: '156' }
      ];
  }
};

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'settings' | 'security'>('main');
  
  // Initialize profile from AuthContext user
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '1',
    name: user?.name || 'User',
    email: user?.email || '',
    phone: user?.phone || '+91 98765 43210',
    role: ROLE_DISPLAY[user?.role || UserRole.ADMIN],
    company: user?.company || 'Royal Paints Pvt Ltd',
    address: user?.address || '123 Paint Street, Industrial Area',
    city: user?.city || 'Ludhiana',
    state: user?.state || 'Punjab',
    pincode: user?.pincode || '141001',
    avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=200&background=2563eb&color=fff`,
    joinedDate: user?.joinedDate || '15 Jan 2024'
  });

  const roleBasedStats = getRoleBasedStats(user?.role || UserRole.ADMIN);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {currentView === 'main' && (
        <MainProfileView
          profile={profile}
          roleBasedStats={roleBasedStats}
          onEdit={() => setCurrentView('edit')}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'edit' && (
        <EditProfileView
          profile={profile}
          onBack={() => setCurrentView('main')}
          onSave={(updatedProfile:any) => {
            setProfile(updatedProfile);
            setCurrentView('main');
            Alert.alert('Success', 'Profile updated successfully!');
          }}
        />
      )}
    </SafeAreaView>
  );
};

// ==================== MAIN PROFILE VIEW ====================
const MainProfileView = ({
  profile,
  roleBasedStats,
  onEdit,
  onLogout
}: {
  profile: UserProfile;
  roleBasedStats: Array<{ label: string; value: string }>;
  onEdit: () => void;
  onLogout: () => void;
}) => {
  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editIconButton}>
          <Edit2 size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileRole}>{profile.role}</Text>
          <View style={styles.profileBadge}>
            <Building2 size={14} color="#2563eb" />
            <Text style={styles.profileCompany}>{profile.company}</Text>
          </View>
        </View>

        {/* Dynamic Role-Based Stats */}
        <View style={styles.statsContainer}>
          {roleBasedStats.map((stat, index) => (
            <React.Fragment key={stat.label}>
              {index > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <InfoRow icon={Mail} label="Email" value={profile.email} />
            <InfoRow icon={Phone} label="Phone" value={profile.phone} />
            <InfoRow icon={MapPin} label="Address" value={profile.address} />
            <InfoRow 
              icon={MapPin} 
              label="City" 
              value={`${profile.city}, ${profile.state} - ${profile.pincode}`}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuButton
              icon={HelpCircle}
              title="Help Center"
              subtitle="Get help and support"
              onPress={() => Alert.alert('Help Center', 'Opening help center...')}
            />
            <MenuButton
              icon={Info}
              title="About"
              subtitle="Version 1.0.0"
              onPress={() => Alert.alert('About', 'Company Management System v1.0.0')}
              isLast
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Member since {profile.joinedDate}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ==================== OTHER VIEWS (EditProfile, Settings, Security) ====================
// [Keep the same EditProfileView, SettingsView, SecurityView components from your original code]
// [Keep the same InfoRow, MenuButton, SettingToggle components]
// [Keep the same styles]

const EditProfileView = ({ profile, onBack, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    pincode: profile.pincode,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Phone validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedProfile = {
        ...profile,
        ...formData,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&size=200&background=2563eb&color=fff`
      };
      
      onSave(updatedProfile);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronRight size={20} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.editProfileCard}>
          <View style={styles.editAvatarContainer}>
            <Image source={{ uri: profile.avatar }} style={styles.editAvatar} />
            <TouchableOpacity style={styles.editCameraButton}>
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.editProfileName}>{profile.name}</Text>
          <Text style={styles.editProfileRole}>{profile.role}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Personal Information</Text>
          
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Address Information</Text>
          
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your address"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                <Text style={styles.inputLabel}>City</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="City"
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                <Text style={styles.inputLabel}>State</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="State"
                    value={formData.state}
                    onChangeText={(text) => setFormData({ ...formData, state: text })}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pincode</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter pincode"
                  value={formData.pincode}
                  onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>* Required fields</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon: Icon, label, value, isLast = false }: any) => (
  <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
    <View style={styles.infoLeft}>
      <Icon size={16} color="#9ca3af" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const MenuButton = ({ icon: Icon, title, subtitle, onPress, isLast = false }: any) => (
  <TouchableOpacity style={[styles.menuItem, isLast && styles.menuItemLast]} onPress={onPress}>
    <View style={styles.menuLeft}>
      <View style={styles.menuIcon}>
        <Icon size={20} color="#2563eb" />
      </View>
      <View>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <ChevronRight size={20} color="#9ca3af" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  mainContainer: { flex: 1 },
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  editIconButton: { padding: 8 },
  scrollView: { flex: 1 },
  profileCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e5e7eb' },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  profileRole: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileCompany: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  infoCard: { backgroundColor: '#fff', paddingHorizontal: 20 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1, textAlign: 'right' },
  menuCard: { backgroundColor: '#fff', paddingHorizontal: 20 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  menuSubtitle: { fontSize: 13, color: '#6b7280' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  footer: { alignItems: 'center', paddingBottom: 32 },
  footerText: { fontSize: 12, color: '#9ca3af' },
  
  // Edit Profile Styles
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  editAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  editAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
  },
  editCameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editProfileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  editProfileRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  formSection: {
    marginBottom: 12,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
});

export default ProfileScreen;