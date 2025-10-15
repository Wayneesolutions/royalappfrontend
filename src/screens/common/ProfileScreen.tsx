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
  Switch,
  Image
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Lock,
  Bell,
  Globe,
  Moon,
  LogOut,
  Edit2,
  Camera,
  Check,
  X,
  ChevronRight,
  Shield,
  HelpCircle,
  Info,
  Trash2
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

interface Settings {
  notifications: {
    orderUpdates: boolean;
    emailNotifications: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
  };
  preferences: {
    darkMode: boolean;
    language: string;
    currency: string;
  };
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

  const [settings, setSettings] = useState<Settings>({
    notifications: {
      orderUpdates: true,
      emailNotifications: true,
      smsAlerts: false,
      pushNotifications: true
    },
    preferences: {
      darkMode: false,
      language: 'English',
      currency: 'INR (₹)'
    }
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted.')
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
          settings={settings}
          roleBasedStats={roleBasedStats}
          onEdit={() => setCurrentView('edit')}
          onSettings={() => setCurrentView('settings')}
          onSecurity={() => setCurrentView('security')}
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

      {currentView === 'settings' && (
        <SettingsView
          settings={settings}
          onBack={() => setCurrentView('main')}
          onUpdate={(updatedSettings:any) => {
            setSettings(updatedSettings);
            Alert.alert('Success', 'Settings updated successfully!');
          }}
        />
      )}

      {currentView === 'security' && (
        <SecurityView
          onBack={() => setCurrentView('main')}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </SafeAreaView>
  );
};

// ==================== MAIN PROFILE VIEW ====================
const MainProfileView = ({
  profile,
  settings,
  roleBasedStats,
  onEdit,
  onSettings,
  onSecurity,
  onLogout
}: {
  profile: UserProfile;
  settings: Settings;
  roleBasedStats: Array<{ label: string; value: string }>;
  onEdit: () => void;
  onSettings: () => void;
  onSecurity: () => void;
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
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.menuCard}>
            <MenuButton
              icon={Bell}
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={onSettings}
            />
            <MenuButton
              icon={Lock}
              title="Security"
              subtitle="Password and authentication"
              onPress={onSecurity}
            />
            <MenuButton
              icon={Globe}
              title="Language & Region"
              subtitle={settings.preferences.language}
              onPress={onSettings}
            />
            <MenuButton
              icon={Moon}
              title="Dark Mode"
              subtitle={settings.preferences.darkMode ? 'Enabled' : 'Disabled'}
              onPress={onSettings}
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
  const [formData, setFormData] = useState(profile);
  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    onSave(formData);
  };
  return <View style={styles.mainContainer}><Text>Edit Profile View</Text></View>;
};

const SettingsView = ({ settings, onBack, onUpdate }: any) => {
  return <View style={styles.mainContainer}><Text>Settings View</Text></View>;
};

const SecurityView = ({ onBack, onDeleteAccount }: any) => {
  return <View style={styles.mainContainer}><Text>Security View</Text></View>;
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
});

export default ProfileScreen;