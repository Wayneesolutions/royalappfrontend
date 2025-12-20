// src/screens/common/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
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
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import { apiService } from '../../services/api';
import { uploadProfileImage, getLocalImagePath } from '../../services/s3Service';

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
  const { user, logout, updateUser } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'settings' | 'security'>('main');
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Initialize profile from AuthContext user
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || user?._id || '1',
    name: user?.name || 'User',
    email: user?.email || '',
    phone: user?.mobile || user?.phone || '',
    role: ROLE_DISPLAY[user?.role as UserRole] || 'User',
    company: user?.defaultCompany?.companyName || user?.company || '',
    address: user?.address?.street || user?.address || '',
    city: user?.address?.city || user?.city || '',
    state: user?.address?.state || user?.state || '',
    pincode: user?.address?.pincode || user?.pincode || '',
    avatar: user?.profileImage || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=200&background=2563eb&color=fff`,
    joinedDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
  });

  // Fetch user profile data
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const res = await apiService.getUserProfile();
      if (res.success && res.data?.user) {
        const userData = res.data.user;
        
        // Get profile image - check S3 URL first, then local storage, then fallback to avatar
        let profileImage = userData.profileImage;
        if (!profileImage && userData._id) {
          const localPath = await getLocalImagePath(userData._id);
          if (localPath) {
            profileImage = localPath;
          }
        }
        if (!profileImage) {
          profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&size=200&background=2563eb&color=fff`;
        }
        
        setProfile({
          id: userData._id || userData.id,
          name: userData.name || 'User',
          email: userData.email || '',
          phone: userData.mobile || '',
          role: ROLE_DISPLAY[userData.role as UserRole] || 'User',
          company: userData.defaultCompany?.companyName || '',
          address: userData.address?.street || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          pincode: userData.address?.pincode || '',
          avatar: profileImage,
          joinedDate: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleBasedStats = getRoleBasedStats(user?.role as UserRole || UserRole.ADMIN);

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

  const handleImagePick = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadAndUpdateImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAndUpdateImage = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      const userId = user?.id || user?._id || profile.id;
      
      // Upload image (to local storage in dev, S3 in production)
      const imageUrl = await uploadProfileImage(imageUri, userId, 'profiles');
      
      // Always update backend with image URL/path
      // In development, we store the local path; in production, we store the S3 URL
      const updateRes = await apiService.updateUserProfile({
        profileImage: imageUrl
      });

      if (updateRes.success) {
        // Update local profile state
        setProfile(prev => ({
          ...prev,
          avatar: imageUrl
        }));

        // Update auth context user
        if (updateRes.data?.user) {
          updateUser(updateRes.data.user);
        }

        Alert.alert('Success', 'Profile image updated successfully!');
      } else {
        Alert.alert('Error', updateRes.message || 'Failed to update profile image');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    try {
      setLoading(true);
      
      const updateData: any = {
        name: updatedProfile.name,
        email: updatedProfile.email,
        mobile: updatedProfile.phone,
      };

      // Only include profileImage if it changed
      if (updatedProfile.avatar !== profile.avatar) {
        updateData.profileImage = updatedProfile.avatar;
      }

      const res = await apiService.updateUserProfile(updateData);

      if (res.success) {
        setProfile(updatedProfile);
        
        // Update auth context
        if (res.data?.user) {
          updateUser(res.data.user);
        }

        setCurrentView('main');
        Alert.alert('Success', 'Profile updated successfully!');
        // Reload profile to get latest data
        await loadUserProfile();
      } else {
        Alert.alert('Error', res.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <>
          {currentView === 'main' && (
            <MainProfileView
              profile={profile}
              roleBasedStats={roleBasedStats}
              onEdit={() => setCurrentView('edit')}
              onLogout={handleLogout}
              onImagePick={handleImagePick}
              uploadingImage={uploadingImage}
            />
          )}

          {currentView === 'edit' && (
            <EditProfileView
              profile={profile}
              onBack={() => setCurrentView('main')}
              onSave={handleSaveProfile}
              onImagePick={handleImagePick}
              uploadingImage={uploadingImage}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

// ==================== MAIN PROFILE VIEW ====================
const MainProfileView = ({
  profile,
  roleBasedStats,
  onEdit,
  onLogout,
  onImagePick,
  uploadingImage
}: {
  profile: UserProfile;
  roleBasedStats: Array<{ label: string; value: string }>;
  onEdit: () => void;
  onLogout: () => void;
  onImagePick: () => void;
  uploadingImage: boolean;
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
            {uploadingImage ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            )}
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={onImagePick}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={16} color="#fff" />
              )}
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

const EditProfileView = ({ profile, onBack, onSave, onImagePick, uploadingImage }: any) => {
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
      const updatedProfile = {
        ...profile,
        ...formData
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
            {uploadingImage ? (
              <View style={[styles.editAvatar, styles.avatarLoading]}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : (
              <Image source={{ uri: profile.avatar }} style={styles.editAvatar} />
            )}
            <TouchableOpacity 
              style={styles.editCameraButton}
              onPress={onImagePick}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={16} color="#fff" />
              )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  avatarLoading: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;